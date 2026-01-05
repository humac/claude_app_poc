import React from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const ComplianceAlertBanner = ({ compliance, onDismiss, onViewDetails }) => {
    if (!compliance) return null;

    const { overdueAttestations, atRiskAssets, score } = compliance;

    // Determine alert level
    const isCritical = overdueAttestations > 0 || atRiskAssets > 0 || score < 60;
    const isWarning = score >= 60 && score < 80;

    if (!isCritical && !isWarning) return null;

    const variant = isCritical ? 'destructive' : 'warning';
    const Icon = isCritical ? AlertCircle : AlertTriangle;
    const title = isCritical ? 'Critical Compliance Issues Detected' : 'Compliance Warning';

    return (
        <Alert variant={variant} className="mb-6 relative animate-slide-up border-l-4 shadow-md">
            <Icon className="h-5 w-5" />
            <AlertTitle className="ml-2 text-base font-semibold">{title}</AlertTitle>
            <AlertDescription className="ml-2 mt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {atRiskAssets > 0 && (
                            <li>
                                <span className="font-medium">{atRiskAssets} assets</span> marked as lost or damaged
                            </li>
                        )}
                        {overdueAttestations > 0 && (
                            <li>
                                <span className="font-medium">{overdueAttestations} attestations</span> are overdue
                            </li>
                        )}
                        {score < 60 && (
                            <li>
                                Overall compliance score is critical (<span className="font-bold">{score}%</span>)
                            </li>
                        )}
                        {score >= 60 && score < 80 && (
                            <li>
                                Compliance score needs improvement (<span className="font-bold">{score}%</span>)
                            </li>
                        )}
                    </ul>

                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <Button
                            size="sm"
                            variant={isCritical ? "outline" : "secondary"}
                            className="gap-2 bg-background/50 hover:bg-background/80 border-current"
                            onClick={onViewDetails}
                        >
                            View Details <ArrowRight className="h-4 w-4" />
                        </Button>
                        {onDismiss && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 -mr-2 text-current hover:bg-black/10 transition-colors"
                                onClick={onDismiss}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </AlertDescription>
        </Alert>
    );
};

export default ComplianceAlertBanner;
