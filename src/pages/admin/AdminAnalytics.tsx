import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Image, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chennaiLocations, Location } from '@/data/mockLocations';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('7days');

  // Compute real-time stats from our mock data source
  const stats = useMemo(() => {
    // 1. Total Visitors (Snapshot)
    const totalCurrentVisitors = chennaiLocations.reduce((sum, loc) => sum + loc.currentCount, 0);

    // 2. Location Distribution (Top 5 busiest)
    const topLocations = [...chennaiLocations]
      .sort((a, b) => b.currentCount - a.currentCount)
      .slice(0, 5)
      .map(loc => ({
        name: loc.name,
        value: loc.currentCount
      }));

    // 3. Crowd Level Distribution
    const levels = { low: 0, medium: 0, high: 0 };
    chennaiLocations.forEach(loc => {
      if (loc.crowdLevel === 'low') levels.low++;
      else if (loc.crowdLevel === 'medium') levels.medium++;
      else levels.high++;
    });

    const distributionData = [
      { name: 'High', value: levels.high, color: 'hsl(0, 84%, 60%)' },
      { name: 'Medium', value: levels.medium, color: 'hsl(38, 92%, 50%)' },
      { name: 'Low', value: levels.low, color: 'hsl(160, 84%, 39%)' },
    ];

    // 4. Trend Data (Simulated based on current total + randomness for past days)
    // We'll create a plausible "past week" trend
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0

    const trendData = Array.from({ length: 7 }, (_, i) => {
      // Shift days so the last one is today
      const dayIndex = (todayIndex - 6 + i + 7) % 7;
      const baseTraffic = 85000; // Estimated city-wide average

      // Weekends are busier
      const isWeekend = dayIndex >= 5;
      const dailyFactor = isWeekend ? 1.4 : 1.0;

      // Random daily fluctuation
      const noise = (Math.random() - 0.5) * 10000;

      const dayVisitors = Math.floor(baseTraffic * dailyFactor + noise);
      const prevWeekVisitors = Math.floor(baseTraffic * dailyFactor * 0.9 + noise); // Last week slightly less

      return {
        day: days[dayIndex],
        visitors: i === 6 ? totalCurrentVisitors * 12 : dayVisitors, // Scale current snapshot for "Today" approximation
        lastWeek: prevWeekVisitors,
      };
    });

    // 5. Busiest Location
    const busiest = topLocations[0];

    return { totalCurrentVisitors, topLocations, distributionData, trendData, busiest };
  }, [dateRange]); // Recalculate if range changes (though we only simulate one view for now)

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
            <LineChart data={stats.trendData}>
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
          <h2 className="font-semibold mb-4">Current Busiest Locations</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topLocations} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card px-3 py-2">
                        <p className="text-sm font-medium">{payload[0].value?.toLocaleString()} active people</p>
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
          <h2 className="font-semibold mb-4">Live Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.distributionData.map((entry, index) => (
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
            {stats.distributionData.map((item) => (
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
              <p className="text-sm font-medium text-crowd-high">Busiest Location Right Now</p>
              <p className="text-lg font-bold">{stats.busiest.name}</p>
              <p className="text-xs text-muted-foreground">{stats.busiest.value.toLocaleString()} current visitors</p>
            </div>
            <div className="p-4 bg-crowd-low/10 rounded-xl">
              <p className="text-sm font-medium text-crowd-low">Quietest Time Prediction</p>
              <p className="text-lg font-bold">Tomorrow, 11 AM</p>
              <p className="text-xs text-muted-foreground">Based on historical patterns</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">
              <p className="text-sm font-medium">Overall City Trend</p>
              <p className="text-lg font-bold">Stable</p>
              <p className="text-xs text-muted-foreground">Normal traffic for {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
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
