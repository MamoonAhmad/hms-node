import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
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
import { AppointmentHistorySidebar } from '@/components/appointments/AppointmentHistorySidebar';
import { AppointmentTimeline } from '@/components/appointments/AppointmentTimeline';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { buildAppointmentSubmitPayloadFromRegistration } from '@/components/patients/patientRegistrationAppointmentConstants';
import {
  getDefaultAppointmentStatusName,
  getAppointmentStatusesFallback,
  statusChipStyle,
} from '@/lib/appointmentStatuses';
import {
  buildPatientSearchOption,
  buildProviderSearchOption,
  formatPatientDemographics,
  formatPatientListName,
  formatProviderListName,
} from '@/lib/appointmentUtils';
import {
  appointmentApi,
  appointmentStatusApi,
  appointmentTypeApi,
  departmentApi,
  patientApi,
  providerApi,
} from '@/services/api';

import { cn } from '@/lib/utils';

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const FILTER_CONTROL_CLASS = 'h-10 w-full';

const SEGMENTED_GROUP_CLASS =
  'flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1 shadow-sm';

const SEGMENTED_ITEM_ACTIVE =
  'bg-background text-foreground shadow-sm hover:bg-background';

const SEGMENTED_ITEM_IDLE =
  'text-muted-foreground hover:bg-background/70 hover:text-foreground';

