# 🤖 CLAUDE OPUS BACKEND PROMPT: Enhance Crowdex Backend

## Your Mission

**The Crowdex backend is already working.** Your job is to **enhance and extend it** to support the new Chennai-focused frontend with 15 public locations, improved mock data patterns, and additional API endpoints for the new UI features.

---

## ⚠️ IMPORTANT: Existing Working Backend

**DO NOT BREAK WHAT IS ALREADY WORKING!**

The current backend has these working features:
- ✅ FastAPI server on port 8000
- ✅ YOLOv8 person detection (singleton pattern, auto-loads model)
- ✅ Live camera WebSocket streaming (`/ws/camera/live` and `/ws/camera/stream`)
- ✅ Video upload and processing with WebSocket progress
- ✅ Mock data for 6 campus locations
- ✅ Predictions and weekly heatmap generation

---

## 🎯 What Needs to Change

### 1. Update Locations Data
**Replace campus locations with Chennai public places**

Current locations (in `data/mock_data.py`):
```python
LOCATIONS = [
    {"id": "loc_001", "name": "Central Library", "capacity": 150},
    {"id": "loc_002", "name": "Student Cafeteria", "capacity": 200},
    {"id": "loc_003", "name": "Bus Terminal", "capacity": 100},
    {"id": "loc_004", "name": "Main Auditorium", "capacity": 500},
    {"id": "loc_005", "name": "Sports Complex", "capacity": 300},
    {"id": "loc_006", "name": "Medical Center", "capacity": 80},
]
```

**Replace with these 15 Chennai locations:**
```python
LOCATIONS = [
    # MALLS
    {
        "id": "loc_001",
        "name": "Express Avenue Mall",
        "type": "mall",
        "address": "Whites Road, Royapettah, Chennai",
        "lat": 13.0604,
        "lng": 80.2627,
        "capacity": 5000
    },
    {
        "id": "loc_002",
        "name": "Phoenix MarketCity",
        "type": "mall",
        "address": "Velachery Main Road, Velachery",
        "lat": 12.9941,
        "lng": 80.2189,
        "capacity": 8000
    },
    {
        "id": "loc_003",
        "name": "VR Chennai",
        "type": "mall",
        "address": "Jawaharlal Nehru Road, Anna Nagar",
        "lat": 13.0878,
        "lng": 80.2069,
        "capacity": 6000
    },
    {
        "id": "loc_004",
        "name": "Forum Vijaya Mall",
        "type": "mall",
        "address": "Arcot Road, Vadapalani",
        "lat": 13.0500,
        "lng": 80.2121,
        "capacity": 4000
    },
    
    # BEACHES
    {
        "id": "loc_005",
        "name": "Marina Beach",
        "type": "beach",
        "address": "Marina Beach Road, Triplicane",
        "lat": 13.0500,
        "lng": 80.2824,
        "capacity": 50000
    },
    {
        "id": "loc_006",
        "name": "Besant Nagar Beach",
        "type": "beach",
        "address": "Elliot's Beach, Besant Nagar",
        "lat": 12.9988,
        "lng": 80.2717,
        "capacity": 10000
    },
    
    # PARKS
    {
        "id": "loc_007",
        "name": "Guindy National Park",
        "type": "park",
        "address": "Guindy, Chennai",
        "lat": 13.0067,
        "lng": 80.2206,
        "capacity": 3000
    },
    {
        "id": "loc_008",
        "name": "Semmozhi Poonga",
        "type": "park",
        "address": "Cathedral Road, Gopalapuram",
        "lat": 13.0371,
        "lng": 80.2565,
        "capacity": 2000
    },
    
    # TRANSIT
    {
        "id": "loc_009",
        "name": "Chennai Central Station",
        "type": "transit",
        "address": "Periyamet, Chennai",
        "lat": 13.0827,
        "lng": 80.2707,
        "capacity": 15000
    },
    {
        "id": "loc_010",
        "name": "Chennai Egmore Station",
        "type": "transit",
        "address": "Egmore, Chennai",
        "lat": 13.0732,
        "lng": 80.2609,
        "capacity": 10000
    },
    {
        "id": "loc_011",
        "name": "CMBT Bus Terminus",
        "type": "transit",
        "address": "Koyambedu, Chennai",
        "lat": 13.0694,
        "lng": 80.1948,
        "capacity": 20000
    },
    
    # MARKETS
    {
        "id": "loc_012",
        "name": "T. Nagar Ranganathan Street",
        "type": "market",
        "address": "T. Nagar, Chennai",
        "lat": 13.0418,
        "lng": 80.2341,
        "capacity": 25000
    },
    {
        "id": "loc_013",
        "name": "Pondy Bazaar",
        "type": "market",
        "address": "Thyagaraya Road, T. Nagar",
        "lat": 13.0458,
        "lng": 80.2399,
        "capacity": 15000
    },
    
    # ATTRACTIONS
    {
        "id": "loc_014",
        "name": "Government Museum",
        "type": "attraction",
        "address": "Pantheon Road, Egmore",
        "lat": 13.0694,
        "lng": 80.2566,
        "capacity": 5000
    },
    {
        "id": "loc_015",
        "name": "Valluvar Kottam",
        "type": "attraction",
        "address": "Valluvar Kottam High Road, Nungambakkam",
        "lat": 13.0499,
        "lng": 80.2422,
        "capacity": 3000
    }
]
```

