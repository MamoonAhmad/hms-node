import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Settings2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BOARD_COLUMNS,
  BOARD_TABS,
  MOCK_NURSES,
  MOCK_PATIENTS,
  NURSING_STATUS_STYLE,
} from './nurseTrackingBoardConstants';
import { TrackingBoardStatusSummary } from './TrackingBoardStatusSummary';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusCell({ status }) {
  const style = NURSING_STATUS_STYLE[status] || {
    label: status,
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
        {style.label}
      </span>
    </div>
  );
}

export function NurseTrackingBoardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [patients] = useState(MOCK_PATIENTS);
  const [search, setSearch] = useState('');
  const [nurseFilter, setNurseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('checkInTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [lastRefresh, setLastRefresh] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );
  const [columnsVisible, setColumnsVisible] = useState(() => {
    const saved = localStorage.getItem('nurse-board-columns') ?? localStorage.getItem('epic-nurse-board-columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
    return Object.fromEntries(BOARD_COLUMNS.map((c) => [c.key, c.defaultVisible]));
  });
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('nurse-board-columns', JSON.stringify(columnsVisible));
  }, [columnsVisible]);

  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    if (activeTab === 'my-patients') {
      filtered = filtered.filter((p) => p.nurseId === 'N001');
    } else if (activeTab === 'vitals-pending') {
      filtered = filtered.filter((p) => p.nursingStatus === 'Vitals Pending');
    } else if (activeTab === 'ready-for-provider') {
      filtered = filtered.filter((p) => p.nursingStatus === 'Ready for Provider');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter((p) => p.nursingStatus === 'Discharged/Cleanup');
    }

    if (nurseFilter !== 'all') {
      filtered = filtered.filter((p) => p.nurseId === nurseFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.chiefComplaint?.toLowerCase().includes(q) ||
          p.room?.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => {
      let aVal;
      let bVal;
      if (sortBy === 'checkInTime') {
        aVal = new Date(a.checkInTime).getTime();
        bVal = new Date(b.checkInTime).getTime();
      } else if (sortBy === 'timeInStatus') {
        aVal = a.timeInStatus ?? 0;
        bVal = b.timeInStatus ?? 0;
      } else if (sortBy === 'patientName') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === 'nursingStatus') {
        aVal = a.nursingStatus.toLowerCase();
        bVal = b.nursingStatus.toLowerCase();
      } else {
        aVal = String(a[sortBy] ?? '').toLowerCase();
        bVal = String(b[sortBy] ?? '').toLowerCase();
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [patients, activeTab, search, nurseFilter, sortBy, sortOrder]);

  const statusCounts = useMemo(
    () => ({
      total: patients.length,
      vitalsPending: patients.filter((p) => p.nursingStatus === 'Vitals Pending').length,
      readyForProvider: patients.filter((p) => p.nursingStatus === 'Ready for Provider').length,
      withProvider: patients.filter((p) => p.nursingStatus === 'With Provider').length,
      discharged: patients.filter((p) => p.nursingStatus === 'Discharged/Cleanup').length,
    }),
    [patients],
  );

  const tabCounts = useMemo(
    () => ({
      all: patients.length,
      'my-patients': patients.filter((p) => p.nurseId === 'N001').length,
      'vitals-pending': statusCounts.vitalsPending,
      'ready-for-provider': statusCounts.readyForProvider,
      completed: statusCounts.discharged,
    }),
    [patients, statusCounts],
  );

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const total = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const base = (currentPage - 1) * pagination.limit;

  const rows = useMemo(
    () =>
      filteredPatients.slice(base, base + pagination.limit).map((row, i) => ({
        ...row,
        _srNo: base + i + 1,
      })),
    [filteredPatients, base, pagination.limit],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback(
    (limit) => setPagination((p) => ({ ...p, limit, page: 1 })),
    [],
  );

  const handleRefresh = () => {
    setLastRefresh(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const toggleColumn = (key) => {
    setColumnsVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cellRenderers = useMemo(
    () => ({
      status: (patient) => <StatusCell status={patient.nursingStatus} />,
      patient: (patient) => (
        <button
          type="button"
          onClick={() => navigate(`/patient-dashboard/${patient.id}`)}
          className="group text-left"
        >
          <span className="block font-medium text-primary group-hover:underline">{patient.name}</span>
          <span className="text-xs text-muted-foreground">
            DOB {new Date(patient.dob).toLocaleDateString()}
          </span>
          {patient.flags?.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1">
              {patient.flags.map((f) => (
                <Badge key={f} variant="outline" className="text-[10px] font-normal">
                  {f}
                </Badge>
              ))}
            </span>
          )}
        </button>
      ),
      mrn: (patient) => <span className="font-mono text-xs">{patient.mrn}</span>,
      ageSex: (patient) => (
        <span className="tabular-nums text-sm">
          {patient.age}/{patient.sex}
        </span>
      ),
      acuity: (patient) => <span className="text-xs font-semibold text-destructive">{patient.acuity}</span>,
      room: (patient) => <span className="font-medium">{patient.room}</span>,
      chiefComplaint: (patient) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block max-w-[200px] truncate">{patient.chiefComplaint}</span>
          </TooltipTrigger>
          <TooltipContent>{patient.chiefComplaint}</TooltipContent>
        </Tooltip>
      ),
      nurse: (patient) => patient.nurse,
      provider: (patient) => (
        <span className={cn(!patient.provider && 'text-muted-foreground')}>
          {patient.provider ?? '—'}
        </span>
      ),
      vitals: (patient) =>
        patient.vitals ? (
          <div className="text-xs leading-snug tabular-nums">
            <div>BP {patient.vitals.bp}</div>
            <div>
              HR {patient.vitals.hr} · T {patient.vitals.temp} · SpO₂ {patient.vitals.spo2}
            </div>
          </div>
        ) : (
          <span className="text-xs font-medium text-destructive">Not recorded</span>
        ),
      checkIn: (patient) => <span className="tabular-nums">{formatTime(patient.checkInTime)}</span>,
      timeInStatus: (patient) => (
        <span
          className={cn(
            'tabular-nums font-semibold',
            patient.timeInStatus > 60 ? 'text-destructive' : '',
          )}
        >
          {patient.timeInStatus}
        </span>
      ),
      pendingTasks: (patient) => (
        <span
          className={cn(
            'text-xs',
            patient.pendingTasks && patient.pendingTasks !== '—'
              ? 'font-medium text-chart-3'
              : 'text-muted-foreground',
          )}
        >
          {patient.pendingTasks || '—'}
        </span>
      ),
      notes: (patient) => (
        <span className="block max-w-[120px] truncate text-xs text-muted-foreground">
          {patient.notes || '—'}
        </span>
      ),
    }),
    [navigate],
  );

  const tableColumns = useMemo(() => {
    const cols = BOARD_COLUMNS.filter((c) => columnsVisible[c.key] && c.key !== 'action').map(
      (col) => ({
        key: col.key,
        label: col.label,
        cellClassName: col.key === 'mrn' ? 'font-mono text-xs' : undefined,
        render: cellRenderers[col.key],
      }),
    );
    return cols.filter((c) => c.render);
  }, [columnsVisible, cellRenderers]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Tracking</h1>
          <p className="text-muted-foreground">
            View and manage patient assignments and nursing workflow
            <span className="hidden sm:inline"> · Last refresh {lastRefresh}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setColumnMenuOpen((o) => !o)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Columns
            </Button>
            {columnMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close column menu"
                  onClick={() => setColumnMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-popover p-3 shadow-[var(--shadow-elevation-md)]">
                  <p className="mb-2 text-xs font-semibold text-foreground">Display columns</p>
                  <div className="max-h-64 space-y-1 overflow-auto">
                    {BOARD_COLUMNS.filter((c) => c.key !== 'action').map((col) => (
                      <label
                        key={col.key}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
                      >
                        <Checkbox
                          checked={!!columnsVisible[col.key]}
                          onCheckedChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <TrackingBoardStatusSummary
        statusCounts={statusCounts}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
      />

      <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:max-w-4xl lg:grid-cols-5">
            {BOARD_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <span>{tab.label}</span>
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold">
                  {tabCounts[tab.id] ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-panel)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={nurseFilter}
            onValueChange={(v) => {
              setNurseFilter(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filter by nurse">
              <SelectValue placeholder="All nurses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All nurses</SelectItem>
              {MOCK_NURSES.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkInTime">Arrival time</SelectItem>
              <SelectItem value="timeInStatus">Min in status</SelectItem>
              <SelectItem value="patientName">Patient name</SelectItem>
              <SelectItem value="nursingStatus">Status</SelectItem>
              <SelectItem value="room">Room</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            aria-label="Toggle sort direction"
          >
            {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
          </Button>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name, MRN, room, or chief complaint..."
        emptyMessage="No patients match the current filters"
        actions={(patient) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(`/patient-dashboard/${patient.id}`)}
              aria-label={`Open chart for ${patient.name}`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
