# CROWDEX BACKEND SPECIFICATION

## Project Overview

FastAPI backend for Crowdex - provides YOLOv8 person detection for live camera feeds and uploaded videos.

---

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container deployment
├── yolov8n.pt              # YOLOv8 nano model weights
├── data/
│   ├── mock_data.py        # Chennai locations & crowd simulation
│   └── saved_cameras.json  # Persisted custom cameras
├── routers/
│   ├── locations.py        # Location endpoints
│   ├── camera.py           # Local webcam endpoints
│   ├── rtsp_camera.py      # RTSP/HLS streaming endpoints
│   └── upload.py           # Video upload endpoints
└── services/
    ├── detector.py         # YOLOv8 singleton detector
    ├── camera.py           # Local webcam service
    ├── rtsp_camera.py      # RTSP/HLS camera service
    └── video_processor.py  # Video upload processing
```

---

## Core Services

### 1. ObjectDetector (services/detector.py)

Singleton YOLOv8 detector:

```python
class ObjectDetector:
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def detect_people(self, frame) -> Tuple[np.ndarray, int]:
        """Detect people in frame, return annotated frame and count"""
        if self._model is None:
            self._model = YOLO("yolov8n.pt")
        results = self._model(frame, classes=[0], verbose=False)  # class 0 = person
        annotated_frame = results[0].plot()
        count = len(results[0].boxes)
        return annotated_frame, count
```

### 2. RTSPCameraService (services/rtsp_camera.py)

Manages camera streams with YOLO detection.

**Supported Stream Types:**
- RTSP streams
- HLS (m3u8) streams
- HTTP streams
- YouTube Live (via yt-dlp)

**Camera Data Structure:**
```python
{
    "id": "cam_001",
    "name": "Custom Camera",
    "url": "rtsp://...",
    "location": "Chennai",
    "description": "Description text",
    "type": "custom",
    "is_active": False
}
```

**Key Methods:**
- `get_saved_cameras()` - List saved cameras from JSON
- `save_camera(data)` - Save new camera configuration
- `delete_camera(id)` - Remove camera
- `update_camera(id, updates)` - Update camera settings
- `start_stream(camera_id)` - Begin streaming
- `stop_stream(camera_id)` - End streaming
- `generate_processed_frames(camera_id)` - Async generator yielding (frame_bytes, count)

**YouTube Support:**
Uses yt-dlp to extract direct stream URL from YouTube Live links.

### 3. VideoProcessor (services/video_processor.py)

Processes uploaded videos with YOLO detection.

**Processing Flow:**
1. Save uploaded file with UUID
2. Open video with OpenCV
3. Process every Nth frame (frame_skip parameter)
4. Track counts per second
5. Generate statistics
6. Save results to JSON
7. Delete video file (save space)

**Status Object:**
```python
{
    "status": "processing" | "completed" | "error",
    "progress": 0-100,
    "current_count": int,
    "counts": [int, ...],
    "frames_processed": int,
    "total_frames": int,
    "preview_frame": "base64...",  # Live preview
    "avg_count": float,
    "peak_count": int,
    "min_count": int,
    "timeline_per_second": [{"second": int, "avg_count": float, "max_count": int}, ...]
}
```

### 4. Mock Data (data/mock_data.py)

15 Chennai locations with crowd simulation.

**Location Types:**
- mall (4 locations)
- beach (2 locations)
- park (2 locations)
- transit (3 locations)
- market (2 locations)
- attraction (2 locations)

**Crowd Patterns:**
Each type has hourly patterns for weekday/weekend. Patterns return realistic crowd percentages based on time of day.

---

## API Endpoints

### Main App (main.py)

```python
app = FastAPI(title="Crowdex Backend", version="1.0.0")

# CORS - allows all origins
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

# Health check
@app.get("/api/health")
async def health():
    return {"status": "healthy"}
