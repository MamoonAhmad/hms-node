import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Eye, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadRooms, loadBeds, saveBeds } from '@/pages/patient-management/roomsBedsStorage';

const BED_LIST_TABS = {
  ALL: 'all',
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  UNAVAILABLE: 'unavailable',
};

const BED_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'blocked', label: 'Blocked' },
];

const emptyForm = () => ({
  bedLabel: '',
  roomId: '',
  status: 'available',
  patientName: '',
  service: '',
  notes: '',
});

function bedsForListTab(beds, listTab) {
  switch (listTab) {
    case BED_LIST_TABS.AVAILABLE:
      return beds.filter((b) => b.status === 'available');
    case BED_LIST_TABS.OCCUPIED:
      return beds.filter((b) => b.status === 'occupied');
    case BED_LIST_TABS.RESERVED:
      return beds.filter((b) => b.status === 'reserved');
    case BED_LIST_TABS.UNAVAILABLE:
      return beds.filter((b) => b.status === 'cleaning' || b.status === 'blocked');
    default:
      return beds;
  }
}

function emptyMessageForTab(listTab) {
  switch (listTab) {
    case BED_LIST_TABS.AVAILABLE:
      return 'No available beds match your search.';
    case BED_LIST_TABS.OCCUPIED:
      return 'No occupied beds match your search.';
    case BED_LIST_TABS.RESERVED:
      return 'No reserved beds match your search.';
    case BED_LIST_TABS.UNAVAILABLE:
      return 'No beds in cleaning or blocked status match your search.';
    default:
      return 'No beds yet — add a bed or load sample data from Rooms.';
  }
}

