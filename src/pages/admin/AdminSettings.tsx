import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast'; // Assuming hook exists based on file structure

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    thresholdLow: 40,
    thresholdMedium: 70,
    thresholdHigh: 100,
    alertHighCapacity: true,
    alertCameraOffline: true,
    emailSummary: false,
    mapApiKey: '',
    aiApiKey: ''
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('crowd_watch_settings');
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      localStorage.setItem('crowd_watch_settings', JSON.stringify(settings));
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
    }, 800);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      const defaults = {
        thresholdLow: 40,
        thresholdMedium: 70,
        thresholdHigh: 100,
        alertHighCapacity: true,
        alertCameraOffline: true,
        emailSummary: false,
        mapApiKey: '',
        aiApiKey: ''
      };
      setSettings(defaults);
      localStorage.removeItem('crowd_watch_settings');
      toast({
        title: "Settings reset",
        description: "All settings have been restored to defaults.",
        variant: "destructive"
      });
    }
  };

  const clearCache = () => {
    localStorage.removeItem('crowd_watch_cache'); // Example cache key
    toast({
      title: "Cache cleared",
      description: "Local application cache has been purged.",
    });
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            System Configuration
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-950">Core Parameters</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Modify monitoring thresholds and global system heuristics</p>
        </div>
        <Button
          className="h-12 px-10 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all gap-3"
          onClick={handleSave}
          disabled={loading}
        >
          <Save className="w-4 h-4" />
          {loading ? 'Synchronizing...' : 'Commit Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Thresholds */}
          <motion.div
            className="glass-card p-10 border-zinc-200 shadow-2xl bg-white rounded-[3rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-2 h-6 bg-zinc-950 rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Crowd Mass Thresholds</h2>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-green-500">Low Density Limit</Label>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mt-1">Maximum capacity for optimal flow state</p>
                  </div>
                  <span className="text-2xl font-black italic tracking-tighter tabular-nums">0% - {settings.thresholdLow}%</span>
                </div>
                <Slider
                  value={[settings.thresholdLow]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, thresholdLow: v }))}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-600 shadow-sm"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-orange-500">Medium Density Limit</Label>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mt-1">Intermediate transition point for alert triggers</p>
                  </div>
                  <span className="text-2xl font-black italic tracking-tighter tabular-nums">{settings.thresholdLow}% - {settings.thresholdMedium}%</span>
                </div>
                <Slider
                  value={[settings.thresholdMedium]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, thresholdMedium: v }))}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-600 shadow-sm"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-red-500">Critical Density Floor</Label>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mt-1">High-occupancy threshold for rapid response</p>
                  </div>
                  <span className="text-2xl font-black italic tracking-tighter tabular-nums">{settings.thresholdMedium}% - 100%</span>
                </div>
                <Slider
                  value={[100]}
                  disabled
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-600 shadow-sm opacity-50"
                />
              </div>
            </div>
          </motion.div>

          {/* API Keys */}
          <motion.div
            className="glass-card p-10 border-zinc-200 shadow-2xl bg-white rounded-[3rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-2 h-6 bg-zinc-950 rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">System Uplink Config</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="map-api" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Map Geospatial Key</Label>
                <Input
                  id="map-api"
                  type="password"
                  value={settings.mapApiKey}
                  onChange={(e) => setSettings(s => ({ ...s, mapApiKey: e.target.value }))}
                  placeholder="PK_MAP_XXXXX"
                  className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl text-[11px] font-black tracking-widest focus-visible:ring-zinc-950/10 shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="ai-api" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Processing Engine Key</Label>
                <Input
                  id="ai-api"
                  type="password"
                  value={settings.aiApiKey}
                  onChange={(e) => setSettings(s => ({ ...s, aiApiKey: e.target.value }))}
                  placeholder="SK_AI_XXXXX"
                  className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl text-[11px] font-black tracking-widest focus-visible:ring-zinc-950/10 shadow-inner"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Notifications */}
          <motion.div
            className="glass-card p-10 border-zinc-100 shadow-xl bg-zinc-50 rounded-[3rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Datalink Alerts</h2>
            <div className="space-y-8">
              {[
                { label: "Cap Threshold Breach", desc: "Notify on density spike", state: "alertHighCapacity" },
                { label: "Uplink Failure", desc: "Notify on camera sever", state: "alertCameraOffline" },
                { label: "Temporal Manifest", desc: "Daily intelligence digest", state: "emailSummary" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{item.label}</Label>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight mt-1">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as any)[item.state]}
                    onCheckedChange={(c) => setSettings(s => ({ ...s, [item.state]: c }))}
                    className="data-[state=checked]:bg-zinc-950"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div
            className="glass-card p-10 border-zinc-100 shadow-xl bg-zinc-50 rounded-[3rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">Maintenance Ops</h2>
            <div className="space-y-6">
              <Button variant="outline" className="w-full h-14 rounded-2xl bg-white border-zinc-200 text-[10px] font-black uppercase tracking-widest gap-3 shadow-sm hover:bg-zinc-100 transition-all" onClick={clearCache}>
                <RefreshCw className="w-4 h-4" />
                Flush Buffer
              </Button>
              <div className="p-4 bg-zinc-200/50 rounded-2xl border border-zinc-200">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center italic">Archive Status: Validated</p>
              </div>
              <Button variant="destructive" className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl hover:bg-red-600 transition-all opacity-80 hover:opacity-100" onClick={handleReset}>
                <Trash2 className="w-4 h-4" />
                Factory Reset
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