const timelineRangeOptions = [
  { value: 'day', label: 'Day' },
];

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentStatusCatalog, setAppointmentStatusCatalog] = useState(
    () => getAppointmentStatusesFallback(),
  );

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
  const [dateFilter, setDateFilter] = useState(() => toDateKey(new Date()));
  const [dateToFilter, setDateToFilter] = useState('');

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientFormFromAppointment, setPatientFormFromAppointment] = useState(false);
  const [pendingPatientId, setPendingPatientId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const fetchMasterData = useCallback(async () => {
    try {
      const [deptRes, provRes, typeRes] = await Promise.all([
        departmentApi.getAll({ limit: 200 }),
        providerApi.getAll({ limit: 500, isActive: true }),
        appointmentTypeApi.getActive(),
      ]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setProviders(Array.isArray(provRes.data) ? provRes.data : []);
      setAppointmentTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  }, []);

  const buildFilterParams = useCallback(
    (overrides = {}) => {
      const params = {
        search: search || undefined,
        appointmentType: typeFilter || undefined,
        departmentId: departmentFilter || undefined,
        providerId: providerFilter || undefined,
        patientId: patientFilter || undefined,
        ...overrides,
      };

      if (viewMode === 'list') {
        if (dateFilter) params.dateFrom = dateFilter;
        if (dateToFilter) params.dateTo = dateToFilter;
      } else if (timelineRange === 'day') {
        params.date = dateFilter;
        params.excludeHiddenTimeline = true;
      }

      return params;
    },
    [
      search,
      typeFilter,
      departmentFilter,
      providerFilter,
      patientFilter,
      dateFilter,
      dateToFilter,
      viewMode,
      timelineRange,
    ],
  );

  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await appointmentApi.getStatusCounts(buildFilterParams());
      setStatusCounts(response.data || { all: 0 });
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  }, [buildFilterParams]);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        ...buildFilterParams(),
        page: pagination.page,
        limit: viewMode === 'timeline' ? 200 : pagination.limit,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await appointmentApi.getAll(params);
      setAppointments(response.data);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, buildFilterParams, viewMode]);

  useEffect(() => {
    let cancelled = false;
    appointmentStatusApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length) setAppointmentStatusCatalog(rows);
      })
      .catch(() => {
        if (!cancelled) setAppointmentStatusCatalog(getAppointmentStatusesFallback());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchMasterData();
  }, [fetchPatients, fetchMasterData]);

  useEffect(() => {
    fetchAppointments();
    fetchStatusCounts();
  }, [fetchAppointments, fetchStatusCounts]);

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
      case 'dateTo':
        setDateToFilter(actualValue);
        break;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreate = () => {
    setSelectedAppointment(null);
    setFormMode('create');
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
      const { bookAppointment, ...patientData } = data;
      const response = await patientApi.create(patientData);
      const patientId = response?.data?.id;

      if (bookAppointment && patientId) {
        const appointmentPayload = buildAppointmentSubmitPayloadFromRegistration(data, patientId, {
          defaultStatus: getDefaultAppointmentStatusName(),
        });
        await appointmentApi.create(appointmentPayload);
        await fetchAppointments();
        setIsPatientFormOpen(false);
        setPatientFormFromAppointment(false);
        await fetchPatients();
        return;
      }

      setIsPatientFormOpen(false);
      await fetchPatients();
      if (patientFormFromAppointment && patientId) {
        setPendingPatientId(patientId);
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
    setDateToFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const patientFilterOptions = patients.map((patient) => buildPatientSearchOption(patient));

  const departmentFilterOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.departmentName,
  }));

  const providerFilterOptions = providers.map((provider) => buildProviderSearchOption(provider));

  const typeFilterOptions = appointmentTypes.map((type) => ({
    value: type.name,
    label: type.name,
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
    setFormMode('create');
    setInitialDate(date);
    setInitialTime(time);
    setIsFormOpen(true);
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setFormMode('view');
    setInitialDate('');
    setInitialTime('');
    setIsFormOpen(true);
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setFormMode('edit');
    setInitialDate('');
    setInitialTime('');
    setIsFormOpen(true);
  };

  const openHistory = async (appointment) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await appointmentApi.getHistory(appointment.id);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
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
      setFormMode('create');
      fetchAppointments();
      fetchStatusCounts();
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
      fetchStatusCounts();
    } catch (err) {
      alert(err.message);
    }
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
            aria-label={viewMode === 'list' ? 'Appointment date from' : 'Appointment date'}
          />

          {viewMode === 'list' && (
            <Input
              type="date"
              value={dateToFilter}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className={FILTER_CONTROL_CLASS}
              aria-label="Appointment date to"
            />
          )}

          <Select
            value={typeFilter || 'all'}
            onValueChange={(v) => handleFilterChange('type', v)}
          >
            <SelectTrigger className={FILTER_CONTROL_CLASS}>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {typeFilterOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SearchableSelect
            value={departmentFilter || 'all'}
            onValueChange={(v) => handleFilterChange('department', v)}
            options={[{ value: 'all', label: 'All departments' }, ...departmentFilterOptions]}
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
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            </div>
          )}

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
                  All ({statusCounts.all || 0})
                </Button>
                {appointmentStatusCatalog.map((statusRow) => {
                  const status = statusRow.name;
                  const chipStyle = statusChipStyle(status, appointmentStatusCatalog);
                  const isActive = statusFilter === status;
                  const count = statusCounts[status] || 0;
                  return (
                  <Button
                    key={statusRow.id || status}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusTabChange(status)}
                    className={cn(
                      'h-8 shrink-0',
                      isActive ? 'shadow-sm ring-1 ring-border/60' : SEGMENTED_ITEM_IDLE,
                    )}
                    style={isActive ? chipStyle : undefined}
                  >
                    {status} ({count})
                  </Button>
                  );
                })}
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
          onAppointmentClick={handleView}
          onDayClick={handleTimelineDayClick}
          statusCatalog={appointmentStatusCatalog}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sr. No.</TableHead>
                <TableHead>Patient Information</TableHead>
                <TableHead>Appointment Type</TableHead>
                <TableHead>Appointment Status</TableHead>
                <TableHead>Appointment Time</TableHead>
                <TableHead>Provider Information</TableHead>
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
                appointments.map((appointment, index) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="text-muted-foreground">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPatientListName(appointment.patient)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPatientDemographics(appointment.patient)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                        {appointment.appointmentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(value) =>
                          handleStatusChange(appointment.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-40">
                          <span
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                            style={statusChipStyle(appointment.status, appointmentStatusCatalog)}
                          >
                            {appointment.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentStatusCatalog.map((statusRow) => (
                            <SelectItem key={statusRow.id || statusRow.name} value={statusRow.name}>
                              <span
                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                                style={statusChipStyle(statusRow.name, appointmentStatusCatalog)}
                              >
                                {statusRow.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(appointment.appointmentTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatProviderListName(appointment.providerRef) ||
                          appointment.provider ||
                          '—'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {appointment.providerRef?.npi || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleView(appointment)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(appointment)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 icon-action-edit" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openHistory(appointment)}
                          title="Timeline history"
                        >
                          <Clock className="h-4 w-4" />
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
          if (!open) {
            setPendingPatientId('');
            setFormMode('create');
          }
        }}
        appointment={selectedAppointment}
        patients={patients}
        onSubmit={handleFormSubmit}
        onAddPatient={() => handleCreatePatient(true)}
        prefillPatientId={pendingPatientId}
        isLoading={isSubmitting}
        initialDate={initialDate}
        initialTime={initialTime}
        mode={formMode}
        onModeChange={setFormMode}
      />

      <AppointmentHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        isLoading={historyLoading}
      />

      <PatientFormDialog
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        patient={null}
        onSubmit={handlePatientSubmit}
        isLoading={isSubmitting}
        registrationMode="quick"
      />
    </div>
  );
}
