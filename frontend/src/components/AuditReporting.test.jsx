import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuditReportingNew from './AuditReporting';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth hook
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
let mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      getAuthHeaders: mockGetAuthHeaders,
      user: mockUser,
    }),
  };
});

// Mock chart components
vi.mock('@/components/charts', () => ({
  AssetStatusPieChart: () => <div data-testid="asset-status-pie-chart">AssetStatusPieChart</div>,
  CompanyBarChart: () => <div data-testid="company-bar-chart">CompanyBarChart</div>,
  ActivityAreaChart: ({ onActionClick }) => (
    <div
      data-testid="activity-area-chart"
      onClick={() => onActionClick && onActionClick('CREATE')}
    >
      ActivityAreaChart
    </div>
  ),
  TrendLineChart: () => <div data-testid="trend-line-chart">TrendLineChart</div>,
  ManagerBarChart: () => <div data-testid="manager-bar-chart">ManagerBarChart</div>,
}));

// Mock widget components
vi.mock('@/components/widgets', () => ({
  KPICard: ({ title, value }) => <div data-testid={`kpi-${title}`}>{value}</div>,
  RiskIndicatorList: () => <div data-testid="risk-indicator-list">RiskIndicatorList</div>,
  ComplianceChecklist: () => <div data-testid="compliance-checklist">ComplianceChecklist</div>,
  MetricsComparison: () => <div data-testid="metrics-comparison">MetricsComparison</div>,
}));

// Mock TablePaginationControls
vi.mock('@/components/TablePaginationControls', () => ({
  default: () => <div data-testid="table-pagination">Pagination</div>,
}));

describe('AuditReporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Data Fetch - Issue 1', () => {
    it('should fetch summary data on initial mount', async () => {
      const mockSummaryEnhanced = {
        total: 100,
        totalChange: 5,
        byStatus: { active: 80, returned: 15, lost: 3, damaged: 2 },
        byCompany: [],
        byManager: [],
        byType: {},
        complianceScore: 85,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }), // compliance
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummaryEnhanced, // summary-enhanced
      });

      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      // Wait for the fetch calls to be made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports/compliance',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
          })
        );
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports/summary-enhanced',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token' })
          })
        );
      });

      // Verify data is displayed
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should display summary tab content by default', async () => {
      const mockSummaryEnhanced = {
        total: 100,
        totalChange: 5,
        byStatus: { active: 80, returned: 15, lost: 3, damaged: 2 },
        byCompany: [],
        byManager: [],
        byType: {},
        complianceScore: 85,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummaryEnhanced,
      });

      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      // Check that Summary tab is active
      const summaryTab = screen.getByRole('tab', { name: /summary/i });
      expect(summaryTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Period Auto-fetch - Issue 2 & 3', () => {
    it('should auto-fetch stats when period changes from 30 to 7 days', async () => {
      const mockStatsEnhanced = {
        activityByDay: [],
        actionBreakdown: [],
        topUsers: [],
      };

      // Initial load - summary
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      const user = userEvent.setup();
      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      // Clear previous fetch calls
      global.fetch.mockClear();

      // Switch to Statistics tab
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsEnhanced,
      });

      const statsTab = screen.getByRole('tab', { name: /statistics/i });
      await user.click(statsTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/statistics-enhanced?period=30'),
          expect.any(Object)
        );
      });

      global.fetch.mockClear();

      // Click on 7 Days button
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsEnhanced,
      });

      const sevenDaysButton = screen.getByRole('button', { name: '7 Days' });
      await user.click(sevenDaysButton);

      // Verify fetch is called with new period
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/statistics-enhanced?period=7'),
          expect.any(Object)
        );
      });
    });

    it('should auto-fetch trends when period changes from 30 to 90 days', async () => {
      const mockTrends = {
        assetGrowth: [],
        statusChanges: [],
        metricsComparison: null,
      };

      // Initial load - summary
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      const user = userEvent.setup();
      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      global.fetch.mockClear();

      // Switch to Trends tab
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const trendsTab = screen.getByRole('tab', { name: /trends/i });
      await user.click(trendsTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/trends?period=30'),
          expect.any(Object)
        );
      });

      global.fetch.mockClear();

      // Click on 90 Days button
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends,
      });

      const ninetyDaysButton = screen.getByRole('button', { name: '90 Days' });
      await user.click(ninetyDaysButton);

      // Verify fetch is called with new period
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/reports/trends?period=90'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Role-Based Tab Visibility', () => {
    beforeEach(() => {
      // Reset mock user to admin before each test
      mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };
    });

    it('should show all tabs for admin users', async () => {
      mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /trends/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
    });

    it('should show all tabs for manager users', async () => {
      mockUser = { id: 2, email: 'manager@test.com', role: 'manager' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /trends/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();
    });

    it('should hide Statistics, Compliance, and Trends tabs for employee users', async () => {
      mockUser = { id: 3, email: 'employee@test.com', role: 'employee' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      // Should show Summary and Audit Logs
      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();

      // Should NOT show Statistics, Compliance, or Trends
      expect(screen.queryByRole('tab', { name: /statistics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /compliance/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /trends/i })).not.toBeInTheDocument();
    });

    it('should hide all tabs when user is null', async () => {
      mockUser = null;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 100 }),
      });

      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      // Should show Summary and Audit Logs (accessible to authenticated users)
      expect(screen.getByRole('tab', { name: /summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /audit logs/i })).toBeInTheDocument();

      // Should NOT show restricted tabs
      expect(screen.queryByRole('tab', { name: /statistics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /compliance/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /trends/i })).not.toBeInTheDocument();
    });
  });

  describe('Chart Interactivity', () => {
    it('should switch to logs tab and apply filter when chart action is clicked', async () => {
      // Reset mock user to ensure tabs are visible
      mockUser = { id: 1, email: 'admin@test.com', role: 'admin' };

      // Setup mock data
      const mockSummaryEnhanced = {
        total: 100,
        totalChange: 5,
        byStatus: { active: 80, returned: 15, lost: 3, damaged: 2 },
        byCompany: [],
        byManager: [],
        byType: {},
        complianceScore: 85,
      };

      const mockStatsEnhanced = {
        activityByDay: [],
        actionBreakdown: [],
        topUsers: [],
      };

      // Initial load
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ score: 95 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummaryEnhanced,
      });

      const user = userEvent.setup();
      render(<MemoryRouter><AuditReportingNew /></MemoryRouter>);

      // Navigate to statistics tab
      global.fetch.mockClear();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsEnhanced,
      });

      const statsTab = screen.getByRole('tab', { name: /statistics/i });
      await user.click(statsTab);

      // Wait for chart to appear
      const chart = await screen.findByTestId('activity-area-chart');

      // Setup fetch mock for logs
      global.fetch.mockClear();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0 }),
      });

      // Click the chart (triggers onActionClick('CREATE') as mocked)
      await user.click(chart);

      // Verify fetchLogs called with CREATE filter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('action=CREATE'),
          expect.any(Object)
        );
      });

      // Verify Logs tab is active
      const logsTab = screen.getByRole('tab', { name: /audit logs/i });
      expect(logsTab).toHaveAttribute('data-state', 'active');
    });
  });
});
