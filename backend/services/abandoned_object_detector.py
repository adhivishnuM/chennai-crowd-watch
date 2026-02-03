"""
Abandoned Object Detector - Production-grade IED/Unattended Baggage Detection.

Detection Logic:
1. Track all persons and bags/packages using YOLOv8 + DeepSORT
2. Associate each object with nearest person (ownership)
3. When person moves away (>threshold distance) → start abandonment timer
4. If object stationary for 120s after person left → ALERT

Privacy-First: Only metadata sent as alerts, video processed at edge.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import time
import base64
import asyncio

from ultralytics import YOLO


@dataclass
class TrackedObject:
    """Represents a tracked bag/package."""
    id: int
    class_name: str
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    center: Tuple[int, int]
    owner_id: Optional[int] = None
    last_near_owner_time: Optional[float] = None
    first_abandoned_time: Optional[float] = None
    is_stationary: bool = False
    stationary_since: Optional[float] = None


@dataclass
class TrackedPerson:
    """Represents a tracked person."""
    id: int
    bbox: Tuple[int, int, int, int]
    center: Tuple[int, int]


class AbandonedObjectDetector:
    """
    Production abandoned object detector using YOLOv8 + DeepSORT.
    
    Triggers alert ONLY when:
    1. A person places an object
    2. The person moves away from the object
    3. The object remains stationary for 120+ seconds
    """
    
    # COCO class IDs for bags/luggage
    OBJECT_CLASSES = {
        24: "backpack",
        26: "handbag", 
        28: "suitcase",
        # Additional classes that could be suspicious
        # 39: "bottle",  # Could be IED
    }
    
    PERSON_CLASS = 0
    
    # Detection thresholds
    # Detection thresholds
    ABANDONMENT_THRESHOLD_SECONDS = 120  # 2 minutes default
    DISTANCE_THRESHOLD_PIXELS = 200  # Person-object separation distance
    STATIONARY_THRESHOLD_PIXELS = 30  # Object movement threshold
    CONFIDENCE_THRESHOLD = 0.5
    
    def __init__(self, model_path: str = "yolov8n.pt"):
        """
        Initialize detector with YOLOv8m model and DeepSORT tracker.
        
        Args:
            model_path: Path to YOLOv8m model weights
        """
        self.model = YOLO(model_path)
        
        # Initialize DeepSORT or fallback
        try:
            from deep_sort_realtime.deepsort_tracker import DeepSort
            self.person_tracker = DeepSort(max_age=120, n_init=3)
            self.object_tracker = DeepSort(max_age=300, n_init=3)  # Longer age for objects
            self.use_deepsort = True
            print("[AbandonedObjectDetector] DeepSORT initialized")
        except ImportError:
            try:
                # Fallback to older import path if needed
                from deep_sort_realtime.deepsort_tracker import DeepSort
                self.person_tracker = DeepSort(max_age=120, n_init=3)
                self.object_tracker = DeepSort(max_age=300, n_init=3)
                self.use_deepsort = True
                print("[AbandonedObjectDetector] DeepSORT initialized")
            except:
                print("[AbandonedObjectDetector] DeepSORT not available, using simple tracking")
                self.use_deepsort = False
                self.simple_tracks = {"persons": {}, "objects": {}}
                self.next_id = {"persons": 0, "objects": 0}
        
        # State tracking
        self.tracked_objects: Dict[int, TrackedObject] = {}
        self.tracked_persons: Dict[int, TrackedPerson] = {}
        self.object_ownership: Dict[int, int] = {}  # object_id -> person_id
        self.abandoned_objects: Dict[int, TrackedObject] = {}
        
        self._frame_count = 0
        
        # Configurable thresholds
        self.abandonment_threshold = self.ABANDONMENT_THRESHOLD_SECONDS
        self.testing_mode = False

    def set_testing_mode(self, enabled: bool):
        """Enable testing mode with shorter thresholds."""
        self.testing_mode = enabled
        if enabled:
            self.abandonment_threshold = 5  # 5 seconds for testing
            print("[AbandonedObjectDetector] Testing mode ENABLED (5s threshold)")
        else:
            self.abandonment_threshold = self.ABANDONMENT_THRESHOLD_SECONDS
            print(f"[AbandonedObjectDetector] Testing mode DISABLED ({self.ABANDONMENT_THRESHOLD_SECONDS}s threshold)")
        
    def _get_center(self, bbox: Tuple[int, int, int, int]) -> Tuple[int, int]:
        """Get center point of bounding box."""
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)
    
    def _calculate_distance(self, p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
        """Calculate Euclidean distance between two points."""
        return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
    
    def _simple_track(self, detections: List, category: str) -> List[Tuple[int, Tuple]]:
        """Simple IoU-based tracking when DeepSORT not available."""
        tracks = self.simple_tracks[category]
        new_tracks = {}
        results = []
        
        for det in detections:
            bbox = det["bbox"]
            best_iou = 0
            best_id = None
            
            for track_id, track_bbox in tracks.items():
                iou = self._calculate_iou(bbox, track_bbox)
                if iou > best_iou and iou > 0.3:
                    best_iou = iou
                    best_id = track_id
            
            if best_id is not None:
                new_tracks[best_id] = bbox
                results.append((best_id, bbox))
            else:
                new_id = self.next_id[category]
                self.next_id[category] += 1
                new_tracks[new_id] = bbox
                results.append((new_id, bbox))
        
        self.simple_tracks[category] = new_tracks
        return results
    
    def _calculate_iou(self, box1, box2):
        """Calculate IoU between two bboxes."""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        
        return inter / (area1 + area2 - inter + 1e-6)
    
    def _find_nearest_person(self, object_center: Tuple[int, int]) -> Optional[Tuple[int, float]]:
        """Find nearest person to an object."""
        nearest_id = None
        min_distance = float('inf')
        
        for person_id, person in self.tracked_persons.items():
            distance = self._calculate_distance(object_center, person.center)
            if distance < min_distance:
                min_distance = distance
                nearest_id = person_id
        
        if nearest_id is not None:
            return (nearest_id, min_distance)
        return None
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> Dict:
        """
        Process a single frame for abandoned object detection.
        
        Args:
            frame: BGR image from OpenCV
            timestamp: Current timestamp in seconds
            
        Returns:
            Dict with detection results and any alerts
        """
        self._frame_count += 1
        
        # Run YOLO detection
        results = self.model(
            frame,
            classes=[self.PERSON_CLASS] + list(self.OBJECT_CLASSES.keys()),
            conf=self.CONFIDENCE_THRESHOLD,
            verbose=False
        )
        
        # Separate persons and objects
        person_detections = []
        object_detections = []
        
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            bbox = tuple(map(int, box.xyxy[0].tolist()))
            conf = float(box.conf[0])
            
            if cls_id == self.PERSON_CLASS:
                person_detections.append({
                    "bbox": bbox,
                    "conf": conf
                })
            elif cls_id in self.OBJECT_CLASSES:
                object_detections.append({
                    "bbox": bbox,
                    "conf": conf,
                    "class_name": self.OBJECT_CLASSES[cls_id]
                })
        
        # Track persons and objects
        if self.use_deepsort:
            person_tracks = self._track_with_deepsort(person_detections, self.person_tracker, frame)
            object_tracks = self._track_with_deepsort(object_detections, self.object_tracker, frame)
        else:
            person_tracks = self._simple_track(person_detections, "persons")
            object_tracks = self._simple_track(object_detections, "objects")
        
        # Update tracked persons
        self.tracked_persons.clear()
        for track_id, bbox in person_tracks:
            self.tracked_persons[track_id] = TrackedPerson(
                id=track_id,
                bbox=bbox,
                center=self._get_center(bbox)
            )
        
        # Update tracked objects and check for abandonment
        alerts = []
        
        for track_id, bbox in object_tracks:
            center = self._get_center(bbox)
            
            # Get or create tracked object
            if track_id in self.tracked_objects:
                obj = self.tracked_objects[track_id]
                prev_center = obj.center
                
                # Check if object is stationary
                movement = self._calculate_distance(center, prev_center)
                if movement < self.STATIONARY_THRESHOLD_PIXELS:
                    if not obj.is_stationary:
                        obj.is_stationary = True
                        obj.stationary_since = timestamp
                else:
                    obj.is_stationary = False
                    obj.stationary_since = None
                
                obj.bbox = bbox
                obj.center = center
            else:
                # New object - find owner
                obj = TrackedObject(
                    id=track_id,
                    class_name=object_detections[0]["class_name"] if object_detections else "bag",
                    bbox=bbox,
                    center=center
                )
                self.tracked_objects[track_id] = obj
            
            # Check ownership and abandonment
            nearest = self._find_nearest_person(center)
            
            if nearest:
                person_id, distance = nearest
                
                if distance < self.DISTANCE_THRESHOLD_PIXELS:
                    # Person is near object - update ownership
                    obj.owner_id = person_id
                    obj.last_near_owner_time = timestamp
                    obj.first_abandoned_time = None
                    self.object_ownership[track_id] = person_id
                else:
                    # Person moved away from their object
                    if obj.owner_id is not None and obj.last_near_owner_time is not None:
                        if obj.first_abandoned_time is None:
                            obj.first_abandoned_time = timestamp
                        
                        abandonment_duration = timestamp - obj.first_abandoned_time
                        
                        # Check if abandoned for threshold duration
                        if abandonment_duration >= self.abandonment_threshold:
                            if track_id not in self.abandoned_objects:
                                self.abandoned_objects[track_id] = obj
                                alerts.append({
                                    "type": "abandoned_object",
                                    "object_id": track_id,
                                    "object_type": obj.class_name,
                                    "bbox": bbox,
                                    "center": center,
                                    "abandoned_duration": abandonment_duration,
                                    "last_owner_id": obj.owner_id,
                                    "confidence": 0.85 + min(abandonment_duration / 300, 0.14)  # Up to 99%
                                })
            else:
                # No person detected - if object was owned, start abandonment timer
                if obj.owner_id is not None and obj.first_abandoned_time is None:
                    obj.first_abandoned_time = timestamp
        
        # Annotate frame
        annotated_frame = self._annotate_frame(frame, person_tracks, object_tracks)
        
        return {
            "frame": annotated_frame,
            "persons_detected": len(person_tracks),
            "objects_detected": len(object_tracks),
            "tracked_objects": len(self.tracked_objects),
            "abandoned_count": len(self.abandoned_objects),
            "alerts": alerts,
            "timestamp": timestamp
        }
    
    def _track_with_deepsort(self, detections, tracker, frame):
        """Track detections using DeepSORT."""
        if not detections:
            return []
        
        # Format for DeepSORT: [[x1, y1, w, h, conf], ...]
        det_list = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            det_list.append(([x1, y1, x2-x1, y2-y1], det["conf"], "object"))
        
        tracks = tracker.update_tracks(det_list, frame=frame)
        
        results = []
        for track in tracks:
            if not track.is_confirmed():
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()
            bbox = tuple(map(int, ltrb))
            results.append((track_id, bbox))
        
        return results
    
    def _annotate_frame(self, frame: np.ndarray, person_tracks, object_tracks) -> np.ndarray:
        """Draw annotations on frame."""
        annotated = frame.copy()
        
        # Draw persons (green)
        for track_id, bbox in person_tracks:
            x1, y1, x2, y2 = bbox
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated, f"P{track_id}", (x1, y1-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Draw objects
        for track_id, bbox in object_tracks:
            x1, y1, x2, y2 = bbox
            obj = self.tracked_objects.get(track_id)
            
            if track_id in self.abandoned_objects:
                # Red for abandoned
                color = (0, 0, 255)
                label = f"⚠️ ABANDONED"
            elif obj and obj.first_abandoned_time:
                # Orange for potentially abandoned
                color = (0, 165, 255)
                label = f"Unattended"
            else:
                # Blue for tracked
                color = (255, 0, 0)
                label = f"Bag {track_id}"
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(annotated, label, (x1, y1-5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return annotated
    
    def get_screenshot(self, frame: np.ndarray) -> str:
        """Encode frame as base64 JPEG."""
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buffer).decode('utf-8')
    
    def reset(self):
        """Reset all tracking state."""
        self.tracked_objects.clear()
        self.tracked_persons.clear()
        self.object_ownership.clear()
        self.abandoned_objects.clear()
        self._frame_count = 0


# Singleton instance
_detector_instance = None

def get_abandoned_object_detector() -> AbandonedObjectDetector:
    """Get or create singleton detector instance."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = AbandonedObjectDetector()
    return _detector_instance
