import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, DoorOpen, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { RoomPatientDialog } from '@/components/appointments/RoomPatientDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';
import { appointmentApi, appointmentStatusApi } from '@/services/api';
import {
  formatPatientListName,
  formatProviderListName,
  formatAppointmentDateTime,
} from '@/lib/appointmentUtils';
import {
  statusChipStyle,
  getAppointmentStatusesFallback,
  getCanonicalAppointmentStatuses,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatuses';
import {
  eventStatusChipStyle,
  canRoomPatient,
  isAppointmentRoomed,
} from '@/lib/appointmentEventStatus';
import {
  ENCOUNTER_WORKFLOW_TABS,
  matchesWorkflowTab,
  countByWorkflowTab,
  resolveEncounterWorkflowStage,
  mapAppointmentStatusToNursingStatus,
} from '@/lib/encounterWorkflow';
import {
  formatGenderLabel,
  formatPatientDobWithAge,
  formatPatientInsuranceSummary,
  formatPatientListAgeLabel,
  getConsentStatusMeta,
} from '@/components/patients/listing/patientListUtils';
import { getWaitTime, getTlos } from '@/lib/visitTiming';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTrackingPatientName(patient) {
  if (!patient) return '—';
  const first = patient.firstName || '';
  const last = patient.lastName || '';
  const middleInitial = patient.middleName
    ? `${String(patient.middleName).charAt(0).toUpperCase()}.`
    : '';
  const name = [first, middleInitial, last].filter(Boolean).join(' ');
  return name || formatPatientListName(patient);
}

function enrichRow(appointment) {
  const patient = appointment.patient;
  return {
    ...appointment,
    workflowStage: resolveEncounterWorkflowStage(appointment),
    nursingStatus: mapAppointmentStatusToNursingStatus(appointment.status),
    nurseId: appointment.assignedNurseId || null,
    assignedToId: patient?.assignedToId || null,
    providerId: appointment.providerId || appointment.providerRef?.id || null,
  };
}

function PatientInformationCell({ row }) {
  const patient = row.patient;
  if (!patient) return <span className="text-muted-foreground">—</span>;

  const dobAge = formatPatientDobWithAge(patient.dateOfBirth);
  const dobOnly = dobAge !== '—' ? dobAge.split(' (')[0] : '—';
  const ageLabel = formatPatientListAgeLabel(patient.dateOfBirth);
  const gender = formatGenderLabel(patient.gender);
  const demoLine = [dobOnly, gender, ageLabel ? `(${ageLabel})` : null].filter(Boolean).join(', ');

  return (
    <div className="min-w-[200px] space-y-0.5 text-sm">
      <p className="font-medium text-foreground">{formatTrackingPatientName(patient)}</p>
      <p className="text-xs text-muted-foreground">{demoLine || '—'}</p>
      <p className="text-xs tabular-nums text-foreground/80">
        <span className="text-muted-foreground">MRN </span>
        {patient.mrn || '—'}
      </p>
      <p className="text-xs tabular-nums font-mono text-foreground/80">
        <span className="font-sans text-muted-foreground">Enc </span>
        {row.encounterNumber || '—'}
      </p>
    </div>
  );
}

function ProviderCell({ row }) {
  const provider = row.providerRef;
  const name =
    (provider ? formatProviderListName(provider) : null) ||
    row.provider ||
    '—';
  const npi = provider?.npi;

  return (
    <div className="min-w-[140px] space-y-0.5 text-sm">
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {npi ? `NPI ${npi}` : 'NPI —'}
      </p>
    </div>
  );
}

function TimingCell({ value, title }) {
  if (!value || value.label === '—') {
    return <span className="text-muted-foreground">—</span>;
  }

  const className = [
    'tabular-nums text-sm font-medium whitespace-nowrap',
    value.isLong ? 'text-[var(--warning)]' : 'text-foreground',
    value.isLive ? '' : 'text-muted-foreground',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{value.label}</span>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}

export function OutpatientTrackingBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departmentId } = useTopbarDepartment();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowTab, setWorkflowTab] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 25 });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(() => toDateKey());
  const [dateTo, setDateTo] = useState('');
  const [statusCatalog, setStatusCatalog] = useState(() => getAppointmentStatusesFallback());
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomAppointment, setRoomAppointment] = useState(null);
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    appointmentStatusApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setStatusCatalog(getCanonicalAppointmentStatuses(list));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Tick every 30s so Wait Time / TLOS stay live without a full refresh.
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await appointmentApi.getAll({
        page: 1,
        limit: 500,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        departmentId: departmentId || undefined,
      });
      setRows((response.data || []).map(enrichRow));
    } catch (err) {
      setError(err.message || 'Failed to load tracking board');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFrom, dateTo, departmentId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        ENCOUNTER_WORKFLOW_TABS.map((tab) => [
          tab.id,
          countByWorkflowTab(rows, tab.id, user?.id),
        ]),
      ),
    [rows, user?.id],
  );

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesWorkflowTab(row, workflowTab, user?.id)),
    [rows, workflowTab, user?.id],
  );

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const base = (currentPage - 1) * pagination.limit;
  const pagedRows = useMemo(
    () => filteredRows.slice(base, base + pagination.limit),
    [filteredRows, base, pagination.limit],
  );

  const openChart = useCallback(
    (row) => {
      if (!row.patient?.id) return;
      navigate(`/patients/${row.patient.id}/chart`);
    },
    [navigate],
  );

  const openPreVisitNotes = useCallback(
    (row) => {
      if (!row.patient?.id) return;
      navigate(`/patient-dashboard/${row.patient.id}?appointmentId=${row.id}`);
    },
    [navigate],
  );

  const openRoomDialog = useCallback((row) => {
    setRoomAppointment(row);
    setRoomDialogOpen(true);
  }, []);

  const handleAssignRoom = async (roomId) => {
    if (!roomAppointment?.id) return;
    setRoomSubmitting(true);
    try {
      const res = await appointmentApi.assignRoom(roomAppointment.id, roomId);
      const updated = enrichRow(
        res?.data || {
          ...roomAppointment,
          roomId,
          eventStatus: 'Roomed',
        },
      );
      setRows((prev) => prev.map((row) => (row.id === roomAppointment.id ? { ...row, ...updated } : row)));
      setRoomDialogOpen(false);
      setRoomAppointment(null);
    } catch (err) {
      alert(err.message || 'Failed to assign room');
    } finally {
      setRoomSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'patientInfo',
        label: 'Patient Information',
        render: (row) => <PatientInformationCell row={row} />,
      },
      {
        key: 'encounterStatus',
        label: 'Encounter Status',
        render: (row) => {
          const status = row.eventStatus || 'Scheduled';
          return (
            <Badge
              variant="outline"
              className="border font-normal whitespace-nowrap"
              style={eventStatusChipStyle(status)}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        key: 'provider',
        label: 'Provider',
        render: (row) => <ProviderCell row={row} />,
      },
      {
        key: 'apptDateTime',
        label: 'Appt Date / Time',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {formatAppointmentDateTime(row.appointmentDate, row.appointmentTime)}
          </span>
        ),
      },
      {
        key: 'waitTime',
        label: 'Wait Time',
        render: (row) => {
          const value = getWaitTime(row, nowMs);
          return (
            <TimingCell
              value={value}
              title={
                value.isLive
                  ? 'Waiting since check-in (updates live)'
                  : 'Time from check-in to roomed'
              }
            />
          );
        },
      },
      {
        key: 'tlos',
        label: 'TLOS',
        render: (row) => {
          const value = getTlos(row, nowMs);
          return (
            <TimingCell
              value={value}
              title={
                value.isLive
                  ? 'Total length of stay since check-in (updates live)'
                  : 'Total length of stay (check-in to checkout)'
              }
            />
          );
        },
      },
      {
        key: 'visitStatus',
        label: 'Visit Status',
        render: (row) => (
          <Badge
            variant="outline"
            className="border font-normal whitespace-nowrap"
            style={statusChipStyle(row.status, statusCatalog)}
          >
            {normalizeAppointmentStatus(row.status) || '—'}
          </Badge>
        ),
      },
      {
        key: 'insurance',
        label: 'Insurance',
        render: (row) => (
          <span className="block max-w-[180px] truncate text-sm" title={formatPatientInsuranceSummary(row.patient)}>
            {formatPatientInsuranceSummary(row.patient)}
          </span>
        ),
      },
      {
        key: 'consent',
        label: 'Consent',
        render: (row) => {
          const meta = getConsentStatusMeta(row.patient);
          return (
            <Badge variant={meta.variant} className="whitespace-nowrap font-normal">
              {meta.label}
            </Badge>
          );
        },
      },
      {
        key: 'roomPatient',
        label: 'Room Patient',
        render: (row) => {
          const roomed = isAppointmentRoomed(row);
          const roomLabel = row.room?.displayName || row.room?.roomNumber;
          const canRoom = canRoomPatient(row.eventStatus, row);

          if (roomed) {
            return (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DoorOpen className="h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden />
                <span className="truncate max-w-[100px]" title={roomLabel || 'Roomed'}>
                  {roomLabel || 'Roomed'}
                </span>
              </div>
            );
          }

          return (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => openRoomDialog(row)}
              disabled={!canRoom}
              aria-label="Room patient"
              title={canRoom ? 'Assign room' : 'Patient cannot be roomed yet'}
            >
              <DoorOpen className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [openRoomDialog, statusCatalog, nowMs],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outpatient Tracking Board"
        description="Live outpatient visit tracking by workflow stage"
        breadcrumbs="Patient Management"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={fetchBoard} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
        <Tabs
          value={workflowTab}
          onValueChange={(tabId) => {
            setWorkflowTab(tabId);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
            {ENCOUNTER_WORKFLOW_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs sm:text-sm">
                <span>{tab.label}</span>
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold">
                  {tabCounts[tab.id] ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-panel)] sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tracking-date-from">From</Label>
            <Input
              id="tracking-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tracking-date-to">To</Label>
            <Input
              id="tracking-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDateFrom(toDateKey());
            setDateTo('');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          From today onward
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={pagedRows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        isLoading={isLoading}
        searchValue={search}
        onSearch={(keyword) => {
          setSearch(keyword);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        getRowId={(row) => row.id}
        searchPlaceholder="Search patient, MRN, encounter #, or provider..."
        emptyMessage="No patients on the tracking board for the current filters"
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => openChart(row)}
              disabled={!row.patient?.id}
              aria-label="Open chart"
              title="Open Chart"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => openPreVisitNotes(row)}
              disabled={!row.patient?.id}
              aria-label="Pre visit notes"
              title="Pre Visit Notes"
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <RoomPatientDialog
        open={roomDialogOpen}
        onOpenChange={(open) => {
          setRoomDialogOpen(open);
          if (!open) setRoomAppointment(null);
        }}
        appointment={roomAppointment}
        onSubmit={handleAssignRoom}
        isLoading={roomSubmitting}
      />
    </div>
  );
}
