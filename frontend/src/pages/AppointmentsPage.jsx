import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppointmentFormDialog } from '@/components/appointments/AppointmentFormDialog';
import { DeleteAppointmentDialog } from '@/components/appointments/DeleteAppointmentDialog';
import { AppointmentTimeline } from '@/components/appointments/AppointmentTimeline';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  DEPARTMENT_OPTIONS,
  OUTPATIENT_PROVIDERS,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { appointmentApi, patientApi } from '@/services/api';

import { cn } from '@/lib/utils';

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const appointmentStatuses = [
  'Scheduled',
  'Checked-In',
  'In Progress',
  'Completed',
  'Cancelled',
  'No-Show',
  'Rescheduled',
];

const FILTER_CONTROL_CLASS = 'h-10 w-full';

const SEGMENTED_GROUP_CLASS =
  'flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1 shadow-sm';

const SEGMENTED_ITEM_ACTIVE =
  'bg-background text-foreground shadow-sm hover:bg-background';

const SEGMENTED_ITEM_IDLE =
  'text-muted-foreground hover:bg-background/70 hover:text-foreground';

const timelineRangeOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const appointmentTypes = ['New', 'Follow-up', 'Televisit'];

const statusColors = {
  Scheduled: 'bg-primary/10 text-primary',
  'Checked-In': 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'No-Show': 'bg-gray-100 text-gray-800',
  Rescheduled: 'bg-orange-100 text-orange-800',
};

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'list' or 'timeline'
  const [viewMode, setViewMode] = useState('timeline');
  const [timelineRange, setTimelineRange] = useState('day');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
    // Default to today's date
    return new Date().toISOString().split('T')[0];
  });

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientFormFromAppointment, setPatientFormFromAppointment] = useState(false);
  const [pendingPatientId, setPendingPatientId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For pre-filling form from timeline click
  const [initialDate, setInitialDate] = useState('');
  const [initialTime, setInitialTime] = useState('');

  // Fetch patients for the form dropdown
  const fetchPatients = useCallback(async () => {
    try {
      const response = await patientApi.getAll({ limit: 100 });
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit:
          viewMode === 'timeline' && timelineRange !== 'day'
            ? 500
            : viewMode === 'timeline'
              ? 100
              : pagination.limit,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.appointmentType = typeFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (providerFilter) params.provider = providerFilter;
      if (patientFilter) params.patientId = patientFilter;
      if (dateFilter && (viewMode === 'list' || (viewMode === 'timeline' && timelineRange === 'day'))) {
        params.date = dateFilter;
      }

      const response = await appointmentApi.getAll(params);
      setAppointments(response.data);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, typeFilter, departmentFilter, providerFilter, patientFilter, dateFilter, viewMode, timelineRange]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusTabChange = (value) => {
    setStatusFilter(value === 'all' ? '' : value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTimelineRangeChange = (value) => {
    setTimelineRange(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTimelineDayClick = (dateKey) => {
    setDateFilter(dateKey);
    setTimelineRange('day');
  };

  const handleFilterChange = (filterType, value) => {
    const actualValue = value === 'all' ? '' : value;
    switch (filterType) {
      case 'type':
        setTypeFilter(actualValue);
        break;
      case 'department':
        setDepartmentFilter(actualValue);
        break;
      case 'provider':
        setProviderFilter(actualValue);
        break;
      case 'patient':
        setPatientFilter(actualValue);
        break;
      case 'date':
        setDateFilter(actualValue);
        break;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreate = () => {
    setSelectedAppointment(null);
    setInitialDate('');
    setInitialTime('');
    setIsFormOpen(true);
  };

  const handleCreatePatient = (fromAppointment = false) => {
    setPatientFormFromAppointment(fromAppointment);
    setIsPatientFormOpen(true);
  };

  const handlePatientSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await patientApi.create(data);
      setIsPatientFormOpen(false);
      await fetchPatients();
      if (patientFormFromAppointment && response?.data?.id) {
        setPendingPatientId(response.data.id);
        if (!isFormOpen) {
          setIsFormOpen(true);
        }
      }
      setPatientFormFromAppointment(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setDepartmentFilter('');
    setProviderFilter('');
    setPatientFilter('');
    setDateFilter(toDateKey(new Date()));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const patientFilterOptions = patients.map((patient) => ({
    value: patient.id,
    label: `${patient.firstName} ${patient.lastName} (${patient.mrn})`,
  }));

  const providerFilterOptions = OUTPATIENT_PROVIDERS.map((p) => ({
    value: p.name,
    label: p.name,
  }));

  const hasActiveFilters =
    search ||
    statusFilter ||
    typeFilter ||
    departmentFilter ||
    providerFilter ||
    patientFilter;

  const handleTimeSlotClick = (date, time) => {
    setSelectedAppointment(null);
    setInitialDate(date);
    setInitialTime(time);
    setIsFormOpen(true);
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setInitialDate('');
    setInitialTime('');
    setIsFormOpen(true);
  };

  const handleDelete = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedAppointment) {
        await appointmentApi.update(selectedAppointment.id, data);
      } else {
        await appointmentApi.create(data);
      }
      setIsFormOpen(false);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await appointmentApi.delete(selectedAppointment.id);
      setIsDeleteOpen(false);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentApi.updateStatus(appointmentId, newStatus);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  const navigateDate = (direction) => {
    const current = parseLocalDate(dateFilter);
    if (viewMode === 'timeline' && timelineRange === 'week') {
      current.setDate(current.getDate() + direction * 7);
    } else if (viewMode === 'timeline' && timelineRange === 'month') {
      current.setMonth(current.getMonth() + direction);
    } else {
      current.setDate(current.getDate() + direction);
    }
    setDateFilter(toDateKey(current));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments</p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
          <div className={SEGMENTED_GROUP_CLASS}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'gap-1.5',
                viewMode === 'timeline' ? SEGMENTED_ITEM_ACTIVE : SEGMENTED_ITEM_IDLE,
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Timeline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'gap-1.5',
                viewMode === 'list' ? SEGMENTED_ITEM_ACTIVE : SEGMENTED_ITEM_IDLE,
              )}
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleCreatePatient(false)}>
            <Users className="h-4 w-4" />
            New Patient
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <form onSubmit={handleSearch} className="min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patient, provider, MRN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn('pl-9', FILTER_CONTROL_CLASS)}
              />
            </div>
          </form>

          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className={FILTER_CONTROL_CLASS}
            aria-label="Appointment date"
          />

          <Select
            value={typeFilter || 'all'}
            onValueChange={(v) => handleFilterChange('type', v)}
          >
            <SelectTrigger className={FILTER_CONTROL_CLASS}>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {appointmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SearchableSelect
            value={departmentFilter || 'all'}
            onValueChange={(v) => handleFilterChange('department', v)}
            options={[{ value: 'all', label: 'All departments' }, ...DEPARTMENT_OPTIONS]}
            placeholder="All departments"
            triggerClassName={FILTER_CONTROL_CLASS}
          />

          <SearchableSelect
            value={providerFilter || 'all'}
            onValueChange={(v) => handleFilterChange('provider', v)}
            options={[{ value: 'all', label: 'All providers' }, ...providerFilterOptions]}
            placeholder="All providers"
            triggerClassName={FILTER_CONTROL_CLASS}
          />

          <SearchableSelect
            value={patientFilter || 'all'}
            onValueChange={(v) => handleFilterChange('patient', v)}
            options={[{ value: 'all', label: 'All patients' }, ...patientFilterOptions]}
            placeholder="All patients"
            triggerClassName={FILTER_CONTROL_CLASS}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {viewMode === 'timeline' ? (
              <div className={SEGMENTED_GROUP_CLASS}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateDate(-1)}
                  className={SEGMENTED_ITEM_IDLE}
                  aria-label="Previous period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter(toDateKey(new Date()))}
                  className={cn('px-3', SEGMENTED_ITEM_IDLE)}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateDate(1)}
                  className={SEGMENTED_ITEM_IDLE}
                  aria-label="Next period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div />
            )}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="overflow-x-auto pb-1">
              <div className={cn(SEGMENTED_GROUP_CLASS, 'min-w-max')}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusTabChange('all')}
                  className={cn(
                    'h-8 shrink-0',
                    !statusFilter ? SEGMENTED_ITEM_ACTIVE : SEGMENTED_ITEM_IDLE,
                  )}
                >
                  All
                </Button>
                {appointmentStatuses.map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusTabChange(status)}
                    className={cn(
                      'h-8 shrink-0',
                      statusFilter === status
                        ? cn('shadow-sm ring-1 ring-border/60', statusColors[status])
                        : SEGMENTED_ITEM_IDLE,
                    )}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {viewMode === 'timeline' && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Calendar view
              </p>
              <div className={cn(SEGMENTED_GROUP_CLASS, 'w-fit')}>
                {timelineRangeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTimelineRangeChange(option.value)}
                    className={cn(
                      'flex-1',
                      timelineRange === option.value
                        ? SEGMENTED_ITEM_ACTIVE
                        : SEGMENTED_ITEM_IDLE,
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <AppointmentTimeline
          appointments={appointments}
          selectedDate={dateFilter}
          rangeMode={timelineRange}
          onTimeSlotClick={handleTimeSlotClick}
          onAppointmentClick={handleEdit}
          onDayClick={handleTimelineDayClick}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {formatDate(appointment.appointmentDate)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(appointment.appointmentTime)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {appointment.patient?.mrn}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                        {appointment.appointmentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {appointment.duration} min
                    </TableCell>
                    <TableCell>
                      {appointment.provider || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(value) =>
                          handleStatusChange(appointment.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              statusColors[appointment.status] || ''
                            )}
                          >
                            {appointment.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                  statusColors[status] || ''
                                )}
                              >
                                {status}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Pencil className="h-4 w-4 icon-action-edit" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(appointment)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 icon-action-delete" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} appointments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AppointmentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setPendingPatientId('');
        }}
        appointment={selectedAppointment}
        patients={patients}
        onSubmit={handleFormSubmit}
        onAddPatient={() => handleCreatePatient(true)}
        prefillPatientId={pendingPatientId}
        isLoading={isSubmitting}
        initialDate={initialDate}
        initialTime={initialTime}
      />

      <DeleteAppointmentDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        appointment={selectedAppointment}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />

      <PatientFormDialog
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        patient={null}
        onSubmit={handlePatientSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
