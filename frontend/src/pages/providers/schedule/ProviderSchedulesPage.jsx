import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Eye, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { providerSchedulesStore, formatAppointmentTypes, normalizeAppointmentTypes } from './providerSchedulesMock';
import { ProviderScheduleFormDialog } from './ProviderScheduleFormDialog';
import { ViewScheduleDialog } from './ViewScheduleDialog';

const DAYS_OPTIONS = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

const SCHEDULE_COLUMNS = [
  { key: 'providerName', label: 'Provider Name', cellClassName: 'font-medium' },
  { key: 'specialty', label: 'Specialty', render: (row) => row.specialty || '-' },
  { key: 'subSpecialty', label: 'Sub-Specialty', render: (row) => row.subSpecialty || '-' },
  { key: 'days', label: 'Days', render: (row) => (row.days || []).join(', ') || '-' },
  { key: 'timeSlot', label: 'Time Slot(s)', render: (row) => formatTimeSlot(row.startTime, row.endTime) },
  {
    key: 'appointmentType',
    label: 'Appointment Type',
    render: (row) => formatAppointmentTypes(row.appointmentType),
  },
  { key: 'overBooking', label: 'Over booking', render: (row) => (row.overBooking ?? 0) },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge variant={row.displayStatus === 'Active' ? 'default' : 'secondary'}>
        {row.displayStatus}
      </Badge>
    ),
  },
];

function DeleteConfirmDialog({ open, onOpenChange, schedule, onConfirm, isLoading }) {
  if (!schedule) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${open ? '' : 'hidden'}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 rounded-lg border bg-background p-6 shadow-lg max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold">Delete Schedule</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Are you sure you want to delete the schedule for <strong>{schedule.providerName}</strong>? This action can be undone later.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(schedule)} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProviderSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({
    providerIds: [],
    specialty: '',
    days: [],
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSchedules = useCallback(() => {
    setIsLoading(true);
    providerSchedulesStore.getSchedules(filters).then((data) => {
      setSchedules(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [filters]);

  useEffect(() => {
    providerSchedulesStore.getProviders(false).then(setProviders);
  }, []);

  const providerOptions = useMemo(
    () => providers.map((p) => ({ value: String(p.id), label: p.name })),
    [providers],
  );

  const filteredBySearch = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return schedules;
    return schedules.filter((row) => {
      const providerName = (row.providerName || '').toLowerCase();
      const specialty = (row.specialty || '').toLowerCase();
      const subSpecialty = (row.subSpecialty || '').toLowerCase();
      const days = (row.days || []).join(' ').toLowerCase();
      const appointmentType = normalizeAppointmentTypes(row.appointmentType).join(' ').toLowerCase();
      const overBooking = String(row.overBooking ?? '').toLowerCase();
      const status = (row.displayStatus || row.status || '').toLowerCase();
      return (
        providerName.includes(q) ||
        specialty.includes(q) ||
        subSpecialty.includes(q) ||
        days.includes(q) ||
        appointmentType.includes(q) ||
        overBooking.includes(q) ||
        status.includes(q)
      );
    });
  }, [schedules, search]);

  const total = filteredBySearch.length;
  const currentPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, Math.ceil(total / pagination.limit))
  );
  const paginatedSchedules = useMemo(
    () =>
      filteredBySearch.slice(
        (currentPage - 1) * pagination.limit,
        currentPage * pagination.limit
      ),
    [filteredBySearch, currentPage, pagination.limit]
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

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleView = (schedule) => {
    setSelectedSchedule(schedule);
    setIsViewOpen(true);
  };

  const handleToggleStatus = async (schedule) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerSchedulesStore.toggleScheduleStatus(schedule.id);
      setMessage({ type: 'success', text: 'Schedule status updated' });
      fetchSchedules();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async (schedule) => {
    setIsDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerSchedulesStore.deleteSchedule(schedule.id);
      setMessage({ type: 'success', text: 'Schedule deleted' });
      setIsDeleteOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (selectedSchedule) {
        await providerSchedulesStore.updateSchedule(selectedSchedule.id, data);
        setMessage({ type: 'success', text: 'Schedule updated' });
      } else {
        await providerSchedulesStore.createSchedule(data);
        setMessage({ type: 'success', text: 'Schedule added' });
      }
      setIsFormOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save schedule' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provider Schedules</h1>
          <p className="text-muted-foreground">Configure provider availability for appointment booking</p>
        </div>
        <Button onClick={handleAddSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {message.text && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'error'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <MultiSelect
              options={providerOptions}
              value={filters.providerIds}
              onChange={(v) => setFilters((prev) => ({ ...prev, providerIds: v }))}
              placeholder="All providers"
              className="w-full"
              searchable
              showSelectAll
              selectAllLabel="Select all providers"
            />
          </div>
          <div className="space-y-2">
            <Label>Specialty</Label>
            <Input
              className="w-full"
              placeholder="Filter by specialty"
              value={filters.specialty}
              onChange={(e) => setFilters((prev) => ({ ...prev, specialty: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Days</Label>
            <MultiSelect
              options={DAYS_OPTIONS}
              value={filters.days}
              onChange={(v) => setFilters((prev) => ({ ...prev, days: v }))}
              placeholder="All days"
              className="w-full"
              showSelectAll
              selectAllLabel="Select all days"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-date-range">From - To Date</Label>
            <DateRangePicker
              id="schedule-date-range"
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              onChange={({ dateFrom, dateTo }) =>
                setFilters((prev) => ({ ...prev, dateFrom, dateTo }))
              }
              placeholder="Select date range"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v === 'all' ? '' : v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Listing */}
      <DataTable
        columns={SCHEDULE_COLUMNS}
        data={paginatedSchedules}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
          searchPlaceholder="Search by provider, specialty, days, type, status..."
        emptyMessage="No schedules found. Click Add Schedule to create one."
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(row)} title="View" aria-label="View">
              <Eye className="h-4 w-4 icon-action-view" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row)} title="Edit" aria-label="Edit">
              <Pencil className="h-4 w-4 icon-action-edit" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(row)} disabled={isSubmitting} title={row.status === 'Active' ? 'Deactivate' : 'Activate'} aria-label={row.status === 'Active' ? 'Deactivate' : 'Activate'}>
              <Power className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(row)} title="Delete" aria-label="Delete">
              <Trash2 className="h-4 w-4 icon-action-delete" />
            </Button>
          </div>
        )}
      />

      <ProviderScheduleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        schedule={selectedSchedule}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
      <ViewScheduleDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        schedule={selectedSchedule}
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        schedule={selectedSchedule}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}
