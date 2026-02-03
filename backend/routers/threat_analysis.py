"""
Threat Analysis Router - API endpoints for threat detection.

Endpoints:
- POST /api/threat/analyze - Analyze video for threats (upload or YouTube)
- GET /api/threat/alerts - Get recent threat alerts
- PATCH /api/threat/alerts/{id} - Update alert status
- WebSocket /ws/threat/stream/{analysis_id} - Real-time analysis stream

Privacy-First: All alerts are admin-only, never shown on public dashboard.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Tuple
import asyncio
import uuid
import os
import cv2
import time
import base64
import tempfile

router = APIRouter(prefix="/api/threat", tags=["Threat Analysis"])


# Request/Response Models
class AnalyzeRequest(BaseModel):
    youtube_url: Optional[str] = None
    threat_types: List[str] = ["fight", "abandoned_object", "accident"]
    frame_skip: int = 5  # Process every Nth frame
    testing_mode: bool = False  # If True, uses very short thresholds (e.g. 5s instead of 120s)


class AlertStatusUpdate(BaseModel):
    status: str  # "acknowledged", "resolved", "false_positive"


# Analysis state storage
active_analyses = {}


def get_youtube_stream_url(youtube_url: str) -> Optional[str]:
    """
    Extract direct stream URL from YouTube live stream or VOD.
    Uses yt-dlp - tries multiple format options for compatibility.
    Matches logic in rtsp_camera.py for maximum compatibility.
    """
    import subprocess
    import os
    
    # Get the path to yt-dlp in the venv
    venv_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    yt_dlp_paths = [
        os.path.join(venv_path, 'venv', 'Scripts', 'yt-dlp.exe'),  # Windows venv
        os.path.join(venv_path, 'venv', 'bin', 'yt-dlp'),  # Linux venv
        'yt-dlp',  # System PATH
        'yt-dlp.exe',  # Windows PATH
    ]
    
    yt_dlp_cmd = None
    for path in yt_dlp_paths:
        if os.path.exists(path) or path in ['yt-dlp', 'yt-dlp.exe']:
            yt_dlp_cmd = path
            break
            
    if not yt_dlp_cmd:
        print("[ThreatAnalysis] yt-dlp not found")
        return None
        
    # Format options from rtsp_camera.py (proven to work)
    format_options = [
        'best[height<=480]',  # Best quality up to 480p
        'best[height<=720]',  # Best quality up to 720p
        'worst',  # Worst quality (fastest)
        'best',  # Best available
    ]
    
    for fmt in format_options:
        try:
            print(f"[ThreatAnalysis] Trying {yt_dlp_cmd} with format: {fmt} for {youtube_url}")
            result = subprocess.run(
                [yt_dlp_cmd, '-g', '-f', fmt, '--no-warnings', youtube_url],
                capture_output=True,
                text=True,
                timeout=45
            )
            if result.returncode == 0 and result.stdout.strip():
                url = result.stdout.strip().split('\n')[0]
                print(f"[ThreatAnalysis] Resolved stream URL: {url[:60]}...")
                return url
        except Exception as e:
            print(f"[ThreatAnalysis] yt-dlp error with format {fmt}: {e}")
    
    return None


async def download_youtube_video(url: str, output_path: str) -> Tuple[bool, Optional[str]]:
    """Download YouTube video using yt-dlp."""
    try:
        import yt_dlp
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': output_path,
            'quiet': False,  # Show logs for debugging
            'no_warnings': False,
            'noplaylist': True,
            'force_overwrites': True,
        }
        
        print(f"[ThreatAnalysis] Downloading YouTube video: {url} -> {output_path}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            error_code = ydl.download([url])
            if error_code != 0:
                return False, f"yt-dlp returned error code {error_code}"
        
        # Verify file exists
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            if size == 0:
                return False, "The downloaded file is empty"
            print(f"[ThreatAnalysis] Download complete. Size: {size} bytes")
            return True, None
        else:
            return False, "File was not created after download"
            
    except Exception as e:
        error_msg = str(e)
        print(f"[ThreatAnalysis] Download error: {error_msg}")
        return False, error_msg



async def process_video_for_threats(
    analysis_id: str,
    video_path: str,
    threat_types: List[str],
    frame_skip: int = 5,
    testing_mode: bool = False,
    youtube_url: Optional[str] = None
):
    """Process video file for threat detection."""
    try:
        from services.alert_service import alert_service, ThreatType, make_serializable
        
        # Initialize detectors based on requested types
        detectors = {}
        
        if "fight" in threat_types:
            from services.fight_detector import get_fight_detector
            detectors["fight"] = get_fight_detector()
            if hasattr(detectors["fight"], "set_testing_mode"):
                detectors["fight"].set_testing_mode(testing_mode)
        
        if "abandoned_object" in threat_types:
            from services.abandoned_object_detector import get_abandoned_object_detector
            detectors["abandoned_object"] = get_abandoned_object_detector()
            if hasattr(detectors["abandoned_object"], "set_testing_mode"):
                detectors["abandoned_object"].set_testing_mode(testing_mode)
        
        if "accident" in threat_types:
            from services.accident_detector import get_accident_detector
            detectors["accident"] = get_accident_detector()
            if hasattr(detectors["accident"], "set_testing_mode"):
                detectors["accident"].set_testing_mode(testing_mode)
        
        # If YouTube, resolve stream URL fresh in the background task
        if youtube_url:
            print(f"[ThreatAnalysis] Resolving fresh stream URL for {youtube_url}")
            video_path = await asyncio.to_thread(get_youtube_stream_url, youtube_url)
            if not video_path:
                active_analyses[analysis_id]["status"] = "error"
                active_analyses[analysis_id]["error"] = "Failed to resolve YouTube stream URL"
                return

        # Reset detectors
        for detector in detectors.values():
            detector.reset()
        
        # Open video
        is_url = video_path.startswith('http')
        if is_url:
            import os
            # Set environment for HLS/HTTPS streams
            os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = 'rtsp_transport;tcp|analyzeduration;10000000|probesize;10000000'
            cap = cv2.VideoCapture(video_path, cv2.CAP_FFMPEG)
            # Configure for streaming
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 15000)
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 10000)
        else:
            cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            active_analyses[analysis_id]["status"] = "error"
            active_analyses[analysis_id]["error"] = "Could not open video stream"
            return
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        
        is_stream = total_frames <= 0 or "youtube.com" in video_path or "googlevideo.com" in video_path
        
        active_analyses[analysis_id].update({
            "status": "processing",
            "total_frames": total_frames if not is_stream else -1,
            "fps": fps,
            "is_stream": is_stream,
            "duration": total_frames / fps if not is_stream and fps > 0 else 0,
            "testing_mode": testing_mode
        })
        
        frame_idx = 0
        start_time = time.time()
        all_alerts = []
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every Nth frame
                if frame_idx % frame_skip == 0:
                    video_timestamp = frame_idx / fps if fps > 0 else 0
                    
                    combined_result = {
                        "frame": frame,
                        "alerts": [],
                        "events": []
                    }
                    
                    # Run each detector
                    for threat_type, detector in detectors.items():
                        try:
                            result = detector.process_frame(frame, video_timestamp)
                            
                            # Collect alerts
                            for alert in result.get("alerts", []):
                                alert["threat_type"] = threat_type
                                combined_result["alerts"].append(alert)
                            
                            # Collect events
                            for event in result.get("events", []):
                                event["threat_type"] = threat_type
                                combined_result["events"].append(event)
                            
                            # Use annotated frame from last detector
                            if "frame" in result:
                                combined_result["frame"] = result["frame"]
                        except Exception as e:
                            print(f"[ThreatAnalysis] Detector error ({threat_type}): {e}")
                    
                    # Create alerts in alert service
                    for alert_data in combined_result["alerts"]:
                        threat_type_enum = ThreatType(alert_data["threat_type"])
                        screenshot = base64.b64encode(
                            cv2.imencode('.jpg', combined_result["frame"])[1]
                        ).decode('utf-8')
                        
                        await alert_service.create_alert(
                            threat_type=threat_type_enum,
                            confidence=alert_data.get("confidence", 0.9),
                            location=f"{'TEST ' if testing_mode else ''}Video analysis - {video_timestamp:.1f}s",
                            screenshot_b64=screenshot,
                            timestamp=video_timestamp,
                            metadata={
                                "analysis_id": analysis_id,
                                "frame": frame_idx,
                                "event_details": alert_data,
                                "testing_mode": testing_mode
                            }
                        )
                        # Sanitize alert data before appending
                        all_alerts.append(make_serializable(alert_data))
                    
                    # Optimize preview frame
                    preview_frame = combined_result["frame"]
                    h, w = preview_frame.shape[:2]
                    target_width = 640
                    if w > target_width:
                        scale = target_width / w
                        new_h = int(h * scale)
                        preview_frame = cv2.resize(preview_frame, (target_width, new_h))
                    
                    # Encode preview frame with lower quality for performance
                    _, buffer = cv2.imencode('.jpg', preview_frame, 
                                             [cv2.IMWRITE_JPEG_QUALITY, 50])
                    preview_b64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Update status
                    if is_stream:
                        progress = min(int(frame_idx / 10), 99) # Fake progress for streams
                    else:
                        progress = int((frame_idx / max(total_frames, 1)) * 100)
                        
                    events_list = combined_result["events"][-5:] if combined_result["events"] else []
                    
                    active_analyses[analysis_id].update({
                        "progress": min(progress, 99),
                        "frames_processed": frame_idx,
                        "preview_frame": preview_b64,
                        "current_alerts": len(all_alerts),
                        "recent_events": make_serializable(events_list)
                    })
                    
                    # Small delay to allow other tasks
                    await asyncio.sleep(0.001)
                
                frame_idx += 1
            
            # Completed
            processing_time = time.time() - start_time
            active_analyses[analysis_id].update({
                "status": "completed",
                "progress": 100,
                "frames_processed": frame_idx,
                "processing_time": processing_time,
                "total_alerts": len(all_alerts),
                "alerts_summary": make_serializable(all_alerts)
            })
            
        except Exception as e:
            print(f"[ThreatAnalysis] Processing error: {e}")
            active_analyses[analysis_id]["status"] = "error"
            active_analyses[analysis_id]["error"] = str(e)
        finally:
            cap.release()
            
            # Clean up video file ONLY if it's a local file
            try:
                if os.path.exists(video_path) and not is_stream:
                    os.remove(video_path)
            except:
                pass
                
    except Exception as e:
        # Catch initialization errors
        error_msg = f"Initialization error: {str(e)}"
        print(f"[ThreatAnalysis] {error_msg}")
        active_analyses[analysis_id]["status"] = "error"
        active_analyses[analysis_id]["error"] = error_msg


@router.post("/analyze")
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    request: Optional[AnalyzeRequest] = None,
    testing_mode: bool = False, # Query param option
    threat_types: Optional[str] = None # Query param option
):
    """
    Analyze video for threats.
    
    Either upload a file or provide a YouTube URL.
    """
    analysis_id = str(uuid.uuid4())
    
    # Check query params first, then request body
    if threat_types:
        requested_threat_types = threat_types.split(",")
    else:
        requested_threat_types = request.threat_types if request else ["fight", "abandoned_object", "accident"]
        
    requested_testing_mode = testing_mode or (request.testing_mode if request else False)
    
    # Determine video source
    if file:
        # Save uploaded file
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "threat")
        os.makedirs(upload_dir, exist_ok=True)
        
        video_path = os.path.join(upload_dir, f"{analysis_id}_{file.filename}")
        
        with open(video_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        frame_skip = request.frame_skip if request else 5
        
    elif request and request.youtube_url:
        # Initialize status and queue for background processing
        # We resolve the URL inside the background task to ensure it's fresh
        active_analyses[analysis_id] = {
            "status": "queued",
            "progress": 0,
            "source": "youtube",
            "url": request.youtube_url
        }
        video_path = "youtube_stream" # Placeholder, resolved in background
        frame_skip = request.frame_skip
    else:
        raise HTTPException(status_code=400, detail="Provide either a file or youtube_url")
    
    # Initialize analysis state
    active_analyses[analysis_id] = {
        "id": analysis_id,
        "status": "queued",
        "progress": 0,
        "threat_types": requested_threat_types,
        "frame_skip": frame_skip,
        "source": "upload" if file else "youtube",
        "testing_mode": requested_testing_mode
    }
    
    # Start processing in background
    background_tasks.add_task(
        process_video_for_threats,
        analysis_id,
        video_path,
        requested_threat_types,
        frame_skip,
        requested_testing_mode,
        request.youtube_url if (request and request.youtube_url) else None
    )
    
    return {
        "id": analysis_id,
        "status": "processing",
        "threat_types": requested_threat_types,
        "testing_mode": requested_testing_mode,
        "message": "Analysis started. Connect to WebSocket for real-time updates."
    }


@router.post("/analyze/youtube")
async def analyze_youtube(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """Analyze YouTube video for threats."""
    if not request.youtube_url:
        raise HTTPException(status_code=400, detail="youtube_url is required")
    
    return await analyze_video(
        background_tasks=background_tasks,
        file=None,
        request=request
    )


@router.get("/status/{analysis_id}")
async def get_analysis_status(analysis_id: str):
    """Get status of an analysis."""
    if analysis_id not in active_analyses:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    status = active_analyses[analysis_id].copy()
    # Don't send preview in REST API to save bandwidth
    status.pop("preview_frame", None)
    
    return status


@router.get("/alerts")
async def get_alerts(
    limit: int = 50,
    threat_type: Optional[str] = None,
    status: Optional[str] = None
):
    """Get recent threat alerts (admin-only)."""
    from services.alert_service import alert_service, ThreatType, AlertStatus
    
    threat_type_enum = ThreatType(threat_type) if threat_type else None
    status_enum = AlertStatus(status) if status else None
    
    alerts = alert_service.get_alerts(
        limit=limit,
        threat_type=threat_type_enum,
        status=status_enum
    )
    
    return {
        "alerts": [a.to_dict() for a in alerts],
        "total": len(alerts),
        "stats": alert_service.get_stats()
    }


@router.patch("/alerts/{alert_id}")
async def update_alert(alert_id: str, update: AlertStatusUpdate):
    """Update alert status."""
    from services.alert_service import alert_service, AlertStatus
    
    try:
        new_status = AlertStatus(update.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
    
    updated = alert_service.update_alert_status(alert_id, new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return updated.to_dict()


@router.websocket("/ws/stream/{analysis_id}")
async def threat_analysis_stream(websocket: WebSocket, analysis_id: str):
    """Real-time threat analysis stream with live preview."""
    await websocket.accept()
    
    try:
        while True:
            if analysis_id not in active_analyses:
                await websocket.send_json({"error": "Analysis not found"})
                break
            
            status = active_analyses[analysis_id].copy()
            
            try:
                await websocket.send_json(status)
            except Exception as send_err:
                print(f"[ThreatAnalysis] WebSocket send error: {send_err}")
                break
            
            if status.get("status") in ["completed", "error"]:
                break
            
            await asyncio.sleep(0.5)  # Reduced frequency to prevent overload
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[ThreatAnalysis] WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@router.websocket("/ws/alerts")
async def alerts_websocket(websocket: WebSocket):
    """Real-time threat alerts WebSocket (admin-only)."""
    from services.alert_service import alert_service
    
    await websocket.accept()
    alert_service.register_websocket(websocket)
    
    try:
        # Keep connection alive and handle any messages
        while True:
            try:
                # Wait for any message (heartbeat, etc.)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        pass
    finally:
        alert_service.unregister_websocket(websocket)
