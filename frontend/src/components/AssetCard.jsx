import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Edit, Trash2, ChevronDown, ChevronUp, Loader2, Laptop, User, Calendar, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatEmployeeName } from '@/utils/user';
import { ASSET_STATUS_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Modern Semantic Status Variants
 */
const statusVariants = {
  active: 'bg-success/15 text-success border-success/20',
  returned: 'bg-muted/20 text-muted-foreground border-transparent',
  lost: 'bg-destructive/15 text-destructive border-destructive/20',
  damaged: 'bg-warning/15 text-warning border-warning/20',
  retired: 'bg-secondary/30 text-secondary-foreground border-transparent'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const AssetCard = memo(function AssetCard({
  asset,
  isSelected,
  canEdit,
  canDelete,
  onToggleSelect,
  onEdit,
  onDelete,
  onStatusUpdated,
}) {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(asset.status || 'active');
  const [returnedDate, setReturnedDate] = useState(asset.returned_date || '');
  const [saving, setSaving] = useState(false);

  const statusKey = (asset.status || '').toLowerCase();
  const employeeName = formatEmployeeName(asset, 'N/A');

  const handleStatusChange = async () => {
    if (pendingStatus === 'returned' && !returnedDate) {
      toast({
        title: "Validation Error",
        description: "Returned date is required when status is 'Returned'",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...asset,
        status: pendingStatus,
        returned_date: pendingStatus === 'returned' ? returnedDate : null,
      };

      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text() || 'Save failed');

      const updated = await res.json();
      toast({ title: "Success", description: "Asset status updated", variant: "success" });
      setStatusPopoverOpen(false);
      if (onStatusUpdated) onStatusUpdated(updated.asset || updated);
    } catch (err) {
      toast({ title: "Error", description: err.message || 'Update failed', variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'glass-panel p-5 rounded-xl border-glass transition-all duration-base animate-fade-in',
        isSelected && 'bg-primary/
