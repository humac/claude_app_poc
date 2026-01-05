import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Filter } from 'lucide-react';
import { ActivityAreaChart } from '@/components/charts';

const AuditStats = ({
    loading,
    statsEnhanced,
    statsPeriod,
    setStatsPeriod,
    fetchStatsEnhanced,
    onActionClick
}) => {
    const getActionColor = (action) => ({ CREATE: 'default', STATUS_CHANGE: 'secondary', UPDATE: 'outline', DELETE: 'destructive' }[action] || 'secondary');

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Button
                    variant={statsPeriod === 7 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatsPeriod(7); }}
                >
                    7 Days
                </Button>
                <Button
                    variant={statsPeriod === 30 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatsPeriod(30); }}
                >
                    30 Days
                </Button>
                <Button
                    variant={statsPeriod === 90 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatsPeriod(90); }}
                >
                    90 Days
                </Button>
                <Button onClick={fetchStatsEnhanced}>
                    <Filter className="h-4 w-4 mr-2" />Apply
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
            ) : statsEnhanced ? (
                <div className="space-y-6">
                    <ActivityAreaChart
                        data={statsEnhanced.activityByDay}
                        title="Activity Over Time"
                        onActionClick={onActionClick}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle className="text-base">Action Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {statsEnhanced.actionBreakdown && statsEnhanced.actionBreakdown.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Action</TableHead>
                                                <TableHead className="text-right">Count</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {statsEnhanced.actionBreakdown.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <Badge variant={getActionColor(item.action)}>{item.action}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">{item.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">No data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle className="text-base">Top Active Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {statsEnhanced.topUsers && statsEnhanced.topUsers.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {statsEnhanced.topUsers.map((user, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{user.email}</TableCell>
                                                    <TableCell className="text-right">{user.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">No data</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AuditStats;
