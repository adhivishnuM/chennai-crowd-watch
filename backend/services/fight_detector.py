"""
Fight Detector - Production-grade Violence & Aggression Detection.

Detection Logic using Temporal Action Recognition:
1. Extract human poses using YOLOv8-Pose (17 keypoints per person)
2. Calculate limb velocities over temporal window
3. Detect "Aggression Signatures":
   - High-velocity limb movements (punching, kicking)
   - People falling
   - Centrifugal crowd movement (people scattering from center)
4. Alert at 90% confidence for Police Direct-Link

Privacy-First: Only threat metadata sent, video processed at edge.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from collections import deque
import time
import base64

from ultralytics import YOLO


@dataclass
class PoseHistory:
    """Stores pose keypoint history for velocity calculation."""
    person_id: int
    keypoints_history: deque = field(default_factory=lambda: deque(maxlen=30))  # ~1 second at 30fps
    timestamps: deque = field(default_factory=lambda: deque(maxlen=30))
    positions: deque = field(default_factory=lambda: deque(maxlen=30))  # Center positions
    

@dataclass
class AggressionEvent:
    """Represents a detected aggression event."""
    event_type: str  # "punch", "kick", "fall", "crowd_scatter", "fight"
    confidence: float
    involved_persons: List[int]
    location: Tuple[int, int]
    timestamp: float
    velocity: float = 0.0


class FightDetector:
    """
    Production fight detector using YOLOv8-Pose with temporal analysis.
    
    Aggression Signatures Detected:
    - High-velocity arm movements (punching)
    - High-velocity leg movements (kicking)
    - Sudden body falls
    - Multiple people in rapid close proximity
    - Crowd scattering from a center point
    """
    
    # YOLO Pose keypoint indices
    KEYPOINTS = {
        "nose": 0, "left_eye": 1, "right_eye": 2,
        "left_ear": 3, "right_ear": 4,
        "left_shoulder": 5, "right_shoulder": 6,
        "left_elbow": 7, "right_elbow": 8,
        "left_wrist": 9, "right_wrist": 10,
        "left_hip": 11, "right_hip": 12,
        "left_knee": 13, "right_knee": 14,
        "left_ankle": 15, "right_ankle": 16
    }
    
    # Velocity thresholds (pixels per second) - INCREASED to reduce false positives
    PUNCH_VELOCITY_THRESHOLD = 800  # Fast arm movement (was 500)
    KICK_VELOCITY_THRESHOLD = 900   # Fast leg movement (was 600)
    FALL_VELOCITY_THRESHOLD = 600   # Rapid downward head movement (was 400)
    
    # Fight detection thresholds
    FIGHT_DISTANCE_THRESHOLD = 80   # Pixels - close proximity for fight (reduced from 100)
    CONFIDENCE_THRESHOLD = 0.95     # 95% for police alert (was 0.90)
    SCATTER_THRESHOLD = 5           # Min people scattering
    
    def __init__(self, model_path: str = "yolov8n-pose.pt"):
        """
        Initialize detector with YOLOv8-Pose model.
        
        Args:
            model_path: Path to YOLOv8-Pose model weights
        """
        self.model = YOLO(model_path)
        
        # Pose history for each tracked person
        self.pose_histories: Dict[int, PoseHistory] = {}
        
        # Simple tracking (ID assignment based on position proximity)
        self.next_person_id = 0
        self.previous_positions: Dict[int, Tuple[int, int]] = {}
        
        # Detection state
        self.current_events: List[AggressionEvent] = []
        self._frame_count = 0
        
        # Configurable thresholds
        self.punch_threshold = self.PUNCH_VELOCITY_THRESHOLD
        self.kick_threshold = self.KICK_VELOCITY_THRESHOLD
        self.fall_threshold = self.FALL_VELOCITY_THRESHOLD
        self.testing_mode = False
        
        print("[FightDetector] Initialized with YOLOv8-Pose model")

    def set_testing_mode(self, enabled: bool):
        """Enable testing mode with lower thresholds for easier demo."""
        self.testing_mode = enabled
        if enabled:
            # Lower thresholds by 40% for easier triggering in testing
            self.punch_threshold = self.PUNCH_VELOCITY_THRESHOLD * 0.6
            self.kick_threshold = self.KICK_VELOCITY_THRESHOLD * 0.6
            self.fall_threshold = self.FALL_VELOCITY_THRESHOLD * 0.6
            print(f"[FightDetector] Testing mode ENABLED (Lower velocity thresholds)")
        else:
            self.punch_threshold = self.PUNCH_VELOCITY_THRESHOLD
            self.kick_threshold = self.KICK_VELOCITY_THRESHOLD
            self.fall_threshold = self.FALL_VELOCITY_THRESHOLD
            print(f"[FightDetector] Testing mode DISABLED (Normal thresholds)")

    
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
    
    def _get_keypoint_center(self, keypoints: np.ndarray) -> Tuple[int, int]:
        """Get center of body from keypoints."""
        # Use hip midpoint as body center
        left_hip = keypoints[self.KEYPOINTS["left_hip"]][:2]
        right_hip = keypoints[self.KEYPOINTS["right_hip"]][:2]
        
        # Check if both hips detected (confidence > 0.3)
        if keypoints[self.KEYPOINTS["left_hip"]][2] > 0.3 and keypoints[self.KEYPOINTS["right_hip"]][2] > 0.3:
            return (int((left_hip[0] + right_hip[0]) / 2), int((left_hip[1] + right_hip[1]) / 2))
        
        # Fallback to shoulders
        left_shoulder = keypoints[self.KEYPOINTS["left_shoulder"]][:2]
        right_shoulder = keypoints[self.KEYPOINTS["right_shoulder"]][:2]
        return (int((left_shoulder[0] + right_shoulder[0]) / 2), int((left_shoulder[1] + right_shoulder[1]) / 2))
    
    def _calculate_limb_velocity(self, history: PoseHistory, keypoint_idx: int) -> float:
        """Calculate velocity of a specific keypoint over time."""
        if len(history.keypoints_history) < 2:
            return 0.0
        
        recent = list(history.keypoints_history)[-5:]  # Last 5 frames
        timestamps = list(history.timestamps)[-5:]
        
        if len(recent) < 2:
            return 0.0
        
        velocities = []
        for i in range(1, len(recent)):
            dt = timestamps[i] - timestamps[i-1]
            if dt <= 0:
                continue
            
            kp_prev = recent[i-1][keypoint_idx][:2]
            kp_curr = recent[i][keypoint_idx][:2]
            
            # Check confidence
            if recent[i-1][keypoint_idx][2] < 0.3 or recent[i][keypoint_idx][2] < 0.3:
                continue
            
            dist = np.sqrt((kp_curr[0] - kp_prev[0])**2 + (kp_curr[1] - kp_prev[1])**2)
            velocities.append(dist / dt)
        
        return max(velocities) if velocities else 0.0
    
    def _detect_punch(self, history: PoseHistory) -> Optional[AggressionEvent]:
        """Detect punching motion from wrist velocity."""
        left_wrist_vel = self._calculate_limb_velocity(history, self.KEYPOINTS["left_wrist"])
        right_wrist_vel = self._calculate_limb_velocity(history, self.KEYPOINTS["right_wrist"])
        
        max_vel = max(left_wrist_vel, right_wrist_vel)
        
        if max_vel > self.punch_threshold:
            confidence = min(0.5 + (max_vel - self.punch_threshold) / 1000, 0.95)
            return AggressionEvent(
                event_type="punch",
                confidence=confidence,
                involved_persons=[history.person_id],
                location=history.positions[-1] if history.positions else (0, 0),
                timestamp=time.time(),
                velocity=max_vel
            )
        return None
    
    def _detect_kick(self, history: PoseHistory) -> Optional[AggressionEvent]:
        """Detect kicking motion from ankle velocity."""
        left_ankle_vel = self._calculate_limb_velocity(history, self.KEYPOINTS["left_ankle"])
        right_ankle_vel = self._calculate_limb_velocity(history, self.KEYPOINTS["right_ankle"])
        
        max_vel = max(left_ankle_vel, right_ankle_vel)
        
        if max_vel > self.kick_threshold:
            confidence = min(0.5 + (max_vel - self.kick_threshold) / 1200, 0.95)
            return AggressionEvent(
                event_type="kick",
                confidence=confidence,
                involved_persons=[history.person_id],
                location=history.positions[-1] if history.positions else (0, 0),
                timestamp=time.time(),
                velocity=max_vel
            )
        return None
    
    def _detect_fall(self, history: PoseHistory) -> Optional[AggressionEvent]:
        """Detect person falling (rapid downward movement of head/shoulders)."""
        if len(history.keypoints_history) < 3:
            return None
        
        recent_kp = list(history.keypoints_history)[-3:]
        timestamps = list(history.timestamps)[-3:]
        
        # Check nose/shoulder vertical velocity
        total_dt = timestamps[-1] - timestamps[0]
        if total_dt <= 0:
            return None
        
        # Get head position (nose)
        nose_start_y = recent_kp[0][self.KEYPOINTS["nose"]][1]
        nose_end_y = recent_kp[-1][self.KEYPOINTS["nose"]][1]
        
        vertical_velocity = (nose_end_y - nose_start_y) / total_dt  # Positive = downward
        
        if vertical_velocity > self.fall_threshold:
            confidence = min(0.6 + vertical_velocity / 1000, 0.90)
            return AggressionEvent(
                event_type="fall",
                confidence=confidence,
                involved_persons=[history.person_id],
                location=history.positions[-1] if history.positions else (0, 0),
                timestamp=time.time(),
                velocity=vertical_velocity
            )
        return None
    
    def _detect_fight(self, all_histories: Dict[int, PoseHistory]) -> Optional[AggressionEvent]:
        """Detect fight: multiple people + aggression in close proximity."""
        if len(all_histories) < 2:
            return None
        
        # Find pairs of people in close proximity with aggression
        positions = [(pid, h.positions[-1] if h.positions else None) 
                     for pid, h in all_histories.items() if h.positions]
        
        fight_pairs = []
        
        for i, (pid1, pos1) in enumerate(positions):
            if pos1 is None:
                continue
            for pid2, pos2 in positions[i+1:]:
                if pos2 is None:
                    continue
                    
                dist = np.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
                
                if dist < self.FIGHT_DISTANCE_THRESHOLD:
                    # Check for aggression from either person
                    h1 = all_histories[pid1]
                    h2 = all_histories[pid2]
                    
                    punch1 = self._detect_punch(h1)
                    punch2 = self._detect_punch(h2)
                    
                    if punch1 or punch2:
                        fight_pairs.append((pid1, pid2, max(
                            punch1.confidence if punch1 else 0,
                            punch2.confidence if punch2 else 0
                        )))
        
        if fight_pairs:
            # Combine into single fight event
            involved = list(set([p[0] for p in fight_pairs] + [p[1] for p in fight_pairs]))
            confidence = max(p[2] for p in fight_pairs)
            
            # Boost confidence for multiple involved
            confidence = min(confidence + len(involved) * 0.05, 0.99)
            
            # Get center of fight
            centers = [all_histories[pid].positions[-1] for pid in involved 
                      if pid in all_histories and all_histories[pid].positions]
            if centers:
                center_x = sum(c[0] for c in centers) // len(centers)
                center_y = sum(c[1] for c in centers) // len(centers)
                location = (center_x, center_y)
            else:
                location = (0, 0)
            
            return AggressionEvent(
                event_type="fight",
                confidence=confidence,
                involved_persons=involved,
                location=location,
                timestamp=time.time()
            )
        return None
    
    def _detect_crowd_scatter(self, all_histories: Dict[int, PoseHistory]) -> Optional[AggressionEvent]:
        """Detect crowd scattering from a center point (panic response)."""
        if len(all_histories) < self.SCATTER_THRESHOLD:
            return None
        
        # Calculate center of all people
        positions = [h.positions[-1] for h in all_histories.values() if h.positions]
        if len(positions) < self.SCATTER_THRESHOLD:
            return None
        
        center_x = sum(p[0] for p in positions) / len(positions)
        center_y = sum(p[1] for p in positions) / len(positions)
        center = (center_x, center_y)
        
        # Check if people are moving AWAY from center
        moving_away_count = 0
        
        for history in all_histories.values():
            if len(history.positions) < 3:
                continue
            
            prev_pos = history.positions[-3]
            curr_pos = history.positions[-1]
            
            prev_dist = np.sqrt((prev_pos[0] - center[0])**2 + (prev_pos[1] - center[1])**2)
            curr_dist = np.sqrt((curr_pos[0] - center[0])**2 + (curr_pos[1] - center[1])**2)
            
            if curr_dist > prev_dist + 20:  # Moving away
                moving_away_count += 1
        
        if moving_away_count >= self.SCATTER_THRESHOLD:
            confidence = min(0.7 + moving_away_count * 0.03, 0.95)
            return AggressionEvent(
                event_type="crowd_scatter",
                confidence=confidence,
                involved_persons=list(all_histories.keys()),
                location=(int(center_x), int(center_y)),
                timestamp=time.time()
            )
        return None
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> Dict:
        """
        Process a single frame for fight detection.
        
        Args:
            frame: BGR image from OpenCV
            timestamp: Current timestamp in seconds
            
        Returns:
            Dict with detection results and any alerts
        """
        self._frame_count += 1
        
        # Run YOLOv8-Pose
        results = self.model(frame, verbose=False)
        
        events = []
        persons_detected = 0
        
        if results[0].keypoints is not None:
            keypoints_data = results[0].keypoints.data.cpu().numpy()
            persons_detected = len(keypoints_data)
            
            # Process each detected person
            for kp in keypoints_data:
                center = self._get_keypoint_center(kp)
                person_id = self._assign_track_id(center)
                
                # Get or create history
                if person_id not in self.pose_histories:
                    self.pose_histories[person_id] = PoseHistory(person_id=person_id)
                
                history = self.pose_histories[person_id]
                history.keypoints_history.append(kp)
                history.timestamps.append(timestamp)
                history.positions.append(center)
                
                # Detect individual aggression
                punch_event = self._detect_punch(history)
                if punch_event:
                    events.append(punch_event)
                
                kick_event = self._detect_kick(history)
                if kick_event:
                    events.append(kick_event)
                
                fall_event = self._detect_fall(history)
                if fall_event:
                    events.append(fall_event)
            
            # Detect group events
            fight_event = self._detect_fight(self.pose_histories)
            if fight_event:
                events.append(fight_event)
            
            scatter_event = self._detect_crowd_scatter(self.pose_histories)
            if scatter_event:
                events.append(scatter_event)
        
        # Annotate frame
        annotated_frame = self._annotate_frame(frame, results, events)
        
        # Filter to high-confidence alerts
        alerts = [e for e in events if e.confidence >= self.CONFIDENCE_THRESHOLD]
        
        return {
            "frame": annotated_frame,
            "persons_detected": persons_detected,
            "events": [{"type": e.event_type, "confidence": e.confidence, 
                       "persons": e.involved_persons, "location": e.location}
                      for e in events],
            "alerts": [{"type": e.event_type, "confidence": e.confidence,
                       "persons": e.involved_persons, "location": e.location}
                      for e in alerts],
            "timestamp": timestamp
        }
    
    def _annotate_frame(self, frame: np.ndarray, results, events: List[AggressionEvent]) -> np.ndarray:
        """Draw annotations on frame."""
        annotated = results[0].plot()
        
        # Draw event indicators
        for event in events:
            x, y = event.location
            
            if event.event_type == "fight":
                color = (0, 0, 255)  # Red
                label = f"⚠️ FIGHT ({event.confidence:.0%})"
                cv2.circle(annotated, (x, y), 80, color, 3)
            elif event.event_type == "punch":
                color = (0, 165, 255)  # Orange
                label = f"Punch ({event.confidence:.0%})"
            elif event.event_type == "kick":
                color = (0, 165, 255)
                label = f"Kick ({event.confidence:.0%})"
            elif event.event_type == "fall":
                color = (255, 0, 255)  # Magenta
                label = f"Fall ({event.confidence:.0%})"
            elif event.event_type == "crowd_scatter":
                color = (255, 0, 0)  # Blue
                label = f"Crowd Scattering"
                cv2.circle(annotated, (x, y), 100, color, 2)
            else:
                continue
            
            cv2.putText(annotated, label, (x - 50, y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        return annotated
    
    def get_screenshot(self, frame: np.ndarray) -> str:
        """Encode frame as base64 JPEG."""
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return base64.b64encode(buffer).decode('utf-8')
    
    def reset(self):
        """Reset all tracking state."""
        self.pose_histories.clear()
        self.previous_positions.clear()
        self.current_events.clear()
        self.next_person_id = 0
        self._frame_count = 0


# Singleton instance
_detector_instance = None

def get_fight_detector() -> FightDetector:
    """Get or create singleton detector instance."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = FightDetector()
    return _detector_instance
