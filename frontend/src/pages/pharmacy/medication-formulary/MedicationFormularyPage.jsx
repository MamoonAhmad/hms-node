import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormularyFormDialog } from './FormularyFormDialog';
import { medicationCatalogApi } from '@/services/api/medicationCatalog.api';
import { FORMULARY_STATUSES, THERAPEUTIC_CATEGORIES } from './formularyConstants';

const FILTER_DEFAULTS = {
  search: '',
  status: '',
  formularyStatus: '',
  therapeuticCategory: '',
};

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
      Active
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
      Inactive
    </span>
  );
}

export function MedicationFormularyPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [debouncedFilters, setDebouncedFilters] = useState(FILTER_DEFAULTS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formKey, setFormKey] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => String(v).trim() !== ''),
    [filters],
  );

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await medicationCatalogApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status || undefined,
        therapeuticCategory: debouncedFilters.therapeuticCategory || undefined,
        formularyStatus: debouncedFilters.formularyStatus || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      setItems(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedFilters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const openRecord = async (record, mode) => {
    try {
      const response = await medicationCatalogApi.getById(record.id);
      setSelectedRecord(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load formulary medication');
    }
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setFormMode('create');
    setFormKey((k) => k + 1);
    setIsFormOpen(true);
  };

  const saveRecord = async (data, { confirmDuplicate = false } = {}) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, confirmDuplicate };
      if (formMode === 'edit' && selectedRecord?.id) {
        await medicationCatalogApi.update(selectedRecord.id, payload);
      } else {
        await medicationCatalogApi.create(payload);
      }
      setIsFormOpen(false);
      setSelectedRecord(null);
      setDuplicateConfirm(null);
      fetchList();
    } catch (err) {
      if (err.code === 'DUPLICATE_MEDICATION' || err.status === 409) {
        setDuplicateConfirm({ data });
        return;
      }
      alert(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await medicationCatalogApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ehr-page">
      <PageHeader
        title="Medication formulary"
        description="Clinical formulary catalog for prescribing. Inventory quantities and stock belong in Medicine Inventory."
        breadcrumbs="Pharmacy / Medication formulary"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      {error && (
        <div className="content-panel mx-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive sm:mx-6">
          {error}
        </div>
      )}

      <section className="content-panel mx-4 space-y-4 rounded-lg p-4 sm:mx-6 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Search &amp; Filters</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilters(FILTER_DEFAULTS)}
            disabled={!hasActiveFilters}
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ffilter-search">Search</Label>
            <Input
              id="ffilter-search"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Display name, generic, brand, NDC, RxNorm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ffilter-status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilter('status', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="ffilter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ffilter-fstatus">Formulary Status</Label>
            <Select
              value={filters.formularyStatus || 'all'}
              onValueChange={(v) => setFilter('formularyStatus', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="ffilter-fstatus">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {FORMULARY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ffilter-cat">Therapeutic Category</Label>
            <Select
              value={filters.therapeuticCategory || 'all'}
              onValueChange={(v) => setFilter('therapeuticCategory', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="ffilter-cat">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {THERAPEUTIC_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="content-panel mx-4 mb-6 overflow-hidden sm:mx-6">
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Display Name',
              cellClassName: 'font-medium',
            },
            {
              key: 'genericName',
              label: 'Generic Name',
              render: (row) => row.genericName || '—',
            },
            {
              key: 'brandName',
              label: 'Brand Name',
              render: (row) => row.brandName || '—',
            },
            {
              key: 'strength',
              label: 'Strength',
              render: (row) =>
                [row.strength, row.strengthUnit].filter(Boolean).join(' ') || '—',
            },
            {
              key: 'dosageForm',
              label: 'Dosage Form',
              render: (row) => row.dosageForm || '—',
            },
            {
              key: 'therapeuticCategory',
              label: 'Therapeutic Category',
              render: (row) => row.therapeuticCategory || row.medicationClass || '—',
            },
            {
              key: 'formularyStatus',
              label: 'Formulary Status',
              render: (row) => row.formularyStatus || '—',
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <StatusBadge isActive={row.isActive} />,
            },
          ]}
          data={items}
          total={pagination.total}
          page={pagination.page}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyMessage="No formulary medications found"
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openRecord(row, 'view')}
                title="View"
                aria-label="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openRecord(row, 'edit')}
                title="Edit"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {row.canDelete !== false && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(row)}
                  className="text-destructive hover:text-destructive"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        />
      </div>

      <FormularyFormDialog
        key={formKey}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedRecord(null);
        }}
        record={selectedRecord}
        mode={formMode}
        onSubmit={(data) => saveRecord(data)}
        isLoading={isSubmitting}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Formulary Medication</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!duplicateConfirm} onOpenChange={(open) => !open && setDuplicateConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Possible Duplicate</DialogTitle>
            <DialogDescription>
              A similar medication already exists. Do you want to save this formulary entry anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                saveRecord(duplicateConfirm.data, { confirmDuplicate: true })
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
