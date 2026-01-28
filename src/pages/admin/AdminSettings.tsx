import { motion } from 'framer-motion';
import { Save, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

export default function AdminSettings() {
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
              <span className="text-sm font-medium tabular-nums">0% - 40%</span>
            </div>
            <Slider defaultValue={[40]} max={100} step={5} className="[&_[role=slider]]:bg-crowd-low" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-crowd-medium">Medium Threshold</Label>
              <span className="text-sm font-medium tabular-nums">40% - 70%</span>
            </div>
            <Slider defaultValue={[70]} max={100} step={5} className="[&_[role=slider]]:bg-crowd-medium" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-crowd-high">High Threshold</Label>
              <span className="text-sm font-medium tabular-nums">70% - 100%</span>
            </div>
            <Slider defaultValue={[100]} max={100} step={5} className="[&_[role=slider]]:bg-crowd-high" />
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
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Camera Offline Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when cameras go offline</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Summary</Label>
              <p className="text-sm text-muted-foreground">Receive a daily email summary of crowd activity</p>
            </div>
            <Switch />
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
              defaultValue="pk_xxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-api">AI Detection API Key</Label>
            <Input 
              id="ai-api" 
              type="password" 
              defaultValue="sk_xxxxxxxxxxxxxxxxxxxx"
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
          <Button variant="secondary" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </Button>
          <div className="text-sm text-muted-foreground">
            Last backup: 2 hours ago
          </div>
          <Button variant="destructive" className="gap-2">
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
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </motion.div>
    </div>
  );
}
