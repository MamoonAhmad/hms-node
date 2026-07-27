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
import { providerApi } from '@/services/api';
import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';

const COLUMNS = [
  {
    key: 'npi',
    label: 'Provider NPI',
    cellClassName: 'font-mono text-xs',
  },
  {
    key: 'name',
    label: 'Provider Name',
    cellClassName: 'font-medium',
    render: (row) =>
      `${row.firstName || ''} ${row.middleName ? `${row.middleName} ` : ''}${row.lastName || ''}`.trim() || '-',
  },
  { key: 'email', label: 'Provider Email', render: (row) => row.email || '-' },
  { key: 'mobileNumber', label: 'Provider Phone', render: (row) => row.mobileNumber || '-' },
  {
    key: 'specialtyLabel',
    label: 'Specialty',
    render: (row) => row.specialty?.name ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'subSpecialtyLabel',
    label: 'Sub-specialty',
    render: (row) => row.subSpecialty?.name ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: 'departmentLabel',
    label: 'Department(s)',
    render: (row) => {
      const names = (row.departments || [])
        .map((d) => d.departmentName)
        .filter(Boolean);
      if (!names.length && row.department?.departmentName) {
        names.push(row.department.departmentName);
      }
      return names.length ? names.join(', ') : <span className="text-muted-foreground">—</span>;
    },
  },
];

export function ProvidersPage() {
  const { departmentId } = useTopbarDepartment();
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [formError, setFormError] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (departmentId) params.departmentId = departmentId;

      const response = await providerApi.getAll(params);
      setProviders(response.data || []);
      setPagination((prev) => ({
        ...prev,
        ...(response.pagination || {}),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, departmentId]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [departmentId]);

  const tableRows = useMemo(
    () =>
      providers.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [providers, pagination.page, pagination.limit],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const handleCreate = () => {
    setSelectedProvider(null);
    setFormMode('create');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleView = async (provider) => {
    try {
      const detail = await providerApi.getById(provider.id);
      setSelectedProvider(detail.data ?? detail);
      setFormMode('view');
      setFormError(null);
      setIsFormOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (provider) => {
    try {
      const detail = await providerApi.getById(provider.id);
      setSelectedProvider(detail.data ?? detail);
      setFormMode('edit');
      setFormError(null);
      setIsFormOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (provider) => {
    setSelectedProvider(provider);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (formMode === 'edit' && selectedProvider?.id) {
        await providerApi.update(selectedProvider.id, payload);
      } else {
        await providerApi.create(payload);
      }
      setIsFormOpen(false);
      setSelectedProvider(null);
      setFormError(null);
      await fetchProviders();
    } catch (err) {
      const details = Array.isArray(err.details)
        ? err.details.map((d) => d.message || d).filter(Boolean)
        : Array.isArray(err.errors)
          ? err.errors.map((e) => e.message || e).filter(Boolean)
          : [];
      setFormError(
        details.length ? `${err.message || 'Validation failed'}: ${details.join('; ')}` : err.message || 'Failed to save provider',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormOpenChange = (open) => {
    setIsFormOpen(open);
    if (!open) setFormError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProvider?.id) return;
    setIsSubmitting(true);
    try {
      await providerApi.delete(selectedProvider.id);
      setIsDeleteOpen(false);
      setSelectedProvider(null);
      await fetchProviders();
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
    ...COLUMNS,
  ];

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
        data={tableRows}
        total={pagination.total || 0}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by NPI, name, email, specialty, department..."
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
        onOpenChange={handleFormOpenChange}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        provider={selectedProvider}
        mode={formMode}
        submitError={formError}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {selectedProvider
                  ? `${selectedProvider.firstName || ''} ${selectedProvider.lastName || ''}`.trim() ||
                    selectedProvider.npi
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
