import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, DoorOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { loadRooms, saveRooms, loadBeds, saveBeds } from '@/pages/patient-management/roomsBedsStorage';

const ROOM_TYPES = [
  { value: 'med_surg', label: 'Medical / Surgical' },
  { value: 'icu', label: 'ICU' },
  { value: 'or', label: 'OR / Procedure' },
  { value: 'ed', label: 'ED / Observation' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
];

const emptyForm = () => ({
  roomNumber: '',
  displayName: '',
  floor: '',
  unit: '',
  roomType: 'med_surg',
  status: 'active',
  licensedBeds: '1',
  notes: '',
});

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('create'); // create | edit | view
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => {
      setRooms(loadRooms());
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const bedCountsByRoom = useMemo(() => {
    const beds = loadBeds();
    const map = {};
    beds.forEach((b) => {
      if (!b.roomId) return;
      map[b.roomId] = (map[b.roomId] || 0) + 1;
    });
    return map;
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const blob = [
        r.roomNumber,
        r.displayName,
        r.floor,
        r.unit,
        r.roomType,
        r.status,
        r.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rooms, search]);

  const rows = useMemo(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
    const base = (currentPage - 1) * pagination.limit;
    return filtered.slice(base, base + pagination.limit).map((row, i) => ({
      ...row,
      _srNo: base + i + 1,
      _bedCount: bedCountsByRoom[row.id] ?? 0,
    }));
  }, [filtered, pagination, bedCountsByRoom]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);

  const roomTypeLabel = (v) => ROOM_TYPES.find((x) => x.value === v)?.label || v;
  const statusLabel = (v) => STATUSES.find((x) => x.value === v)?.label || v;

  const openCreate = () => {
    setSelected(null);
    setMode('create');
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openView = (row) => {
    setSelected(row);
    setMode('view');
    setForm({
      roomNumber: row.roomNumber || '',
      displayName: row.displayName || '',
      floor: row.floor || '',
      unit: row.unit || '',
      roomType: row.roomType || 'med_surg',
      status: row.status || 'active',
      licensedBeds: String(row.licensedBeds ?? 1),
      notes: row.notes || '',
    });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setMode('edit');
    setForm({
      roomNumber: row.roomNumber || '',
      displayName: row.displayName || '',
      floor: row.floor || '',
      unit: row.unit || '',
      roomType: row.roomType || 'med_surg',
      status: row.status || 'active',
      licensedBeds: String(row.licensedBeds ?? 1),
      notes: row.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const licensed = Math.max(0, parseInt(form.licensedBeds, 10) || 0);
      const payload = {
        roomNumber: form.roomNumber.trim(),
        displayName: form.displayName.trim(),
        floor: form.floor.trim(),
        unit: form.unit.trim(),
        roomType: form.roomType,
        status: form.status,
        licensedBeds: licensed,
        notes: form.notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (mode === 'edit' && selected?.id) {
        setRooms((prev) => {
          const next = prev.map((r) => (r.id === selected.id ? { ...r, ...payload } : r));
          saveRooms(next);
          return next;
        });
      } else if (mode === 'create') {
        setRooms((prev) => {
          const id = `r_${Date.now()}`;
          const next = [{ id, ...payload, createdAt: new Date().toISOString() }, ...prev];
          saveRooms(next);
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
      setRooms((prev) => {
        const next = prev.filter((r) => r.id !== selected.id);
        saveRooms(next);
        return next;
      });
      const beds = loadBeds().filter((b) => b.roomId !== selected.id);
      saveBeds(beds);
      setDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: '_srNo', label: '#', render: (row) => row._srNo },
    {
      key: 'roomNumber',
      label: 'Room #',
      cellClassName: 'font-medium',
      render: (row) => row.roomNumber || '—',
    },
    { key: 'displayName', label: 'Display name', render: (row) => row.displayName || '—' },
    { key: 'floor', label: 'Floor', render: (row) => row.floor || '—' },
    { key: 'unit', label: 'Unit / wing', render: (row) => row.unit || '—' },
    { key: 'roomType', label: 'Type', render: (row) => roomTypeLabel(row.roomType) },
    { key: 'status', label: 'Status', render: (row) => statusLabel(row.status) },
    {
      key: 'beds',
      label: 'Beds (in use)',
      render: (row) => (
        <span className="tabular-nums">
          {row._bedCount} / {row.licensedBeds ?? 0}
        </span>
      ),
    },
  ];

  const readOnly = mode === 'view';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <DoorOpen className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Rooms</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Define inpatient locations: room number, unit, type, and licensed bed capacity. Bed
            assignments are managed on the Beds page.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add room
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Layers className="h-4 w-4" />
            Total rooms
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{rooms.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Active rooms</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {rooms.filter((r) => r.status === 'active').length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Licensed beds (sum)</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {rooms.reduce((acc, r) => acc + (Number(r.licensedBeds) || 0), 0)}
          </p>
        </div>
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
        searchPlaceholder="Search room, unit, floor, or type..."
        emptyMessage="No rooms yet — add your first room."
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Add room' : mode === 'edit' ? 'Edit room' : 'Room details'}
            </DialogTitle>
            <DialogDescription>
              {readOnly
                ? 'Read-only view of this room.'
                : 'Room identifiers appear on the census and bed board.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="roomNumber">Room number</Label>
                <Input
                  id="roomNumber"
                  value={form.roomNumber}
                  onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
                  disabled={readOnly}
                  required={!readOnly}
                  placeholder="e.g. 301"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  disabled={readOnly}
                  placeholder="Optional friendly name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={form.floor}
                  onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                  disabled={readOnly}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit / wing</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  disabled={readOnly}
                  placeholder="e.g. East Wing"
                />
              </div>
              <div className="space-y-2">
                <Label>Room type</Label>
                <Select
                  value={form.roomType}
                  onValueChange={(v) => setForm((f) => ({ ...f, roomType: v }))}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operational status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="licensedBeds">Licensed bed capacity</Label>
                <Input
                  id="licensedBeds"
                  type="number"
                  min={0}
                  value={form.licensedBeds}
                  onChange={(e) => setForm((f) => ({ ...f, licensedBeds: e.target.value }))}
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                disabled={readOnly}
                placeholder="Housekeeping, equipment, or census notes"
              />
            </div>
            {!readOnly && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !form.roomNumber.trim()}>
                  {submitting ? 'Saving…' : mode === 'create' ? 'Create room' : 'Save changes'}
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
            <DialogTitle>Delete room</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold">{selected?.roomNumber}</span> and unlink any beds
              in this room. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting || !selected}>
              {submitting ? 'Deleting…' : 'Delete room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
