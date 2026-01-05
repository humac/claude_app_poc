import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BarChart3, TrendingUp, Shield, Activity, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sub-components
import AuditSummary from '@/components/audit/AuditSummary';
import AuditLogs from '@/components/audit/AuditLogs';
import AuditStats from '@/components/audit/AuditStats';
import AuditCompliance from '@/components/audit/AuditCompliance';
import AuditTrends from '@/components/audit/AuditTrends';
import ComplianceAlertBanner from '@/components/widgets/ComplianceAlertBanner';

const AuditReportingNew = () => {
  const { getAuthHeaders, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL
  const [activeView, setActiveView] = useState(searchParams.get('tab') || 'summary');

  const [logs, setLogs] = useState([]);
  const [summaryEnhanced, setSummaryEnhanced] = useState(null);
  const [statsEnhanced, setStatsEnhanced] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Data State
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(10);
  const [statsPeriod, setStatsPeriod] = useState(30);
  const [trendsPeriod, setTrendsPeriod] = useState(30);
  const [filters, setFilters] = useState({
    action: searchParams.get('action') || '',
    entityType: searchParams.get('entityType') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    userEmail: searchParams.get('userEmail') || '',
    limit: searchParams.get('limit') || '100'
  });

  // Check if user can access advanced reports (admin, manager, and coordinator)
  const canAccessReports = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'coordinator');

  // Track previous period values to avoid duplicate fetches
  const prevStatsPeriod = useRef(statsPeriod);
  const prevTrendsPeriod = useRef(trendsPeriod);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeView) params.set('tab', activeView);

    // Only sync filters if we are in logs view to avoid clutter, or always? 
    // Plan says "Sync activeView and filters".
    if (activeView === 'logs') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.set(key, value);
        else params.delete(key);
      });
    }

    setSearchParams(params, { replace: true });
  }, [activeView, filters]);

  // Auto-refresh interval
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        if (activeView === 'logs') fetchLogs();
        else if (activeView === 'summary') fetchSummaryEnhanced();
        else if (activeView === 'stats') fetchStatsEnhanced();
        else if (activeView === 'compliance') fetchCompliance();
        else if (activeView === 'trends') fetchTrends();
      }, 60000); // 60s
    }
    return () => clearInterval(interval);
  }, [autoRefresh, activeView, filters, statsPeriod, trendsPeriod]);

  // Initial fetch for compliance banner
  useEffect(() => {
    if (canAccessReports) {
      fetchCompliance();
    }
  }, [canAccessReports]);

  // Fetch data when active view changes
  useEffect(() => {
    if (activeView === 'logs') fetchLogs();
    else if (activeView === 'summary') { fetchSummaryEnhanced(); }
    else if (activeView === 'stats') { fetchStatsEnhanced(); }
    else if (activeView === 'compliance') {
      // Already fetched on mount, but refresh if it's null or stale? 
      // For simplicity, we can refetch or just rely on the initial fetch. 
      // Let's refetch to be safe if it's not present.
      if (!compliance) fetchCompliance();
    }
    else if (activeView === 'trends') fetchTrends();
  }, [activeView]);

  // Auto-fetch stats when period changes (Issue 2 fix)
  useEffect(() => {
    // Only fetch if period actually changed (not on mount or tab switch)
    if (activeView === 'stats' && prevStatsPeriod.current !== statsPeriod) {
      fetchStatsEnhanced();
    }
    prevStatsPeriod.current = statsPeriod;
  }, [statsPeriod, activeView]);

  // Auto-fetch trends when period changes (Issue 3 fix)
  useEffect(() => {
    // Only fetch if period actually changed (not on mount or tab switch)
    if (activeView === 'trends' && prevTrendsPeriod.current !== trendsPeriod) {
      fetchTrends();
    }
    prevTrendsPeriod.current = trendsPeriod;
  }, [trendsPeriod, activeView]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.append(k, v);
      });
      const response = await fetch(`/api/audit/logs?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      setLogs(await response.json());
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const fetchSummaryEnhanced = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports/summary-enhanced', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch enhanced summary');
      setSummaryEnhanced(await response.json());
    } catch (err) {
      console.error('Error fetching enhanced summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsEnhanced = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: statsPeriod.toString() });
      const response = await fetch(`/api/reports/statistics-enhanced?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch enhanced statistics');
      setStatsEnhanced(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async () => {
    // Don't set global loading here if we are just fetching for banner in background,
    // but if activeView IS compliance, we should. 
    // For simplicity, let's just set loading if activeView is compliance.
    if (activeView === 'compliance') setLoading(true);

    try {
      const response = await fetch('/api/reports/compliance', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch compliance data');
      setCompliance(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (activeView === 'compliance') setLoading(false);
    }
  };

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: trendsPeriod.toString() });
      const response = await fetch(`/api/reports/trends?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch trends');
      setTrends(await response.json());
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && k !== 'limit' && params.append(k, v));
      const response = await fetch(`/api/audit/export?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };


  const clearFilters = () => setFilters({ action: '', entityType: '', startDate: '', endDate: '', userEmail: '', limit: '100' });

  // Reset log page when filters change (implicitly via logs change)
  useEffect(() => {
    setLogsPage(1);
  }, [logsPageSize, logs.length]);

  const handleActionClick = (action) => {
    setFilters(prev => ({ ...prev, action }));
    setActiveView('logs');
  };

  return (
    <div className="space-y-6 p-1 md:p-2 animate-fade-in bg-surface/30 min-h-screen rounded-2xl">
      <Card className="glass-panel rounded-2xl">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-gradient text-lg sm:text-xl">Audit & Reporting</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`gap-2 ${autoRefresh ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground'}`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 hidden md:flex">
                <Printer className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {canAccessReports && showBanner && (
            <ComplianceAlertBanner
              compliance={compliance}
              onDismiss={() => setShowBanner(false)}
              onViewDetails={() => setActiveView('compliance')}
            />
          )}

          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="mb-6 w-full overflow-x-auto flex-nowrap justify-start">
              <TabsTrigger value="summary" className="gap-2"><BarChart3 className="h-4 w-4" />Summary</TabsTrigger>
              {canAccessReports && <TabsTrigger value="compliance" className="gap-2"><Shield className="h-4 w-4" />Compliance</TabsTrigger>}
              <TabsTrigger value="logs" className="gap-2"><FileText className="h-4 w-4" />Audit Logs</TabsTrigger>
              {canAccessReports && <TabsTrigger value="trends" className="gap-2"><TrendingUp className="h-4 w-4" />Trends</TabsTrigger>}
              {canAccessReports && <TabsTrigger value="stats" className="gap-2"><Activity className="h-4 w-4" />Statistics</TabsTrigger>}
            </TabsList>

            {error && <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

            <TabsContent value="summary" className="space-y-6">
              <AuditSummary
                loading={loading}
                summaryEnhanced={summaryEnhanced}
              />
            </TabsContent>

            {canAccessReports && (
              <TabsContent value="compliance" className="space-y-6">
                <AuditCompliance
                  loading={loading}
                  compliance={compliance}
                />
              </TabsContent>
            )}

            <TabsContent value="logs" className="space-y-4">
              <AuditLogs
                loading={loading}
                logs={logs}
                filters={filters}
                setFilters={setFilters}
                fetchLogs={fetchLogs}
                clearFilters={clearFilters}
                handleExport={handleExport}
                logsPage={logsPage}
                setLogsPage={setLogsPage}
                logsPageSize={logsPageSize}
                setLogsPageSize={setLogsPageSize}
              />
            </TabsContent>


            {canAccessReports && (
              <TabsContent value="trends" className="space-y-6">
                <AuditTrends
                  loading={loading}
                  trends={trends}
                  trendsPeriod={trendsPeriod}
                  setTrendsPeriod={setTrendsPeriod}
                  fetchTrends={fetchTrends}
                />
              </TabsContent>
            )}

            {canAccessReports && (
              <TabsContent value="stats" className="space-y-4">
                <AuditStats
                  loading={loading}
                  statsEnhanced={statsEnhanced}
                  statsPeriod={statsPeriod}
                  setStatsPeriod={setStatsPeriod}
                  fetchStatsEnhanced={fetchStatsEnhanced}
                  onActionClick={handleActionClick}
                />
              </TabsContent>
            )}

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditReportingNew;