---

### 2. Add Location Type-Specific Crowd Patterns

Different location types have different crowd patterns. Add to `data/mock_data.py`:

```python
# Crowd patterns by location type (percentage of capacity by hour)
CROWD_PATTERNS = {
    "mall": {
        "weekday": [
            0.05, 0.02, 0.02, 0.02, 0.02, 0.03,  # 00:00 - 05:00
            0.05, 0.08, 0.12, 0.20, 0.35, 0.55,  # 06:00 - 11:00
            0.70, 0.75, 0.65, 0.55, 0.50, 0.60,  # 12:00 - 17:00
            0.75, 0.85, 0.80, 0.65, 0.45, 0.20   # 18:00 - 23:00
        ],
        "weekend": [
            0.05, 0.03, 0.02, 0.02, 0.02, 0.03,
            0.05, 0.08, 0.15, 0.30, 0.50, 0.70,
            0.85, 0.90, 0.85, 0.80, 0.75, 0.80,
            0.90, 0.95, 0.85, 0.70, 0.50, 0.25
        ]
    },
    "beach": {
        "weekday": [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.15,
            0.35, 0.40, 0.30, 0.20, 0.15, 0.10,
            0.08, 0.06, 0.08, 0.12, 0.25, 0.50,
            0.75, 0.85, 0.70, 0.45, 0.25, 0.10
        ],
        "weekend": [
            0.03, 0.02, 0.01, 0.02, 0.05, 0.20,
            0.45, 0.55, 0.45, 0.30, 0.20, 0.15,
            0.12, 0.10, 0.15, 0.25, 0.45, 0.70,
            0.90, 0.95, 0.80, 0.55, 0.30, 0.15
        ]
    },
    "park": {
        "weekday": [
            0.02, 0.01, 0.01, 0.01, 0.05, 0.25,
            0.45, 0.50, 0.35, 0.20, 0.15, 0.10,
            0.08, 0.06, 0.08, 0.15, 0.30, 0.45,
            0.55, 0.50, 0.35, 0.20, 0.10, 0.05
        ],
        "weekend": [
            0.02, 0.01, 0.01, 0.02, 0.08, 0.35,
            0.60, 0.65, 0.55, 0.40, 0.30, 0.25,
            0.20, 0.18, 0.20, 0.30, 0.45, 0.60,
            0.65, 0.55, 0.40, 0.25, 0.12, 0.05
        ]
    },
    "transit": {
        "weekday": [
            0.15, 0.10, 0.08, 0.08, 0.12, 0.25,
            0.50, 0.75, 0.85, 0.70, 0.50, 0.45,
            0.40, 0.35, 0.30, 0.35, 0.50, 0.70,
            0.85, 0.80, 0.65, 0.50, 0.35, 0.20
        ],
        "weekend": [
            0.12, 0.08, 0.06, 0.06, 0.10, 0.20,
            0.35, 0.50, 0.55, 0.50, 0.45, 0.40,
            0.40, 0.38, 0.35, 0.40, 0.50, 0.60,
            0.65, 0.60, 0.50, 0.40, 0.30, 0.18
        ]
    },
    "market": {
        "weekday": [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.05,
            0.10, 0.20, 0.35, 0.55, 0.75, 0.85,
            0.80, 0.70, 0.60, 0.55, 0.60, 0.75,
            0.85, 0.80, 0.60, 0.40, 0.20, 0.08
        ],
        "weekend": [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.05,
            0.12, 0.25, 0.45, 0.65, 0.85, 0.95,
            0.90, 0.80, 0.70, 0.65, 0.70, 0.80,
            0.85, 0.75, 0.55, 0.35, 0.18, 0.08
        ]
    },
    "attraction": {
        "weekday": [
            0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
            0.00, 0.00, 0.05, 0.20, 0.40, 0.60,
            0.70, 0.65, 0.55, 0.50, 0.55, 0.45,
            0.30, 0.15, 0.00, 0.00, 0.00, 0.00
        ],
        "weekend": [
            0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
            0.00, 0.00, 0.08, 0.30, 0.55, 0.75,
            0.85, 0.80, 0.70, 0.65, 0.60, 0.50,
            0.35, 0.18, 0.00, 0.00, 0.00, 0.00
        ]
    }
}

def _get_time_multiplier(location_type: str = "mall") -> float:
    """Get crowd multiplier based on time of day and location type."""
    from datetime import datetime
    
    hour = datetime.now().hour
    is_weekend = datetime.now().weekday() >= 5
    
    pattern_key = "weekend" if is_weekend else "weekday"
    patterns = CROWD_PATTERNS.get(location_type, CROWD_PATTERNS["mall"])
    pattern = patterns.get(pattern_key, patterns["weekday"])
    
    return pattern[hour] if 0 <= hour < 24 else 0.5
```