function statusVariant(status) {
  switch (status) {
    case 'available':
      return 'default';
    case 'occupied':
      return 'secondary';
    case 'cleaning':
      return 'outline';
    case 'reserved':
      return 'secondary';
    case 'blocked':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function BedsPage() {
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [listTab, setListTab] = useState(BED_LIST_TABS.ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const refreshFromStorage = () => {
    setRooms(loadRooms());
    setBeds(loadBeds());
  };

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => {
      refreshFromStorage();
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const roomLabel = (id) => {
    const r = rooms.find((x) => x.id === id);
    if (!r) return '—';
    return r.displayName ? `${r.roomNumber} — ${r.displayName}` : r.roomNumber;
  };

  const filtered = useMemo(() => {
    const scoped = bedsForListTab(beds, listTab);
    const q = search.toLowerCase().trim();
    if (!q) return scoped;
    return scoped.filter((b) => {
      const room = roomLabel(b.roomId).toLowerCase();
      const blob = [b.bedLabel, b.status, b.patientName, b.service, b.notes, room]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [beds, search, rooms, listTab]);

  const rows = useMemo(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
    const base = (currentPage - 1) * pagination.limit;
    return filtered.slice(base, base + pagination.limit).map((row, i) => ({
      ...row,
      _srNo: base + i + 1,
      _roomLabel: roomLabel(row.roomId),
    }));
  }, [filtered, pagination, rooms]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);

  const statusLabel = (v) => BED_STATUSES.find((x) => x.value === v)?.label || v;

  const openCreate = () => {
    refreshFromStorage();
    setSelected(null);
    setMode('create');
    setForm({
      ...emptyForm(),
      roomId: rooms[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const openView = (row) => {
    refreshFromStorage();
    setSelected(row);
    setMode('view');
    setForm({
      bedLabel: row.bedLabel || '',
      roomId: row.roomId || '',
      status: row.status || 'available',
      patientName: row.patientName || '',
      service: row.service || '',
      notes: row.notes || '',
    });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    refreshFromStorage();
    setSelected(row);
    setMode('edit');
    setForm({
      bedLabel: row.bedLabel || '',
      roomId: row.roomId || '',
      status: row.status || 'available',
      patientName: row.patientName || '',
      service: row.service || '',
      notes: row.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        bedLabel: form.bedLabel.trim(),
        roomId: form.roomId || null,
        status: form.status,
        patientName: form.status === 'occupied' ? form.patientName.trim() : '',
        service: form.service.trim(),
        notes: form.notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (mode === 'edit' && selected?.id) {
        setBeds((prev) => {
          const next = prev.map((b) => (b.id === selected.id ? { ...b, ...payload } : b));
          saveBeds(next);
          return next;
        });
      } else {
        setBeds((prev) => {
          const id = `b_${Date.now()}`;
          const next = [{ id, ...payload, createdAt: new Date().toISOString() }, ...prev];
          saveBeds(next);
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
      setBeds((prev) => {
        const next = prev.filter((b) => b.id !== selected.id);
        saveBeds(next);
        return next;
      });
      setDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: '_srNo', label: '#', render: (row) => row._srNo },
    {
      key: 'bedLabel',
      label: 'Bed',
      cellClassName: 'font-medium',
      render: (row) => row.bedLabel || '—',
    },
    { key: '_roomLabel', label: 'Room', render: (row) => row._roomLabel },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={statusVariant(row.status)} className="font-normal">
          {statusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'patientName',
      label: 'Patient',
      render: (row) =>
        row.status === 'occupied' && row.patientName ? (
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {row.patientName}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: 'service', label: 'Service', render: (row) => row.service || '—' },
  ];

  const readOnly = mode === 'view';
  const occupiedHint = form.status === 'occupied';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <BedDouble className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Beds</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Track each physical bed: link it to a room, set census status, and optionally note the
            patient when the bed is occupied. Add rooms first if your room list is empty.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0" disabled={!rooms.length}>
          <Plus className="mr-2 h-4 w-4" />
          Add bed
        </Button>
      </div>

      {!rooms.length && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          No rooms defined yet. Open{' '}
          <strong className="font-semibold">Rooms</strong> under Rooms Management and create at
          least one room before adding beds.
        </div>
      )}

      <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
        <Tabs
          value={listTab}
          onValueChange={(value) => {
            setListTab(value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <TabsList className="grid h-auto w-full max-w-4xl grid-cols-2 gap-0.5 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value={BED_LIST_TABS.ALL}>All beds</TabsTrigger>
            <TabsTrigger value={BED_LIST_TABS.AVAILABLE}>Available</TabsTrigger>
            <TabsTrigger value={BED_LIST_TABS.OCCUPIED}>Occupied</TabsTrigger>
            <TabsTrigger value={BED_LIST_TABS.RESERVED}>Reserved</TabsTrigger>
            <TabsTrigger value={BED_LIST_TABS.UNAVAILABLE}>Cleaning / blocked</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Total beds</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{beds.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Available</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {beds.filter((b) => b.status === 'available').length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Occupied</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {beds.filter((b) => b.status === 'occupied').length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Cleaning / blocked</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {beds.filter((b) => b.status === 'cleaning' || b.status === 'blocked').length}
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
        searchPlaceholder="Search bed, room, patient, or status..."
        emptyMessage={emptyMessageForTab(listTab)}
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
              {mode === 'create' ? 'Add bed' : mode === 'edit' ? 'Edit bed' : 'Bed details'}
            </DialogTitle>
            <DialogDescription>
              {readOnly
                ? 'Read-only view.'
                : 'Beds are listed on the inpatient bed board and can mirror your ADT system later.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bedLabel">Bed label</Label>
              <Input
                id="bedLabel"
                value={form.bedLabel}
                onChange={(e) => setForm((f) => ({ ...f, bedLabel: e.target.value }))}
                disabled={readOnly}
                required={!readOnly}
                placeholder="e.g. 301-A"
              />
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                value={form.roomId || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
                disabled={readOnly || !rooms.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.displayName ? `${r.roomNumber} — ${r.displayName}` : r.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bed status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BED_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient (when occupied)</Label>
              <Input
                id="patientName"
                value={form.patientName}
                onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                disabled={readOnly || !occupiedHint}
                placeholder={occupiedHint ? 'Patient name or MRN label' : 'Set status to Occupied to edit'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service / specialty</Label>
              <Input
                id="service"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                disabled={readOnly}
                placeholder="e.g. General, Telemetry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedNotes">Notes</Label>
              <Textarea
                id="bedNotes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                disabled={readOnly}
              />
            </div>
            {!readOnly && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !form.bedLabel.trim() || !form.roomId}>
                  {submitting ? 'Saving…' : mode === 'create' ? 'Create bed' : 'Save changes'}
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
            <DialogTitle>Delete bed</DialogTitle>
            <DialogDescription>
              Remove bed <span className="font-semibold">{selected?.bedLabel}</span>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={submitting || !selected}>
              {submitting ? 'Deleting…' : 'Delete bed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
