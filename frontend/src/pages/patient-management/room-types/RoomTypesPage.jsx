import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { roomTypeApi } from '@/services/api';

const emptyForm = () => ({
  code: '',
  label: '',
  isActive: true,
});

export function RoomTypesPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const fetchRoomTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roomTypeApi.getAll({
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
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const rows = useMemo(
    () =>
      items.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [items, pagination.page, pagination.limit],
  );

  const openCreate = () => {
    setSelected(null);
    setMode('create');
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openRecord = async (row, nextMode) => {
    try {
      const response = await roomTypeApi.getById(row.id);
      const record = response.data;
      setSelected(record);
      setMode(nextMode);
      setForm({
        code: record.code || '',
        label: record.label || '',
        isActive: record.isActive !== false,
      });
      setDialogOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load room type');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') return;

    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim(),
        label: form.label.trim(),
        isActive: form.isActive,
      };

      if (mode === 'edit' && selected?.id) {
        await roomTypeApi.update(selected.id, payload);
      } else {
        await roomTypeApi.create(payload);
      }
      setDialogOpen(false);
      setSelected(null);
      fetchRoomTypes();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected?.id) return;
    setSubmitting(true);
    try {
      await roomTypeApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      fetchRoomTypes();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: '_srNo', label: '#', render: (row) => row._srNo },
    { key: 'code', label: 'Code', cellClassName: 'font-mono text-sm', render: (row) => row.code || '—' },
    { key: 'label', label: 'Display name', render: (row) => row.label || '—' },
    {
      key: 'isActive',
      label: 'Active',
      render: (row) => (row.isActive !== false ? 'Yes' : 'No'),
    },
  ];

  const readOnly = mode === 'view';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Layers className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Rooms Type</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Configure room type options used when creating or editing rooms (e.g. ICU, Med/Surg).
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add room type
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={(keyword) => {
          setSearch(keyword);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        getRowId={(row) => row.id}
        searchPlaceholder="Search code or name..."
        emptyMessage="No room types yet — add your first room type."
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => openRecord(row, 'view')} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => openRecord(row, 'edit')} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => openDelete(row)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Add room type' : mode === 'edit' ? 'Edit room type' : 'Room type details'}
            </DialogTitle>
            <DialogDescription>
              {readOnly ? 'Read-only view.' : 'Code is stored on the room record; use a short unique value.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                disabled={readOnly || mode === 'edit' || submitting}
                required={!readOnly}
                placeholder="e.g. icu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Display name</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                disabled={readOnly || submitting}
                required={!readOnly}
                placeholder="e.g. ICU"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v === true }))}
                disabled={readOnly || submitting}
              />
              <Label htmlFor="isActive" className="font-normal">
                Active
              </Label>
            </div>
            {!readOnly && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !form.code.trim() || !form.label.trim()}>
                  {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
                </Button>
              </DialogFooter>
            )}
            {readOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete room type</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold">{selected?.label}</span>? Rooms using this type may
              still show the old code until updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting || !selected}>
              {submitting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
