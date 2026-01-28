import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle2, AlertCircle, Play, BarChart3, Download, Clock, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { uploadVideo, API_BASE_URL, WS_BASE_URL } from '@/lib/api';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface ProcessingStats {
  status: string;
  progress: number;
  current_count: number;
  counts: number[];
  avg_count?: number;
  peak_count?: number;
  min_count?: number;
  frames_processed?: number;
  total_frames?: number;
  duration?: number;
  fps?: number;
  filename?: string;
  preview_frame?: string; // Base64 encoded frame with bounding boxes
  timeline_per_second?: { second: number; avg_count: number; max_count: number }[];
}

export default function AdminVideoUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [frameSkip, setFrameSkip] = useState(15); // 1=all frames (slow), 30=fast
  const [hoveredBar, setHoveredBar] = useState<{ second: number; count: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Frame skip presets
  const getSpeedLabel = (skip: number) => {
    if (skip <= 5) return { label: 'Detailed', desc: 'More data points, slower' };
    if (skip <= 15) return { label: 'Balanced', desc: 'Good speed & accuracy' };
    return { label: 'Fast', desc: 'Quick processing' };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('uploading');
    setProgress(0);
    setProcessingTime(0);

    try {
      // 1. Upload with selected frame skip
      const response = await uploadVideo(selectedFile, frameSkip);
      setFileId(response.id);
      setStatus('processing');
      setProgress(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setProcessingTime(prev => prev + 0.1);
      }, 100);

      // 2. Connect WebSocket for progress
      connectWebSocket(response.id);

    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const connectWebSocket = (id: string) => {
    const ws = new WebSocket(`${WS_BASE_URL}/upload/${id}/progress`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'error') {
        setStatus('error');
        if (timerRef.current) clearInterval(timerRef.current);
        ws.close();
      } else if (data.status === 'completed') {
        setStatus('complete');
        setStats(data);
        if (timerRef.current) clearInterval(timerRef.current);
        ws.close();
      } else {
        setStats(data);
        setProgress(data.progress);
      }
    };

    ws.onerror = () => {
      console.error("WebSocket error");
    };

    ws.onclose = () => {
      // console.log("WebSocket closed");
    };
  };

  const handleDownloadJSON = async () => {
    if (!fileId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/upload/${fileId}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crowd_analysis_${fileId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const resetUpload = () => {
    setStatus('idle');
    setProgress(0);
    setFile(null);
    setFileId(null);
    setStats(null);
    setProcessingTime(0);
    if (wsRef.current) wsRef.current.close();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const avgCount = stats?.avg_count ?? (stats?.counts?.length ? Math.round(stats.counts.reduce((a, b) => a + b, 0) / stats.counts.length) : 0);
  const peakCount = stats?.peak_count ?? (stats?.counts?.length ? Math.max(...stats.counts) : 0);
  const minCount = stats?.min_count ?? (stats?.counts?.length ? Math.min(...stats.counts) : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Video Upload & Analysis</h1>
        <p className="text-muted-foreground">Upload video files for YOLOv8 crowd detection analysis - <span className="text-primary font-medium">LIVE AI Processing</span></p>
      </div>

      {/* Upload Area */}
      <motion.div
        className={`glass-card p-8 border-2 border-dashed transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {status === 'idle' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Drop video file here</h3>
            <p className="text-muted-foreground text-sm mb-6">or click to browse</p>

            {/* Frame Skip Control */}
            <div className="max-w-md mx-auto mb-6 p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Processing Speed</span>
                </div>
                <span className="text-sm font-bold text-primary">{getSpeedLabel(frameSkip).label}</span>
              </div>
              <Slider
                value={[frameSkip]}
                onValueChange={(v) => setFrameSkip(v[0])}
                min={1}
                max={30}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Detailed (1 FPS)</span>
                <span>Fast (30 FPS skip)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {getSpeedLabel(frameSkip).desc} • Process every {frameSkip} frame{frameSkip > 1 ? 's' : ''}
              </p>
            </div>

            <div className="relative inline-block">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button size="lg">
                <Upload className="w-4 h-4 mr-2" />
                Select Video File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: MP4, AVI, MOV • Max size: 500MB
            </p>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">{file?.name || 'video_file.mp4'}</h3>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'uploading' || status === 'processing' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Uploaded</span>
                </div>
                <div className="w-8 h-0.5 bg-border" />
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'processing' ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-secondary'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-sm">AI Detection</span>
                </div>
              </div>
            </div>

            {/* Live Preview + Stats Grid */}
            {status === 'processing' && stats && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Live Video Preview with Bounding Boxes */}
                <div className="relative">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                    {stats.preview_frame ? (
                      <img
                        src={`data:image/jpeg;base64,${stats.preview_frame}`}
                        alt="Live detection preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Zap className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                          <p>Initializing detection...</p>
                        </div>
                      </div>
                    )}

                    {/* Live indicator */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      LIVE DETECTION
                    </div>

                    {/* Person count overlay */}
                    <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-4 py-2 rounded-xl">
                      <p className="text-2xl font-bold">{stats.current_count}</p>
                      <p className="text-xs opacity-80">Persons</p>
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 bg-secondary/50 rounded-xl">
                      <p className="text-3xl font-bold text-primary">{stats.current_count}</p>
                      <p className="text-xs text-muted-foreground">Current Count</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-xl">
                      <p className="text-3xl font-bold">{stats.frames_processed || 0}</p>
                      <p className="text-xs text-muted-foreground">Frames Analyzed</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-xl">
                      <p className="text-3xl font-bold">{processingTime.toFixed(1)}s</p>
                      <p className="text-xs text-muted-foreground">Elapsed Time</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-xl">
                      <p className="text-3xl font-bold text-crowd-high">{Math.max(...(stats.counts || [0]))}</p>
                      <p className="text-xs text-muted-foreground">Peak Count</p>
                    </div>
                  </div>

                  {/* Mini chart */}
                  {stats.counts && stats.counts.length > 1 && (
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-2">Detection Timeline</p>
                      <div className="h-16 flex items-end gap-0.5">
                        {stats.counts.slice(-30).map((c, i) => (
                          <div
                            key={i}
                            className="bg-primary flex-1 rounded-t transition-all"
                            style={{ height: `${Math.max(4, (c / Math.max(...stats.counts, 1)) * 100)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-6">
              <Progress value={status === 'processing' ? progress : (status === 'uploading' ? 100 : 0)} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {status === 'uploading' ? 'Uploading...' : `Processing with YOLOv8... ${progress}%`}
              </p>
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-crowd-low/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-crowd-low" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analysis Complete!</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Processed in {processingTime.toFixed(1)} seconds using YOLOv8
            </p>
            <Button variant="secondary" onClick={resetUpload}>
              Upload Another
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
            <p className="text-muted-foreground text-sm mb-4">Something went wrong. Please check your backend connection.</p>
            <Button onClick={resetUpload}>
              Try Again
            </Button>
          </div>
        )}
      </motion.div>

      {/* Analysis Results (shown when complete) */}
      {status === 'complete' && stats && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Live Analysis Results (YOLOv8 Detection)
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Video Info */}
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Processing Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{stats.duration?.toFixed(1) || '?'}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frames Analyzed</p>
                    <p className="font-medium">{stats.frames_processed || stats.counts?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">FPS</p>
                    <p className="font-medium">{stats.fps?.toFixed(0) || '?'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Process Time</p>
                    <p className="font-medium">{processingTime.toFixed(1)}s</p>
                  </div>
                </div>
              </div>

              <div className="aspect-video bg-foreground/5 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Video Analyzed</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">
                    {avgCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Count</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-crowd-high">
                    {peakCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Peak Count</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-crowd-low">
                    {minCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Low Count</p>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Detection Timeline</span>
                  </div>
                  {/* Show hovered bar info or total seconds */}
                  {hoveredBar ? (
                    <span className="text-sm font-bold text-primary animate-in fade-in">
                      {hoveredBar.second}s: {hoveredBar.count} people
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {stats.timeline_per_second?.length || Math.ceil(stats.duration || 0)} seconds
                    </span>
                  )}
                </div>
                <div className="h-28 bg-foreground/5 rounded-lg overflow-hidden px-2">
                  {/* Per-second visualization */}
                  <div className="flex items-end h-full gap-1 w-full py-2">
                    {(stats.timeline_per_second || []).map((s, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                        onMouseEnter={() => setHoveredBar({ second: s.second, count: Math.round(s.avg_count) })}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Count label on hover */}
                        <div className={`text-[10px] font-bold text-primary mb-1 transition-opacity ${hoveredBar?.second === s.second ? 'opacity-100' : 'opacity-0'
                          }`}>
                          {Math.round(s.avg_count)}
                        </div>
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t min-h-[4px] transition-all ${hoveredBar?.second === s.second
                              ? 'bg-primary scale-110 shadow-lg'
                              : 'bg-primary/70 group-hover:bg-primary'
                            }`}
                          style={{ height: `${Math.max(4, Math.min(85, (s.avg_count / (peakCount || 1)) * 85))}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Time labels */}
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>0s</span>
                  {stats.duration && stats.duration > 2 && <span>{Math.round(stats.duration / 2)}s</span>}
                  <span>{Math.round(stats.duration || 0)}s</span>
                </div>
              </div>

              <Button className="w-full gap-2" onClick={handleDownloadJSON}>
                <Download className="w-4 h-4" />
                Download JSON Report
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

