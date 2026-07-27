import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Eye, Pencil, Trash2, Check, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { ChargeMasterFormDialog } from './ChargeMasterFormDialog';
import { chargeMasterApi } from '@/services/api';

function formatMoney(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `$${n.toFixed(2)}`;
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ isActive }) {
  return isActive !== false ? (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
      <Check className="h-3 w-3" />
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <X className="h-3 w-3" />
      Inactive
    </Badge>
  );
}

const emptyFilterOptions = {
  locations: [],
  categories: [],
  payers: [],
  departments: [],
};

export function ChargeMasterPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [category, setCategory] = useState('all');
  const [payer, setPayer] = useState('all');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [filterOptions, setFilterOptions] = useState(emptyFilterOptions);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCharges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chargeMasterApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        location: location !== 'all' ? location : undefined,
        category: category !== 'all' ? category : undefined,
        payer: payer !== 'all' ? payer : undefined,
        genericDepartment: department !== 'all' ? department : undefined,
        isActive: status === 'all' ? undefined : status === 'active',
      });
      setItems(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
      if (response.filters) {
        setFilterOptions({
          locations: response.filters.locations || [],
          categories: response.filters.categories || [],
          payers: response.filters.payers || [],
          departments: response.filters.departments || [],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load charge masters');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    location,
    category,
    payer,
    department,
    status,
  ]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const rows = useMemo(
    () =>
      items.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [items, pagination.page, pagination.limit],
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

  const resetFilters = () => {
    setLocation('all');
    setCategory('all');
    setPayer('all');
    setDepartment('all');
    setStatus('all');
    setSearch('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openRecord = async (record, mode) => {
    try {
      const response = await chargeMasterApi.getById(record.id);
      setSelectedRecord(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load charge master');
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
        await chargeMasterApi.update(selectedRecord.id, data);
      } else {
        await chargeMasterApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedRecord(null);
      fetchCharges();
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
      await chargeMasterApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchCharges();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters =
    location !== 'all' ||
    category !== 'all' ||
    payer !== 'all' ||
    department !== 'all' ||
    status !== 'all' ||
    !!search;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Charge Master</h1>
          <p className="text-muted-foreground mt-1">
            Maintain CPT charge rates, revenue codes, and facility pricing.
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Charge Master
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filters
            </div>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Select
                value={location}
                onValueChange={(v) => {
                  setLocation(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {filterOptions.locations.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {filterOptions.categories.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select
                value={department}
                onValueChange={(v) => {
                  setDepartment(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {filterOptions.departments.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payer</Label>
              <Select
                value={payer}
                onValueChange={(v) => {
                  setPayer(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All payers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payers</SelectItem>
                  {filterOptions.payers.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={[
          {
            key: '_srNo',
            label: 'Sr. No.',
            align: 'center',
            className: 'w-14 min-w-14 max-w-16 px-2',
            cellClassName: 'w-14 min-w-14 max-w-16 px-2 tabular-nums',
            render: (row) => row._srNo,
          },
          {
            key: 'cptCode',
            label: 'CPT Code',
            cellClassName: 'font-mono font-medium',
          },
          {
            key: 'description',
            label: 'Description',
            render: (row) => (
              <span className="line-clamp-2 max-w-[280px]">{row.description || '—'}</span>
            ),
          },
          {
            key: 'revenueCode',
            label: 'Revenue Code',
            cellClassName: 'font-mono',
          },
          {
            key: 'standardAmount',
            label: 'Standard Amount',
            render: (row) => formatMoney(row.standardAmount),
          },
          {
            key: 'location',
            label: 'Location',
          },
          {
            key: 'category',
            label: 'Category',
            render: (row) => row.category || '—',
          },
          {
            key: 'priceEffectiveDate',
            label: 'Effective',
            render: (row) => formatDisplayDate(row.priceEffectiveDate),
          },
          {
            key: 'isActive',
            label: 'Status',
            render: (row) => <StatusBadge isActive={row.isActive} />,
          },
        ]}
        data={rows}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search CPT, description, revenue code, payer…"
        emptyMessage="No charge masters found"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openRecord(row, 'view')}
              aria-label="View"
              title="View"
            >
              <Eye className="h-4 w-4 icon-action-view" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openRecord(row, 'edit')}
              aria-label="Edit"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteTarget(row)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ChargeMasterFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedRecord(null);
        }}
        charge={selectedRecord}
        mode={formMode}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Charge Master</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete CPT{' '}
              <span className="font-mono font-medium text-foreground">
                {deleteTarget?.cptCode}
              </span>
              {deleteTarget?.description ? ` — ${deleteTarget.description}` : ''}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
