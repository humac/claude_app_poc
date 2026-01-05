import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Filter } from 'lucide-react';
import { TrendLineChart, ActivityAreaChart } from '@/components/charts';
import { MetricsComparison } from '@/components/widgets';

const AuditTrends = ({
    loading,
    trends,
    trendsPeriod,
    setTrendsPeriod,
    fetchTrends
}) => {
    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Button
                    variant={trendsPeriod === 7 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTrendsPeriod(7); }}
                >
                    7 Days
                </Button>
                <Button
                    variant={trendsPeriod === 30 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTrendsPeriod(30); }}
                >
                    30 Days
                </Button>
                <Button
                    variant={trendsPeriod === 90 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTrendsPeriod(90); }}
                >
                    90 Days
                </Button>
                <Button onClick={fetchTrends}>
                    <Filter className="h-4 w-4 mr-2" />Apply
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
            ) : trends ? (
                <div className="space-y-6">
                    <TrendLineChart data={trends.assetGrowth} title="Asset Growth Over Time" dataKey="count" />

                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle className="text-base">Status Changes Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ActivityAreaChart data={trends.statusChanges} title="" />
                        </CardContent>
                    </Card>

                    {trends.metricsComparison && (
                        <MetricsComparison
                            current={trends.metricsComparison.current}
                            previous={trends.metricsComparison.previous}
                            title={`Metrics Comparison (Last ${trendsPeriod} Days vs Previous ${trendsPeriod} Days)`}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default AuditTrends;
