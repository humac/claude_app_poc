import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, BarChart3, Shield, Activity, Loader2 } from 'lucide-react';
import { KPICard } from '@/components/widgets';
import { AssetStatusPieChart, CompanyBarChart, ManagerBarChart } from '@/components/charts';

const AuditSummary = ({ loading, summaryEnhanced }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (!summaryEnhanced) return null;

    return (
        <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Assets"
                    value={summaryEnhanced.total}
                    icon={Laptop}
                    trend={summaryEnhanced.totalChange > 0 ? 'up' : summaryEnhanced.totalChange < 0 ? 'down' : null}
                    trendValue={summaryEnhanced.totalChange !== 0 ? `${Math.abs(summaryEnhanced.totalChange)} vs last month` : null}
                    variant="info"
                />
                <KPICard
                    title="Active Assets"
                    value={summaryEnhanced.byStatus?.active || 0}
                    icon={BarChart3}
                    variant="success"
                    description={`${summaryEnhanced.byStatus?.returned || 0} returned`}
                />
                <KPICard
                    title="At Risk"
                    value={(summaryEnhanced.byStatus?.lost || 0) + (summaryEnhanced.byStatus?.damaged || 0)}
                    icon={Shield}
                    variant={(summaryEnhanced.byStatus?.lost || 0) + (summaryEnhanced.byStatus?.damaged || 0) > 0 ? 'danger' : 'success'}
                    description={`${summaryEnhanced.byStatus?.lost || 0} lost, ${summaryEnhanced.byStatus?.damaged || 0} damaged`}
                />
                <KPICard
                    title="Active Rate"
                    value={`${summaryEnhanced.complianceScore}%`}
                    icon={Activity}
                    variant={summaryEnhanced.complianceScore >= 80 ? 'success' : summaryEnhanced.complianceScore >= 60 ? 'warning' : 'danger'}
                    description="Percentage of active assets"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <AssetStatusPieChart data={summaryEnhanced.byStatus} />
                <CompanyBarChart data={summaryEnhanced.byCompany} topN={10} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ManagerBarChart data={summaryEnhanced.byManager?.slice(0, 10) || []} />
                <Card className="glass-panel">
                    <CardHeader>
                        <CardTitle className="text-base">Asset Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(summaryEnhanced.byType || {})
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 8)
                                .map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full"
                                                    style={{ width: `${(count / summaryEnhanced.total) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold w-12 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AuditSummary;
