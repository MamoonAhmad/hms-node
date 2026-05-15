import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ProviderFormDialog } from '@/components/providers/ProviderFormDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const mockProviders = [
  {
    id: 1,
    npi: '1234567890',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Smith',
    email: 'john.smith@hospital.com',
    mobileNumber: '(555) 123-4567',
    specialty: 'Cardiology',
  },
  {
    id: 2,
    npi: '0987654321',
    firstName: 'Sarah',
    middleName: '',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    mobileNumber: '(555) 234-5678',
    specialty: 'Pediatrics',
  },
];

const COLUMNS = [
  { key: 'serialNum', label: 'Serial Num' },
  { key: 'npi', label: 'Provider NPI', cellClassName: 'font-mono text-xs' },
  {
    key: 'name',
    label: 'Provider Name',
    cellClassName: 'font-medium',
    render: (row) =>
      `${row.firstName || ''} ${row.middleName ? `${row.middleName} ` : ''}${row.lastName || ''}`.trim() || '-',
  },
  { key: 'email', label: 'Provider Email' },
  { key: 'mobileNumber', label: 'Provider Phone', render: (row) => row.mobileNumber || '-' },
  { key: 'specialty', label: 'Specialty' },
];

export function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [formMode, setFormMode] = useState('create'); // create | edit | view
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const t = setTimeout(() => {
      setProviders(mockProviders);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        (p.npi && String(p.npi).toLowerCase().includes(q)) ||
        `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(q) ||
        (p.email && String(p.email).toLowerCase().includes(q)) ||
        (p.specialty && String(p.specialty).toLowerCase().includes(q)) ||
        (p.mobileNumber && String(p.mobileNumber).toLowerCase().includes(q))
    );
  }, [providers, search]);

  const rows = useMemo(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
    const base = (currentPage - 1) * pagination.limit;
    return filtered
      .slice(base, base + pagination.limit)
      .map((row, i) => ({ ...row, _srNo: base + i + 1 }));
  }, [filtered, pagination.page, pagination.limit]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleCreate = () => {
    setSelectedProvider(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleView = (provider) => {
    setSelectedProvider(provider);
    setFormMode('view');
    setIsFormOpen(true);
  };

  const handleEdit = (provider) => {
    setSelectedProvider(provider);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDelete = (provider) => {
    setSelectedProvider(provider);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedProvider?.id) {
        setProviders((prev) => prev.map((p) => (p.id === selectedProvider.id ? { ...p, ...data } : p)));
      } else {
        const nextId = Math.max(0, ...providers.map((p) => Number(p.id) || 0)) + 1;
        setProviders((prev) => [{ ...data, id: nextId }, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      setProviders((prev) => prev.filter((p) => p.id !== selectedProvider.id));
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columnsWithSrNo = [
    {
      key: '_srNo',
      label: 'Serial Num',
      render: (row) => row._srNo,
    },
    ...COLUMNS.filter((c) => c.key !== 'serialNum'),
  ];

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Providers Management</h1>
          <p className="text-muted-foreground">Manage healthcare providers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={columnsWithSrNo}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by NPI, name, email, or specialty..."
        emptyMessage="No providers found"
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

      <ProviderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        provider={selectedProvider}
        mode={formMode}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {selectedProvider
                  ? `${selectedProvider.firstName || ''} ${selectedProvider.lastName || ''}`.trim() || selectedProvider.npi
                  : 'this provider'}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting || !selectedProvider}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
