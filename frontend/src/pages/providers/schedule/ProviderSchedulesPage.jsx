import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Eye, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { providerApi, providerScheduleApi, specialtyApi, departmentApi } from '@/services/api';
import {
  DAYS_FILTER_OPTIONS,
  formatAppointmentTypes,
  formatBreakHours,
  formatLocations,
  formatTimeSlot,
  formatScheduleDepartments,
  buildSchedulePayload,
} from '@/lib/providerScheduleUtils';
import { ProviderScheduleFormDialog } from './ProviderScheduleFormDialog';
import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';

const SCHEDULE_COLUMNS = [
  { key: 'providerName', label: 'Provider Name', cellClassName: 'font-medium' },
  {
    key: 'departmentName',
    label: 'Department(s)',
    render: (row) => formatScheduleDepartments(row),
  },
  { key: 'specialty', label: 'Specialty', render: (row) => row.specialty || '-' },
  { key: 'subSpecialty', label: 'Sub-Specialty', render: (row) => row.subSpecialty || '-' },
  { key: 'days', label: 'Days', render: (row) => (row.days || []).join(', ') || '-' },
  { key: 'timeSlot', label: 'Time Slot(s)', render: (row) => formatTimeSlot(row.startTime, row.endTime) },
  {
    key: 'breakHours',
    label: 'Break Hours',
    render: (row) => formatBreakHours(row),
  },
  {
    key: 'appointmentType',
    label: 'Appointment Type',
    render: (row) => formatAppointmentTypes(row.appointmentType),
  },
  { key: 'overBooking', label: 'Over Booking', render: (row) => row.overBooking ?? 0 },
  {
    key: 'locations',
    label: 'Locations',
    render: (row) => formatLocations(row.locations),
  },
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

export function ProviderSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [providers, setProviders] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const {
    departmentId: topbarDepartmentId,
    setSelectedDepartmentId,
    ALL_DEPARTMENTS_VALUE,
  } = useTopbarDepartment();
  const [filters, setFilters] = useState({
    providerIds: [],
    specialtyId: '',
    departmentId: topbarDepartmentId || '',
    days: [],
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [formMode, setFormMode] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const next = topbarDepartmentId || '';
    setFilters((prev) => (prev.departmentId === next ? prev : { ...prev, departmentId: next }));
  }, [topbarDepartmentId]);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await providerScheduleApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        providerIds: filters.providerIds.length ? filters.providerIds : undefined,
        specialtyId: filters.specialtyId || undefined,
        departmentId: filters.departmentId || topbarDepartmentId || undefined,
        days: filters.days.length ? filters.days : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        status: filters.status || undefined,
      });
      setSchedules(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total ?? 0,
        totalPages: response.pagination?.totalPages ?? 0,
      }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load schedules' });
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, search, topbarDepartmentId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [filters, search, topbarDepartmentId]);

  useEffect(() => {
    providerApi.getAll({ limit: 500 }).then((res) => {
      const rows = res.data || [];
      setProviders(
        rows.map((p) => ({
          id: p.id,
          name: [p.firstName, p.lastName].filter(Boolean).join(' '),
          npi: p.npi || '',
          specialty: p.specialty?.name || '',
          subSpecialty: p.subSpecialty?.name || '',
          specialtyId: p.specialty?.id,
          subSpecialtyId: p.subSpecialty?.id,
          isActive: p.isActive,
          departmentId: p.departmentId || p.department?.id || null,
          departmentIds: p.departmentIds || [],
          departments: p.departments?.length
            ? p.departments
            : p.department
              ? [p.department]
              : [],
          department: p.department || null,
        })),
      );
    }).catch(() => setProviders([]));

    specialtyApi.getActive().then((res) => setSpecialties(res.data || [])).catch(() => setSpecialties([]));
    departmentApi.getActive().then((res) => setDepartments(res.data || [])).catch(() => setDepartments([]));
  }, []);

  const providerOptions = useMemo(
    () => providers.map((p) => ({ value: p.id, label: p.name })),
    [providers],
  );

  const specialtyOptions = useMemo(
    () => specialties.map((s) => ({ value: s.id, label: s.name })),
    [specialties],
  );

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.departmentName })),
    [departments],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const openForm = (mode, schedule = null) => {
    setSelectedSchedule(schedule);
    setFormMode(mode);
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedSchedule(null);
  };

  const handleToggleStatus = async (schedule) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerScheduleApi.toggleStatus(schedule.id);
      setMessage({ type: 'success', text: 'Schedule status updated' });
      fetchSchedules();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSchedule) return;
    setIsDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerScheduleApi.delete(selectedSchedule.id);
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

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = buildSchedulePayload(formData);
      if (formMode === 'edit' && selectedSchedule) {
        await providerScheduleApi.update(selectedSchedule.id, payload);
        setMessage({ type: 'success', text: 'Schedule updated' });
      } else {
        await providerScheduleApi.create(payload);
        setMessage({ type: 'success', text: 'Schedule added' });
      }
      closeForm();
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
        <Button onClick={() => openForm('create')}>
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

      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
            <Select
              value={filters.specialtyId || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, specialtyId: v === 'all' ? '' : v }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All specialties</SelectItem>
                {specialtyOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={filters.departmentId || 'all'}
              onValueChange={(v) => {
                const next = v === 'all' ? '' : v;
                setFilters((prev) => ({ ...prev, departmentId: next }));
                setSelectedDepartmentId(next || ALL_DEPARTMENTS_VALUE);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departmentOptions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Days</Label>
            <MultiSelect
              options={DAYS_FILTER_OPTIONS}
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

      <DataTable
        columns={SCHEDULE_COLUMNS}
        data={schedules}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by provider, specialty, days, type, locations, status..."
        emptyMessage="No schedules found. Click Add Schedule to create one."
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openForm('view', row)}
              title="View"
              aria-label="View"
            >
              <Eye className="h-4 w-4 icon-action-view" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openForm('edit', row)}
              title="Edit"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4 icon-action-edit" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToggleStatus(row)}
              disabled={isSubmitting}
              title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
              aria-label={row.status === 'Active' ? 'Deactivate' : 'Activate'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedSchedule(row);
                setIsDeleteOpen(true);
              }}
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 icon-action-delete" />
            </Button>
          </div>
        )}
      />

      <ProviderScheduleFormDialog
        open={formMode === 'create' || formMode === 'edit' || formMode === 'view'}
        readOnly={formMode === 'view'}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        schedule={selectedSchedule}
        editingScheduleId={formMode === 'edit' ? selectedSchedule?.id : undefined}
        providers={providers}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Do you want to delete the schedule for{' '}
            <strong>{selectedSchedule?.providerName}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
