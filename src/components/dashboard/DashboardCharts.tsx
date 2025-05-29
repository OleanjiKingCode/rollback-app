import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface DashboardChartsProps {
  mockAnalytics: Array<{ date: string; value: number }>;
}

export function DashboardCharts({ mockAnalytics }: DashboardChartsProps) {
  return (
    <ChartContainer
      config={{
        value: { label: "Value ($)", color: "#000000" }
      }}
      className="h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockAnalytics}>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#000000', fontSize: 12 }}
            axisLine={{ stroke: '#000000' }}
          />
          <YAxis 
            tick={{ fill: '#000000', fontSize: 12 }}
            axisLine={{ stroke: '#000000' }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #000000',
              borderRadius: '8px',
              color: '#000000',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            labelStyle={{
              color: '#000000',
              fontWeight: '600'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#000000" 
            strokeWidth={2}
            dot={{ fill: '#000000' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
