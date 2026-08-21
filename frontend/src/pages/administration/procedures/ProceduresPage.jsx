import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ProcedureFormDialog } from './ProcedureFormDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { procedureApi, procedureCategoryApi } from '@/services/api';
import { CatalogStatusBadge, YesNoBadge } from '@/components/rcm/CatalogStatusBadge';
import { CPT_CODE_TYPES } from '@/lib/codeCatalog';

const PROCEDURE_COLUMNS = [
  {
    key: 'cptCode',
    label: 'Code',
    cellClassName: 'font-mono font-medium',
    render: (row) => row.cptCode || '—',
  },
  {
    key: 'procedureDescription',
    label: 'Description',
    cellClassName: 'font-medium',
  },
  {
    key: 'categoryName',
    label: 'Category',
    render: (row) => row.categoryName || row.categories?.map((c) => c.name).join(', ') || '—',
  },
  { key: 'codeType', label: 'Type', render: (row) => row.codeType || 'CPT' },
  { key: 'revenueCode', label: 'Rev', render: (row) => row.revenueCode || '—' },
  {
    key: 'unitPrice',
    label: 'Charge',
    render: (row) => (row.unitPrice != null ? `$${Number(row.unitPrice).toFixed(2)}` : '—'),
  },
  {
    key: 'isBillable',
    label: 'Billable',
    render: (row) => <YesNoBadge value={row.isBillable !== false} />,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <CatalogStatusBadge isActive={row.isActive} />,
  },
];

export function ProceduresPage() {
  const [procedures, setProcedures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [codeTypeFilter, setCodeTypeFilter] = useState('all');
  const [billableFilter, setBillableFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  const fetchProcedures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await procedureApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        codeType: codeTypeFilter !== 'all' ? codeTypeFilter : undefined,
        isBillable: billableFilter === 'all' ? undefined : billableFilter === 'yes',
      });
      setProcedures(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setProcedures([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, categoryFilter, codeTypeFilter, billableFilter]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  useEffect(() => {
    procedureCategoryApi
      .getAll({ limit: 500 })
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  const rows = useMemo(
    () =>
      procedures.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [procedures, pagination.page, pagination.limit],
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

  const openProcedure = async (record, mode) => {
    try {
      const response = await procedureApi.getById(record.id);
      setSelectedProcedure(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load procedure');
    }
  };

  const handleCreate = () => {
    setSelectedProcedure(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedProcedure?.id) {
        await procedureApi.update(selectedProcedure.id, data);
      } else {
        await procedureApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedProcedure(null);
      fetchProcedures();
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
      await procedureApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchProcedures();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Procedure Codes</h1>
          <p className="text-muted-foreground">Maintain CPT and HCPCS procedure codes used for charge capture and claims.</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Procedure
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium">Filters</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name || item.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Code type</Label>
            <Select
              value={codeTypeFilter}
              onValueChange={(value) => {
                setCodeTypeFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {CPT_CODE_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Billable</Label>
            <Select
              value={billableFilter}
              onValueChange={(value) => {
                setBillableFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Billable</SelectItem>
                <SelectItem value="no">Not billable</SelectItem>
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
        columns={PROCEDURE_COLUMNS}
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
        searchPlaceholder="Search procedures..."
        emptyMessage="No procedures found"
        actions={(procedure) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openProcedure(procedure, 'view')}
              aria-label="View"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openProcedure(procedure, 'edit')}
              aria-label="Edit"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteTarget(procedure)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ProcedureFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedProcedure(null);
        }}
        procedure={selectedProcedure}
        mode={formMode}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Delete procedure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.procedureDescription}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
