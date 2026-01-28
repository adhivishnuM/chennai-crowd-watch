import { motion } from 'framer-motion';
import { Video, Play, Maximize2, Users, Settings, Wifi, WifiOff } from 'lucide-react';
import CountUp from 'react-countup';
import { chennaiLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';

// Mock camera data
const cameras = chennaiLocations.slice(0, 9).map((loc, i) => ({
  id: `cam-${i + 1}`,
  location: loc.name,
  status: Math.random() > 0.1 ? 'online' : 'offline',
  currentCount: Math.floor(Math.random() * 500) + 100,
  crowdLevel: loc.crowdLevel,
}));

export default function AdminCameras() {
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
            {cameras.filter(c => c.status === 'online').length} Online
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            {cameras.filter(c => c.status === 'offline').length} Offline
          </div>
        </div>
      </div>

      {/* Camera Grid */}
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
