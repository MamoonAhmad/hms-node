import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { InsuranceProviderFormDialog } from '@/components/insurance/InsuranceProviderFormDialog';
import { insuranceProviderApi } from '@/services/api';

const COLUMNS = [
  {
    key: 'id',
    label: 'Payer ID',
    cellClassName: 'font-mono text-xs',
    render: (row) => row.id,
  },
  { key: 'name', label: 'Payer Name', cellClassName: 'font-medium' },
  {
    key: 'status',
    label: 'Payer Status',
    render: (row) =>
      row.isActive ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          <Check className="h-3 w-3" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
          <X className="h-3 w-3" />
          Inactive
        </span>
      ),
  },
];

export function InsuranceProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [payerIdFilter, setPayerIdFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [debouncedPayerId, setDebouncedPayerId] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPayerId(payerIdFilter), 400);
    return () => clearTimeout(timer);
  }, [payerIdFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(nameFilter), 400);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState('create');

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        isActive: statusFilter === 'active',
      };
      if (debouncedPayerId.trim()) params.payerId = debouncedPayerId.trim();
      if (debouncedName.trim()) params.name = debouncedName.trim();

      const response = await insuranceProviderApi.getAll(params);
      setProviders(response.data);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedPayerId, debouncedName, statusFilter]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handlePageChange = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedProvider(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openProvider = async (provider, mode) => {
    try {
      const response = await insuranceProviderApi.getById(provider.id);
      setSelectedProvider(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load payer');
    }
  };

  const handleView = (provider) => openProvider(provider, 'view');

  const handleEdit = (provider) => openProvider(provider, 'edit');

  const handleDelete = (provider) => {
    setSelectedProvider(provider);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedProvider) {
        await insuranceProviderApi.update(selectedProvider.id, data);
      } else {
        await insuranceProviderApi.create(data);
      }
      setIsFormOpen(false);
      fetchProviders();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await insuranceProviderApi.delete(selectedProvider.id);
      setIsDeleteOpen(false);
      fetchProviders();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payers Management</h1>
          <p className="text-muted-foreground">Manage insurance payer records</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payer
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Filters</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="payer-id-filter">Payer ID</Label>
            <Input
              id="payer-id-filter"
              value={payerIdFilter}
              onChange={(e) => handleFilterChange(setPayerIdFilter)(e.target.value)}
              placeholder="Search by payer ID..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payer-name-filter">Payer Name</Label>
            <Input
              id="payer-name-filter"
              value={nameFilter}
              onChange={(e) => handleFilterChange(setNameFilter)(e.target.value)}
              placeholder="Search by payer name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payer-status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange(setStatusFilter)(value)}
            >
              <SelectTrigger id="payer-status-filter" aria-label="Filter by status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        data={providers}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        hideToolbar
        emptyMessage="No payers found"
        actions={(provider) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => handleView(provider)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(provider)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(provider)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <InsuranceProviderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        provider={selectedProvider}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        mode={formMode}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[520px] max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Payer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{selectedProvider?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Yes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