---

### 3. Update API Response Format

The new frontend expects additional fields. Update `get_all_locations()` in `data/mock_data.py`:

```python
def get_all_locations() -> List[Dict[str, Any]]:
    """Get all locations with current crowd status."""
    _update_counts()
    
    locations = []
    for loc in LOCATIONS:
        loc_id = loc["id"]
        count = _current_counts.get(loc_id, int(loc["capacity"] * 0.5))
        capacity = loc["capacity"]
        
        # Calculate trend
        history = _trend_history.get(loc_id, [count])
        trend_direction = "stable"
        trend_change = 0
        if len(history) >= 2:
            change_percent = ((history[-1] - history[0]) / max(history[0], 1)) * 100
            if change_percent > 3:
                trend_direction = "rising"
                trend_change = int(change_percent)
            elif change_percent < -3:
                trend_direction = "falling"
                trend_change = int(change_percent)
        
        locations.append({
            "id": loc_id,
            "name": loc["name"],
            "type": loc.get("type", "other"),
            "address": loc.get("address", ""),
            "lat": loc.get("lat", 0),
            "lng": loc.get("lng", 0),
            "current_count": count,
            "capacity": capacity,
            "crowd_level": get_crowd_level(count, capacity),
            "crowd_percentage": int((count / capacity) * 100),
            "trend": trend_direction,
            "trend_change": trend_change,
            "last_updated": datetime.now().isoformat() + "Z",
            "recent_counts": _trend_history.get(loc_id, [count])[-5:]
        })
    
    return locations
```

---

### 4. Add Popular Times and Best Time Endpoints

The new UI needs a "Popular Times" chart like Google Maps. Add to `data/mock_data.py`:

