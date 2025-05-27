
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
          <ChartTooltip 
            content={<ChartTooltipContent />}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #FAEBD1',
              borderRadius: '8px',
              color: '#3C2415',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            labelStyle={{
              color: '#8B5E3C',
              fontWeight: '600'
            }}
          />
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
