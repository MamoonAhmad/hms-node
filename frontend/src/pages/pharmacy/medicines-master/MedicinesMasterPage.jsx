import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  History,
  ArrowUpDown,
} from 'lucide-react';
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
import { MedicineFormDialog } from './MedicineFormDialog';
import { medicationCatalogApi } from '@/services/api/medicationCatalog.api';
import { DOSAGE_FORMS, ROUTES, MEDICATION_CATEGORIES } from './medicineConstants';

const FILTER_DEFAULTS = {
  search: '',
  status: '',
  dosageForm: '',
  route: '',
  medicationClass: '',
  isControlledSubstance: '',
  prescriptionRequired: '',
};

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function YesNoBadge({ value }) {
  return value ? (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
      Yes
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      No
    </span>
  );
}

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

export function MedicinesMasterPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [debouncedFilters, setDebouncedFilters] = useState(FILTER_DEFAULTS);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formKey, setFormKey] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');
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

  const fetchMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await medicationCatalogApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedFilters.search || undefined,
        status: debouncedFilters.status || undefined,
        dosageForm: debouncedFilters.dosageForm || undefined,
        route: debouncedFilters.route || undefined,
        medicationClass: debouncedFilters.medicationClass || undefined,
        isControlledSubstance:
          debouncedFilters.isControlledSubstance === ''
            ? undefined
            : debouncedFilters.isControlledSubstance,
        prescriptionRequired:
          debouncedFilters.prescriptionRequired === ''
            ? undefined
            : debouncedFilters.prescriptionRequired,
        sortBy,
        sortOrder,
      });
      setItems(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedFilters, sortBy, sortOrder]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const SortableLabel = ({ field, label }) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-foreground"
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
      {sortBy === field ? (
        <span className="text-[10px] uppercase text-muted-foreground">{sortOrder}</span>
      ) : null}
    </button>
  );

  const openRecord = async (record, mode) => {
    try {
      const response = await medicationCatalogApi.getById(record.id);
      setSelectedRecord(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load medication');
    }
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setFormMode('create');
    setFormKey((k) => k + 1);
    setIsFormOpen(true);
  };

  const saveMedicine = async (data, { intent = 'save', confirmDuplicate = false } = {}) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, confirmDuplicate };
      if (formMode === 'edit' && selectedRecord?.id) {
        await medicationCatalogApi.update(selectedRecord.id, payload);
      } else {
        await medicationCatalogApi.create(payload);
      }

      if (intent === 'saveAndAdd' && formMode === 'create') {
        setSelectedRecord(null);
        setFormMode('create');
        setFormKey((k) => k + 1);
        setIsFormOpen(true);
      } else {
        setIsFormOpen(false);
        setSelectedRecord(null);
      }
      setDuplicateConfirm(null);
      fetchMedicines();
    } catch (err) {
      if (err.code === 'DUPLICATE_MEDICATION' || err.status === 409) {
        setDuplicateConfirm({ data, intent });
        return;
      }
      alert(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (data, options) => saveMedicine(data, options);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await medicationCatalogApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchMedicines();
      if (result?.message) alert(result.message);
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (row) => {
    try {
      await medicationCatalogApi.activate(row.id);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Activate failed');
    }
  };

  const handleDeactivate = async (row) => {
    try {
      await medicationCatalogApi.deactivate(row.id);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Deactivate failed');
    }
  };

  const openHistory = async (row) => {
    try {
      const response = await medicationCatalogApi.getHistory(row.id);
      setHistoryRows(response.data || []);
      setHistoryTitle(row.name);
      setHistoryOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load audit history');
    }
  };

  return (
    <div className="ehr-page">
      <PageHeader
        title="Medicines Master"
        description="Manage medicines available for orders, ePrescribe, and medication administration."
        breadcrumbs="Pharmacy / Medicines Master"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Medication
          </Button>
        }
      />

      {error && (
        <div className="content-panel rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive mx-4 sm:mx-6">
          {error}
        </div>
      )}

      <section className="content-panel space-y-4 rounded-lg p-4 sm:p-6 mx-4 sm:mx-6">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="filter-search">Search</Label>
            <Input
              id="filter-search"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Medication name, generic, brand, code, NDC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilter('status', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-status">
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
            <Label htmlFor="filter-dosage-form">Dosage Form</Label>
            <Select
              value={filters.dosageForm || 'all'}
              onValueChange={(v) => setFilter('dosageForm', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-dosage-form">
                <SelectValue placeholder="All forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All forms</SelectItem>
                {DOSAGE_FORMS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-route">Route</Label>
            <Select
              value={filters.route || 'all'}
              onValueChange={(v) => setFilter('route', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-route">
                <SelectValue placeholder="All routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All routes</SelectItem>
                {ROUTES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-category">Medication Category</Label>
            <Select
              value={filters.medicationClass || 'all'}
              onValueChange={(v) => setFilter('medicationClass', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {MEDICATION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-controlled">Controlled Substance</Label>
            <Select
              value={filters.isControlledSubstance === '' ? 'all' : String(filters.isControlledSubstance)}
              onValueChange={(v) =>
                setFilter('isControlledSubstance', v === 'all' ? '' : v === 'true')
              }
            >
              <SelectTrigger id="filter-controlled">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-rx">Prescription Required</Label>
            <Select
              value={filters.prescriptionRequired === '' ? 'all' : String(filters.prescriptionRequired)}
              onValueChange={(v) =>
                setFilter('prescriptionRequired', v === 'all' ? '' : v === 'true')
              }
            >
              <SelectTrigger id="filter-rx">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="content-panel overflow-hidden mx-4 sm:mx-6 mb-6">
        <DataTable
          columns={[
            {
              key: 'name',
              label: <SortableLabel field="name" label="Medication Name" />,
              cellClassName: 'font-medium',
            },
            {
              key: 'genericName',
              label: <SortableLabel field="genericName" label="Generic Name" />,
              render: (row) => row.genericName || '—',
            },
            {
              key: 'brandName',
              label: 'Brand Name',
              render: (row) => row.brandName || '—',
            },
            {
              key: 'strength',
              label: <SortableLabel field="strength" label="Strength" />,
              render: (row) =>
                [row.strength, row.strengthUnit].filter(Boolean).join(' ') || '—',
            },
            {
              key: 'dosageForm',
              label: 'Dosage Form',
              render: (row) => row.dosageForm || '—',
            },
            {
              key: 'route',
              label: 'Route',
              render: (row) =>
                Array.isArray(row.route) && row.route.length ? row.route.join(', ') : '—',
            },
            {
              key: 'medicationClass',
              label: 'Category',
              render: (row) => row.medicationClass || '—',
            },
            {
              key: 'isControlledSubstance',
              label: 'Controlled Substance',
              render: (row) => <YesNoBadge value={row.isControlledSubstance} />,
            },
            {
              key: 'prescriptionRequired',
              label: 'Prescription Required',
              render: (row) => <YesNoBadge value={row.prescriptionRequired} />,
            },
            {
              key: 'status',
              label: <SortableLabel field="isActive" label="Status" />,
              render: (row) => <StatusBadge isActive={row.isActive} />,
            },
            {
              key: 'createdAt',
              label: <SortableLabel field="createdAt" label="Created Date" />,
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              key: 'updatedAt',
              label: <SortableLabel field="updatedAt" label="Updated Date" />,
              render: (row) => formatDateTime(row.updatedAt),
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
          emptyMessage="No medicines found"
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
              {row.isActive ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeactivate(row)}
                  title="Deactivate"
                  aria-label="Deactivate"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(row)}
                  title="Activate"
                  aria-label="Activate"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openHistory(row)}
                title="Audit History"
                aria-label="Audit History"
              >
                <History className="h-4 w-4" />
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

      <MedicineFormDialog
        key={formKey}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedRecord(null);
        }}
        record={selectedRecord}
        mode={formMode}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Medication</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this medication?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!duplicateConfirm} onOpenChange={(open) => !open && setDuplicateConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Similar Medication Exists</DialogTitle>
            <DialogDescription>
              A similar medication already exists with the same name, generic name, strength,
              strength unit, and dosage form. Do you want to save anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateConfirm(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                saveMedicine(duplicateConfirm.data, {
                  intent: duplicateConfirm.intent,
                  confirmDuplicate: true,
                })
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit History — {historyTitle}</DialogTitle>
            <DialogDescription>
              Creation, updates, activation, deactivation, and deletion attempts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {historyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit history recorded yet.</p>
            ) : (
              historyRows.map((row) => (
                <div key={row.id} className="rounded-md border p-3 text-sm space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium capitalize">{row.action?.replaceAll('_', ' ')}</span>
                    <span className="text-muted-foreground">{formatDateTime(row.createdAt)}</span>
                  </div>
                  <p className="text-muted-foreground">{row.summary || '—'}</p>
                  {row.previousValue && (
                    <p>
                      <span className="text-muted-foreground">Previous: </span>
                      {row.previousValue}
                    </p>
                  )}
                  {row.updatedValue && (
                    <p>
                      <span className="text-muted-foreground">Updated: </span>
                      {row.updatedValue}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {row.changedByName || '—'}
                    {row.changedByRole ? ` (${row.changedByRole})` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
