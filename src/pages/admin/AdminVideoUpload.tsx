import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle2, AlertCircle, Play, BarChart3, Download, Clock, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { uploadVideo, API_BASE_URL, WS_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface ProcessingStats {
  status: string;
  progress: number;
  people_count: number;
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

  const avgCount = Math.round(stats?.avg_count ?? (stats?.counts?.length ? stats.counts.reduce((a, b) => a + b, 0) / stats.counts.length : 0));
  const peakCount = stats?.peak_count ?? (stats?.counts?.length ? Math.max(...stats.counts) : 0);
  const minCount = stats?.min_count ?? (stats?.counts?.length ? Math.min(...stats.counts) : 0);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Spatial Video Analysis
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-950">Video Upload</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Upload videos for automated crowd detection and analysis</p>
        </div>
      </div>

      {/* Upload Area */}
      <motion.div
        className={cn(
          "glass-card p-12 border-2 border-dashed transition-all duration-500 rounded-[3rem] relative overflow-hidden",
          dragOver ? "border-zinc-950 bg-zinc-50 scale-[1.01]" : "border-zinc-200 bg-white"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {status === 'idle' && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="relative inline-block mb-10">
              <div className="absolute -inset-4 bg-zinc-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-24 h-24 rounded-3xl bg-zinc-950 flex items-center justify-center text-white shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <Upload className="w-10 h-10" />
              </div>
            </div>

            {/* Frame Skip Control */}
            <div className="mb-10 p-8 bg-zinc-50 rounded-[2rem] border border-zinc-200 shadow-inner group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analysis Detail</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-zinc-950 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                  {getSpeedLabel(frameSkip).label} Mode
                </div>
              </div>
              <Slider
                value={[frameSkip]}
                onValueChange={(v) => setFrameSkip(v[0])}
                min={1}
                max={30}
                step={1}
                className="mb-4"
              />
              <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                <span>Best Detail (Slow)</span>
                <span>Best Speed (Fast)</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 mt-6 uppercase tracking-widest opacity-60">
                {getSpeedLabel(frameSkip).desc} • Sampling every {frameSkip} frame{frameSkip > 1 ? 's' : ''}
              </p>
            </div>

            <div className="relative inline-block">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button size="lg" className="h-14 px-8 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                <File className="w-4 h-4 mr-3" />
                Select Video File
              </Button>
            </div>
            <p className="text-[9px] font-black text-zinc-400 mt-8 uppercase tracking-[0.3em]">
              MP4 / AVI / MOV • MAX SIZE: 500MB
            </p>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 shadow-sm">
                Processing: {file?.name || 'video.mp4'}
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    status === 'uploading' || status === 'processing' ? 'bg-zinc-950 text-white shadow-xl' : 'bg-zinc-100 text-zinc-400'
                  )}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Uploading</span>
                </div>
                <div className="w-12 h-px bg-zinc-200" />
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    status === 'processing' ? 'bg-zinc-950 text-white shadow-xl animate-pulse' : 'bg-zinc-100 text-zinc-400'
                  )}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Analyzing</span>
                </div>
              </div>
            </div>

            {/* Live Preview + Stats Grid */}
            {status === 'processing' && stats && (
              <div className="grid lg:grid-cols-12 gap-10">
                {/* Live Video Preview with Bounding Boxes */}
                <div className="lg:col-span-7">
                  <div className="aspect-video bg-zinc-950 rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {stats.preview_frame ? (
                      <img
                        src={`data:image/jpeg;base64,${stats.preview_frame}`}
                        alt="Live detection preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="relative inline-block">
                            <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse rounded-full"></div>
                            <Zap className="w-16 h-16 text-white relative animate-bounce" />
                          </div>
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mt-6">Starting Process...</p>
                        </div>
                      </div>
                    )}

                    {/* Live indicator */}
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Feed</span>
                    </div>

                    {/* Person count overlay */}
                    <div className="absolute bottom-6 right-6 bg-white text-zinc-950 px-6 py-4 rounded-[1.5rem] shadow-2xl scale-110">
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{stats.people_count}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Nodes</p>
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Detected Nodes", value: stats.people_count, color: "text-zinc-950" },
                      { label: "Frames Processed", value: stats.frames_processed || 0, color: "text-zinc-400" },
                      { label: "Time Elapsed", value: `${processingTime.toFixed(1)}s`, color: "text-zinc-400" },
                      { label: "Peak Signal", value: Math.max(...(stats.counts || [0])), color: "text-red-500" }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-zinc-50 border border-zinc-200 rounded-[1.5rem] shadow-sm flex flex-col justify-between h-32">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</p>
                        <p className={cn("text-3xl font-black italic tracking-tighter uppercase", item.color)}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini chart */}
                  {stats.counts && stats.counts.length > 1 && (
                    <div className="p-8 bg-zinc-950 rounded-[2rem] shadow-2xl relative overflow-hidden h-48 flex flex-col">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-6 relative z-10">Flow Density Over Time</p>
                      <div className="flex-1 flex items-end gap-1.5 relative z-10">
                        {stats.counts.slice(-40).map((c, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(8, (c / Math.max(...stats.counts, 1)) * 100)}%` }}
                            className="bg-white/20 flex-1 rounded-full hover:bg-white transition-colors cursor-crosshair"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="relative h-4 bg-zinc-100 rounded-full overflow-hidden shadow-inner p-1">
                <motion.div
                  className="h-full bg-zinc-950 rounded-full shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${status === 'processing' ? progress : (status === 'uploading' ? 100 : 0)}%` }}
                />
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  {status === 'uploading' ? 'Uploading Video...' : 'Analyzing Video...'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">
                  {progress}% Complete
                </span>
              </div>
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center py-10">
            <div className="relative inline-block mb-10">
              <div className="absolute -inset-4 bg-green-50 rounded-full blur-2xl"></div>
              <div className="relative w-24 h-24 rounded-[2rem] bg-white border border-zinc-200 flex items-center justify-center text-green-500 shadow-xl">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-3">Analysis Complete</h3>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10">
              Processing finished in {processingTime.toFixed(1)} seconds
            </p>
            <Button size="lg" className="h-14 px-8 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest shadow-xl" onClick={resetUpload}>
              Analyze Another Video
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-10">
            <div className="relative inline-block mb-10">
              <div className="absolute -inset-4 bg-red-50 rounded-full blur-2xl"></div>
              <div className="relative w-24 h-24 rounded-[2rem] bg-zinc-950 flex items-center justify-center text-red-500 shadow-2xl">
                <AlertCircle className="w-12 h-12" />
              </div>
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-3">Connection Error</h3>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10">Connection refused by uplink node • Check network topology</p>
            <Button variant="outline" size="lg" className="h-12 border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetUpload}>
              Try Again
            </Button>
          </div>
        )}
      </motion.div>

      {/* Analysis Results (shown when complete) */}
      {status === 'complete' && stats && (
        <motion.div
          className="glass-card p-10 border-zinc-200 shadow-2xl bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-2 h-6 bg-zinc-950 rounded-full" />
              Analysis Results
            </h2>
            <div className="px-3 py-1.5 rounded-full bg-zinc-100 text-[9px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-200">
              File ID: {fileId?.slice(0, 12).toUpperCase()}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Video Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] shadow-inner">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Video Details</span>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  {[
                    { label: "Duration", value: `${stats.duration?.toFixed(1) || '?'}s` },
                    { label: "Frames Analyzed", value: stats.frames_processed || stats.counts?.length || 0 },
                    { label: "FPS", value: `${stats.fps?.toFixed(0) || '?'} Hz` },
                    { label: "Time Taken", value: `${processingTime.toFixed(1)}s` }
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-xl font-black italic tracking-tighter uppercase text-zinc-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="aspect-video bg-zinc-950 rounded-[2.5rem] flex items-center justify-center relative shadow-2xl group overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                <div className="text-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Video Preview</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "Average People", value: avgCount, color: "text-zinc-950", bg: "bg-zinc-50" },
                  { label: "Peak People", value: peakCount, color: "text-red-500", bg: "bg-red-50/50" },
                  { label: "Minimum People", value: minCount, color: "text-green-500", bg: "bg-green-50/50" }
                ].map((item, i) => (
                  <div key={i} className={cn("text-center p-6 border border-zinc-200 rounded-[2rem] shadow-sm flex flex-col justify-center h-32", item.bg)}>
                    <p className={cn("text-5xl font-black italic tracking-tighter leading-none mb-2", item.color)}>{item.value}</p>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-10 bg-zinc-950 rounded-[3rem] shadow-2xl relative overflow-hidden h-[340px] flex flex-col border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -mr-32 -mt-32 rounded-full blur-3xl"></div>
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Flow Density Timeline</span>
                  </div>
                  {hoveredBar ? (
                    <div className="px-4 py-1.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4">
                      T+{hoveredBar.second}S: {hoveredBar.count} PEOPLE
                    </div>
                  ) : (
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      RESOLUTION: 1.0 SECONDS
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-white/5 rounded-[2rem] p-6 relative z-10 border border-white/5 shadow-inner">
                  <div className="flex items-end h-full gap-2 w-full">
                    {(stats.timeline_per_second || []).map((s, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                        onMouseEnter={() => setHoveredBar({ second: s.second, count: Math.round(s.avg_count) })}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <motion.div
                          layoutId={`bar-${i}`}
                          className={cn(
                            "w-full rounded-full min-h-[6px] transition-all duration-300",
                            hoveredBar?.second === s.second ? 'bg-white scale-x-125 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/20 group-hover:bg-white/40'
                          )}
                          style={{ height: `${Math.max(6, Math.min(100, (s.avg_count / (peakCount || 1)) * 100))}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-6 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                    <span>T+0.0SEC</span>
                    <span>MID-SYNC</span>
                    <span>T+{Math.round(stats.duration || 0)}.0SEC</span>
                  </div>
                </div>
              </div>

              <Button className="w-full h-16 rounded-[1.5rem] bg-zinc-950 text-white hover:bg-zinc-800 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl active:scale-[0.98] transition-all" onClick={handleDownloadJSON}>
                <Download className="w-4 h-4" />
                Download Analysis Report (.JSON)
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

