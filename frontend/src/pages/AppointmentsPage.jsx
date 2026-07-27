import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
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
import { AppointmentActionMenu } from '@/components/appointments/AppointmentActionMenu';
import { AppointmentDetailSidebar } from '@/components/appointments/AppointmentDetailSidebar';
import { AppointmentFormDialog } from '@/components/appointments/AppointmentFormDialog';
import { AppointmentHistorySidebar } from '@/components/appointments/AppointmentHistorySidebar';
import { AppointmentTimeline } from '@/components/appointments/AppointmentTimeline';
import { RoomPatientDialog } from '@/components/appointments/RoomPatientDialog';
import {
  getEditAppointmentPath,
  getNewAppointmentPath,
} from '@/pages/appointments/AppointmentFormPage';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { createAppointmentFromRegistrationIfNeeded } from '@/components/patients/patientRegistrationAppointmentConstants';
import {
  getDefaultAppointmentStatusName,
  getAppointmentStatusesFallback,
  getCanonicalAppointmentStatuses,
  appointmentStatusSoftClass,
  appointmentStatusSolidClass,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatuses';
import { APPOINTMENT_STATUS } from '@/lib/appointmentStatusWorkflow';
import { eventStatusChipClass } from '@/lib/appointmentEventStatus';
import {
  buildPatientSearchOption,
  buildProviderSearchOption,
  formatPatientDemographics,
  formatPatientListName,
  formatProviderListName,
} from '@/lib/appointmentUtils';
import { patientPhotoSrc } from '@/pages/patient-dashboard/patientChartUtils';
import {
  appointmentApi,
  appointmentStatusApi,
  appointmentTypeApi,
  departmentApi,
  patientApi,
  providerApi,
  providerBlockHourApi,
} from '@/services/api';

import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';
import { cn } from '@/lib/utils';

function PatientListAvatar({ patient }) {
  const photo = patientPhotoSrc(patient);
  const initials =
    `${(patient?.firstName?.[0] || '').toUpperCase()}${(patient?.lastName?.[0] || '').toUpperCase()}` ||
    '?';

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--status-info-bg)] text-xs font-semibold text-[var(--status-info-fg)] ring-1 ring-[var(--status-info-border)]"
      aria-hidden
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

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

