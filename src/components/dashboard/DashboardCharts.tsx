
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface DashboardChartsProps {
  mockAnalytics: Array<{ date: string; value: number }>;
}

export function DashboardCharts({ mockAnalytics }: DashboardChartsProps) {
  return (
    <ChartContainer
      config={{
        value: { label: "Value ($)", color: "#E9A344" }
      }}
      className="h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockAnalytics}>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#3C2415', fontSize: 12 }}
            axisLine={{ stroke: '#3C2415' }}
          />
          <YAxis 
            tick={{ fill: '#3C2415', fontSize: 12 }}
            axisLine={{ stroke: '#3C2415' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#E9A344" 
            strokeWidth={2}
            dot={{ fill: '#E9A344' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
