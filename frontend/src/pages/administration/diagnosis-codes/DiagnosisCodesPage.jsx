import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Eye, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DiagnosisCodeFormDialog } from './DiagnosisCodeFormDialog';
import { diagnosisCodeApi } from '@/services/api';

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

export function DiagnosisCodesPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await diagnosisCodeApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setItems(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

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

  const openRecord = async (record, mode) => {
    try {
      const response = await diagnosisCodeApi.getById(record.id);
      setSelectedRecord(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load diagnosis code');
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
        await diagnosisCodeApi.update(selectedRecord.id, data);
      } else {
        await diagnosisCodeApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedRecord(null);
      fetchCodes();
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
      await diagnosisCodeApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchCodes();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Diagnosis Codes</h1>
          <p className="text-muted-foreground mt-1">
            Maintain ICD-10-CM diagnosis codes for problem lists, encounters, and claims.
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Diagnosis Code
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

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
            key: 'code',
            label: 'Code',
            cellClassName: 'font-mono font-medium',
          },
          {
            key: 'effectiveDate',
            label: 'Effective Date',
            render: (row) => formatDisplayDate(row.effectiveDate),
          },
          {
            key: 'status',
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
        searchPlaceholder="Search by ICD code, description, or notes..."
        emptyMessage="No diagnosis codes found"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openRecord(row, 'view')}
              aria-label="View"
              title="View"
            >
              <Eye className="h-4 w-4" />
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

      <DiagnosisCodeFormDialog
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
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Delete diagnosis code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ICD code{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.code}</span>?
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
