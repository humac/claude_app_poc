import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, Filter, Download, Loader2, X, Users, Database } from 'lucide-react';
import TablePaginationControls from '@/components/TablePaginationControls';
import EmptyState from '@/components/ui/empty-state';

const AuditLogs = ({
    loading,
    logs,
    filters,
    setFilters,
    fetchLogs,
    clearFilters,
    handleExport,
    logsPage,
    setLogsPage,
    logsPageSize,
    setLogsPageSize
}) => {
    const formatDate = (d) => new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const getActionStyles = (action) => {
        switch (action) {
            case 'CREATE':
                return { variant: 'outline', className: 'border-green-500/20 bg-green-500/10 text-green-700 shadow-[0_0_10px_rgba(34,197,94,0.1)] dark:text-green-400 dark:border-green-500/30' };
            case 'UPDATE':
                return { variant: 'outline', className: 'border-blue-500/20 bg-blue-500/10 text-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.1)] dark:text-blue-400 dark:border-blue-500/30' };
            case 'STATUS_CHANGE':
                return { variant: 'outline', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.1)] dark:text-amber-400 dark:border-amber-500/30' };
            case 'DELETE':
                return { variant: 'destructive', className: 'shadow-sm' };
            default:
                return { variant: 'outline', className: '' };
        }
    };

    const paginatedLogs = useMemo(() => {
        if (!Array.isArray(logs)) {
            console.error('AuditLogs received invalid logs:', logs);
            return [];
        }
        const start = (logsPage - 1) * logsPageSize;
        return logs.slice(start, start + logsPageSize);
    }, [logs, logsPage, logsPageSize]);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-6">
                <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
                    <SelectTrigger aria-label="Filter by Action"><SelectValue placeholder="Action" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.entityType} onValueChange={(v) => setFilters({ ...filters, entityType: v })}>
                    <SelectTrigger aria-label="Filter by Entity Type"><SelectValue placeholder="Entity Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                </Select>
                <Input type="date" aria-label="Start Date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} placeholder="Start Date" />
                <Input type="date" aria-label="End Date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} placeholder="End Date" />
                <Input type="email" aria-label="User Email" value={filters.userEmail} onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })} placeholder="User Email" />
                <Select value={filters.limit} onValueChange={(v) => setFilters({ ...filters, limit: v })}>
                    <SelectTrigger aria-label="Limit Records"><SelectValue placeholder="Limit" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="50">50 records</SelectItem>
                        <SelectItem value="100">100 records</SelectItem>
                        <SelectItem value="250">250 records</SelectItem>
                        <SelectItem value="all">All records</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
                <Button onClick={fetchLogs}><Filter className="h-4 w-4 mr-2" />Apply Filters</Button>
                <Button variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Clear</Button>
                <Button variant="outline" onClick={handleExport} className="ml-auto"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Loading...</span></div>
            ) : logs.length === 0 ? (
                <EmptyState
                    icon={Database}
                    title="No Audit Logs Found"
                    description="No records match your selected filters. Try adjusting dates or clearing filters."
                    action={<Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
                />
            ) : (
                <div className="space-y-4">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {paginatedLogs.map((log) => (
                            <div key={log.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge {...getActionStyles(log.action)}>{log.action}</Badge>
                                            <span className="text-xs text-muted-foreground capitalize">{log.entity_type}</span>
                                        </div>
                                        <h4 className="font-medium truncate">{log.entity_name || 'N/A'}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(log.timestamp)}</p>
                                    </div>
                                </div>

                                {log.details && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">Details</p>
                                        <p className="text-sm">{log.details}</p>
                                    </div>
                                )}

                                {log.user_email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        <span>{log.user_email}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="hidden lg:table-cell">Entity Type</TableHead>
                                    <TableHead>Entity Name</TableHead>
                                    <TableHead className="hidden xl:table-cell">Details</TableHead>
                                    <TableHead className="hidden lg:table-cell">User</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">{formatDate(log.timestamp)}</TableCell>
                                        <TableCell><Badge {...getActionStyles(log.action)}>{log.action}</Badge></TableCell>

                                        <TableCell className="hidden lg:table-cell capitalize">{log.entity_type}</TableCell>
                                        <TableCell>{log.entity_name || '-'}</TableCell>
                                        <TableCell className="hidden xl:table-cell max-w-xs truncate text-sm text-muted-foreground">{log.details}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{log.user_email || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <TablePaginationControls
                        className="mt-4"
                        page={logsPage}
                        pageSize={logsPageSize}
                        totalItems={logs.length}
                        onPageChange={setLogsPage}
                        onPageSizeChange={setLogsPageSize}
                    />
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
