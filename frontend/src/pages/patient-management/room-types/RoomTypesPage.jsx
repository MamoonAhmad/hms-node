import { useEffect, useMemo, useState } from 'react';
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

const STORAGE_KEY = 'hms_room_types';

const DEFAULT_ROOM_TYPES = [
  { id: 'rt_med_surg', code: 'med_surg', label: 'Medical / Surgical', isActive: true },
  { id: 'rt_icu', code: 'icu', label: 'ICU', isActive: true },
  { id: 'rt_or', code: 'or', label: 'OR / Procedure', isActive: true },
  { id: 'rt_ed', code: 'ed', label: 'ED / Observation', isActive: true },
  { id: 'rt_isolation', code: 'isolation', label: 'Isolation', isActive: true },
  { id: 'rt_other', code: 'other', label: 'Other', isActive: true },
];

function loadRoomTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOM_TYPES));
      return DEFAULT_ROOM_TYPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_ROOM_TYPES;
  } catch {
    return DEFAULT_ROOM_TYPES;
  }
}

function saveRoomTypes(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const emptyForm = () => ({
  code: '',
  label: '',
  isActive: true,
});

export function RoomTypesPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => {
      setItems(loadRoomTypes());
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((row) => {
      const blob = [row.code, row.label].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [items, search]);

  const rows = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pagination.limit));
    const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
    const base = (currentPage - 1) * pagination.limit;
    return filtered.slice(base, base + pagination.limit).map((row, i) => ({
      ...row,
      _srNo: base + i + 1,
    }));
  }, [filtered, pagination]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);

  const openCreate = () => {
    setSelected(null);
    setMode('create');
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openView = (row) => {
    setSelected(row);
    setMode('view');
    setForm({ code: row.code || '', label: row.label || '', isActive: row.isActive !== false });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setMode('edit');
    setForm({ code: row.code || '', label: row.label || '', isActive: row.isActive !== false });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toLowerCase().replace(/\s+/g, '_'),
        label: form.label.trim(),
        isActive: form.isActive,
        updatedAt: new Date().toISOString(),
      };

      if (mode === 'edit' && selected?.id) {
        setItems((prev) => {
          const next = prev.map((r) => (r.id === selected.id ? { ...r, ...payload } : r));
          saveRoomTypes(next);
          return next;
        });
      } else {
        setItems((prev) => {
          const id = `rt_${Date.now()}`;
          const next = [{ id, ...payload, createdAt: new Date().toISOString() }, ...prev];
          saveRoomTypes(next);
          return next;
        });
      }
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selected?.id) return;
    setSubmitting(true);
    try {
      setItems((prev) => {
        const next = prev.filter((r) => r.id !== selected.id);
        saveRoomTypes(next);
        return next;
      });
      setDeleteOpen(false);
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

      <DataTable
        columns={columns}
        data={rows}
        total={total}
        page={currentPage}
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
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => openView(row)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Edit">
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
                disabled={readOnly || mode === 'edit'}
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
                disabled={readOnly}
                required={!readOnly}
                placeholder="e.g. ICU"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v === true }))}
                disabled={readOnly}
              />
              <Label htmlFor="isActive" className="font-normal">
                Active
              </Label>
            </div>
            {!readOnly && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
