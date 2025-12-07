import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ASSET_STATUSES } from '@/constants/assetStatus';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AssetEditModal({ asset, currentUser, onClose, onSaved }) {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  
  // Only these 4 fields are editable
  const [form, setForm] = useState({ 
    status: asset.status || 'active',
    manager_name: asset.manager_name || '',
    manager_email: asset.manager_email || '',
    notes: asset.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState('');

  function onChange(e) {
    const { name, value } = e.target;
    
    // Apply character limits
    let finalValue = value;
    if (name === 'manager_name' && value.length > 100) {
      finalValue = value.slice(0, 100);
    } else if (name === 'notes' && value.length > 1000) {
      finalValue = value.slice(0, 1000);
    }
    
    setForm(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear email error when user types
    if (name === 'manager_email') {
      setEmailError('');
    }
  }

  function validateEmail() {
    if (form.manager_email && !EMAIL_REGEX.test(form.manager_email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }

  async function save() {
    // Validate email before saving
    if (!validateEmail()) {
      return;
    }

    setSaving(true);
    try {
      // Only send the 4 editable fields
      const payload = {
        status: form.status,
        manager_name: form.manager_name,
        manager_email: form.manager_email,
        notes: form.notes,
      };

      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Save failed');
      }
      const updated = await res.json();
      toast({
        title: "Success",
        description: "Asset updated successfully",
        variant: "success",
      });
      // The API returns { message, asset }, extract the asset
      onSaved(updated.asset || updated);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || 'Unable to save asset.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-[520px]" aria-describedby="edit-asset-description">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription id="edit-asset-description">
            Update manager information and status for this asset.
          </DialogDescription>
        </DialogHeader>

        {/* Read-only summary section */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="font-medium text-muted-foreground">Asset Tag:</span>
              <span className="ml-2 text-foreground">{asset.laptop_asset_tag || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Type:</span>
              <span className="ml-2 text-foreground">{asset.laptop_make && asset.laptop_model ? `${asset.laptop_make} ${asset.laptop_model}` : 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Location:</span>
              <span className="ml-2 text-foreground">{asset.company_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Purchased:</span>
              <span className="ml-2 text-foreground">{formatDate(asset.registration_date)}</span>
            </div>
            {asset.laptop_serial_number && (
              <div className="col-span-2">
                <span className="font-medium text-muted-foreground">Serial:</span>
                <span className="ml-2 text-foreground">{asset.laptop_serial_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Editable fields section */}
        <div className="space-y-4 py-2">
          {/* Status - Editable */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select 
              value={form.status} 
              onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="status" aria-label="Asset Status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manager Name - Editable */}
          <div className="space-y-2">
            <Label htmlFor="manager_name">Manager Name</Label>
            <Input 
              id="manager_name" 
              name="manager_name" 
              value={form.manager_name} 
              onChange={onChange}
              maxLength={100}
              placeholder="Enter manager name"
            />
            <p className="text-xs text-muted-foreground">
              {form.manager_name.length}/100 characters
            </p>
          </div>

          {/* Manager Email - Editable with validation */}
          <div className="space-y-2">
            <Label htmlFor="manager_email">Manager Email</Label>
            <Input 
              id="manager_email" 
              name="manager_email" 
              type="email"
              value={form.manager_email} 
              onChange={onChange}
              onBlur={validateEmail}
              placeholder="manager@example.com"
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {emailError}
              </p>
            )}
          </div>

          {/* Notes - Editable */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={form.notes} 
              onChange={onChange}
              rows={3}
              maxLength={1000}
              placeholder="Add any additional notes..."
            />
            <p className="text-xs text-muted-foreground">
              {form.notes.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving || !!emailError}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
