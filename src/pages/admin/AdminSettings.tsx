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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your crowd monitoring system</p>
      </div>

      {/* Thresholds */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-semibold mb-4">Crowd Level Thresholds</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Set the percentage thresholds for determining crowd levels
        </p>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-crowd-low">Low Threshold</Label>
              <span className="text-sm font-medium tabular-nums">0% - {settings.thresholdLow}%</span>
            </div>
            <Slider
              value={[settings.thresholdLow]}
              onValueChange={([v]) => setSettings(s => ({ ...s, thresholdLow: v }))}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-crowd-low"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-crowd-medium">Medium Threshold</Label>
              <span className="text-sm font-medium tabular-nums">{settings.thresholdLow}% - {settings.thresholdMedium}%</span>
            </div>
            <Slider
              value={[settings.thresholdMedium]}
              onValueChange={([v]) => setSettings(s => ({ ...s, thresholdMedium: v }))}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-crowd-medium"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-crowd-high">High Threshold</Label>
              <span className="text-sm font-medium tabular-nums">{settings.thresholdMedium}% - 100%</span>
            </div>
            <Slider
              value={[100]}
              disabled
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-crowd-high"
            />
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="font-semibold mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>High Capacity Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when locations reach high capacity</p>
            </div>
            <Switch
              checked={settings.alertHighCapacity}
              onCheckedChange={(c) => setSettings(s => ({ ...s, alertHighCapacity: c }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Camera Offline Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when cameras go offline</p>
            </div>
            <Switch
              checked={settings.alertCameraOffline}
              onCheckedChange={(c) => setSettings(s => ({ ...s, alertCameraOffline: c }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Summary</Label>
              <p className="text-sm text-muted-foreground">Receive a daily email summary of crowd activity</p>
            </div>
            <Switch
              checked={settings.emailSummary}
              onCheckedChange={(c) => setSettings(s => ({ ...s, emailSummary: c }))}
            />
          </div>
        </div>
      </motion.div>

      {/* API Keys */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-semibold mb-4">API Configuration</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-api">Map Provider API Key</Label>
            <Input
              id="map-api"
              type="password"
              value={settings.mapApiKey}
              onChange={(e) => setSettings(s => ({ ...s, mapApiKey: e.target.value }))}
              placeholder="pk_..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-api">AI Detection API Key</Label>
            <Input
              id="ai-api"
              type="password"
              value={settings.aiApiKey}
              onChange={(e) => setSettings(s => ({ ...s, aiApiKey: e.target.value }))}
              placeholder="sk_..."
            />
          </div>
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-semibold mb-4">Data Management</h2>
        <div className="space-y-4">
          <Button variant="secondary" className="gap-2" onClick={clearCache}>
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </Button>
          <div className="text-sm text-muted-foreground">
            Last backup: 2 hours ago
          </div>
          <Button variant="destructive" className="gap-2" onClick={handleReset}>
            <Trash2 className="w-4 h-4" />
            Reset All Data
          </Button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button className="gap-2 shadow-lg" size="lg" onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  );
}
