import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { RowActionsMenu, RowActionsMenuItem } from '@/components/ui/row-actions-menu';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  appointmentStatusApi,
  departmentApi,
  encountersWorkListApi,
  patientApi,
  providerApi,
} from '@/services/api';
import {
  APPOINTMENT_TIME_OPTIONS,
  GENDER_OPTIONS,
  STATUS_CHIP_COLORS,
  WORK_LIST_TABS,
  formatAppointmentDate,
  formatDob,
  formatTime12h,
  formatWaitingTime,
  todayIsoDate,
} from './encountersWorkListConstants';

const EMPTY_TAB_COUNTS = {
  all: 0,
  my_patients: 0,
  ready_for_intake: 0,
  ready_for_providers: 0,
  ready_for_checkout: 0,
  ready_for_coding: 0,
};

function StatusCell({ status }) {
  const style = STATUS_CHIP_COLORS[status] || {
    stripe: 'bg-muted-foreground',
    pill: 'bg-muted text-foreground border-border',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-6 w-1 shrink-0 rounded-full', style.stripe)} aria-hidden />
      <span
        className={cn(
          'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
          style.pill,
        )}
      >
        {status}
      </span>
    </div>
  );
}

export function EncountersWorkListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [tabCounts, setTabCounts] = useState(EMPTY_TAB_COUNTS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('all');
  const [departmentId, setDepartmentId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerId, setProviderId] = useState('all');
  const [appointmentTimeFilter, setAppointmentTimeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [pagination, setPagination] = useState({ page: 1, limit: 25 });

  const [providers, setProviders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    Promise.all([
      providerApi.getAll({ limit: 500, isActive: true }),
      departmentApi.getAll({ limit: 500 }),
      appointmentStatusApi.getActive(),
    ])
      .then(([providerRes, deptRes, statusRes]) => {
        setProviders(Array.isArray(providerRes.data) ? providerRes.data : []);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setStatusOptions(Array.isArray(statusRes.data) ? statusRes.data : []);
      })
      .catch(() => {
        setProviders([]);
        setDepartments([]);
        setStatusOptions([]);
      });
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await encountersWorkListApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        tab: activeTab,
        search: search.trim() || undefined,
        gender: gender !== 'all' ? gender : undefined,
        departmentId: departmentId !== 'all' ? departmentId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        providerId: providerId !== 'all' ? providerId : undefined,
        appointmentTimeFilter: appointmentTimeFilter !== 'all' ? appointmentTimeFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTabCounts(res.tabCounts || EMPTY_TAB_COUNTS);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      setRows([]);
      setTabCounts(EMPTY_TAB_COUNTS);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    pagination.page,
    pagination.limit,
    search,
    gender,
    departmentId,
    statusFilter,
    providerId,
    appointmentTimeFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handleAssignToMe = async (row) => {
    setActionLoading(true);
    try {
      await patientApi.assignToMe(row.patient.id);
      await fetchList();
    } finally {
      setActionLoading(false);
    }
  };

  const tableColumns = useMemo(
    () => [
      {
        key: 'patient',
        label: 'Patient',
        render: (row) => (
          <div>
            <span className="block font-medium">{row.patient.displayName}</span>
            <span className="text-xs text-muted-foreground">
              MRN {row.patient.mrn} · ENC {row.encounterNumber}
            </span>
          </div>
        ),
      },
      {
        key: 'genderDob',
        label: 'Gender / DOB',
        render: (row) => (
          <span className="tabular-nums text-sm">
            {row.patient.genderCode} · {formatDob(row.patient.dateOfBirth)}
          </span>
        ),
      },
      {
        key: 'chiefComplaint',
        label: 'Chief complaint',
        render: (row) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[180px] truncate">{row.chiefComplaint || '—'}</span>
            </TooltipTrigger>
            {row.chiefComplaint && <TooltipContent>{row.chiefComplaint}</TooltipContent>}
          </Tooltip>
        ),
      },
      {
        key: 'department',
        label: 'Department',
        render: (row) => row.department || '—',
      },
      {
        key: 'patientStatus',
        label: 'Patient Status',
        render: (row) => <StatusCell status={row.status} />,
      },
      {
        key: 'provider',
        label: 'Provider',
        render: (row) => row.provider || '—',
      },
      {
        key: 'appointment',
        label: 'Appointment date and time',
        render: (row) => (
          <div className="tabular-nums text-sm">
            <div>{formatAppointmentDate(row.appointmentDate)}</div>
            <div className="text-xs text-muted-foreground">{formatTime12h(row.appointmentTime)}</div>
          </div>
        ),
      },
      {
        key: 'waitTime',
        label: 'Wait time',
        render: (row) => (
          <span
            className={cn(
              'tabular-nums font-medium',
              row.waitingMinutes != null && row.waitingMinutes > 60 && 'text-destructive',
            )}
          >
            {formatWaitingTime(row.waitingMinutes)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Encounters Work List</h1>
          <p className="text-muted-foreground">
            Eligible encounters with self-pay or registered insurance and required consents signed
          </p>
        </div>
        <Button type="button" variant="outline" onClick={fetchList} disabled={loading || actionLoading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
            {WORK_LIST_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs sm:text-sm">
                <span className="truncate">{tab.label}</span>
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold">
                  {tabCounts[tab.countKey] ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-panel)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Select
          value={gender}
          onValueChange={(v) => {
            setGender(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger aria-label="Filter by gender">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={departmentId}
          onValueChange={(v) => {
            setDepartmentId(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger aria-label="Filter by department">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.departmentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger aria-label="Filter by patient status">
            <SelectValue placeholder="Patient status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All patient status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.id || status.name} value={status.name}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={providerId}
          onValueChange={(v) => {
            setProviderId(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger aria-label="Filter by provider">
            <SelectValue placeholder="Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {[provider.lastName, provider.firstName].filter(Boolean).join(', ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={({ dateFrom: from, dateTo: to }) => {
            setDateFrom(from);
            setDateTo(to);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          placeholder="Appointment date range"
        />

        <Select
          value={appointmentTimeFilter}
          onValueChange={(v) => {
            setAppointmentTimeFilter(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger aria-label="Filter by appointment time">
            <SelectValue placeholder="Appointment time" />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_TIME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={tableColumns}
        data={rows}
        total={total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        getRowId={(row) => row.id}
        searchPlaceholder="Search patient, MRN, encounter, provider..."
        emptyMessage={loading ? 'Loading encounters…' : 'No eligible encounters match the current filters'}
        actions={(row) => (
          <RowActionsMenu disabled={actionLoading}>
            <RowActionsMenuItem onClick={() => navigate(`/rcm/encounters/${row.id}`)}>
              Open workspace
            </RowActionsMenuItem>
            <RowActionsMenuItem onClick={() => navigate(`/patients/edit/${row.patient.id}`)}>
              Open patient
            </RowActionsMenuItem>
            <RowActionsMenuItem onClick={() => handleAssignToMe(row)}>
              Assign to me
            </RowActionsMenuItem>
          </RowActionsMenu>
        )}
      />
    </div>
  );
}
