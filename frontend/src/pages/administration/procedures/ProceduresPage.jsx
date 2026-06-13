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
import { procedureApi } from '@/services/api';

const PROCEDURE_COLUMNS = [
  {
    key: 'procedureDescription',
    label: 'Procedure Description',
    cellClassName: 'font-medium',
  },
  {
    key: 'genericDescription',
    label: 'Generic Description',
    render: (row) => row.genericDescription || '—',
  },
  {
    key: 'categoryName',
    label: 'Category',
    render: (row) => row.categoryName || row.categories?.map((c) => c.name).join(', ') || '—',
  },
  { key: 'cptCode', label: 'CPT Code', render: (row) => row.cptCode || '—' },
  { key: 'revenueCode', label: 'Revenue Code', render: (row) => row.revenueCode || '—' },
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

  const fetchProcedures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await procedureApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setProcedures(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setProcedures([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

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
          <p className="text-muted-foreground">Manage procedure codes</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Procedure
        </Button>
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
