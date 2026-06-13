import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { bedApi, roomApi, patientApi } from '@/services/api';

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
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'blocked', label: 'Blocked' },
];

const PATIENT_SELECT_STATUSES = ['available', 'reserved'];
const PATIENT_READONLY_STATUSES = ['occupied'];
const NO_PATIENT_STATUSES = ['cleaning', 'blocked'];

const emptyForm = () => ({
  bedLabel: '',
  roomId: '',
  status: 'available',
  patientId: '',
  service: '',
  notes: '',
});

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
      return 'No beds yet — add a bed after creating at least one room.';
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

function formatPatientOption(patient) {
  const name = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
  return name ? `${name} (${patient.mrn})` : patient.mrn;
}

export function BedsPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, available: 0, occupied: 0, unavailable: 0 });
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [listTab, setListTab] = useState(BED_LIST_TABS.ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const listTabParam = listTab === BED_LIST_TABS.ALL ? undefined : listTab;

  const fetchBeds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bedApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        listTab: listTabParam,
      });
      setItems(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
      if (response.summary) setSummary(response.summary);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, listTabParam]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const loadFormOptions = async () => {
    setLoadingOptions(true);
    try {
      const [roomsRes, patientsRes] = await Promise.all([
        roomApi.getAll({ limit: 500 }),
        patientApi.getAll({ limit: 500 }),
      ]);
      setRooms(roomsRes.data || []);
      setPatients(patientsRes.data || []);
      return {
        rooms: roomsRes.data || [],
        patients: patientsRes.data || [],
      };
    } catch {
      setRooms([]);
      setPatients([]);
      return { rooms: [], patients: [] };
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadFormOptions();
  }, []);

  const rows = useMemo(
    () =>
      items.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [items, pagination.page, pagination.limit],
  );

  const statusLabel = (v) => BED_STATUSES.find((x) => x.value === v)?.label || v;

  const showPatientSelect = PATIENT_SELECT_STATUSES.includes(form.status);
  const showPatientReadOnly = PATIENT_READONLY_STATUSES.includes(form.status);
  const hidePatientField = NO_PATIENT_STATUSES.includes(form.status);

  const matchedPatient = patients.find((p) => p.id === form.patientId);
  const linkedPatientName =
    selected?.patientName || (matchedPatient ? formatPatientOption(matchedPatient) : '');

  const handleStatusChange = (status) => {
    setForm((prev) => {
      const next = { ...prev, status };
      if (NO_PATIENT_STATUSES.includes(status)) {
        next.patientId = '';
      }
      return next;
    });
  };

  const openCreate = async () => {
    const { rooms: roomList } = await loadFormOptions();
    setSelected(null);
    setMode('create');
    setForm({
      ...emptyForm(),
      roomId: roomList[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const openRecord = async (row, nextMode) => {
    await loadFormOptions();
    try {
      const response = await bedApi.getById(row.id);
      const record = response.data;
      setSelected(record);
      setMode(nextMode);
      setForm({
        bedLabel: record.bedLabel || '',
        roomId: record.roomId || '',
        status: record.status || 'available',
        patientId: record.patientId || '',
        service: record.service || '',
        notes: record.notes || '',
      });
      setDialogOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load bed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') return;

    if (form.status === 'occupied' && !form.patientId) {
      alert('Assign a patient while status is Available or Reserved before marking the bed Occupied.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bedLabel: form.bedLabel.trim(),
        roomId: form.roomId,
        status: form.status,
        service: form.service.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (PATIENT_SELECT_STATUSES.includes(form.status)) {
        payload.patientId = form.patientId || null;
      } else if (form.status === 'occupied' && form.patientId) {
        payload.patientId = form.patientId;
      }

      if (mode === 'edit' && selected?.id) {
        await bedApi.update(selected.id, payload);
      } else {
        await bedApi.create(payload);
      }
      setDialogOpen(false);
      setSelected(null);
      fetchBeds();
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
      await bedApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      fetchBeds();
    } catch (err) {
      alert(err.message || 'Delete failed');
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
    { key: 'roomLabel', label: 'Room', render: (row) => row.roomLabel || '—' },
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
        row.patientName ? (
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <BedDouble className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Beds</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Track each physical bed: link it to a room, set census status, and assign patients from
            the registry when the bed is available or reserved.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0" disabled={!rooms.length}>
          <Plus className="mr-2 h-4 w-4" />
          Add bed
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {!rooms.length && !isLoading && (
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
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Available</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {summary.available}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Occupied</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.occupied}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Cleaning / blocked</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.unavailable}</p>
        </div>
      </div>

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
        searchPlaceholder="Search bed, room, patient, or status..."
        emptyMessage={emptyMessageForTab(listTab)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Add bed' : mode === 'edit' ? 'Edit bed' : 'Bed details'}
            </DialogTitle>
            <DialogDescription>
              {readOnly
                ? 'Read-only view.'
                : 'Assign patients from the registry when the bed is available or reserved.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bedLabel">Bed label</Label>
              <Input
                id="bedLabel"
                value={form.bedLabel}
                onChange={(e) => setForm((f) => ({ ...f, bedLabel: e.target.value }))}
                disabled={readOnly || submitting}
                required={!readOnly}
                placeholder="e.g. 301-A"
              />
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select
                value={form.roomId || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
                disabled={readOnly || submitting || !rooms.length}
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
                onValueChange={handleStatusChange}
                disabled={readOnly || submitting}
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

            {!hidePatientField && showPatientReadOnly && (
              <div className="space-y-2">
                <Label htmlFor="patientReadOnly">Patient</Label>
                <Input
                  id="patientReadOnly"
                  value={selected?.patientName || linkedPatientName || '—'}
                  disabled
                  readOnly
                  className="bg-muted"
                />
              </div>
            )}

            {!hidePatientField && showPatientSelect && (
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select
                  value={form.patientId || '__none__'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, patientId: v === '__none__' ? '' : v }))
                  }
                  disabled={readOnly || submitting || loadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingOptions ? 'Loading patients…' : 'Select patient (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No patient assigned</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {formatPatientOption(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="service">Service / specialty</Label>
              <Input
                id="service"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                disabled={readOnly || submitting}
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
                disabled={readOnly || submitting}
              />
            </div>
            {!readOnly && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
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
