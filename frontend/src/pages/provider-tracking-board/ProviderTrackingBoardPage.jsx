import { useState, useEffect, useMemo } from 'react';
import { Eye, Play, Settings2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

// Mock data – provider workflow view
const mockPatients = [
  {
    id: 'pt-1',
    mrn: 'MRN-001',
    name: 'John Doe',
    dob: '1985-05-15',
    age: 39,
    sex: 'M',
    chiefComplaint: 'Chest pain and shortness of breath',
    room: 'Room 101',
    nurse: 'Nurse Johnson',
    provider: 'Dr. Smith',
    providerId: 'P001',
    providerStatus: 'In Progress',
    checkInTime: '2025-01-15T08:30:00',
    ordersPending: 'None',
    notes: '',
  },
  {
    id: 'pt-2',
    mrn: 'MRN-002',
    name: 'Jane Smith',
    dob: '1990-08-22',
    age: 34,
    sex: 'F',
    chiefComplaint: 'Fever and headache',
    room: 'Room 102',
    nurse: 'Nurse Williams',
    provider: null,
    providerId: null,
    providerStatus: 'Waiting for Provider',
    checkInTime: '2025-01-15T09:15:00',
    ordersPending: '—',
    notes: '',
  },
  {
    id: 'pt-3',
    mrn: 'MRN-003',
    name: 'Robert Brown',
    dob: '1978-12-03',
    age: 46,
    sex: 'M',
    chiefComplaint: 'Abdominal pain',
    room: 'Room 103',
    nurse: 'Nurse Johnson',
    provider: 'Dr. Smith',
    providerId: 'P001',
    providerStatus: 'In Progress',
    checkInTime: '2025-01-15T07:00:00',
    ordersPending: 'Labs pending',
    notes: '',
  },
  {
    id: 'pt-4',
    mrn: 'MRN-004',
    name: 'Maria Garcia',
    dob: '1982-03-10',
    age: 42,
    sex: 'F',
    chiefComplaint: 'Sore throat',
    room: 'Room 104',
    nurse: 'Nurse Johnson',
    provider: null,
    providerId: null,
    providerStatus: 'Waiting for Provider',
    checkInTime: '2025-01-15T10:00:00',
    ordersPending: '—',
    notes: '',
  },
  {
    id: 'pt-5',
    mrn: 'MRN-005',
    name: 'David Lee',
    dob: '1995-11-20',
    age: 29,
    sex: 'M',
    chiefComplaint: 'Ankle injury',
    room: 'Room 105',
    nurse: 'Nurse Williams',
    provider: 'Dr. Johnson',
    providerId: 'P002',
    providerStatus: 'Documentation Pending',
    checkInTime: '2025-01-15T10:45:00',
    ordersPending: 'None',
    notes: '',
  },
  {
    id: 'pt-6',
    mrn: 'MRN-006',
    name: 'Sarah Wilson',
    dob: '1970-07-08',
    age: 54,
    sex: 'F',
    chiefComplaint: 'Follow-up diabetes',
    room: 'Room 106',
    nurse: 'Nurse Williams',
    provider: 'Dr. Johnson',
    providerId: 'P002',
    providerStatus: 'Ready for Discharge',
    checkInTime: '2025-01-15T08:00:00',
    ordersPending: 'None',
    notes: 'Discharge orders entered',
  },
  {
    id: 'pt-7',
    mrn: 'MRN-007',
    name: 'James Taylor',
    dob: '1965-04-12',
    age: 59,
    sex: 'M',
    chiefComplaint: 'Hypertension follow-up',
    room: 'Room 107',
    nurse: 'Nurse Johnson',
    provider: 'Dr. Smith',
    providerId: 'P001',
    providerStatus: 'Discharged',
    checkInTime: '2025-01-15T07:30:00',
    ordersPending: 'None',
    notes: 'Discharged 10:00',
  },
];

const mockProviders = [
  { id: 'P001', name: 'Dr. Smith' },
  { id: 'P002', name: 'Dr. Johnson' },
  { id: 'P003', name: 'Dr. Williams' },
];

const PROVIDER_BOARD_COLUMNS = [
  { key: 'srNo', label: 'Sr #', defaultVisible: true },
  { key: 'action', label: 'Action', defaultVisible: true },
  { key: 'patientName', label: 'Patient Name', defaultVisible: true },
  { key: 'mrn', label: 'MRN', defaultVisible: true },
  { key: 'ageSex', label: 'Age / Sex', defaultVisible: true },
  { key: 'room', label: 'Room / Location', defaultVisible: true },
  { key: 'chiefComplaint', label: 'Chief Complaint', defaultVisible: true },
  { key: 'provider', label: 'Provider', defaultVisible: true },
  { key: 'nurse', label: 'Nurse', defaultVisible: true },
  { key: 'providerStatus', label: 'Provider Status', defaultVisible: true },
  { key: 'waitTime', label: 'Wait Time', defaultVisible: true },
  { key: 'checkInTime', label: 'Check-in Time', defaultVisible: true },
  { key: 'ordersPending', label: 'Orders Pending', defaultVisible: true },
  { key: 'notes', label: 'Notes', defaultVisible: false },
];

const PROVIDER_STATUS_COLORS = {
  'Waiting for Provider': 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-primary/10 text-primary',
  'Documentation Pending': 'bg-purple-100 text-purple-800',
  'Ready for Discharge': 'bg-green-100 text-green-800',
  'Discharged': 'bg-gray-100 text-gray-800',
};

const PAGE_SIZES = [10, 25, 50];

function getWaitTime(checkInTime) {
  if (!checkInTime) return '—';
  const start = new Date(checkInTime).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function ProviderTrackingBoardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [patients] = useState(mockPatients);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('checkInTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columnsVisible, setColumnsVisible] = useState(() => {
    const saved = localStorage.getItem('provider-board-columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
    const defaults = {};
    PROVIDER_BOARD_COLUMNS.forEach((col) => {
      defaults[col.key] = col.defaultVisible;
    });
    return defaults;
  });
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('provider-board-columns', JSON.stringify(columnsVisible));
  }, [columnsVisible]);

  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    if (activeTab === 'my-patients') {
      filtered = filtered.filter((p) => p.providerId === 'P001');
    } else if (activeTab === 'waiting') {
      filtered = filtered.filter((p) => p.providerStatus === 'Waiting for Provider');
    } else if (activeTab === 'in-progress') {
      filtered = filtered.filter((p) => p.providerStatus === 'In Progress');
    } else if (activeTab === 'documentation') {
      filtered = filtered.filter((p) => p.providerStatus === 'Documentation Pending');
    } else if (activeTab === 'ready-discharge') {
      filtered = filtered.filter((p) => p.providerStatus === 'Ready for Discharge');
    } else if (activeTab === 'discharged') {
      filtered = filtered.filter((p) => p.providerStatus === 'Discharged');
    }

    if (providerFilter && providerFilter !== 'all') {
      filtered = filtered.filter((p) => p.providerId === providerFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.mrn.toLowerCase().includes(searchLower) ||
          (p.chiefComplaint && p.chiefComplaint.toLowerCase().includes(searchLower))
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'checkInTime') {
        aVal = new Date(a.checkInTime).getTime();
        bVal = new Date(b.checkInTime).getTime();
      } else if (sortBy === 'patientName') {
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
      } else if (sortBy === 'providerStatus') {
        aVal = (a.providerStatus || '').toLowerCase();
        bVal = (b.providerStatus || '').toLowerCase();
      } else if (sortBy === 'mrn') {
        aVal = (a.mrn || '').toLowerCase();
        bVal = (b.mrn || '').toLowerCase();
      } else if (sortBy === 'waitTime') {
        aVal = new Date(a.checkInTime).getTime();
        bVal = new Date(b.checkInTime).getTime();
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [patients, activeTab, search, providerFilter, sortBy, sortOrder]);

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));

  const formatCheckInTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeClass = (status) =>
    PROVIDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  const toggleColumn = (key) => {
    setColumnsVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleColCount = Object.values(columnsVisible).filter(Boolean).length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Provider Tracking Board</h1>
        <p className="text-muted-foreground mt-1">
          View and manage provider assignments and patient flow.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="my-patients">My Patients</TabsTrigger>
            <TabsTrigger value="waiting">Waiting for Provider</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="documentation">Documentation Pending</TabsTrigger>
            <TabsTrigger value="ready-discharge">Ready for Discharge</TabsTrigger>
            <TabsTrigger value="discharged">Discharged</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Button variant="outline" onClick={() => setColumnMenuOpen(!columnMenuOpen)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Columns
          </Button>
          {columnMenuOpen && (
            <div className="absolute z-20 mt-2 right-0 w-64 rounded-lg border bg-popover p-3 shadow-lg">
              <p className="mb-2 text-sm font-semibold">Visible Columns</p>
              <div className="flex max-h-64 flex-col gap-2 overflow-auto pr-1">
                {PROVIDER_BOARD_COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={!!columnsVisible[col.key]}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, MRN, or chief complaint..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
            aria-label="Search patients"
          />
        </div>
        <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48" aria-label="Filter by provider">
            <SelectValue placeholder="All providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {mockProviders.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mrn">MRN</SelectItem>
            <SelectItem value="patientName">Patient Name</SelectItem>
            <SelectItem value="checkInTime">Check-in Time</SelectItem>
            <SelectItem value="waitTime">Wait Time</SelectItem>
            <SelectItem value="providerStatus">Provider Status</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnsVisible.srNo && <TableHead className="w-16">Sr #</TableHead>}
                  {columnsVisible.action && <TableHead className="w-40">Action</TableHead>}
                  {columnsVisible.patientName && <TableHead className="min-w-[140px]">Patient Name</TableHead>}
                  {columnsVisible.mrn && <TableHead className="w-28">MRN</TableHead>}
                  {columnsVisible.ageSex && <TableHead className="w-24">Age / Sex</TableHead>}
                  {columnsVisible.room && <TableHead className="w-28">Room / Location</TableHead>}
                  {columnsVisible.chiefComplaint && <TableHead className="min-w-[180px]">Chief Complaint</TableHead>}
                  {columnsVisible.provider && <TableHead className="w-32">Provider</TableHead>}
                  {columnsVisible.nurse && <TableHead className="w-36">Nurse</TableHead>}
                  {columnsVisible.providerStatus && <TableHead className="w-44">Provider Status</TableHead>}
                  {columnsVisible.waitTime && <TableHead className="w-24">Wait Time</TableHead>}
                  {columnsVisible.checkInTime && <TableHead className="w-28">Check-in Time</TableHead>}
                  {columnsVisible.ordersPending && <TableHead className="min-w-[100px]">Orders Pending</TableHead>}
                  {columnsVisible.notes && <TableHead className="min-w-[120px]">Notes</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColCount} className="text-center h-32 text-muted-foreground">
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPatients.map((patient, index) => (
                    <TableRow key={patient.id}>
                      {columnsVisible.srNo && (
                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      )}
                      {columnsVisible.action && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/patient-dashboard/${patient.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1 icon-action-view" />
                              View
                            </Button>
                            {patient.providerStatus === 'Waiting for Provider' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigate(`/patient-dashboard/${patient.id}`)}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columnsVisible.patientName && (
                        <TableCell>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            DOB: {new Date(patient.dob).toLocaleDateString()}
                          </div>
                        </TableCell>
                      )}
                      {columnsVisible.mrn && <TableCell className="font-mono text-sm">{patient.mrn}</TableCell>}
                      {columnsVisible.ageSex && (
                        <TableCell>{patient.age} Y / {patient.sex}</TableCell>
                      )}
                      {columnsVisible.room && <TableCell>{patient.room}</TableCell>}
                      {columnsVisible.chiefComplaint && (
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate max-w-[220px]">{patient.chiefComplaint}</div>
                            </TooltipTrigger>
                            <TooltipContent>{patient.chiefComplaint}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      )}
                      {columnsVisible.provider && (
                        <TableCell>{patient.provider ?? '—'}</TableCell>
                      )}
                      {columnsVisible.nurse && <TableCell>{patient.nurse}</TableCell>}
                      {columnsVisible.providerStatus && (
                        <TableCell>
                          <Badge className={getStatusBadgeClass(patient.providerStatus)}>
                            {patient.providerStatus}
                          </Badge>
                        </TableCell>
                      )}
                      {columnsVisible.waitTime && (
                        <TableCell>{getWaitTime(patient.checkInTime)}</TableCell>
                      )}
                      {columnsVisible.checkInTime && (
                        <TableCell>{formatCheckInTime(patient.checkInTime)}</TableCell>
                      )}
                      {columnsVisible.ordersPending && (
                        <TableCell className="text-sm">{patient.ordersPending || '—'}</TableCell>
                      )}
                      {columnsVisible.notes && (
                        <TableCell className="text-sm text-muted-foreground">{patient.notes || '—'}</TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredPatients.length)} of {filteredPatients.length} patients
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-20" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
