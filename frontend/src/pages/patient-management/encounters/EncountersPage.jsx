import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';
import { appointmentApi, appointmentStatusApi } from '@/services/api';
import {
  formatPatientListName,
  formatProviderListName,
} from '@/lib/appointmentUtils';
import {
  formatGenderAbbrev,
  formatGenderLabel,
  formatPatientDobWithAge,
} from '@/components/patients/listing/patientListUtils';
import {
  statusChipStyle,
  getAppointmentStatusesFallback,
  getCanonicalAppointmentStatuses,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatuses';
import {
  ENCOUNTER_WORKFLOW_TABS,
  matchesWorkflowTab,
  countByWorkflowTab,
  resolveEncounterWorkflowStage,
  mapAppointmentStatusToNursingStatus,
} from '@/lib/encounterWorkflow';
import {
  mapAppointmentStatusToVisitStep,
  getVisitStepBadgeVariant,
} from '@/lib/encounterVisitStatus';
import { getEncountersListSampleRows } from '@/pages/patient-dashboard/patientDashboardSample';
function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatEncounterDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function enrichEncounter(appointment) {
  const patient = appointment.patient;
  return {
    ...appointment,
    workflowStage: resolveEncounterWorkflowStage(appointment),
    visitStatus: mapAppointmentStatusToVisitStep(
      appointment.status,
      appointment.eventStatus,
    ),
    nursingStatus: mapAppointmentStatusToNursingStatus(
      appointment.status,
      appointment.eventStatus,
    ),
    nurseId: appointment.assignedNurseId || null,
    assignedToId: patient?.assignedToId || null,
    providerId: appointment.providerId || appointment.providerRef?.id || null,
  };
}

function openCurrentEncounter(navigate, row) {
  if (!row.patient?.id || !row.id) return;
  navigate(`/patient-dashboard/${row.patient.id}?appointmentId=${encodeURIComponent(row.id)}`);
}

function openPatientEncountersList(navigate, row) {
  if (!row.patient?.id) return;
  navigate(`/patients/${row.patient.id}/encounters`);
}

export function EncountersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { departmentId } = useTopbarDepartment();
  const [encounters, setEncounters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowTab, setWorkflowTab] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 25 });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(() => toDateKey());
  const [dateTo, setDateTo] = useState('');
  const [statusCatalog, setStatusCatalog] = useState(() => getAppointmentStatusesFallback());

  useEffect(() => {
    let cancelled = false;
    appointmentStatusApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setStatusCatalog(getCanonicalAppointmentStatuses(Array.isArray(rows) ? rows : []));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchEncounters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const q = String(search || '').trim().toLowerCase();
    const demos = getEncountersListSampleRows()
      .filter((row) => {
        if (departmentId) {
          const rowDeptId = row.departmentId || row.departmentRef?.id || null;
          if (rowDeptId !== departmentId) return false;
        }
        if (dateFrom && row.appointmentDate < dateFrom) return false;
        if (dateTo && row.appointmentDate > dateTo) return false;
        if (!q) return true;
        const hay = [
          row.patient?.firstName,
          row.patient?.lastName,
          row.patient?.preferredName,
          row.patient?.mrn,
          row.encounterNumber,
          row.visitReason,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .map(enrichEncounter);
    try {
      const response = await appointmentApi.getAll({
        page: 1,
        limit: 500,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        departmentId: departmentId || undefined,
      });
      const live = (response.data || []).map(enrichEncounter);
      setEncounters([...demos, ...live]);
    } catch (err) {
      setError(err.message || 'Failed to load encounters');
      setEncounters(demos);
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFrom, dateTo, departmentId]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        ENCOUNTER_WORKFLOW_TABS.map((tab) => [
          tab.id,
          countByWorkflowTab(encounters, tab.id, user?.id),
        ]),
      ),
    [encounters, user?.id],
  );

  const filteredEncounters = useMemo(
    () => encounters.filter((row) => matchesWorkflowTab(row, workflowTab, user?.id)),
    [encounters, workflowTab, user?.id],
  );

  const total = filteredEncounters.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const base = (currentPage - 1) * pagination.limit;
  const pagedEncounters = useMemo(
    () => filteredEncounters.slice(base, base + pagination.limit),
    [filteredEncounters, base, pagination.limit],
  );

  const columns = useMemo(
    () => [
      {
        key: 'encounterNumber',
        label: 'Encounter #',
        cellClassName: 'font-mono text-xs',
        render: (row) =>
          row.encounterNumber ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCurrentEncounter(navigate, row);
              }}
              className="text-primary hover:underline"
            >
              {row.encounterNumber}
            </button>
          ) : (
            '—'
          ),
      },
      {
        key: 'patient',
        label: 'Patient',
        render: (row) => {
          const patient = row.patient;
          const name = patient ? formatPatientListName(patient) : '—';
          const mrn = patient?.mrn;
          const genderValue = patient?.genderIdentity || patient?.gender;
          const genderAbbrev = formatGenderAbbrev(genderValue);
          const genderLabel = formatGenderLabel(genderValue);
          const dobWithAge = patient?.dateOfBirth
            ? formatPatientDobWithAge(patient.dateOfBirth)
            : null;

          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCurrentEncounter(navigate, row);
              }}
              className="group max-w-[280px] text-left"
            >
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-primary group-hover:underline">{name}</span>
                {row.isDemo ? (
                  <Badge variant="secondary" className="font-normal">
                    Demo
                  </Badge>
                ) : null}
              </span>
              {mrn ? (
                <span className="block text-xs text-muted-foreground">{mrn}</span>
              ) : null}
              {(genderValue || dobWithAge) && (
                <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {genderValue ? (
                    <span
                      className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 font-semibold tabular-nums text-foreground"
                      title={genderLabel}
                    >
                      {genderAbbrev}
                    </span>
                  ) : null}
                  {genderValue && dobWithAge ? <span aria-hidden>·</span> : null}
                  {dobWithAge ? (
                    <span className="tabular-nums">{dobWithAge}</span>
                  ) : null}
                </span>
              )}
            </button>
          );
        },
      },
      {
        key: 'date',
        label: 'Date of Service',
        render: (row) => (
          <div className="text-sm">
            <div>{formatEncounterDate(row.appointmentDate)}</div>
            {row.appointmentTime && (
              <div className="text-xs text-muted-foreground tabular-nums">{row.appointmentTime}</div>
            )}
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Appointment Type',
        render: (row) => row.appointmentType || row.appointmentTypeRef?.name || '—',
      },
      {
        key: 'department',
        label: 'Department',
        render: (row) => row.departmentRef?.departmentName || row.department || '—',
      },
      {
        key: 'provider',
        label: 'Provider',
        render: (row) =>
          row.provider ||
          (row.providerRef ? formatProviderListName(row.providerRef) : '—'),
      },
      {
        key: 'visitReason',
        label: 'Reason for Visit',
        render: (row) => (
          <span className="block max-w-[200px] truncate" title={row.visitReason || ''}>
            {row.visitReason || '—'}
          </span>
        ),
      },
      {
        key: 'visitStatus',
        label: 'Encounter Status',
        render: (row) => {
          const step =
            row.visitStatus ||
            mapAppointmentStatusToVisitStep(row.status, row.eventStatus);
          return (
            <Badge variant={getVisitStepBadgeVariant(step)} className="font-normal">
              {step}
            </Badge>
          );
        },
      },
      {
        key: 'status',
        label: 'Appointment Status',
        render: (row) => (
          <Badge
            variant="outline"
            className="border font-normal"
            style={statusChipStyle(row.status, statusCatalog)}
          >
            {normalizeAppointmentStatus(row.status) || '—'}
          </Badge>
        ),
      },
    ],
    [navigate, statusCatalog],
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

  const handleWorkflowTabChange = useCallback((tabId) => {
    setWorkflowTab(tabId);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handleClearDates = () => {
    setDateFrom(toDateKey());
    setDateTo('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Encounters"
        description="Outpatient visit and encounter history across all patients"
        breadcrumbs="Patient Management"
      />

      <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
        <Tabs value={workflowTab} onValueChange={handleWorkflowTabChange}>
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
            <Label htmlFor="encounter-date-from">From</Label>
            <Input
              id="encounter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="encounter-date-to">To</Label>
            <Input
              id="encounter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleClearDates}>
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
        data={pagedEncounters}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        isLoading={isLoading}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        onRowClick={(row) => openCurrentEncounter(navigate, row)}
        searchPlaceholder="Search encounter #, patient, MRN, provider, or reason..."
        emptyMessage="No encounters match the current filters"
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {row.patient?.id && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openCurrentEncounter(navigate, row)}
                  aria-label="Open patient chart"
                  title="Open patient chart"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openPatientEncountersList(navigate, row)}
                  aria-label="View encounters"
                  title="View encounters"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    navigate(
                      `/patient-dashboard/${row.patient.id}?tab=patient-checkout&appointmentId=${row.id}`,
                    )
                  }
                  aria-label="Start checkout"
                  title="Start Checkout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}