```

### Location Endpoints (routers/locations.py)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all locations |
| GET | `/api/locations?type=mall` | Filter by type |
| GET | `/api/locations/{id}` | Get location details |

**Response Fields:**
- id, name, type, address, lat, lng
- current_count, capacity, crowd_level, crowd_percentage
- trend, trend_change, last_updated
- popular_times, best_times, avoid_times (for detail endpoint)

### Camera Endpoints (routers/camera.py)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/camera/status` | Check camera availability |
| GET | `/api/camera/frame` | Get single frame with detection |

| WebSocket | Description |
|-----------|-------------|
| `/ws/camera/live` | Live count streaming (JSON) |
| `/ws/camera/stream` | Live video streaming with detection |

### RTSP Camera Endpoints (routers/rtsp_camera.py)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rtsp/cameras` | List all cameras |
| POST | `/api/rtsp/saved` | Save new camera |
| PUT | `/api/rtsp/saved/{id}` | Update camera |
| DELETE | `/api/rtsp/saved/{id}` | Delete camera |
| POST | `/api/rtsp/stream/start` | Start stream |
| POST | `/api/rtsp/stream/stop/{id}` | Stop stream |
| GET | `/api/rtsp/stream/status/{id}` | Get stream status |

| WebSocket | Description |
|-----------|-------------|
| `/ws/rtsp/stream/{camera_id}` | Live stream with YOLO detection |

**WebSocket Data Flow:**
1. Send: Binary JPEG frame bytes
2. Send: JSON `{"count": int, "camera_id": str, "timestamp": float}`

**Create Camera Request:**
```python
class CreateCameraRequest(BaseModel):
    name: str
    url: str
    location: Optional[str] = "Custom"
    description: Optional[str] = ""
```

### Upload Endpoints (routers/upload.py)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/video?frame_skip=15` | Upload video |
| GET | `/api/upload/{id}/status` | Get processing status |
| DELETE | `/api/upload/{id}` | Delete upload |

| WebSocket | Description |
|-----------|-------------|
| `/ws/upload/{file_id}/progress` | Real-time processing progress |

**Upload Response:**
```json
{
    "id": "uuid",
    "status": "processing",
    "frame_skip": 15
}
```

**Progress WebSocket Data:**
```json
{
    "status": "processing",
    "progress": 45,
    "current_count": 23,
    "preview_frame": "base64...",
    "frames_processed": 450,
    "total_frames": 1000
}
```

---

## Requirements

```txt
fastapi
uvicorn[standard]
opencv-python
ultralytics
python-multipart
yt-dlp
```

---

## Running the Server

### Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Docker
```bash
docker build -t crowdex-backend .
docker run -p 8000:8000 crowdex-backend
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `UPLOAD_DIR` | Video uploads directory | `../uploads` |

---

## Testing

### Health Check
```bash
curl http://localhost:8000/api/health
# {"status": "healthy"}
```

### List Locations
```bash
curl http://localhost:8000/api/locations
# {"locations": [...], "total": 15, "timestamp": "..."}
```

### Filter by Type
```bash
curl http://localhost:8000/api/locations?type=mall
# {"locations": [4 malls...], "total": 4, ...}
```

### Upload Video
```bash
curl -X POST -F "file=@video.mp4" "http://localhost:8000/api/upload/video?frame_skip=30"
# {"id": "uuid", "status": "processing", "frame_skip": 30}
```

---

## Key Implementation Notes

1. **Singleton Detector** - YOLOv8 model loads once, shared across requests
2. **Frame Skip** - Higher values = faster processing, fewer data points
3. **Video Cleanup** - Videos deleted after processing to save disk space
4. **Camera Persistence** - Saved to `data/saved_cameras.json`
5. **CORS Enabled** - Allows all origins for hackathon use
6. **WebSocket Streaming** - Sends binary frames + JSON detection data alternately

---

*Document updated: February 1, 2026*
*Reflects current production backend*
