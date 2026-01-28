import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Image, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data
const trendData = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  visitors: Math.floor(Math.random() * 5000) + 3000,
  lastWeek: Math.floor(Math.random() * 5000) + 3000,
}));

const locationData = [
  { name: 'Marina Beach', value: 3500 },
  { name: 'Express Avenue', value: 2800 },
  { name: 'T. Nagar', value: 2500 },
  { name: 'Phoenix Mall', value: 2200 },
  { name: 'Central Station', value: 1800 },
];

const distributionData = [
  { name: 'High', value: 6, color: 'hsl(0, 84%, 60%)' },
  { name: 'Medium', value: 5, color: 'hsl(38, 92%, 50%)' },
  { name: 'Low', value: 4, color: 'hsl(160, 84%, 39%)' },
];

const heatmapData = Array.from({ length: 7 }, (_, day) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
  hours: Array.from({ length: 17 }, (_, hour) => ({
    hour: 6 + hour,
    value: Math.floor(Math.random() * 100),
  })),
}));

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('7days');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Deep dive into crowd data and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-semibold mb-4">Crowd Trends Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card px-3 py-2">
                        <p className="text-sm font-medium">{payload[0].value?.toLocaleString()} visitors</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="visitors" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="lastWeek" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary" />
              <span className="text-muted-foreground">This week</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">Last week</span>
            </div>
          </div>
        </motion.div>

        {/* Location Distribution */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-semibold mb-4">Daily Average by Location</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={locationData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card px-3 py-2">
                        <p className="text-sm font-medium">{payload[0].value?.toLocaleString()} avg visitors</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Crowd Level Distribution */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-semibold mb-4">Crowd Level Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card px-3 py-2">
                        <p className="text-sm font-medium">{payload[0].name}: {payload[0].value} locations</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 text-sm">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div
          className="glass-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-semibold mb-4">Key Insights</h2>
          <div className="space-y-4">
            <div className="p-4 bg-crowd-high/10 rounded-xl">
              <p className="text-sm font-medium text-crowd-high">Busiest Location</p>
              <p className="text-lg font-bold">Marina Beach</p>
              <p className="text-xs text-muted-foreground">3,500 avg visitors/day</p>
            </div>
            <div className="p-4 bg-crowd-low/10 rounded-xl">
              <p className="text-sm font-medium text-crowd-low">Quietest Time</p>
              <p className="text-lg font-bold">Tuesday, 2 PM</p>
              <p className="text-xs text-muted-foreground">Across all locations</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">
              <p className="text-sm font-medium">Most Improved</p>
              <p className="text-lg font-bold">Spencer Plaza</p>
              <p className="text-xs text-muted-foreground">-25% crowd level vs last week</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Export Options */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-semibold mb-4">Export Data</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="gap-2">
            <Image className="w-4 h-4" />
            Download as PNG
          </Button>
          <Button variant="secondary" className="gap-2">
            <FileText className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button variant="secondary" className="gap-2">
            <Download className="w-4 h-4" />
            Generate PDF Report
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
