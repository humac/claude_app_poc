import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Loader2 } from 'lucide-react';
import { KPICard, RiskIndicatorList, ComplianceChecklist } from '@/components/widgets';

const AuditCompliance = ({ loading, compliance }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (!compliance) return null;

    return (
        <>
            {/* Compliance KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Compliance Score"
                    value={`${compliance.score}%`}
                    icon={Shield}
                    variant={compliance.score >= 80 ? 'success' : compliance.score >= 60 ? 'warning' : 'danger'}
                    description="Overall compliance rating"
                />
                <KPICard
                    title="Overdue Attestations"
                    value={compliance.overdueAttestations}
                    icon={FileText}
                    variant={compliance.overdueAttestations === 0 ? 'success' : 'warning'}
                    description="Past due date"
                />
                <KPICard
                    title="At Risk Assets"
                    value={compliance.atRiskAssets}
                    icon={Shield}
                    variant={compliance.atRiskAssets === 0 ? 'success' : compliance.atRiskAssets < 5 ? 'warning' : 'danger'}
                    description="Lost or damaged"
                />
                <KPICard
                    title="Attested This Quarter"
                    value={compliance.attestedThisQuarter}
                    icon={FileText}
                    variant="info"
                    description="Completed attestations"
                />
            </div>

            {/* Campaign Progress */}
            {compliance.campaigns && compliance.campaigns.length > 0 && (
                <Card className="glass-panel">
                    <CardHeader>
                        <CardTitle className="text-base">Active Campaign Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {compliance.campaigns.map((campaign, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{campaign.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {campaign.completed}/{campaign.total} ({campaign.progress}%)
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${campaign.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <RiskIndicatorList risks={compliance.riskIndicators} />
                <ComplianceChecklist items={compliance.checklist} />
            </div>
        </>
    );
};

export default AuditCompliance;
