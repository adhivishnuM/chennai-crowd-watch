"""
Alert Service - Production-grade threat alert management system.
Handles silent alerts for security threats (fight, abandoned object, accident).
Alerts are NEVER shown on public dashboard - admin/first responders only.
"""

import uuid
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Set
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
import numpy as np

def make_serializable(obj):
    """Recursively convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, (np.integer, int)):
        return int(obj)
    if isinstance(obj, (np.floating, float)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return make_serializable(obj.tolist())
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serializable(x) for x in obj]
    return obj



class ThreatType(str, Enum):
    FIGHT = "fight"
    ABANDONED_OBJECT = "abandoned_object"
    ACCIDENT = "accident"


class AlertStatus(str, Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


@dataclass
class ThreatAlert:
    id: str
    threat_type: ThreatType
    confidence: float
    location: str
    screenshot_b64: Optional[str]
    timestamp: float
    metadata: Dict
    status: AlertStatus
    created_at: str
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "threat_type": self.threat_type.value,
            "confidence": self.confidence,
            "location": self.location,
            "screenshot_b64": self.screenshot_b64,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
            "status": self.status.value,
            "created_at": self.created_at
        }


class AlertService:
    """
    Production alert service with:
    - In-memory storage for real-time access
    - JSON file persistence for durability
    - WebSocket broadcast to admin clients
    - Privacy-first design (admin-only)
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AlertService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.alerts: List[ThreatAlert] = []
        self.websocket_connections: Set = set()
        self._alerts_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            "data", 
            "threat_alerts.json"
        )
        self._load_alerts()
        self._initialized = True
    
    def _load_alerts(self):
        """Load alerts from persistent storage."""
        try:
            if os.path.exists(self._alerts_file):
                with open(self._alerts_file, "r") as f:
                    data = json.load(f)
                    for alert_data in data:
                        self.alerts.append(ThreatAlert(
                            id=alert_data["id"],
                            threat_type=ThreatType(alert_data["threat_type"]),
                            confidence=alert_data["confidence"],
                            location=alert_data["location"],
                            screenshot_b64=alert_data.get("screenshot_b64"),
                            timestamp=alert_data["timestamp"],
                            metadata=alert_data.get("metadata", {}),
                            status=AlertStatus(alert_data["status"]),
                            created_at=alert_data["created_at"]
                        ))
                print(f"[AlertService] Loaded {len(self.alerts)} alerts from storage")
        except Exception as e:
            print(f"[AlertService] Could not load alerts: {e}")
            self.alerts = []
    
    def _save_alerts(self):
        """Persist alerts to JSON file."""
        try:
            os.makedirs(os.path.dirname(self._alerts_file), exist_ok=True)
            with open(self._alerts_file, "w") as f:
                json.dump([a.to_dict() for a in self.alerts[-500:]], f, indent=2)
        except Exception as e:
            print(f"[AlertService] Could not save alerts: {e}")
    
    async def create_alert(
        self,
        threat_type: ThreatType,
        confidence: float,
        location: str,
        screenshot_b64: Optional[str] = None,
        timestamp: Optional[float] = None,
        metadata: Optional[Dict] = None
    ) -> ThreatAlert:
        """
        Create a silent threat alert.
        These are NEVER shown on public dashboard.
        """
        alert = ThreatAlert(
            id=str(uuid.uuid4()),
            threat_type=threat_type,
            confidence=make_serializable(confidence),
            location=location,
            screenshot_b64=screenshot_b64,
            timestamp=make_serializable(timestamp or datetime.now().timestamp()),
            metadata=make_serializable(metadata or {}),
            status=AlertStatus.PENDING,
            created_at=datetime.now().isoformat()
        )
        
        self.alerts.append(alert)
        self._save_alerts()
        
        # Broadcast to connected admin WebSocket clients
        await self._broadcast_alert(alert)
        
        print(f"[AlertService] 🚨 THREAT ALERT: {threat_type.value} at {location} ({confidence:.1%} confidence)")
        
        return alert
    
    async def _broadcast_alert(self, alert: ThreatAlert):
        """Send alert to all connected admin WebSocket clients."""
        if not self.websocket_connections:
            return
            
        message = {
            "type": "threat_alert",
            "data": alert.to_dict()
        }
        
        disconnected = set()
        for ws in self.websocket_connections:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.add(ws)
        
        # Remove disconnected clients
        self.websocket_connections -= disconnected
    
    def register_websocket(self, websocket):
        """Register admin WebSocket for real-time alerts."""
        self.websocket_connections.add(websocket)
        print(f"[AlertService] WebSocket registered. Active connections: {len(self.websocket_connections)}")
    
    def unregister_websocket(self, websocket):
        """Unregister WebSocket on disconnect."""
        self.websocket_connections.discard(websocket)
        print(f"[AlertService] WebSocket unregistered. Active connections: {len(self.websocket_connections)}")
    
    def get_alerts(
        self, 
        limit: int = 50, 
        threat_type: Optional[ThreatType] = None,
        status: Optional[AlertStatus] = None
    ) -> List[ThreatAlert]:
        """Get recent alerts with optional filters."""
        filtered = self.alerts
        
        if threat_type:
            filtered = [a for a in filtered if a.threat_type == threat_type]
        if status:
            filtered = [a for a in filtered if a.status == status]
        
        # Return most recent first
        return sorted(filtered, key=lambda a: a.timestamp, reverse=True)[:limit]
    
    def update_alert_status(self, alert_id: str, new_status: AlertStatus) -> Optional[ThreatAlert]:
        """Update alert status (acknowledge, resolve, mark as false positive)."""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.status = new_status
                self._save_alerts()
                return alert
        return None
    
    def get_stats(self) -> Dict:
        """Get alert statistics."""
        total = len(self.alerts)
        by_type = {}
        by_status = {}
        
        for alert in self.alerts:
            by_type[alert.threat_type.value] = by_type.get(alert.threat_type.value, 0) + 1
            by_status[alert.status.value] = by_status.get(alert.status.value, 0) + 1
        
        return {
            "total": total,
            "by_type": by_type,
            "by_status": by_status,
            "pending": by_status.get("pending", 0)
        }


# Singleton instance
alert_service = AlertService()
