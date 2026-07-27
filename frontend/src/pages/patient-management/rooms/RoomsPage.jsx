import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, DoorOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
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
import { roomApi, roomTypeApi, departmentApi } from '@/services/api';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';

const ROOM_LIST_TABS = {
  ALL: 'all',
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
};

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
];

function emptyMessageForTab(listTab) {
  switch (listTab) {
    case ROOM_LIST_TABS.ACTIVE:
      return 'No active rooms match your search.';
    case ROOM_LIST_TABS.MAINTENANCE:
      return 'No rooms in maintenance match your search.';
    case ROOM_LIST_TABS.OFFLINE:
      return 'No offline rooms match your search.';
    default:
      return 'No rooms yet — add your first room.';
  }
}

const emptyForm = () => ({
  roomNumber: '',
  displayName: '',
  floor: '',
  unit: '',
  departmentId: '',
  roomTypeIds: [],
  status: 'active',
  licensedBeds: '1',
  notes: '',
});

export function RoomsPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalRooms: 0, activeRooms: 0, licensedBedsSum: 0 });
  const [roomTypes, setRoomTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [listTab, setListTab] = useState(ROOM_LIST_TABS.ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    roomTypeApi
      .getActive()
      .then((response) => setRoomTypes(response.data || []))
      .catch(() => setRoomTypes([]));
    departmentApi
      .getActive()
      .then((response) => setDepartments(response.data || []))
      .catch(() => setDepartments([]));
  }, []);

  const statusFilter = listTab === ROOM_LIST_TABS.ALL ? undefined : listTab;

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roomApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter,
      });
      setItems(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
      if (response.summary) {
        setSummary(response.summary);
      }
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const roomTypeOptions = useMemo(
    () => roomTypes.map((t) => ({ value: t.id, label: t.label || t.code })),
    [roomTypes],
  );

  const departmentOptions = useMemo(() => {
    const options = departments.map((d) => ({
      value: d.id,
      label: d.departmentCode
        ? `${d.departmentName} (${d.departmentCode})`
        : d.departmentName,
    }));
    if (
      form.departmentId &&
      !options.some((o) => String(o.value) === String(form.departmentId))
    ) {
      const label =
        selected?.departmentName ||
        selected?.department?.departmentName ||
        'Current department';
      options.unshift({ value: form.departmentId, label });
    }
    return options;
  }, [departments, form.departmentId, selected]);

  const rows = useMemo(
    () =>
      items.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [items, pagination.page, pagination.limit],
  );

  const statusLabel = (v) => STATUSES.find((x) => x.value === v)?.label || v;

  const openCreate = () => {
    setSelected(null);
    setMode('create');
    setForm({
      ...emptyForm(),
      roomTypeIds: roomTypes[0]?.id ? [roomTypes[0].id] : [],
    });
    setDialogOpen(true);
  };

  const openRecord = async (row, nextMode) => {
    try {
      const response = await roomApi.getById(row.id);
      const record = response.data;
      setSelected(record);
      setMode(nextMode);
      setForm({
        roomNumber: record.roomNumber || '',
        displayName: record.displayName || '',
        floor: record.floor || '',
        unit: record.unit || '',
        departmentId: record.departmentId || '',
        roomTypeIds: record.roomTypeIds || record.roomTypes?.map((t) => t.id) || [],
        status: record.status || 'active',
        licensedBeds: String(record.licensedBeds ?? 1),
        notes: record.notes || '',
      });
      setDialogOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load room');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') return;

    if (!form.roomTypeIds.length) {
      alert('Select at least one room type');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roomNumber: form.roomNumber.trim(),
        displayName: form.displayName.trim() || null,
        floor: form.floor.trim() || null,
        unit: form.unit.trim() || null,
        departmentId: form.departmentId || null,
        roomTypeIds: form.roomTypeIds,
        status: form.status,
        licensedBeds: Math.max(0, parseInt(form.licensedBeds, 10) || 0),
        notes: form.notes.trim() || null,
      };

      if (mode === 'edit' && selected?.id) {
        await roomApi.update(selected.id, payload);
      } else {
        await roomApi.create(payload);
      }
      setDialogOpen(false);
      setSelected(null);
      fetchRooms();
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
      await roomApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      fetchRooms();
    } catch (err) {
      alert(err.message || 'Delete failed');
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
    { key: 'department', label: 'Department', render: (row) => row.departmentName || '—' },
    { key: 'floor', label: 'Floor', render: (row) => row.floor || '—' },
    { key: 'unit', label: 'Unit / wing', render: (row) => row.unit || '—' },
    { key: 'roomType', label: 'Type', render: (row) => row.roomTypeLabels || '—' },
    { key: 'status', label: 'Status', render: (row) => statusLabel(row.status) },
    {
      key: 'beds',
      label: 'Beds (in use)',
      render: (row) => (
        <span className="tabular-nums">
          {row.bedCount ?? 0} / {row.licensedBeds ?? 0}
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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Layers className="h-4 w-4" />
            Total rooms
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalRooms}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Active rooms</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.activeRooms}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Licensed beds (sum)</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.licensedBedsSum}</p>
        </div>
      </div>

      <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
        <Tabs
          value={listTab}
          onValueChange={(value) => {
            setListTab(value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <TabsList className="grid h-auto w-full max-w-3xl grid-cols-2 gap-0.5 sm:grid-cols-4">
            <TabsTrigger value={ROOM_LIST_TABS.ALL}>All rooms</TabsTrigger>
            <TabsTrigger value={ROOM_LIST_TABS.ACTIVE}>Active</TabsTrigger>
            <TabsTrigger value={ROOM_LIST_TABS.MAINTENANCE}>Maintenance</TabsTrigger>
            <TabsTrigger value={ROOM_LIST_TABS.OFFLINE}>Offline</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

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
        searchPlaceholder="Search room, unit, floor, or type..."
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
                  disabled={readOnly || submitting}
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
                  disabled={readOnly || submitting}
                  placeholder="Optional friendly name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={form.floor}
                  onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                  disabled={readOnly || submitting}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit / wing</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  disabled={readOnly || submitting}
                  placeholder="e.g. East Wing"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="departmentId">Department</Label>
                {readOnly ? (
                  <Input
                    value={selected?.departmentName || '—'}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                ) : (
                  <SearchableSelect
                    value={form.departmentId || '__none__'}
                    onValueChange={(value) =>
                      setForm((f) => ({ ...f, departmentId: value === '__none__' ? '' : value }))
                    }
                    options={[
                      { value: '__none__', label: 'No department' },
                      ...departmentOptions,
                    ]}
                    placeholder={
                      departments.length ? 'Search department…' : 'No departments available'
                    }
                    disabled={submitting || !departments.length}
                    preserveOptionOrder
                    triggerClassName="w-full"
                  />
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="roomTypeIds">Room type</Label>
                {readOnly ? (
                  <Input
                    value={selected?.roomTypeLabels || '—'}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                ) : (
                  <MultiSelect
                    id="roomTypeIds"
                    options={roomTypeOptions}
                    value={form.roomTypeIds}
                    onChange={(value) => setForm((f) => ({ ...f, roomTypeIds: value }))}
                    placeholder={roomTypes.length ? 'Select room type(s)' : 'No room types available'}
                    searchable
                    searchPlaceholder="Search room types..."
                    disabled={submitting || !roomTypes.length}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Operational status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  disabled={readOnly || submitting}
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
              <div className="space-y-2">
                <Label htmlFor="licensedBeds">Licensed bed capacity</Label>
                <Input
                  id="licensedBeds"
                  type="number"
                  min={0}
                  value={form.licensedBeds}
                  onChange={(e) => setForm((f) => ({ ...f, licensedBeds: e.target.value }))}
                  disabled={readOnly || submitting}
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
                disabled={readOnly || submitting}
                placeholder="Housekeeping, equipment, or census notes"
              />
            </div>
            {!readOnly && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !form.roomNumber.trim() || !form.roomTypeIds.length}
                >
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
              Remove <span className="font-semibold">{selected?.roomNumber}</span> and delete any beds
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
