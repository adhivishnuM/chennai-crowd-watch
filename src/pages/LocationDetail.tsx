import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Clock, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, BarChart3 } from 'lucide-react';
import CountUp from 'react-countup';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { chennaiLocations } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { PopularTimesChart } from '@/components/PopularTimesChart';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useMode } from '@/context/ModeContext';
import { LocationTypeIcon } from '@/components/LocationTypeIcon';

// Mock trend data for the last 3 hours
const generateTrendData = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const time = new Date(now.getTime() - (11 - i) * 15 * 60000);
    return {
      time: time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      count: Math.floor(Math.random() * 500) + 800,
    };
  });
};

export default function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useMode();
  const location = chennaiLocations.find(loc => loc.id === id);

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Location not found</p>
      </div>
    );
  }

  const capacityPercentage = Math.round((location.currentCount / location.capacity) * 100);
  const trendData = generateTrendData();

  const TrendIcon = {
    rising: TrendingUp,
    falling: TrendingDown,
    stable: Minus,
  }[location.trend];

  const trendColor = {
    rising: 'text-crowd-high',
    falling: 'text-crowd-low',
    stable: 'text-muted-foreground',
  }[location.trend];

  // Quick stats
  const stats = [
    { label: 'Peak hours today', value: '5 PM - 7 PM', icon: Clock },
    { label: 'Avg wait time', value: '~12 mins', icon: AlertTriangle },
    { label: 'vs yesterday', value: '+15%', icon: BarChart3 },
    { label: 'Next hour prediction', value: location.trend === 'rising' ? 'More crowded' : 'Less crowded', icon: TrendingUp },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background pt-20 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <motion.button
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          onClick={() => navigate('/')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map</span>
        </motion.button>

        {/* Hero Section */}
        <motion.div
          className="glass-card p-6 md:p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center">
                <LocationTypeIcon type={location.type} size={28} className="text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{location.name}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location.address}</span>
                </div>
              </div>
            </div>
            <CrowdBadge level={location.crowdLevel} size="lg" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {mode === 'admin' ? (
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  ~<CountUp end={location.currentCount} duration={1.5} separator="," />
                </div>
                <div className="text-xs text-muted-foreground">people now</div>
              </div>
            ) : (
              // Replaced with a placeholder or simple status for public
              <div className="text-center p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-lg font-bold">
                  {capacityPercentage > 70 ? "High" : capacityPercentage > 40 ? "Medium" : "Low"}
                </div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
            )}
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold tabular-nums">{capacityPercentage}%</div>
              <div className="text-xs text-muted-foreground">capacity</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendIcon className={`w-5 h-5 ${trendColor}`} />
              </div>
              <div className="text-2xl font-bold capitalize">{location.trend}</div>
              <div className="text-xs text-muted-foreground">trend</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold tabular-nums">~12</div>
              <div className="text-xs text-muted-foreground">min wait</div>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Current Capacity</span>
              <span className="font-semibold">{mode === 'admin' ? `${location.currentCount.toLocaleString()} / ${location.capacity.toLocaleString()}` : `${capacityPercentage}%`}</span>
            </div>
            <Progress value={capacityPercentage} className="h-3" />
          </div>
        </motion.div>

        {/* Best Time Recommendation */}
        <motion.div
          className="glass-card p-6 mb-6 border-l-4 border-l-crowd-low"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-crowd-low/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-crowd-low" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Best Time to Visit</h3>
              <p className="text-2xl font-bold mt-1">{location.bestTime}</p>
              <p className="text-muted-foreground text-sm mt-1">
                Typically 40% less crowded than peak hours
              </p>
            </div>
          </div>
        </motion.div>

        {/* Popular Times Chart */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PopularTimesChart data={location.popularTimes} />
        </motion.div>

        {/* Live Trend */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Trend (Last 3 Hours)</h3>
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{location.trend}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval={2}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card px-3 py-2">
                        <p className="text-sm font-medium">{payload[0].value} people</p>
                        <p className="text-xs text-muted-foreground">{payload[0].payload.time}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="glass-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="font-semibold">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