```python
def generate_popular_times(location_id: str) -> List[Dict]:
    """Generate popular times data (6 AM to 11 PM) for a location."""
    loc = next((l for l in LOCATIONS if l["id"] == location_id), None)
    if not loc:
        return []
    
    location_type = loc.get("type", "mall")
    is_weekend = datetime.now().weekday() >= 5
    pattern_key = "weekend" if is_weekend else "weekday"
    patterns = CROWD_PATTERNS.get(location_type, CROWD_PATTERNS["mall"])
    pattern = patterns.get(pattern_key)
    
    current_hour = datetime.now().hour
    
    times = []
    for hour in range(6, 24):  # 6 AM to 11 PM
        crowd_level = int(pattern[hour] * 100)
        times.append({
            "hour": f"{hour:02d}:00",
            "crowd_level": crowd_level,
            "label": "Now" if hour == current_hour else None
        })
    
    return times


def get_best_times(location_id: str) -> Dict:
    """Get best time to visit recommendation."""
    popular_times = generate_popular_times(location_id)
    
    # Find hours with crowd_level < 40
    quiet_hours = [t for t in popular_times if t["crowd_level"] < 40]
    peak_hours = [t for t in popular_times if t["crowd_level"] >= 70]
    
    best = {
        "recommended_window": "Early morning (6-8 AM)",
        "description": "Generally the quietest time",
        "hours": ["06:00", "07:00", "08:00"]
    }
    
    if quiet_hours:
        # Find contiguous quiet windows
        start = quiet_hours[0]["hour"]
        end = quiet_hours[-1]["hour"]
        best = {
            "recommended_window": f"{start} - {end}",
            "description": "Typically 40% less crowded than peak hours",
            "hours": [t["hour"] for t in quiet_hours]
        }
    
    avoid = {
        "peak_window": "12:00 PM - 1:00 PM",
        "description": "Usually most crowded"
    }
    
    if peak_hours:
        avoid = {
            "peak_window": f"{peak_hours[0]['hour']} - {peak_hours[-1]['hour']}",
            "description": "Usually most crowded"
        }
    
    return {
        "best_times": best,
        "avoid_times": avoid
    }
```

---

### 5. Update Location Detail Endpoint

Update `get_location_by_id()` to include new fields:

```python
def get_location_by_id(location_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific location with detailed stats."""
    _update_counts()
    
    loc = next((l for l in LOCATIONS if l["id"] == location_id), None)
    if not loc:
        return None
    
    count = _current_counts.get(location_id, int(loc["capacity"] * 0.5))
    capacity = loc["capacity"]
    
    # Generate hourly data
    hourly_data = generate_hourly_data(location_id)
    counts_today = [h["count"] for h in hourly_data if h["count"] > 0]
    peak_count = max(counts_today) if counts_today else 0
    peak_hour = counts_today.index(peak_count) if counts_today else 12
    low_count = min(counts_today) if counts_today else 0
    low_hour = counts_today.index(low_count) if counts_today else 6
    
    # Get popular times and best times
    popular_times = generate_popular_times(location_id)
    times_info = get_best_times(location_id)
    
    return {
        "id": location_id,
        "name": loc["name"],
        "type": loc.get("type", "other"),
        "address": loc.get("address", ""),
        "lat": loc.get("lat", 0),
        "lng": loc.get("lng", 0),
        "current_count": count,
        "capacity": capacity,
        "crowd_level": get_crowd_level(count, capacity),
        "crowd_percentage": int((count / capacity) * 100),
        "last_updated": datetime.now().isoformat() + "Z",
        "trend": _trend_history.get(location_id, [count])[-5:],
        "today_stats": {
            "peak_count": peak_count,
            "peak_time": f"{peak_hour:02d}:30",
            "low_count": low_count,
            "low_time": f"{low_hour:02d}:00",
            "average": int(sum(counts_today) / len(counts_today)) if counts_today else 0
        },
        "popular_times": popular_times,
        "best_times": times_info["best_times"],
        "avoid_times": times_info["avoid_times"],
        "hourly_data": hourly_data
    }
```

