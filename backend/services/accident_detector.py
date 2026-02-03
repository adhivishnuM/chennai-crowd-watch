"""
Accident Detector - Production-grade Medical Emergency Detection.

Detection Logic:
1. Use YOLOv8-Pose to detect human poses
2. Analyze body orientation to detect prone/horizontal position
3. Track how long person remains prone
4. If prone for 30+ seconds in non-rest area → Medical Emergency Alert

Designed for 108 Emergency Services integration.
Privacy-First: Only GPS coordinates and timestamp sent, video processed at edge.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import time
import base64

from ultralytics import YOLO


@dataclass
class ProneTracking:
    """Tracks a potentially collapsed person."""
    person_id: int
    first_prone_time: float
    last_seen_time: float
    position: Tuple[int, int]
    is_still_prone: bool = True


class AccidentDetector:
    """
    Production accident/medical emergency detector.
    
    Detects "Prone Human" state - person lying on ground for extended period.
    Designed for integration with 108 Emergency Services.
    
    Detection criteria:
    - Body orientation is horizontal (width >> height)
    - Person remains prone for PRONE_THRESHOLD_SECONDS
    - Not in a designated rest area (configurable zones)
    """
    
    # Pose keypoint indices
    KEYPOINTS = {
        "nose": 0,
        "left_shoulder": 5, "right_shoulder": 6,
        "left_hip": 11, "right_hip": 12,
        "left_ankle": 15, "right_ankle": 16
    }
    
    # Detection thresholds
    PRONE_THRESHOLD_SECONDS = 30  # 30 seconds for medical emergency
    HORIZONTAL_RATIO_THRESHOLD = 1.5  # Width/Height ratio for horizontal detection
    CONFIDENCE_THRESHOLD = 0.80
    
    def __init__(self, model_path: str = "yolov8n-pose.pt"):
        """
        Initialize detector with YOLOv8-Pose model.
        
        Args:
            model_path: Path to YOLOv8-Pose model weights
        """
        self.model = YOLO(model_path)
        
        # Tracking state
        self.prone_tracking: Dict[int, ProneTracking] = {}
        self.previous_positions: Dict[int, Tuple[int, int]] = {}
        self.next_person_id = 0
        
        # Rest zones (areas where people are expected to lie down)
        # Format: [(x1, y1, x2, y2), ...]
        self.rest_zones: List[Tuple[int, int, int, int]] = []
        
        self._frame_count = 0
        self.confirmed_emergencies: Dict[int, ProneTracking] = {}
        
        # Configurable thresholds
        self.prone_threshold = self.PRONE_THRESHOLD_SECONDS
        self.testing_mode = False
        
        print("[AccidentDetector] Initialized with YOLOv8-Pose model")

    def set_testing_mode(self, enabled: bool):
        """Enable testing mode with shorter thresholds."""
        self.testing_mode = enabled
        if enabled:
            self.prone_threshold = 5  # 5 seconds for testing
            print(f"[AccidentDetector] Testing mode ENABLED (5s threshold)")
        else:
            self.prone_threshold = self.PRONE_THRESHOLD_SECONDS
            print(f"[AccidentDetector] Testing mode DISABLED ({self.PRONE_THRESHOLD_SECONDS}s threshold)")

    
    def add_rest_zone(self, zone: Tuple[int, int, int, int]):
        """Add a rest zone where prone detection should be ignored."""
        self.rest_zones.append(zone)
    
    def _is_in_rest_zone(self, position: Tuple[int, int]) -> bool:
        """Check if position is within a rest zone."""
        x, y = position
        for x1, y1, x2, y2 in self.rest_zones:
            if x1 <= x <= x2 and y1 <= y <= y2:
                return True
        return False
    
    def _assign_track_id(self, center: Tuple[int, int]) -> int:
        """Simple tracking by position proximity."""
        MIN_DISTANCE = 100
        
        for pid, prev_pos in self.previous_positions.items():
            dist = np.sqrt((center[0] - prev_pos[0])**2 + (center[1] - prev_pos[1])**2)
            if dist < MIN_DISTANCE:
                self.previous_positions[pid] = center
                return pid
        
        # New person
        new_id = self.next_person_id
        self.next_person_id += 1
        self.previous_positions[new_id] = center
        return new_id
    
    def _get_body_center(self, keypoints: np.ndarray) -> Tuple[int, int]:
        """Get center of body from keypoints."""
        left_hip = keypoints[self.KEYPOINTS["left_hip"]][:2]
        right_hip = keypoints[self.KEYPOINTS["right_hip"]][:2]
        left_shoulder = keypoints[self.KEYPOINTS["left_shoulder"]][:2]
        right_shoulder = keypoints[self.KEYPOINTS["right_shoulder"]][:2]
        
        # Use midpoint of hips and shoulders
        points = [left_hip, right_hip, left_shoulder, right_shoulder]
        valid_points = [p for i, p in enumerate(points) 
                       if keypoints[[11, 12, 5, 6][i]][2] > 0.3]
        
        if valid_points:
            center_x = sum(p[0] for p in valid_points) / len(valid_points)
            center_y = sum(p[1] for p in valid_points) / len(valid_points)
            return (int(center_x), int(center_y))
        
        # Fallback to nose
        return (int(keypoints[0][0]), int(keypoints[0][1]))
    
    def _is_prone(self, keypoints: np.ndarray) -> Tuple[bool, float]:
        """
        Check if person is in prone/horizontal position.
        
        Returns:
            Tuple of (is_prone, confidence)
        """
        # Get body bounding box from keypoints
        valid_points = []
        for kp in keypoints:
            if kp[2] > 0.3:  # Confidence threshold
                valid_points.append((kp[0], kp[1]))
        
        if len(valid_points) < 4:
            return False, 0.0
        
        xs = [p[0] for p in valid_points]
        ys = [p[1] for p in valid_points]
        
        width = max(xs) - min(xs)
        height = max(ys) - min(ys)
        
        if height < 10:  # Avoid division issues
            height = 10
        
        ratio = width / height
        
        # Check specific keypoint relationships for prone detection
        # Shoulders and ankles should be at similar Y levels when prone
        left_shoulder_y = keypoints[self.KEYPOINTS["left_shoulder"]][1]
        left_ankle_y = keypoints[self.KEYPOINTS["left_ankle"]][1]
        
        y_diff = abs(left_shoulder_y - left_ankle_y)
        
        # Person is prone if:
        # 1. Width >> Height (horizontal orientation)
        # 2. Shoulder and ankle at similar Y level
        if ratio > self.HORIZONTAL_RATIO_THRESHOLD and y_diff < height * 0.5:
            confidence = min(0.5 + (ratio - self.HORIZONTAL_RATIO_THRESHOLD) * 0.2, 0.95)
            return True, confidence
        
        # Also check if person is very low in frame (collapsed)
        avg_y = sum(ys) / len(ys)
        frame_height = 480  # Assume standard height
        
        if avg_y > frame_height * 0.8 and ratio > 1.2:
            return True, 0.7
        
        return False, 0.0
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> Dict:
        """
        Process a single frame for accident/medical emergency detection.
        
        Args:
            frame: BGR image from OpenCV
            timestamp: Current timestamp in seconds
            
        Returns:
            Dict with detection results and any alerts
        """
        self._frame_count += 1
        frame_height = frame.shape[0]
        
        # Run YOLOv8-Pose
        results = self.model(frame, verbose=False)
        
        alerts = []
        prone_detections = []
        persons_detected = 0
        
        if results[0].keypoints is not None:
            keypoints_data = results[0].keypoints.data.cpu().numpy()
            persons_detected = len(keypoints_data)
            
            # Track which persons are still being tracked this frame
            seen_this_frame = set()
            
            for kp in keypoints_data:
                center = self._get_body_center(kp)
                person_id = self._assign_track_id(center)
                seen_this_frame.add(person_id)
                
                # Check if in rest zone
                if self._is_in_rest_zone(center):
                    continue
                
                # Check prone status
                is_prone, confidence = self._is_prone(kp)
                
                if is_prone:
                    prone_detections.append({
                        "person_id": person_id,
                        "position": center,
                        "confidence": confidence
                    })
                    
                    if person_id in self.prone_tracking:
                        # Already tracking this person
                        tracking = self.prone_tracking[person_id]
                        tracking.last_seen_time = timestamp
                        tracking.position = center
                        tracking.is_still_prone = True
                        
                        # Check if threshold exceeded
                        prone_duration = timestamp - tracking.first_prone_time
                        
                        if prone_duration >= self.prone_threshold:
                            if person_id not in self.confirmed_emergencies:
                                self.confirmed_emergencies[person_id] = tracking
                                
                                alert_confidence = min(
                                    confidence + prone_duration / 100,
                                    0.99
                                )

                                
                                alerts.append({
                                    "type": "medical_emergency",
                                    "person_id": person_id,
                                    "position": center,
                                    "prone_duration": prone_duration,
                                    "confidence": alert_confidence,
                                    "timestamp": timestamp
                                })
                    else:
                        # Start tracking new prone person
                        self.prone_tracking[person_id] = ProneTracking(
                            person_id=person_id,
                            first_prone_time=timestamp,
                            last_seen_time=timestamp,
                            position=center
                        )
                else:
                    # Person is not prone - reset tracking
                    if person_id in self.prone_tracking:
                        del self.prone_tracking[person_id]
                    if person_id in self.confirmed_emergencies:
                        del self.confirmed_emergencies[person_id]
            
            # Clean up stale tracking entries
            stale_ids = []
            for pid, tracking in self.prone_tracking.items():
                if timestamp - tracking.last_seen_time > 5.0:  # 5 second timeout
                    stale_ids.append(pid)
            for pid in stale_ids:
                del self.prone_tracking[pid]
        
        # Annotate frame
        annotated_frame = self._annotate_frame(frame, results, prone_detections, alerts)
        
        return {
            "frame": annotated_frame,
            "persons_detected": persons_detected,
            "prone_detected": len(prone_detections),
            "tracking": [{"person_id": t.person_id, 
                         "duration": timestamp - t.first_prone_time,
                         "position": t.position}
                        for t in self.prone_tracking.values()],
            "alerts": alerts,
            "timestamp": timestamp
        }
    
    def _annotate_frame(self, frame: np.ndarray, results, 
                        prone_detections: List, alerts: List) -> np.ndarray:
        """Draw annotations on frame."""
        annotated = results[0].plot()
        
        # Draw prone person indicators
        for detection in prone_detections:
            x, y = detection["position"]
            person_id = detection["person_id"]
            
            # Check if this is a confirmed emergency
            is_emergency = person_id in self.confirmed_emergencies
            
            if is_emergency:
                color = (0, 0, 255)  # Red for emergency
                label = "🚨 MEDICAL EMERGENCY"
                cv2.circle(annotated, (x, y), 60, color, 3)
            else:
                # Calculate how long they've been prone
                if person_id in self.prone_tracking:
                    duration = time.time() - self.prone_tracking[person_id].first_prone_time
                    color = (0, 165, 255)  # Orange for monitoring
                    label = f"Prone: {duration:.0f}s"
                else:
                    color = (0, 255, 255)  # Yellow for new detection
                    label = "Prone detected"
            
            cv2.putText(annotated, label, (x - 60, y - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Draw rest zones
        for x1, y1, x2, y2 in self.rest_zones:
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 1)
            cv2.putText(annotated, "Rest Zone", (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        return annotated
    
    def get_screenshot(self, frame: np.ndarray) -> str:
        """Encode frame as base64 JPEG."""
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buffer).decode('utf-8')
    
    def reset(self):
        """Reset all tracking state."""
        self.prone_tracking.clear()
        self.confirmed_emergencies.clear()
        self.previous_positions.clear()
        self.next_person_id = 0
        self._frame_count = 0


# Singleton instance
_detector_instance = None

def get_accident_detector() -> AccidentDetector:
    """Get or create singleton detector instance."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = AccidentDetector()
    return _detector_instance
