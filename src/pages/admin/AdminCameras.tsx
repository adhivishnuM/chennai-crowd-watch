import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Maximize2, Users, Settings, Wifi, WifiOff } from 'lucide-react';
import CountUp from 'react-countup';
import { chennaiLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { WS_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

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
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Network Surveillance
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-950">Visual Intelligence</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Real-time edge processing and computer vision stream management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-green-50 px-4 py-2 rounded-2xl border border-green-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
              {cameras.filter(c => c.status === 'online').length + (isLiveConnected ? 1 : 0)} Active Nodes
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-red-50 px-4 py-2 rounded-2xl border border-red-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
              {cameras.filter(c => c.status === 'offline').length} Severed Links
            </span>
          </div>
        </div>
      </div>

      {/* Main Live Feed */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <motion.div
            className="glass-card p-6 border-zinc-200 shadow-2xl bg-white rounded-[3rem] overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-6 bg-zinc-950 rounded-full" />
                Local Computation Engine
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Stream: localhost:8080/neural-v8</span>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
              </div>
            </div>

            <div className="relative aspect-video bg-zinc-950 rounded-[2rem] overflow-hidden shadow-inner border border-zinc-200">
              {isLiveConnected ? (
                <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-contain" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse rounded-full"></div>
                      <Wifi className="w-12 h-12 text-white relative animate-bounce" />
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Synchronizing Network Link...</p>
                  </div>
                </div>
              )}

              <div className="absolute top-6 left-6 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
                <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-zinc-500 shadow-none'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isLiveConnected ? 'LIVE FEED ACTIVE' : 'NETWORK STANDBY'}</span>
              </div>

              <div className="absolute bottom-6 left-6 bg-white text-zinc-950 px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-zinc-950" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Detections</p>
                  <p className="text-2xl font-black italic tracking-tighter leading-none">{liveCount}</p>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 flex gap-2">
                <Button size="icon" className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button size="icon" className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 border-zinc-200 shadow-xl bg-zinc-50 rounded-[3rem] h-full flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Network Telemetry</h3>
              <div className="space-y-6">
                {[
                  { label: "Active Inference Nodes", value: cameras.filter(c => c.status === 'online').length + 1, suffix: "NODES" },
                  { label: "Aggregate Crowd Mass", value: cameras.reduce((acc, c) => acc + (c.status === 'online' ? c.currentCount : 0), 0) + liveCount, suffix: "PERSONS" },
                  { label: "Network Confidence", value: isLiveConnected ? "98.4" : "0.0", suffix: "%" }
                ].map((stat, i) => (
                  <div key={i} className="pb-6 border-b border-zinc-200 last:border-0 last:pb-0">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black italic tracking-tighter text-zinc-950">{stat.value}</span>
                      <span className="text-[10px] font-black text-zinc-400">{stat.suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full h-14 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest shadow-xl">
              Initialize Global Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="pt-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-2 h-6 bg-zinc-950 rounded-full" />
            Remote Node Cluster
          </h2>
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            SORTED BY LATENCY: LOWEST FIRST
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera, index) => (
            <motion.div
              key={camera.id}
              className="glass-card overflow-hidden bg-white border-zinc-200 shadow-xl rounded-[2.5rem] group hover:scale-[1.02] transition-all duration-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative aspect-video bg-zinc-100 flex items-center justify-center group/screen overflow-hidden">
                {camera.status === 'online' ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent z-10" />
                    <div className="relative z-20 group-hover/screen:scale-110 transition-transform duration-700">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                    </div>

                    <div className="absolute top-4 left-4 z-20">
                      <CrowdBadge level={camera.crowdLevel} size="sm" showPulse={true} />
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest bg-zinc-950/50 backdrop-blur-sm px-2 py-1 rounded-md">LIVE NODE {index + 1}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white text-zinc-950 px-3 py-1 rounded-full shadow-lg">
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-black italic">
                          <CountUp end={camera.currentCount} duration={1} />
                        </span>
                      </div>
                    </div>

                    <button className="absolute top-4 right-4 z-20 p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-zinc-300 group-hover:text-zinc-400 transition-colors">
                    <WifiOff className="w-12 h-12" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Connection Refused</span>
                  </div>
                )}
              </div>

              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    camera.status === 'online' ? "bg-zinc-100 text-zinc-950" : "bg-red-50 text-red-500"
                  )}>
                    {camera.status === 'online' ? (
                      <Wifi className="w-5 h-5" />
                    ) : (
                      <WifiOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-zinc-900 uppercase tracking-tighter truncate block">{camera.location}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Node ID: {camera.id.toUpperCase()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-400">
                  <Settings className="w-4.5 h-4.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
