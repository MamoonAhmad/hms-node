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
import { VaccineFormDialog } from './VaccineFormDialog';
import { vaccineApi, VACCINE_ROUTE_OPTIONS } from '@/services/api/vaccine.api';

const FILTER_DEFAULTS = {
  vaccineName: '',
  vaccineCode: '',
  manufacturer: '',
  route: '',
  status: '',
  createdDateFrom: '',
  createdDateTo: '',
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

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span
      className={
        active
          ? 'inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'
          : 'inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'
      }
    >
      {status || '—'}
    </span>
  );
}

export function VaccineMasterPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [debouncedFilters, setDebouncedFilters] = useState(FILTER_DEFAULTS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const fetchVaccines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vaccineApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        vaccineName: debouncedFilters.vaccineName || undefined,
        vaccineCode: debouncedFilters.vaccineCode || undefined,
        manufacturer: debouncedFilters.manufacturer || undefined,
        route: debouncedFilters.route || undefined,
        status: debouncedFilters.status || undefined,
        createdDateFrom: debouncedFilters.createdDateFrom || undefined,
        createdDateTo: debouncedFilters.createdDateTo || undefined,
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
    fetchVaccines();
  }, [fetchVaccines]);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const openRecord = async (record, mode) => {
    try {
      const response = await vaccineApi.getById(record.id);
      setSelectedRecord(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load vaccine');
    }
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedRecord?.id) {
        await vaccineApi.update(selectedRecord.id, data);
      } else {
        await vaccineApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedRecord(null);
      fetchVaccines();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await vaccineApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchVaccines();
      if (result?.message) alert(result.message);
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ehr-page">
      <PageHeader
        title="Immunization / Vaccine Master"
        description="Manage immunizations and vaccines available for provider orders on the Patient Dashboard."
        breadcrumbs="Pharmacy / Immunization / Vaccine Master"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Vaccine
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
            Clear filters
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="filter-vaccine-name">Vaccine Name</Label>
            <Input
              id="filter-vaccine-name"
              value={filters.vaccineName}
              onChange={(e) => setFilter('vaccineName', e.target.value)}
              placeholder="Search by name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-vaccine-code">Vaccine Code</Label>
            <Input
              id="filter-vaccine-code"
              value={filters.vaccineCode}
              onChange={(e) => setFilter('vaccineCode', e.target.value)}
              placeholder="Search by code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-manufacturer">Manufacturer</Label>
            <Input
              id="filter-manufacturer"
              value={filters.manufacturer}
              onChange={(e) => setFilter('manufacturer', e.target.value)}
              placeholder="Filter by manufacturer"
            />
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
                {VACCINE_ROUTE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="filter-created-from">Created Date (From)</Label>
            <Input
              id="filter-created-from"
              type="date"
              value={filters.createdDateFrom}
              onChange={(e) => setFilter('createdDateFrom', e.target.value)}
              max={filters.createdDateTo || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-created-to">Created Date (To)</Label>
            <Input
              id="filter-created-to"
              type="date"
              value={filters.createdDateTo}
              onChange={(e) => setFilter('createdDateTo', e.target.value)}
              min={filters.createdDateFrom || undefined}
            />
          </div>
        </div>
      </section>

      <div className="content-panel overflow-hidden mx-4 sm:mx-6 mb-6">
        <DataTable
          columns={[
            { key: 'vaccineName', label: 'Vaccine Name', cellClassName: 'font-medium' },
            { key: 'vaccineCode', label: 'Vaccine Code', cellClassName: 'font-mono text-sm' },
            { key: 'manufacturer', label: 'Manufacturer', render: (row) => row.manufacturer || '—' },
            { key: 'route', label: 'Route', render: (row) => row.route || '—' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'createdByName', label: 'Created By', render: (row) => row.createdByName || '—' },
            {
              key: 'createdAt',
              label: 'Created Date & Time',
              render: (row) => formatDateTime(row.createdAt),
            },
            { key: 'updatedByName', label: 'Updated By', render: (row) => row.updatedByName || '—' },
            {
              key: 'updatedAt',
              label: 'Updated Date & Time',
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
          emptyMessage="No vaccines found"
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => openRecord(row, 'view')} title="View">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => openRecord(row, 'edit')} title="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(row)}
                className="text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <VaccineFormDialog
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
            <DialogTitle>Delete Vaccine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.vaccineName}</span>?
              If this vaccine has been used in patient orders, it will be marked Inactive instead of deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
