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
      if (hourInt === 0) hourLabel = '12a';
      else if (hourInt === 12) hourLabel = '12p';
      else if (hourInt > 12) hourLabel = `${hourInt - 12}p`;
      else hourLabel = `${hourInt}a`;

      return {
        hour: hourLabel,
        value: item.crowdLevel,
        isCurrent: index === currentHourIndex,
        originalHour: index
      };
    })
    .filter(item => item.originalHour >= 6 && item.originalHour <= 23);

  const getBarColor = (value: number) => {
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
              interval={4}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.value)}
                  opacity={entry.isCurrent ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full py-1">
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">
          Usually <span className="font-medium text-foreground">{getBusynessLabel(currentVal)}</span> now
        </span>
      </div>

      <ResponsiveContainer width="100%" height={88}>
        <BarChart data={chartData} barCategoryGap={3}>
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            interval={2}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.15)', radius: 4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value as number;
                return (
                  <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                    <p className="font-medium capitalize">{getBusynessLabel(value)}</p>
                    <p className="text-muted-foreground mt-0.5">{value}% capacity</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.value)}
                opacity={entry.isCurrent ? 1 : 0.35}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-5 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-crowd-low" />
          <span>Quiet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-crowd-medium" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-crowd-high" />
          <span>Busy</span>
        </div>
      </div>
    </div>
  );
}
