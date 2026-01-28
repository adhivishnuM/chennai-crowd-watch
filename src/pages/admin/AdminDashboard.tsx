import { motion } from 'framer-motion';
import { MapPin, Video, Users, Bell, TrendingUp, TrendingDown, Clock, Plus, Upload, Eye, FileText } from 'lucide-react';
import CountUp from 'react-countup';
import { chennaiLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock activity data
const recentActivity = [
  { id: 1, location: 'Marina Beach', event: 'reached HIGH capacity', time: '2 min ago', type: 'alert' },
  { id: 2, location: 'Express Avenue', event: 'trend changed to RISING', time: '5 min ago', type: 'trend' },
  { id: 3, location: 'T. Nagar', event: 'capacity updated to 3500', time: '12 min ago', type: 'update' },
  { id: 4, location: 'Chennai Central', event: 'new camera added', time: '25 min ago', type: 'camera' },
  { id: 5, location: 'Phoenix Mall', event: 'dropped to MEDIUM level', time: '32 min ago', type: 'alert' },
];

export default function AdminDashboard() {
  const totalLocations = chennaiLocations.length;
  const activeCameras = 42;
  const avgCrowdLevel = 65;
  const alertsToday = 12;

  const highCount = chennaiLocations.filter(l => l.crowdLevel === 'high').length;
  const mediumCount = chennaiLocations.filter(l => l.crowdLevel === 'medium').length;
  const lowCount = chennaiLocations.filter(l => l.crowdLevel === 'low').length;

  const stats = [
    { label: 'Total Locations', value: totalLocations, icon: MapPin, color: 'text-primary' },
    { label: 'Active Cameras', value: activeCameras, icon: Video, color: 'text-crowd-low' },
    { label: 'Avg Crowd Level', value: avgCrowdLevel, suffix: '%', icon: Users, color: 'text-crowd-medium' },
    { label: 'Alerts Today', value: alertsToday, icon: Bell, color: 'text-crowd-high' },
  ];

  const quickActions = [
    { label: 'Add Location', icon: Plus, action: () => {} },
    { label: 'Upload Video', icon: Upload, action: () => {} },
    { label: 'View Cameras', icon: Video, action: () => {} },
    { label: 'Generate Report', icon: FileText, action: () => {} },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your crowd monitoring system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  <CountUp end={stat.value} duration={1.5} />
                  {stat.suffix}
                </p>
              </div>
              <div className={`p-2 rounded-xl bg-secondary ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <motion.div
          className="lg:col-span-2 glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Live Activity Feed</h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-crowd-low animate-pulse" />
              Live
            </span>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'alert' ? 'bg-crowd-high' :
                    activity.type === 'trend' ? 'bg-crowd-medium' :
                    'bg-crowd-low'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.location}</span>{' '}
                      <span className="text-muted-foreground">{activity.event}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={action.label}
                variant="secondary"
                className="h-auto py-4 flex-col gap-2"
                onClick={action.action}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>

          {/* System Health */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <h3 className="text-sm font-medium mb-3">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cameras Online</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-crowd-low" />
                  42/45
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Sync</span>
                <span>30 sec ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-crowd-low" />
                  Operational
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Crowd Distribution */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-semibold mb-4">Current Crowd Distribution</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-crowd-high/10">
            <p className="text-3xl font-bold text-crowd-high tabular-nums">{highCount}</p>
            <p className="text-sm text-muted-foreground mt-1">High Capacity</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-crowd-medium/10">
            <p className="text-3xl font-bold text-crowd-medium tabular-nums">{mediumCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Medium Capacity</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-crowd-low/10">
            <p className="text-3xl font-bold text-crowd-low tabular-nums">{lowCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Low Capacity</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
