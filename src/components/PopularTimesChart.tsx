import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface PopularTimesChartProps {
  data: number[];
  currentHour?: number;
}

const HOURS = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'];

export function PopularTimesChart({ data, currentHour = new Date().getHours() - 6 }: PopularTimesChartProps) {
  const chartData = data.map((value, index) => ({
    hour: HOURS[index],
    value,
    isCurrent: index === currentHour,
  }));

  const getBarColor = (value: number, isCurrent: boolean) => {
    if (isCurrent) return 'hsl(var(--primary))';
    if (value < 40) return 'hsl(var(--crowd-low))';
    if (value < 70) return 'hsl(var(--crowd-medium))';
    return 'hsl(var(--crowd-high))';
  };

  const getBusynessLabel = (value: number) => {
    if (value < 40) return 'quiet';
    if (value < 70) return 'moderate';
    return 'busy';
  };

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
          Usually <span className="font-medium text-foreground">{getBusynessLabel(data[currentHour] || 50)}</span> at this time
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
                opacity={entry.isCurrent ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-crowd-low" />
          <span className="text-muted-foreground">Quiet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-crowd-medium" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-crowd-high" />
          <span className="text-muted-foreground">Busy</span>
        </div>
      </div>
    </motion.div>
  );
}
