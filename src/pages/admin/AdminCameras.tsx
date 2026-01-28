import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Maximize2, Users, Settings, Wifi, WifiOff } from 'lucide-react';
import CountUp from 'react-countup';
import { chennaiLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { WS_BASE_URL } from '@/lib/api';

// Mock camera data
const cameras = chennaiLocations.slice(0, 9).map((loc, i) => ({
  id: `cam-${i + 1}`,
  location: loc.name,
  status: Math.random() > 0.1 ? 'online' : 'offline',
  currentCount: Math.floor(Math.random() * 500) + 100,
  crowdLevel: loc.crowdLevel,
}));

export default function AdminCameras() {
  const [liveCount, setLiveCount] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to video stream
    const ws = new WebSocket(`${WS_BASE_URL}/camera/stream`);
    wsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setIsLiveConnected(true);
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') {
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

    ws.onclose = () => setIsLiveConnected(false);

    // Separate connection for count if needed, but for now we'll just use the stream or mock it
    // Actually, let's connect to the live count endpoint as well effectively
    const countWs = new WebSocket(`${WS_BASE_URL}/camera/live`);
    countWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.count !== undefined) setLiveCount(data.count);
      } catch (e) { }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      countWs.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Camera Feeds</h1>
          <p className="text-muted-foreground">Monitor real-time camera streams</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-crowd-low" />
            {cameras.filter(c => c.status === 'online').length + (isLiveConnected ? 1 : 0)} Online
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            {cameras.filter(c => c.status === 'offline').length} Offline
          </div>
        </div>
      </div>

      {/* Main Live Feed */}
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          System Live Feed (Webcam)
        </h2>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {isLiveConnected ? (
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-contain" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Connecting to camera...
            </div>
          )}

          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
            {isLiveConnected ? 'LIVE' : 'OFFLINE'}
          </div>

          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            Persons Detected: <span className="font-bold text-lg">{liveCount}</span>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      <h3 className="text-lg font-semibold mt-8 mb-4">Remote Feeds (Simulated)</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera, index) => (
          <motion.div
            key={camera.id}
            className="glass-card overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Video Placeholder */}
            <div className="relative aspect-video bg-foreground/5 flex items-center justify-center group">
              {camera.status === 'online' ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Play className="w-12 h-12 text-white/50 group-hover:text-white/80 transition-colors" />

                  {/* Overlay Info */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-white text-xs bg-black/50 px-2 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                      <CrowdBadge level={camera.crowdLevel} size="sm" />
                    </div>
                    <span className="flex items-center gap-1 text-white text-xs bg-black/50 px-2 py-1 rounded">
                      <Users className="w-3 h-3" />
                      <CountUp end={camera.currentCount} duration={1} />
                    </span>
                  </div>

                  {/* Fullscreen Button */}
                  <button className="absolute top-2 right-2 p-1.5 bg-black/50 rounded hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <WifiOff className="w-8 h-8" />
                  <span className="text-sm">Camera Offline</span>
                </div>
              )}
            </div>

            {/* Camera Info */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {camera.status === 'online' ? (
                  <Wifi className="w-4 h-4 text-crowd-low flex-shrink-0" />
                ) : (
                  <WifiOff className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{camera.location}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