function shiftDateKey(dateKey, days) {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function shiftMonthKey(dateKey, months) {
  const date = parseLocalDate(dateKey);
  date.setMonth(date.getMonth() + months);
  return toDateKey(date);
}

function getWeekRange(dateKey) {
  const anchor = parseLocalDate(dateKey);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { dateFrom: toDateKey(start), dateTo: toDateKey(end) };
}

function getMonthRange(dateKey) {
  const anchor = parseLocalDate(dateKey);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { dateFrom: toDateKey(start), dateTo: toDateKey(end) };
}

function resolveProviderDepartmentPrefill(provider, departmentFilter) {
  if (!provider) return '';
  const providerDeptIds = provider.departmentIds?.length
    ? provider.departmentIds
    : provider.departmentId
      ? [provider.departmentId]
      : [];
  if (departmentFilter && providerDeptIds.includes(departmentFilter)) {
    return departmentFilter;
  }
  return provider.departmentId || providerDeptIds[0] || '';
}

const FILTER_CONTROL_CLASS = 'h-10 w-full';

const FILTER_CHIP_BASE =
  'inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

const FILTER_CHIP_IDLE =
  'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground';

const FILTER_CHIP_ACTIVE =
  'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90';

const VIEW_TOGGLE_GROUP_CLASS =
  'flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/80 p-1';

const VIEW_TOGGLE_ACTIVE =
  'bg-card text-foreground shadow-sm ring-1 ring-border hover:bg-card';

const VIEW_TOGGLE_IDLE =
  'text-muted-foreground hover:bg-card/80 hover:text-foreground';

const STATUS_BADGE_CLASS =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold';

const timelineRangeOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function AppointmentsPage() {
  const navigate = useNavigate();
  const {
    departmentId: topbarDepartmentId,
    setSelectedDepartmentId,
    ALL_DEPARTMENTS_VALUE,
  } = useTopbarDepartment();
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
  const [departmentFilter, setDepartmentFilter] = useState(topbarDepartmentId || '');
  const [providerFilter, setProviderFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => toDateKey(new Date()));
  const [dateToFilter, setDateToFilter] = useState('');

  useEffect(() => {
    const next = topbarDepartmentId || '';
    setDepartmentFilter((prev) => (prev === next ? prev : next));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [topbarDepartmentId]);

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientFormFromAppointment, setPatientFormFromAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomAppointment, setRoomAppointment] = useState(null);
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [providerBlockHours, setProviderBlockHours] = useState([]);

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
      } else if (timelineRange === 'week') {
        const range = getWeekRange(dateFilter);
        params.dateFrom = range.dateFrom;
        params.dateTo = range.dateTo;
        params.excludeHiddenTimeline = true;
      } else if (timelineRange === 'month') {
        const range = getMonthRange(dateFilter);
        params.dateFrom = range.dateFrom;
        params.dateTo = range.dateTo;
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
        setAppointmentStatusCatalog(getCanonicalAppointmentStatuses(rows));
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

  useEffect(() => {
    if (!providerFilter || viewMode !== 'timeline') {
      setProviderBlockHours([]);
      return undefined;
    }

    let cancelled = false;

    providerBlockHourApi
      .getAll({
        providerId: providerFilter,
        status: 'Active',
        limit: 100,
      })
      .then((res) => {
        if (!cancelled) {
          setProviderBlockHours(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setProviderBlockHours([]);
      });

    return () => {
      cancelled = true;
    };
  }, [providerFilter, viewMode]);

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

  const handlePreviousDay = () => {
    setDateFilter((prev) => {
      if (timelineRange === 'month') return shiftMonthKey(prev, -1);
      const days = timelineRange === 'week' ? -7 : -1;
      return shiftDateKey(prev, days);
    });
  };

  const handleNextDay = () => {
    setDateFilter((prev) => {
      if (timelineRange === 'month') return shiftMonthKey(prev, 1);
      const days = timelineRange === 'week' ? 7 : 1;
      return shiftDateKey(prev, days);
    });
  };

  const handleViewPatientAppointments = (appointment) => {
    if (!appointment?.patientId) return;
    navigate(`/appointments/patient/${appointment.patientId}`);
  };

  const handleCalendarAppointmentClick = (appointment) => {
    handleView(appointment);
  };

  const applyAppointmentUpdate = (appointmentId, updated) => {
    setAppointments((prev) =>
      prev.map((row) => (row.id === appointmentId ? { ...row, ...updated } : row)),
    );
    fetchAppointments();
    fetchStatusCounts();
  };

  const handleAdvanceStatus = async (appointment, nextStatus) => {
    if (!appointment?.id || !nextStatus) return;
    try {
      const res =
        nextStatus === APPOINTMENT_STATUS.CHECKED_IN
          ? await appointmentApi.checkIn(appointment.id)
          : await appointmentApi.updateStatus(appointment.id, nextStatus);
      const updated = res?.data || { ...appointment, status: nextStatus };
      applyAppointmentUpdate(appointment.id, updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    if (!appointment?.id) return;
    const patientName = formatPatientListName(appointment.patient);
    const confirmed = window.confirm(
      `Cancel appointment for ${patientName}? This sets the appointment status to Cancelled.`,
    );
    if (!confirmed) return;
    try {
      const res = await appointmentApi.updateStatus(
        appointment.id,
        APPOINTMENT_STATUS.CANCELLED,
      );
      const updated = res?.data || { ...appointment, status: APPOINTMENT_STATUS.CANCELLED };
      applyAppointmentUpdate(appointment.id, updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkNoShow = async (appointment) => {
    if (!appointment?.id) return;
    const patientName = formatPatientListName(appointment.patient);
    const confirmed = window.confirm(
      `Mark appointment for ${patientName} as No Show?`,
    );
    if (!confirmed) return;
    try {
      const res = await appointmentApi.updateStatus(
        appointment.id,
        APPOINTMENT_STATUS.NO_SHOW,
      );
      const updated = res?.data || { ...appointment, status: APPOINTMENT_STATUS.NO_SHOW };
      applyAppointmentUpdate(appointment.id, updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const openRoomDialog = (appointment) => {
    setRoomAppointment(appointment);
    setRoomDialogOpen(true);
  };

  const handleAssignRoom = async (roomId) => {
    if (!roomAppointment?.id) return;
    setRoomSubmitting(true);
    try {
      const res = await appointmentApi.assignRoom(roomAppointment.id, roomId);
      const updated = res?.data || {
        ...roomAppointment,
        roomId,
        eventStatus: 'Roomed',
      };
      setAppointments((prev) =>
        prev.map((row) => (row.id === roomAppointment.id ? { ...row, ...updated } : row)),
      );
      setRoomDialogOpen(false);
      setRoomAppointment(null);
      fetchAppointments();
      fetchStatusCounts();
    } catch (err) {
      alert(err.message);
    } finally {
      setRoomSubmitting(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const actualValue = value === 'all' ? '' : value;
    switch (filterType) {
      case 'type':
        setTypeFilter(actualValue);
        break;
      case 'department':
        setDepartmentFilter(actualValue);
        setSelectedDepartmentId(actualValue || ALL_DEPARTMENTS_VALUE);
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

  const prefillProvider = providerFilter
    ? providers.find((provider) => provider.id === providerFilter)
    : null;
  const resolvedDepartmentPrefill = resolveProviderDepartmentPrefill(
    prefillProvider,
    departmentFilter,
  );

  const handleCreate = () => {
    navigate(
      getNewAppointmentPath({
        date: viewMode === 'timeline' ? dateFilter : '',
        providerId: providerFilter || '',
        departmentId: resolvedDepartmentPrefill || departmentFilter || '',
        appointmentType: typeFilter || '',
        patientId: patientFilter || '',
      }),
    );
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

      const createdAppointment = patientId
        ? await createAppointmentFromRegistrationIfNeeded(patientId, data, {
            appointmentApi,
            defaultStatus: getDefaultAppointmentStatusName(),
            evaluateRegistrationStatus: true,
          })
        : null;

      if (createdAppointment) {
        await fetchAppointments();
        setIsPatientFormOpen(false);
        setPatientFormFromAppointment(false);
        await fetchPatients();
        return;
      }

      setIsPatientFormOpen(false);
      await fetchPatients();
      if (patientFormFromAppointment && patientId) {
        setPatientFormFromAppointment(false);
        navigate(
          getNewAppointmentPath({
            patientId,
            providerId: providerFilter || '',
            departmentId: resolvedDepartmentPrefill || departmentFilter || '',
            appointmentType: typeFilter || '',
          }),
        );
        return;
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
    setSelectedDepartmentId(ALL_DEPARTMENTS_VALUE);
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
    navigate(
      getNewAppointmentPath({
        date,
        time,
        providerId: providerFilter || '',
        departmentId: resolvedDepartmentPrefill || departmentFilter || '',
        appointmentType: typeFilter || '',
        patientId: patientFilter || '',
      }),
    );
  };

  const handleView = async (appointment) => {
    if (!appointment?.id) return;
    setDetailOpen(true);
    setDetailAppointment(appointment);
    setDetailLoading(true);
    try {
      const res = await appointmentApi.getById(appointment.id);
      setDetailAppointment(res?.data || appointment);
    } catch {
      setDetailAppointment(appointment);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditOrReschedule = (appointment) => {
    if (!appointment?.id) return;
    navigate(getEditAppointmentPath(appointment.id));
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
          <div className={VIEW_TOGGLE_GROUP_CLASS}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'gap-1.5',
                viewMode === 'timeline' ? VIEW_TOGGLE_ACTIVE : VIEW_TOGGLE_IDLE,
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
                viewMode === 'list' ? VIEW_TOGGLE_ACTIVE : VIEW_TOGGLE_IDLE,
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

          <div className="space-y-2.5">
            <p className="text-sm font-medium text-foreground">Status</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusTabChange('all')}
                className={cn(
                  FILTER_CHIP_BASE,
                  !statusFilter ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE,
                )}
              >
                All ({statusCounts.all || 0})
              </button>
              {appointmentStatusCatalog.map((statusRow) => {
                const status = statusRow.name;
                const isActive = statusFilter === status;
                const count = statusCounts[status] || 0;
                return (
                  <button
                    key={statusRow.id || status}
                    type="button"
                    onClick={() => handleStatusTabChange(status)}
                    className={cn(
                      FILTER_CHIP_BASE,
                      isActive
                        ? appointmentStatusSolidClass(status)
                        : cn(appointmentStatusSoftClass(status), 'hover:opacity-90'),
                    )}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === 'timeline' && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground">Calendar view</p>
              <div className="flex flex-wrap gap-2">
                {timelineRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTimelineRangeChange(option.value)}
                    className={cn(
                      FILTER_CHIP_BASE,
                      timelineRange === option.value ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE,
                    )}
                  >
                    {option.label}
                  </button>
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
          onAppointmentClick={handleCalendarAppointmentClick}
          onDayClick={handleTimelineDayClick}
          onPreviousDay={handlePreviousDay}
          onNextDay={handleNextDay}
          statusCatalog={appointmentStatusCatalog}
          blockHours={providerBlockHours}
          filteredProviderId={providerFilter}
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
                <TableHead>Event Status</TableHead>
                <TableHead>Appointment Time</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Provider Information</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
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
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PatientListAvatar patient={appointment.patient} />
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {formatPatientListName(appointment.patient)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatPatientDemographics(appointment.patient)}
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            MRN: {appointment.patient?.mrn || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            Enc: {appointment.encounterNumber || '—'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {appointment.appointmentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          STATUS_BADGE_CLASS,
                          appointmentStatusSoftClass(appointment.status),
                        )}
                      >
                        {normalizeAppointmentStatus(appointment.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          STATUS_BADGE_CLASS,
                          eventStatusChipClass(appointment.eventStatus || 'Scheduled'),
                        )}
                      >
                        {appointment.eventStatus || 'Scheduled'}
                      </span>
                      {appointment.room?.displayName || appointment.room?.roomNumber ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Room: {appointment.room.displayName || appointment.room.roomNumber}
                        </div>
                      ) : null}
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
                      {appointment.departmentRef?.departmentName ||
                        appointment.department ||
                        '—'}
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
                      <AppointmentActionMenu
                        appointment={appointment}
                        onViewPatientAppointments={handleViewPatientAppointments}
                        onAdvanceStatus={handleAdvanceStatus}
                        onCancelAppointment={handleCancelAppointment}
                        onMarkNoShow={handleMarkNoShow}
                        onRoomPatient={openRoomDialog}
                        onView={handleView}
                        onEditOrReschedule={handleEditOrReschedule}
                        onHistory={openHistory}
                      />
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
            setFormMode('create');
          }
        }}
        appointment={selectedAppointment}
        patients={patients}
        onSubmit={handleFormSubmit}
        onAddPatient={() => handleCreatePatient(true)}
        prefillProviderId={providerFilter}
        prefillDepartmentId={resolvedDepartmentPrefill}
        prefillAppointmentType={typeFilter}
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

      <AppointmentDetailSidebar
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailAppointment(null);
        }}
        appointment={detailAppointment}
        isLoading={detailLoading}
        statusCatalog={appointmentStatusCatalog}
      />

      <RoomPatientDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        appointment={roomAppointment}
        onSubmit={handleAssignRoom}
        isLoading={roomSubmitting}
      />

      <PatientFormDialog
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        patient={null}
        onSubmit={handlePatientSubmit}
        isLoading={isSubmitting}
        registrationMode="quick"
        onNavigateToExisting={(existingPatient) => {
          setIsPatientFormOpen(false);
          if (existingPatient?.mrn) {
            navigate(`/patients?mrn=${encodeURIComponent(existingPatient.mrn)}`);
            return;
          }
          navigate('/patients');
        }}
      />
    </div>
  );
}
