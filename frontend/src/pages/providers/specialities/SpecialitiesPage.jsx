import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SpecialtyFormDialog } from '@/components/providers/SpecialtyFormDialog';
import { specialtyApi } from '@/services/api';

const COLUMNS = [
  { key: '_srNo', label: 'Sr No', render: (row) => row._srNo },
  { key: 'name', label: 'Speciality Name', cellClassName: 'font-medium' },
  {
    key: 'status',
    label: 'Speciality Status',
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

export function SpecialitiesPage() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // create | edit | view
  const [selected, setSelected] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSpecialties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;

      const response = await specialtyApi.getAll(params);
      setRows(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const tableData = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [rows, pagination.page, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setFormMode('create');
    setIsFormOpen(true);
  };
  const handleView = (row) => {
    setSelected(row);
    setFormMode('view');
    setIsFormOpen(true);
  };
  const handleEdit = (row) => {
    setSelected(row);
    setFormMode('edit');
    setIsFormOpen(true);
  };
  const handleDelete = (row) => {
    setSelected(row);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selected?.id) {
        await specialtyApi.update(selected.id, payload);
      } else {
        await specialtyApi.create(payload);
      }
      setIsFormOpen(false);
      fetchSpecialties();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await specialtyApi.delete(selected?.id);
      setIsDeleteOpen(false);
      fetchSpecialties();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Specialities</h1>
          <p className="text-muted-foreground">Manage provider specialities</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Speciality
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        data={tableData}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(r) => r.id}
        searchPlaceholder="Search by name or code..."
        emptyMessage="No specialities found"
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => handleView(row)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(row)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(row)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <SpecialtyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        specialty={selected}
        mode={formMode}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[700px] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Speciality</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{selected?.name}</span>? This action
              cannot be undone.
              {selected?._count?.subSpecialties > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: deleting this speciality removes {selected._count.subSpecialties} linked sub-specialties
                  (cascade).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting || !selected}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