---

### 6. Add Filter by Type Endpoint

Add to `routers/locations.py`:

```python
@router.get("")
async def list_locations(type: str = None):
    """
    Get list of all monitored locations with current crowd status.
    
    Args:
        type: Optional filter by location type (mall, beach, park, transit, market, attraction)
    """
    locations = get_all_locations()
    
    if type:
        locations = [loc for loc in locations if loc.get("type") == type]
    
    return {
        "locations": locations,
        "total": len(locations),
        "timestamp": datetime.now().isoformat() + "Z"
    }
```

---

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `data/mock_data.py` | Update LOCATIONS, add CROWD_PATTERNS, update functions |
| `routers/locations.py` | Add type filter, ensure all new fields are returned |
| `services/predictions.py` | Update to use location types for patterns |
| `config.py` | No changes needed (already good) |
| `main.py` | No changes needed (already good) |

---

## ✅ Files Already Working (DO NOT MODIFY)

| File | Status |
|------|--------|
| `services/detector.py` | ✅ Perfect - singleton YOLOv8 detector |
| `services/camera.py` | ✅ Perfect - camera service with WebSocket |
| `services/video_processor.py` | ✅ Perfect - video upload processing |
| `routers/camera.py` | ✅ Perfect - WebSocket endpoints work |
| `routers/upload.py` | ✅ Perfect - upload and progress work |
| `requirements.txt` | ✅ Perfect - all deps installed |

---

## 🔌 Current API Endpoints (Already Working)

### Location Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/locations` | List all locations |
| `GET /api/locations/{id}` | Get location details |
| `GET /api/locations/{id}/history` | Get historical data |
| `GET /api/locations/{id}/predictions` | Get predictions for location |
| `GET /api/locations/{id}/heatmap` | Get weekly heatmap |
| `GET /api/locations/predictions/all` | Get all predictions |
| `GET /api/predictions` | Shortcut to all predictions |

### Camera Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/camera/status` | Check camera availability |
| `GET /api/camera/frame` | Get single frame with detection |
| `WS /ws/camera/live` | Live count streaming (no video) |
| `WS /ws/camera/stream` | Live video streaming with detection |

### Upload Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /api/upload/video` | Upload video file |
| `GET /api/upload/{id}/status` | Get upload status |
| `WS /ws/upload/{id}/progress` | Stream processing progress |
| `DELETE /api/upload/{id}` | Delete upload |

### System Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /` | API info and links |
| `GET /api/health` | Health check |

---

## 🧪 Testing After Changes

After making changes, verify:

1. **Health Check:** `GET http://localhost:8000/api/health` → healthy
2. **Locations List:** `GET http://localhost:8000/api/locations` → 15 locations with lat/lng
3. **Filter by Type:** `GET http://localhost:8000/api/locations?type=mall` → 4 malls
4. **Location Detail:** `GET http://localhost:8000/api/locations/loc_001` → includes popular_times
5. **WebSocket Still Works:** Connect to `ws://localhost:8000/ws/camera/live` → streams count
6. **Video Upload Still Works:** POST a video → processing works

---

## 🎯 Summary of Changes

1. **Replace** 6 campus locations with 15 Chennai public places
2. **Add** location type-specific crowd patterns (mall, beach, park, transit, market, attraction)
3. **Add** `lat`, `lng`, `type`, `address` fields to all locations
4. **Add** `popular_times` array to location detail response
5. **Add** `best_times` and `avoid_times` to location detail response
6. **Add** `crowd_percentage`, `trend`, `trend_change` to location list response
7. **Add** optional `?type=` filter parameter to locations list endpoint

---

## 🚀 How to Run After Changes

```bash
cd d:\crowdex\backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

**ENHANCE THE BACKEND. Don't break what's working. Make it Chennai-ready!** 🚀

---

*Document updated: January 28, 2026*
*Matches existing working backend structure*
