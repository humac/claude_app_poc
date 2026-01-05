import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuditLogs from './AuditLogs';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, variant }) => (
        <button onClick={onClick} data-variant={variant}>{children}</button>
    ),
}));
vi.mock('@/components/ui/input', () => ({
    Input: (props) => <input {...props} />,
}));
vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className, variant }) => (
        <span data-testid="badge" className={className} data-variant={variant}>{children}</span>
    ),
}));
vi.mock('@/components/ui/select', () => ({
    Select: ({ children, value, onValueChange }) => (
        <div data-testid="select" data-value={value} onClick={() => onValueChange && onValueChange('new-value')}>
            {children}
        </div>
    ),
    SelectTrigger: ({ children }) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }) => <div>{children}</div>,
    SelectItem: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/table', () => ({
    Table: ({ children }) => <table>{children}</table>,
    TableHeader: ({ children }) => <thead>{children}</thead>,
    TableBody: ({ children }) => <tbody>{children}</tbody>,
    TableRow: ({ children }) => <tr>{children}</tr>,
    TableHead: ({ children }) => <th>{children}</th>,
    TableCell: ({ children }) => <td>{children}</td>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    FileText: () => <div data-testid="icon-file-text" />,
    Filter: () => <div data-testid="icon-filter" />,
    Download: () => <div data-testid="icon-download" />,
    Loader2: () => <div data-testid="icon-loader" />,
    X: () => <div data-testid="icon-x" />,
    Users: () => <div data-testid="icon-users" />,
    Database: () => <div data-testid="icon-database" />,
}));

// Mock TablePaginationControls
vi.mock('@/components/TablePaginationControls', () => ({
    default: () => <div data-testid="pagination-controls">Pagination</div>,
}));

// Mock EmptyState
vi.mock('@/components/ui/empty-state', () => ({
    default: ({ title, description, action }) => (
        <div data-testid="empty-state">
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    ),
}));

describe('AuditLogs', () => {
    const defaultProps = {
        loading: false,
        logs: [
            {
                id: 1,
                action: 'CREATE',
                entity_type: 'asset',
                entity_name: 'MacBook Pro',
                details: 'Created new asset',
                timestamp: '2023-01-01T12:00:00Z',
                user_email: 'admin@example.com'
            }
        ],
        filters: { action: '', entityType: '', startDate: '', endDate: '', userEmail: '', limit: '100' },
        setFilters: vi.fn(),
        fetchLogs: vi.fn(),
        clearFilters: vi.fn(),
        handleExport: vi.fn(),
        logsPage: 1,
        setLogsPage: vi.fn(),
        logsPageSize: 10,
        setLogsPageSize: vi.fn()
    };

    it('renders logs table when logs are present', () => {
        render(<AuditLogs {...defaultProps} />);

        // Elements appear twice (Mobile view and Desktop view)
        expect(screen.getAllByText('MacBook Pro')).toHaveLength(2);
        expect(screen.getAllByText('CREATE').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('admin@example.com').length).toBeGreaterThanOrEqual(2);
    });

    it('renders EmptyState when logs are empty', () => {
        render(<AuditLogs {...defaultProps} logs={[]} />);

        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No Audit Logs Found')).toBeInTheDocument();
    });

    it('shows loading spinner when loading is true', () => {
        render(<AuditLogs {...defaultProps} loading={true} />);

        expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    });

    it('applies correct badge styles for CREATE action', () => {
        render(<AuditLogs {...defaultProps} />);

        const badge = screen.getAllByTestId('badge')[0];
        expect(badge).toHaveClass('bg-green-500/10');
        expect(badge).toHaveClass('text-green-700');
    });

    it('renders Clear Filters button in EmptyState', () => {
        render(<AuditLogs {...defaultProps} logs={[]} />);

        const clearButton = screen.getByText('Clear Filters');
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(defaultProps.clearFilters).toHaveBeenCalled();
    });
});
