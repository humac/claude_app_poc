import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import EmptyState from '@/components/ui/empty-state';
import { Activity } from 'lucide-react';

const ACTION_COLORS = {
  CREATE: '#22c55e',
  UPDATE: '#3b82f6',
  STATUS_CHANGE: '#f59e0b',
  DELETE: '#ef4444'
};

export default function ActivityAreaChart({ data, title = 'Activity Over Time', showPeriodSelector = true, onActionClick }) {
  const [period, setPeriod] = useState(30);

  // Filter data by period (last N days)
  const filteredData = (data || []).slice(-period);

  const handleClick = (action) => {
    if (onActionClick) onActionClick(action);
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {showPeriodSelector && (
            <div className="flex gap-1">
              <Button
                variant={period === 7 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(7)}
                className="h-7 text-xs"
              >
                7D
              </Button>
              <Button
                variant={period === 30 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(30)}
                className="h-7 text-xs"
              >
                30D
              </Button>
              <Button
                variant={period === 90 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(90)}
                className="h-7 text-xs"
              >
                90D
              </Button>
            </div>
          )}
        </div>

      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Activity"
            description="No recent activity found for the selected period."
            className="min-h-[300px]"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorCREATE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.CREATE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={ACTION_COLORS.CREATE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUPDATE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.UPDATE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={ACTION_COLORS.UPDATE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSTATUS_CHANGE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.STATUS_CHANGE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={ACTION_COLORS.STATUS_CHANGE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDELETE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.DELETE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={ACTION_COLORS.DELETE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                onClick={(e) => handleClick(e.dataKey)}
                wrapperStyle={{ cursor: 'pointer' }}
              />
              <Area
                type="monotone"
                dataKey="CREATE"
                stackId="1"
                stroke={ACTION_COLORS.CREATE}
                fillOpacity={1}
                fill="url(#colorCREATE)"
                onClick={() => handleClick('CREATE')}
                style={{ cursor: 'pointer' }}
                activeDot={{ onClick: () => handleClick('CREATE'), r: 6, style: { cursor: 'pointer' } }}
              />
              <Area
                type="monotone"
                dataKey="UPDATE"
                stackId="1"
                stroke={ACTION_COLORS.UPDATE}
                fillOpacity={1}
                fill="url(#colorUPDATE)"
                onClick={() => handleClick('UPDATE')}
                style={{ cursor: 'pointer' }}
                activeDot={{ onClick: () => handleClick('UPDATE'), r: 6, style: { cursor: 'pointer' } }}
              />
              <Area
                type="monotone"
                dataKey="STATUS_CHANGE"
                stackId="1"
                stroke={ACTION_COLORS.STATUS_CHANGE}
                fillOpacity={1}
                fill="url(#colorSTATUS_CHANGE)"
                onClick={() => handleClick('STATUS_CHANGE')}
                style={{ cursor: 'pointer' }}
                activeDot={{ onClick: () => handleClick('STATUS_CHANGE'), r: 6, style: { cursor: 'pointer' } }}
              />
              <Area
                type="monotone"
                dataKey="DELETE"
                stackId="1"
                stroke={ACTION_COLORS.DELETE}
                fillOpacity={1}
                fill="url(#colorDELETE)"
                onClick={() => handleClick('DELETE')}
                style={{ cursor: 'pointer' }}
                activeDot={{ onClick: () => handleClick('DELETE'), r: 6, style: { cursor: 'pointer' } }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
