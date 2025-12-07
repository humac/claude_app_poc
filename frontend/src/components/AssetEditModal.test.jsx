import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetEditModal from './AssetEditModal';

// Mock fetch
global.fetch = vi.fn();

// Mock useAuth hook
const mockGetAuthHeaders = vi.fn(() => ({ Authorization: 'Bearer test-token' }));
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      getAuthHeaders: mockGetAuthHeaders,
    }),
  };
});

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('AssetEditModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSaved = vi.fn();

  const sampleAsset = {
    id: 1,
    employee_name: 'John Doe',
    employee_email: 'john@example.com',
    manager_name: 'Jane Manager',
    manager_email: 'jane@example.com',
    company_name: 'Acme Corp',
    laptop_make: 'Dell',
    laptop_model: 'XPS 15',
    laptop_serial_number: 'SN12345',
    laptop_asset_tag: 'AT001',
    registration_date: '2024-01-15',
    status: 'active',
    notes: 'Test notes',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title and description', () => {
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Edit Asset')).toBeInTheDocument();
    expect(screen.getByText('Update manager information and status for this asset.')).toBeInTheDocument();
  });

  it('displays read-only summary section with asset information', () => {
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Check read-only fields are displayed
    expect(screen.getByText('Asset Tag:')).toBeInTheDocument();
    expect(screen.getByText('AT001')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Dell XPS 15')).toBeInTheDocument();
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Serial:')).toBeInTheDocument();
    expect(screen.getByText('SN12345')).toBeInTheDocument();
  });

  it('shows only editable fields: status, manager name, manager email, notes', () => {
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    // Editable fields should be present
    expect(screen.getByLabelText('Status *')).toBeInTheDocument();
    expect(screen.getByLabelText('Manager Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Manager Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();

    // Non-editable fields should NOT have input elements
    expect(screen.queryByLabelText('Employee Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Employee Email')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Serial Number')).not.toBeInTheDocument();
  });

  it('displays character count for manager name field', () => {
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('12/100 characters')).toBeInTheDocument(); // Jane Manager is 12 chars
  });

  it('displays character count for notes field', () => {
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('10/1000 characters')).toBeInTheDocument(); // Test notes is 10 chars
  });

  it('enforces 100 character limit on manager name', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const managerNameField = screen.getByLabelText('Manager Name');
    await user.clear(managerNameField);
    
    // Use paste to insert text at once
    const longText = 'A'.repeat(150);
    await user.click(managerNameField);
    await user.paste(longText);

    expect(managerNameField).toHaveValue('A'.repeat(100)); // Should be truncated to 100
  });

  it('enforces 1000 character limit on notes', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const notesField = screen.getByLabelText('Notes');
    await user.clear(notesField);
    
    // Use paste to insert text at once
    const longText = 'B'.repeat(1050);
    await user.click(notesField);
    await user.paste(longText);

    expect(notesField).toHaveValue('B'.repeat(1000)); // Should be truncated to 1000
  });

  it('validates email and shows error message for invalid email', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const emailField = screen.getByLabelText('Manager Email');
    await user.clear(emailField);
    await user.type(emailField, 'invalid-email');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('clears email error when user starts typing again', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const emailField = screen.getByLabelText('Manager Email');
    await user.clear(emailField);
    await user.type(emailField, 'invalid-email');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Start typing again
    await user.type(emailField, '@');
    
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });

  it('disables Save button when email is invalid', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const emailField = screen.getByLabelText('Manager Email');
    await user.clear(emailField);
    await user.type(emailField, 'invalid-email');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('sends only editable fields in save payload', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    const mockResponse = { asset: { ...sampleAsset, status: 'retired', notes: 'Updated notes' } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const notesField = screen.getByLabelText('Notes');
    await user.clear(notesField);
    await user.click(notesField);
    await user.paste('Updated notes');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/assets/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            status: 'active',
            manager_name: 'Jane Manager',
            manager_email: 'jane@example.com',
            notes: 'Updated notes',
          }),
        })
      );
      expect(mockOnSaved).toHaveBeenCalledWith(mockResponse.asset);
    });
  });

  it('updates form fields correctly', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const managerNameField = screen.getByLabelText('Manager Name');
    await user.clear(managerNameField);
    await user.type(managerNameField, 'New Manager');

    expect(managerNameField).toHaveValue('New Manager');
  });

  it('shows success toast on successful save', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    const mockResponse = { asset: { ...sampleAsset, notes: 'Updated' } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Success",
        description: "Asset updated successfully",
        variant: "success",
      });
    });
  });

  it('shows error toast on failed save', async () => {
    const user = userEvent.setup();
    const currentUser = { roles: ['admin'] };
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Server error',
    });

    render(
      <AssetEditModal
        asset={sampleAsset}
        currentUser={currentUser}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Server error",
        variant: "destructive",
      });
    });
  });
});
