import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Download, Users, MapPin, Activity, Clock,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chennaiLocations } from '@/data/mockLocations';
import { cn } from '@/lib/utils';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('7days');

  // Compute stats
  const stats = useMemo(() => {
    const totalCurrentVisitors = chennaiLocations.reduce((sum, loc) => sum + loc.currentCount, 0);
    const avgCapacityDetails = chennaiLocations.reduce((acc, loc) => acc + (loc.currentCount / loc.capacity), 0) / chennaiLocations.length;

    // Top Locations
    const topLocations = [...chennaiLocations]
      .sort((a, b) => b.currentCount - a.currentCount)
      .slice(0, 5)
      .map(loc => ({
        name: loc.name,
        value: loc.currentCount,
        capacity: loc.capacity,
        fill: loc.crowdLevel === 'high' ? 'hsl(var(--crowd-high))' : loc.crowdLevel === 'medium' ? 'hsl(var(--crowd-medium))' : 'hsl(var(--crowd-low))'
      }));

    // Distribution
    const levels = { low: 0, medium: 0, high: 0 };
    chennaiLocations.forEach(loc => {
      if (loc.crowdLevel === 'low') levels.low++;
      else if (loc.crowdLevel === 'medium') levels.medium++;
      else levels.high++;
    });

    const distributionData = [
      { name: 'High Traffic', value: levels.high, color: 'hsl(var(--crowd-high))' },
      { name: 'Moderate', value: levels.medium, color: 'hsl(var(--crowd-medium))' },
      { name: 'Low Traffic', value: levels.low, color: 'hsl(var(--crowd-low))' },
    ];

    // Simulated Trend Data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    const trendData = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (todayIndex - 6 + i + 7) % 7;
      const baseTraffic = 85000;
      const isWeekend = dayIndex >= 5;
      const dailyFactor = isWeekend ? 1.4 : 1.0;
      const noise = (Math.random() - 0.5) * 15000;

      const dayVisitors = Math.floor(baseTraffic * dailyFactor + noise);
      const prevWeekVisitors = Math.floor(baseTraffic * dailyFactor * 0.9 + noise);

      return {
        day: days[dayIndex],
        visitors: i === 6 ? totalCurrentVisitors * 12 : dayVisitors,
        lastWeek: prevWeekVisitors,
      };
    });

    const busiest = topLocations[0];
    const growingTrend = trendData[6].visitors > trendData[5].visitors;

    return {
      totalCurrentVisitors,
      avgCapacity: Math.round(avgCapacityDetails * 100),
      topLocations,
      distributionData,
      trendData,
      busiest,
      growingTrend
    };
  }, [dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-4 py-3 shadow-xl border border-white/20">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.stroke || entry.fill }} />
              <span className="font-medium" style={{ color: entry.stroke || entry.fill }}>
                {entry.name}: {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Analytics Engine
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-950">Spatial Analytics</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Real-time predictive crowd modeling & spatial intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px] h-11 bg-zinc-100 border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner">
              <Calendar className="w-4 h-4 mr-2 text-zinc-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-zinc-200 shadow-2xl">
              <SelectItem value="today" className="text-[10px] font-black uppercase">Standard: Today</SelectItem>
              <SelectItem value="7days" className="text-[10px] font-black uppercase">Standard: 7 Days</SelectItem>
              <SelectItem value="30days" className="text-[10px] font-black uppercase">Standard: 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11 px-6 bg-white border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 shadow-sm transition-all active:scale-95">
            <Download className="w-4 h-4 mr-2" />
            Extract Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Global Active Density",
            value: stats.totalCurrentVisitors.toLocaleString(),
            icon: Users,
            trend: "+12.5%",
            trendUp: true,
            desc: "Aggregate City Pulse"
          },
          {
            label: "Neural Peak Point",
            value: stats.busiest.name,
            icon: MapPin,
            sub: `${stats.busiest.value.toLocaleString()} UNIT COUNT`,
            trend: "MAX",
            trendUp: true
          },
          {
            label: "Spatial Utilization",
            value: `${stats.avgCapacity}%`,
            icon: Activity,
            trend: "-2.1%",
            trendUp: false,
            desc: "Capacity Threshold"
          },
          {
            label: "Inference Confidence",
            value: "94.2%",
            icon: TrendingUp,
            trend: "OPTIMAL",
            trendUp: true,
            desc: "Detection Confidence"
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 border-zinc-200 shadow-xl overflow-hidden group hover:-translate-y-1 transition-all duration-500 bg-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 -mr-16 -mt-16 rounded-full group-hover:bg-zinc-100 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shadow-lg shadow-zinc-200 group-hover:scale-110 transition-transform duration-500">
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.trend && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border shadow-sm",
                    stat.trendUp ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                  )}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                )}
              </div>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-3xl font-black text-zinc-900 tracking-tighter truncate uppercase italic">
                {stat.value}
              </p>
              {(stat.desc || stat.sub) && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{stat.desc || stat.sub}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Trend Chart */}
      <motion.div
        className="glass-card p-8 border-zinc-200 shadow-2xl bg-white relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-2 h-6 bg-zinc-950 rounded-full" />
              City Pulse Propagation
            </h2>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Comparative predictive crowd modeling & flow analysis</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-zinc-950"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active Cycle</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Baseline Cycle</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trendData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#999', fontSize: 10, fontWeight: 800 }}
                dy={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#999', fontSize: 10, fontWeight: 800 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '8 8' }}
              />
              <Area
                type="monotone"
                dataKey="lastWeek"
                stroke="#eee"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="10 10"
                name="Baseline"
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#000"
                fillOpacity={1}
                fill="url(#colorVisitors)"
                strokeWidth={4}
                name="Pulse"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Locations Bar Chart */}
        <motion.div
          className="glass-card p-8 border-zinc-200 shadow-xl bg-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-2">High-Density Zones</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">Direct analysis of critical capacity nodes</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topLocations} layout="vertical" margin={{ left: -20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 10, fontWeight: 800 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8f8f8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1">{data.name}</p>
                          <p className="text-xl font-black italic tracking-tighter truncate">{data.value.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Units Detected</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                  {stats.topLocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#18181b" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Status Distribution Donut */}
        <motion.div
          className="glass-card p-8 border-zinc-200 shadow-xl bg-white relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-2">Capacity Matrix</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">Percentage aggregate distribution vs city baseline</p>
          </div>
          <div className="h-[350px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distributionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={90}
                  outerRadius={125}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-14">
              <span className="text-4xl font-black italic tracking-tighter text-zinc-950">{chennaiLocations.length}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Nodes</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insight Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {[
          {
            title: "Predictive Index",
            icon: Clock,
            borderColor: "border-l-zinc-950",
            content: "Traffic surge prediction: +18% shift expected at T+24h 1100 based on historical vectors."
          },
          {
            title: "Critical Overload",
            icon: AlertCircle,
            borderColor: "border-l-red-500",
            content: `${stats.busiest.name} detected at ${(stats.busiest.value / stats.busiest.capacity * 100).toFixed(0)}% spatial threshold. Intervention recommended.`
          },
          {
            title: "Optimization Node",
            icon: TrendingDown,
            borderColor: "border-l-green-500",
            content: "Under-utilization detected at 5 secondary nodes. Strategic traffic diversion available."
          }
        ].map((alert, i) => (
          <div
            key={i}
            className={cn(
              "glass-card p-6 border-zinc-200 border-l-[6px] shadow-lg flex gap-5 items-start bg-white hover:bg-zinc-50 transition-colors",
              alert.borderColor
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <alert.icon className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-950 mb-2">{alert.title}</h4>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-tight leading-relaxed">
                {alert.content}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
