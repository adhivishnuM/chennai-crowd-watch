import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video,
    Play,
    Pause,
    Maximize2,
    Users,
    Radio,
    Wifi,
    WifiOff,
    Globe,
    MapPin,
    Camera,
    Activity,
    Zap,
    RefreshCw,
    ExternalLink,
    Settings,
    ChevronRight,
    Circle,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import { API_BASE_URL, WS_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

// Camera types for icons
const cameraTypeIcons: Record<string, React.ReactNode> = {
    crowd: <Users className="w-4 h-4" />,
    local: <Camera className="w-4 h-4" />,
    custom: <Globe className="w-4 h-4" />
};

interface PublicCamera {
    id: string;
    name: string;
    location: string;
    url: string;
    type: string;
    description: string;
    is_active: boolean;
    uptime: number;
}

interface StreamStats {
    count: number;
    maxCount: number;
    avgCount: number;
    history: number[];
    startTime: number;
}

export default function AdminLiveCCTV() {
    const [cameras, setCameras] = useState<PublicCamera[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<PublicCamera | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentCount, setCurrentCount] = useState(0);
    const [streamStats, setStreamStats] = useState<StreamStats>({
        count: 0,
        maxCount: 0,
        avgCount: 0,
        history: [],
        startTime: 0
    });
    const [customUrl, setCustomUrl] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch available cameras
    const fetchCameras = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/rtsp/cameras`);
            const data = await response.json();
            setCameras(data.cameras || []);
        } catch (err) {
            console.error('Failed to fetch cameras:', err);
        }
    }, []);

    useEffect(() => {
        fetchCameras();

        // Refresh camera list every 30s
        const interval = setInterval(fetchCameras, 30000);
        return () => clearInterval(interval);
    }, [fetchCameras]);

    // Connect to camera stream
    const connectToCamera = useCallback(async (camera: PublicCamera) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        setIsConnecting(true);
        setError(null);
        setSelectedCamera(camera);
        setStreamStats({
            count: 0,
            maxCount: 0,
            avgCount: 0,
            history: [],
            startTime: Date.now()
        });

        // Start the stream via API first
        try {
            const response = await fetch(`${API_BASE_URL}/rtsp/stream/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    camera_id: camera.id,
                    custom_url: camera.id === 'custom' ? camera.url : undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start stream');
            }
        } catch (err) {
            console.error('Failed to start stream:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to stream');
            setIsConnecting(false);
            setIsConnected(false);
            return;
        }

        // Wait for stream to initialize (YouTube streams take longer)
        const isYouTube = camera.url?.includes('youtube.com') || camera.url?.includes('youtu.be');
        await new Promise(resolve => setTimeout(resolve, isYouTube ? 8000 : 3000));

        // Connect WebSocket
        const ws = new WebSocket(`${WS_BASE_URL.replace('/ws', '')}/api/rtsp/ws/stream/${camera.id}`);
        wsRef.current = ws;
        ws.binaryType = 'arraybuffer';

        let pendingData = false;

        ws.onopen = () => {
            setIsConnected(true);
            setIsConnecting(false);
        };

        ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                // JSON detection data
                try {
                    const data = JSON.parse(event.data);
                    if (data.count !== undefined) {
                        setCurrentCount(data.count);
                        setStreamStats(prev => {
                            const newHistory = [...prev.history, data.count].slice(-60); // Keep last 60 readings
                            const sum = newHistory.reduce((a, b) => a + b, 0);
                            return {
                                ...prev,
                                count: data.count,
                                maxCount: Math.max(prev.maxCount, data.count),
                                avgCount: Math.round(sum / newHistory.length),
                                history: newHistory
                            };
                        });
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            } else {
                // Binary frame data
                const blob = new Blob([event.data], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        }
                    }
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            setIsConnecting(false);
        };

        ws.onerror = (e) => {
            console.error('WebSocket error:', e);
            setError('Connection error. Please try again.');
            setIsConnected(false);
            setIsConnecting(false);
        };
    }, []);

    // Disconnect from camera
    const disconnectCamera = useCallback(async () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (selectedCamera) {
            try {
                await fetch(`${API_BASE_URL}/rtsp/stream/stop/${selectedCamera.id}`, {
                    method: 'POST'
                });
            } catch (err) {
                console.error('Failed to stop stream:', err);
            }
        }

        setIsConnected(false);
        setSelectedCamera(null);
        setCurrentCount(0);
    }, [selectedCamera]);

    // Connect to custom URL
    const connectToCustomUrl = useCallback(async () => {
        if (!customUrl.trim()) return;

        const customCamera: PublicCamera = {
            id: 'custom',
            name: 'Custom Stream',
            location: 'Custom URL',
            url: customUrl,
            type: 'custom',
            description: 'User-provided stream URL',
            is_active: false,
            uptime: 0
        };

        connectToCamera(customCamera);
        setShowCustomInput(false);
    }, [customUrl, connectToCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
        };
    }, []);

    // Calculate crowd level
    const getCrowdLevel = (count: number): { level: string; color: string; bgColor: string } => {
        if (count < 5) return { level: 'Low', color: 'text-green-500', bgColor: 'bg-green-500/20' };
        if (count < 15) return { level: 'Moderate', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
        if (count < 30) return { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
        return { level: 'Very High', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    };

    const crowdInfo = getCrowdLevel(currentCount);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                            <Globe className="w-6 h-6 text-primary" />
                        </div>
                        Live CCTV Detection
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time crowd detection from public camera streams worldwide
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchCameras}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Custom URL Input - Always Visible */}
            <div className="glass-card p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="Paste any YouTube URL or RTSP/HLS stream link here..."
                            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <Button onClick={connectToCustomUrl} disabled={!customUrl.trim() || isConnecting} className="min-w-[100px]">
                        {isConnecting && customUrl ? 'Connecting...' : 'Connect URL'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-1">
                    Supports YouTube Live, standard YouTube videos (loops automatically), M3U8, and RTSP streams.
                </p>
            </div>


            <div className="space-y-6">
                {/* Main Video Feed */}
                <div className="space-y-4">
                    <div className="glass-card overflow-hidden">
                        {/* Video Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    isConnected ? "bg-green-500 animate-pulse" :
                                        isConnecting ? "bg-yellow-500 animate-pulse" : "bg-gray-400"
                                )} />
                                <div>
                                    <h3 className="font-semibold">
                                        {selectedCamera ? selectedCamera.name : 'Select a Camera'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedCamera ? selectedCamera.location : 'Choose from available public CCTV streams'}
                                    </p>
                                </div>
                            </div>
                            {selectedCamera && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={disconnectCamera}
                                    className="text-destructive hover:text-destructive"
                                >
                                    Disconnect
                                </Button>
                            )}
                        </div>

                        {/* Video Canvas */}
                        <div className="relative aspect-video bg-black">
                            {selectedCamera ? (
                                <>
                                    <canvas
                                        ref={canvasRef}
                                        width={640}
                                        height={480}
                                        className="w-full h-full object-contain"
                                    />

                                    {/* Status Overlay */}
                                    {isConnecting && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="text-white">Connecting to stream...</p>
                                            <p className="text-white/60 text-sm mt-1">
                                                {selectedCamera?.url?.includes('youtube')
                                                    ? 'Extracting YouTube stream (up to 15 seconds)...'
                                                    : 'Initializing video feed...'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Live Badge */}
                                    {isConnected && (
                                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            LIVE
                                        </div>
                                    )}

                                    {/* Count Overlay */}
                                    {isConnected && (
                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                            <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    <span className="text-2xl font-bold">
                                                        <CountUp end={currentCount} duration={0.3} preserveValue />
                                                    </span>
                                                    <span className="text-sm text-white/70">persons</span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm",
                                                crowdInfo.bgColor, crowdInfo.color
                                            )}>
                                                {crowdInfo.level} Crowd
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                    <Video className="w-16 h-16 mb-4 opacity-50" />
                                    <p className="text-lg">No camera selected</p>
                                    <p className="text-sm opacity-70 mt-1">Select a camera from the list to start</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stream Statistics */}
                    {isConnected && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                        >
                            <div className="glass-card p-4 text-center">
                                <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
                                <p className="text-2xl font-bold">
                                    <CountUp end={currentCount} duration={0.3} preserveValue />
                                </p>
                                <p className="text-xs text-muted-foreground">Current</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <Zap className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                                <p className="text-2xl font-bold">
                                    <CountUp end={streamStats.maxCount} duration={0.3} preserveValue />
                                </p>
                                <p className="text-xs text-muted-foreground">Peak</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                                <p className="text-2xl font-bold">
                                    <CountUp end={streamStats.avgCount} duration={0.3} preserveValue />
                                </p>
                                <p className="text-xs text-muted-foreground">Average</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <Radio className="w-5 h-5 mx-auto mb-2 text-green-500" />
                                <p className="text-2xl font-bold">
                                    {Math.floor((Date.now() - streamStats.startTime) / 1000)}s
                                </p>
                                <p className="text-xs text-muted-foreground">Uptime</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Detection History Chart */}
                    {isConnected && streamStats.history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-4"
                        >
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Detection Timeline
                            </h3>
                            <div className="h-20 flex items-end gap-0.5">
                                {streamStats.history.map((count, i) => {
                                    const height = streamStats.maxCount > 0
                                        ? (count / streamStats.maxCount) * 100
                                        : 0;
                                    const crowdLevel = getCrowdLevel(count);
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-t transition-all duration-300"
                                            style={{
                                                height: `${Math.max(height, 2)}%`,
                                                backgroundColor: count < 5 ? '#22c55e' :
                                                    count < 15 ? '#eab308' :
                                                        count < 30 ? '#f97316' : '#ef4444'
                                            }}
                                            title={`${count} persons`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                <span>60 samples ago</span>
                                <span>Now</span>
                            </div>
                        </motion.div>
                    )}
                </div>


            </div>
        </div >
    );
}
