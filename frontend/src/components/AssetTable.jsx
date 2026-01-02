import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import TablePaginationControls from '@/components/TablePaginationControls';
import AssetTableRow from '@/components/AssetTableRow';
import AssetCard from '@/components/AssetCard';
import AssetTableFilters from '@/components/AssetTableFilters';
import BulkAssetActions from '@/components/BulkAssetActions';
import { Laptop, SearchX, Loader2 } from 'lucide-react';

export default function AssetTable({ assets = [], onEdit, onDelete, currentUser, onRefresh, onAssetAdded }) {
  const { getAuthHeaders } = useAuth();
  const { getFullName, getEmail } = useUsers();
  const { toast } = useToast();
  
  // State management
  const [deleteDialog, setDeleteDialog] = useState({ open: false, asset: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [companies, setCompanies] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch filters on mount
  useEffect(() => {
    async function fetchData() {
      setIsInitialLoading(true);
      try {
        const [compRes, typeRes] = await Promise.all([
          fetch('/api/companies/names', { headers: { ...getAuthHeaders() } }),
          fetch('/api/asset-types', { headers: { ...getAuthHeaders() } })
        ]);
        if (compRes.ok) setCompanies(await compRes.json());
        if (typeRes.ok) setAssetTypes(await typeRes.json());
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    fetchData();
  }, [getAuthHeaders]);

  // Handle deletion
  async function handleDeleteConfirm() {
    const asset = deleteDialog.asset;
    setDeleteDialog({ open: false, asset: null });
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { 
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: "Success", description: "Asset deleted successfully", variant: "success" });
      onDelete(asset.id);
    } catch (err) {
      toast({ title: "Error", description: 'Unable to delete asset.', variant: "destructive" });
    }
  }

  // Permissions & Data Mapping
  const canEdit = (asset) => currentUser?.role === 'admin' || (currentUser?.email?.toLowerCase() === asset.employee_email?.toLowerCase());
  const canDelete = (asset) => currentUser?.role === 'admin';

  const assetsWithManagerData = useMemo(() => assets.map(asset => ({
    ...asset,
    _managerDisplayName: asset.manager_first_name ? `${asset.manager_first_name} ${asset.manager_last_name}` : getFullName(asset.manager_id),
    _managerEmail: asset.manager_email || getEmail(asset.manager_id)
  })), [assets, getFullName, getEmail]);

  // Filtering Logic
  const filteredAssets = useMemo(() => {
    return assetsWithManagerData.filter(asset => {
      const matchesSearch = !searchTerm || [
        asset.employee_first_name, asset.employee_last_name, asset.employee_email,
        asset.serial_number, asset.asset_tag, asset.company_name, asset.make, asset.model
      ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch &&
        (statusFilter === 'all' || asset.status === statusFilter) &&
        (companyFilter === 'all' || asset.company_name === companyFilter) &&
        (assetTypeFilter === 'all' || asset.asset_type === assetTypeFilter);
    });
  }, [assetsWithManagerData, searchTerm, statusFilter, companyFilter, assetTypeFilter]);

  // Pagination
  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page, pageSize]);

  // Selection Logic
  const toggleSelectAll = () => {
    const pageIds = paginatedAssets.map(a => a.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-full glass-panel shimmer rounded-lg" />
        <div className="h-64 w-full glass-panel shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filters Section */}
      <section className="glass-panel p-4 rounded-xl border-glass">
        <AssetTableFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          assetTypeFilter={assetTypeFilter} setAssetTypeFilter={setAssetTypeFilter}
          companyFilter={companyFilter} setCompanyFilter={setCompanyFilter}
          companies={companies} assetTypes={assetTypes}
          onClearFilters={() => {setSearchTerm(''); setStatusFilter('all'); setCompanyFilter('all');}}
        />
      </section>

      {/* Bulk Actions Shell */}
      <BulkAssetActions
        selectedIds={selectedIds}
        filteredAssets={filteredAssets}
        onClearSelection={() => setSelectedIds(new Set())}
        onRefresh={onRefresh}
        currentUser={currentUser}
      />

      {/* Main Table Container */}
      <div className="glass-panel overflow-hidden rounded-bento border-glass shadow-2xl">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-surface/20">
            <SearchX className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No assets found matching your criteria</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden space-y-4 p-4 bg-surface/10">
              {paginatedAssets.map(asset => (
                <AssetCard key={asset.id} asset={asset} isSelected={selectedIds.has(asset.id)} />
              ))}
            </div>

            {/* Desktop Modern Table */}
            <Table className="hidden md:table">
              <TableHeader className="bg-muted/30 border-b border-white/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 px-6">
                    <Checkbox 
                      checked={paginatedAssets.length > 0 && paginatedAssets.every(a => selectedIds.has(a.id))}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold tracking-wider text-xs uppercase opacity-70">Employee / Asset</TableHead>
                  <TableHead className="font-bold tracking-wider text-xs uppercase opacity-70">Configuration</TableHead>
                  <TableHead className="font-bold tracking-wider text-xs uppercase opacity-70">Identity</TableHead>
                  <TableHead className="font-bold tracking-wider text-xs uppercase opacity-70">Status</TableHead>
                  <TableHead className="text-right pr-8 font-bold tracking-wider text-xs uppercase opacity-70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset, index) => (
                  <TableRow 
                    key={asset.id} 
                    className={cn(
                      "group border-b border-white/5 transition-colors hover:bg-white/[0.02]",
                      "animate-slide-up"
                    )}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                  >
                    <TableCell className="px-6">
                      <Checkbox 
                        checked={selectedIds.has(asset.id)}
                        onCheckedChange={() => {
                          const next = new Set(selectedIds);
                          next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id);
                          setSelectedIds(next);
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Laptop size={18} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground leading-none mb-1">
                            {asset.employee_first_name} {asset.employee_last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{asset.employee_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{asset.make} {asset.model}</div>
                      <div className="text-xs text-muted-foreground italic">{asset.asset_type}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted/50 px-2 py-1 rounded text-primary/80">
                        {asset.serial_number || 'NO-SERIAL'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                        asset.status === 'Active' ? "bg-success/15 text-success border-success/20" : 
                        asset.status === 'Maintenance' ? "bg-warning/15 text-warning border-warning/20" : 
                        "bg-muted/20 text-muted-foreground"
                      )}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button variant="ghost" size="sm" onClick={() => onEdit(asset)} className="hover:bg-primary/10 hover:text-primary">
                         Edit
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      <TablePaginationControls
        className="glass-panel p-2 rounded-xl border-glass bg-surface/50"
        page={page} pageSize={pageSize} totalItems={filteredAssets.length}
        onPageChange={setPage} onPageSizeChange={setPageSize}
      />

      {/* Delete Dialog Refactored for Glassmorphism */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, asset: null })}>
        <DialogContent className="glass-panel border-glass">
          <DialogHeader>
            <DialogTitle className="text-gradient text-2xl">Confirm Permanent Deletion</DialogTitle>
            <DialogDescription className="pt-2">
              You are about to remove <span className="font-bold text-foreground">"{deleteDialog.asset?.employee_first_name} {deleteDialog.asset?.employee_last_name}"'s</span> asset from the secure registry. This cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, asset: null })}>Cancel</Button>
            <Button variant="destructive" className="shadow-glow-destructive" onClick={handleDeleteConfirm}>Delete Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
