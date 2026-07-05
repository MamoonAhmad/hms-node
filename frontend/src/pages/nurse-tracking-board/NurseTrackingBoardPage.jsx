import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AppointmentFormDialog } from '@/components/appointments/AppointmentFormDialog';
import {
  appointmentApi,
  appointmentStatusApi,
  patientApi,
  providerApi,
  trackingBoardApi,
} from '@/services/api';
import { AssignRoomDialog } from './AssignRoomDialog';
import { UpdateStatusDialog } from './UpdateStatusDialog';
import { TrackingBoardStatusSummary } from './TrackingBoardStatusSummary';
import {
  ARRIVAL_TIME_OPTIONS,
  STATUS_CHIP_COLORS,
  formatAppointmentDate,
  formatLastUpdated,
  formatTime12h,
  formatWaitingTime,
  todayIsoDate,
} from './nurseTrackingBoardConstants';

const EMPTY_INDICATORS = {
  total: 0,
  scheduled: 0,
  arrived: 0,
  registrationIncomplete: 0,
  roomed: 0,
  withProvider: 0,
  providerOut: 0,
  checkout: 0,
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

export function NurseTrackingBoardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [indicators, setIndicators] = useState(EMPTY_INDICATORS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');

  const [search, setSearch] = useState('');
  const [providerId, setProviderId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [arrivalTimeFilter, setArrivalTimeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25 });

  const [providers, setProviders] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [openRowMenuId, setOpenRowMenuId] = useState(null);
  const [assignRoomRow, setAssignRoomRow] = useState(null);
  const [updateStatusRow, setUpdateStatusRow] = useState(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    providerApi.getAll({ limit: 500, isActive: true }).then((res) => {
      setProviders(Array.isArray(res.data) ? res.data : []);
    }).catch(() => setProviders([]));

    appointmentStatusApi.getActive().then((res) => {
      setStatusOptions(Array.isArray(res.data) ? res.data : []);
    }).catch(() => setStatusOptions([]));
  }, []);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trackingBoardApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        providerId: providerId !== 'all' ? providerId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        arrivalTimeFilter: arrivalTimeFilter !== 'all' ? arrivalTimeFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        indicator: activeIndicator || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setIndicators(res.indicators || EMPTY_INDICATORS);
      setTotal(res.pagination?.total ?? 0);
      setLastRefresh(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      );
    } catch {
      setRows([]);
      setIndicators(EMPTY_INDICATORS);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    providerId,
    statusFilter,
    arrivalTimeFilter,
    dateFrom,
    dateTo,
    activeIndicator,
  ]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

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

  const handleAssignRoom = async (roomId) => {
    if (!assignRoomRow) return;
    setActionLoading(true);
    try {
      await trackingBoardApi.assignRoom(assignRoomRow.id, roomId);
      setAssignRoomRow(null);
      await fetchBoard();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!updateStatusRow) return;
    setActionLoading(true);
    try {
      await appointmentApi.updateStatus(updateStatusRow.id, status);
      setUpdateStatusRow(null);
      await fetchBoard();
    } finally {
      setActionLoading(false);
    }
  };

  const openReschedule = async (row) => {
    setUpdateStatusRow(null);
    setOpenRowMenuId(null);
    try {
      const [apptRes, patientRes] = await Promise.all([
        appointmentApi.getById(row.id),
        patientApi.getById(row.patient.id),
      ]);
      setRescheduleAppointment(apptRes.data);
      setPatients([patientRes.data]);
    } catch {
      setRescheduleAppointment({ id: row.id, patientId: row.patient.id, ...row });
      setPatients([row.patient]);
    }
  };

  const handleRescheduleSubmit = async (payload) => {
    if (!rescheduleAppointment?.id) return;
    setActionLoading(true);
    try {
      await appointmentApi.update(rescheduleAppointment.id, payload);
      setRescheduleAppointment(null);
      await fetchBoard();
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
        key: 'appointment',
        label: 'Appointment',
        render: (row) => (
          <div className="tabular-nums text-sm">
            <div>{formatTime12h(row.appointmentTime)}</div>
            <div className="text-xs text-muted-foreground">{formatAppointmentDate(row.appointmentDate)}</div>
          </div>
        ),
      },
      {
        key: 'visitType',
        label: 'Visit Type',
        render: (row) => row.visitType || '—',
      },
      {
        key: 'provider',
        label: 'Provider',
        render: (row) => row.provider || '—',
      },
      {
        key: 'status',
        label: 'Appointment Status',
        render: (row) => <StatusCell status={row.status} />,
      },
      {
        key: 'room',
        label: 'Room',
        render: (row) => row.room || '—',
      },
      {
        key: 'waitingTime',
        label: 'Waiting Time',
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
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        render: (row) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatLastUpdated(row.updatedAt)}
          </span>
        ),
      },
      {
        key: 'chiefComplaint',
        label: 'Chief Complaint',
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
        key: 'assignedNurse',
        label: 'Assigned Nurse/MA',
        render: (row) => row.assignedNurseName || '—',
      },
      {
        key: 'ordersPending',
        label: 'Orders Pending',
        render: (row) => (
          <span className={cn(row.ordersPending > 0 && 'font-semibold text-chart-3')}>
            {row.ordersPending || '—'}
          </span>
        ),
      },
      {
        key: 'alertsFlags',
        label: 'Alerts/Flags',
        render: (row) =>
          row.alertsFlags?.length ? (
            <div className="flex flex-wrap gap-1">
              {row.alertsFlags.map((flag) => (
                <Badge key={flag} variant="outline" className="text-[10px] font-normal">
                  {flag}
                </Badge>
              ))}
            </div>
          ) : (
            '—'
          ),
      },
      {
        key: 'insuranceStatus',
        label: 'Insurance Status',
        render: (row) => row.insuranceStatus || '—',
      },
      {
        key: 'checkoutStatus',
        label: 'Checkout Status',
        render: (row) => row.checkoutStatus || '—',
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Tracking Board</h1>
          <p className="text-muted-foreground">
            Track today&apos;s patients through arrival, rooming, and checkout
            {lastRefresh && (
              <span className="hidden sm:inline"> · Last refresh {lastRefresh}</span>
            )}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={fetchBoard} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <TrackingBoardStatusSummary
        indicators={indicators}
        activeIndicator={activeIndicator}
        onSelectIndicator={(key) => {
          setActiveIndicator(key);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-panel)] lg:flex-row lg:flex-wrap lg:items-center">
        <Select
          value={providerId}
          onValueChange={(v) => {
            setProviderId(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger className="w-full lg:w-[200px]" aria-label="Filter by provider">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {[provider.lastName, provider.firstName].filter(Boolean).join(', ')}
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
          <SelectTrigger className="w-full lg:w-[220px]" aria-label="Filter by appointment status">
            <SelectValue placeholder="All Appointment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Appointment status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.id || status.name} value={status.name}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={arrivalTimeFilter}
          onValueChange={(v) => {
            setArrivalTimeFilter(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger className="w-full lg:w-[200px]" aria-label="Filter by arrival time">
            <SelectValue placeholder="Arrival time" />
          </SelectTrigger>
          <SelectContent>
            {ARRIVAL_TIME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          className="w-full lg:w-[260px]"
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={({ dateFrom: from, dateTo: to }) => {
            setDateFrom(from);
            setDateTo(to);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          placeholder="Date range"
        />
      </div>

      <DataTable
        columns={tableColumns}
        data={rows}
        total={total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search patient, MRN, encounter, provider, room..."
        emptyMessage={loading ? 'Loading patients…' : 'No patients match the current filters'}
        actions={(row) => (
          <div className="relative flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpenRowMenuId(openRowMenuId === row.id ? null : row.id)}
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {openRowMenuId === row.id && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setOpenRowMenuId(null)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border bg-popover p-1 shadow-lg">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setAssignRoomRow(row);
                      setOpenRowMenuId(null);
                    }}
                  >
                    Assign / change room
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setUpdateStatusRow(row);
                      setOpenRowMenuId(null);
                    }}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate(`/patient-dashboard/${row.patient.id}`);
                      setOpenRowMenuId(null);
                    }}
                  >
                    View Encounter
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      />

      <AssignRoomDialog
        open={Boolean(assignRoomRow)}
        onOpenChange={(open) => !open && setAssignRoomRow(null)}
        appointment={assignRoomRow}
        onAssign={handleAssignRoom}
        isLoading={actionLoading}
      />

      <UpdateStatusDialog
        open={Boolean(updateStatusRow)}
        onOpenChange={(open) => !open && setUpdateStatusRow(null)}
        appointment={updateStatusRow}
        onUpdateStatus={handleUpdateStatus}
        onReschedule={() => openReschedule(updateStatusRow)}
        isLoading={actionLoading}
      />

      <AppointmentFormDialog
        open={Boolean(rescheduleAppointment)}
        onOpenChange={(open) => !open && setRescheduleAppointment(null)}
        appointment={rescheduleAppointment}
        patients={patients}
        mode="edit"
        onSubmit={handleRescheduleSubmit}
        isLoading={actionLoading}
      />
    </div>
  );
}
