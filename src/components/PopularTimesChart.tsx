import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface PopularTime {
  hour: string;
  crowdLevel: number;
  label: string | null;
}

interface PopularTimesChartProps {
  data: PopularTime[];
  compact?: boolean;
}

export function PopularTimesChart({ data, compact = false }: PopularTimesChartProps) {
  if (!data) return null;

  const currentHourIndex = new Date().getHours();

  const chartData = data
    .map((item, index) => {
      const hourInt = parseInt(item.hour);
      let hourLabel = '';
      if (hourInt === 0) hourLabel = '12am';
      else if (hourInt === 12) hourLabel = '12pm';
      else if (hourInt > 12) hourLabel = `${hourInt - 12}pm`;
      else hourLabel = `${hourInt}am`;

      return {
        hour: hourLabel,
        value: item.crowdLevel,
        isCurrent: index === currentHourIndex,
        originalHour: index
      };
    })
    .filter(item => item.originalHour >= 6 && item.originalHour <= 23);

  const getBarColor = (value: number, isCurrent: boolean) => {
    // REMOVED: if (isCurrent) return 'hsl(var(--primary))'; // Don't make it black
    if (value < 40) return 'hsl(var(--crowd-low))';
    if (value < 70) return 'hsl(var(--crowd-medium))';
    return 'hsl(var(--crowd-high))';
  };

  const getBusynessLabel = (value: number) => {
    if (value < 40) return 'quiet';
    if (value < 70) return 'moderate';
    return 'busy';
  };

  const currentVal = data[currentHourIndex]?.crowdLevel || 0;

  // Compact mode for cards - just the chart, no header/legend
  if (compact) {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={1}>
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
              interval={3}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.value, entry.isCurrent)}
                  opacity={entry.isCurrent ? 1 : 0.6}
                  stroke={entry.isCurrent ? 'hsl(var(--primary))' : 'none'}
                  strokeWidth={entry.isCurrent ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Full mode with header and legend
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Popular Times</h3>
        <span className="text-sm text-muted-foreground">
          Usually <span className="font-medium text-foreground">{getBusynessLabel(currentVal)}</span> at this time
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} barCategoryGap={2}>
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            interval={2}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value as number;
                return (
                  <div className="glass-card px-3 py-2 text-sm">
                    <p className="font-medium">{getBusynessLabel(value)}</p>
                    <p className="text-xs text-muted-foreground">{value}% capacity</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.value, entry.isCurrent)}
                // Highlight current time with full opacity and a distinct border/glow effect if needed
                opacity={entry.isCurrent ? 1 : 0.4}
                stroke={entry.isCurrent ? 'hsl(var(--foreground))' : 'none'}
                strokeWidth={entry.isCurrent ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-crowd-low opacity-60" />
          <span className="text-muted-foreground">Quiet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-crowd-medium opacity-60" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-crowd-high opacity-60" />
          <span className="text-muted-foreground">Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm border-2 border-foreground bg-transparent" />
          <span className="text-muted-foreground">Now</span>
        </div>
      </div>
    </motion.div>
  );
}
