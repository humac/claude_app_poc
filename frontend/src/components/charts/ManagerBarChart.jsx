import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function ManagerBarChart({ data, title = 'Assets by Manager' }) {
  // Transform data
  const chartData = (data || []).map((item, index) => ({
    name: item.name || item.email,
    count: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <Card className="glass-panel">

      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Manager Data"
            description="No assets are currently assigned to any manager."
            className="min-h-[300px]"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => value.length > 15 ? value.substring(0, 12) + '...' : value}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(label) => label}
                formatter={(value) => [`${value} assets`]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="count" position="top" fill="hsl(var(--foreground))" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
