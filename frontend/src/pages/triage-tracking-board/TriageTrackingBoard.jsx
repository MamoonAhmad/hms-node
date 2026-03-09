import { useState, useEffect, useMemo } from 'react';
import { Eye, Settings2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

// Mock data
const mockPatients = [
  {
    id: 1,
    mrn: 'MRN-001',
    name: 'John Doe',
    dob: '1985-05-15',
    age: 39,
    sex: 'M',
    chiefComplaint: 'Chest pain and shortness of breath',
    provider: 'Dr. Smith',
    providerId: 'P001',
    nurse: 'Nurse Johnson',
    modeOfArrival: 'Ambulance',
    vitals: { bp: '120/80', hr: 72, temp: '98.6°F' },
    labResults: [{ test: 'CBC', status: 'Complete' }],
    medications: [{ name: 'Aspirin', status: 'Given' }],
    imagingResults: [{ test: 'Chest X-Ray', status: 'Pending' }],
    status: 'In Process',
    admissionDate: '2025-01-15T10:30:00',
    dischargeDate: null,
  },
  {
    id: 2,
    mrn: 'MRN-002',
    name: 'Jane Smith',
    dob: '1990-08-22',
    age: 34,
    sex: 'F',
    chiefComplaint: 'Fever and headache',
    provider: null,
    providerId: null,
    nurse: 'Nurse Williams',
    modeOfArrival: 'Walk-in',
    vitals: { bp: '118/75', hr: 88, temp: '101.2°F' },
    labResults: [{ test: 'Flu Test', status: 'Complete' }],
    medications: [],
    imagingResults: [],
    status: 'Waiting Provider',
    admissionDate: '2025-01-15T14:15:00',
    dischargeDate: null,
  },
  {
    id: 3,
    mrn: 'MRN-003',
    name: 'Robert Brown',
    dob: '1978-12-03',
    age: 46,
    sex: 'M',
    chiefComplaint: 'Abdominal pain',
    provider: 'Dr. Smith',
    providerId: 'P001',
    nurse: 'Nurse Johnson',
    modeOfArrival: 'Ambulance',
    vitals: { bp: '130/85', hr: 95, temp: '99.1°F' },
    labResults: [{ test: 'CBC', status: 'Pending' }],
    medications: [{ name: 'Pain Relief', status: 'Ordered' }],
    imagingResults: [{ test: 'CT Scan', status: 'In Progress' }],
    status: 'Check-In',
    admissionDate: '2025-01-14T09:00:00',
    dischargeDate: '2025-01-15T16:30:00',
  },
];

const mockProviders = [
  { id: 'P001', name: 'Dr. Smith' },
  { id: 'P002', name: 'Dr. Johnson' },
  { id: 'P003', name: 'Dr. Williams' },
];

const allColumns = [
  { key: 'srNo', label: 'Sr #', defaultVisible: true },
  { key: 'action', label: 'Action', defaultVisible: true },
  { key: 'patientDetails', label: 'Patient Details', defaultVisible: true },
  { key: 'mrn', label: 'MRN', defaultVisible: true },
  { key: 'ageSex', label: 'Age / Sex', defaultVisible: true },
  { key: 'tlos', label: 'TLOS', defaultVisible: true },
  { key: 'chiefComplaint', label: 'Chief Complaint', defaultVisible: true },
  { key: 'provider', label: 'Provider', defaultVisible: true },
  { key: 'nurse', label: 'Nurse', defaultVisible: true },
  { key: 'modeOfArrival', label: 'Mode of Arrival', defaultVisible: true },
  { key: 'vitals', label: 'Vitals', defaultVisible: true },
  { key: 'labResults', label: 'Lab Results', defaultVisible: true },
  { key: 'medications', label: 'Medications', defaultVisible: true },
  { key: 'imagingResults', label: 'Imaging Results', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
];

export function TriageTrackingBoard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [patients, setPatients] = useState(mockPatients);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('mrn');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [columnsVisible, setColumnsVisible] = useState(() => {
    const saved = localStorage.getItem('triage-board-columns');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaults = {};
    allColumns.forEach((col) => {
      defaults[col.key] = col.defaultVisible;
    });
    return defaults;
  });
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  // Save column preferences
  useEffect(() => {
    localStorage.setItem('triage-board-columns', JSON.stringify(columnsVisible));
  }, [columnsVisible]);

  // Filter patients by tab
  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    if (activeTab === 'my-assigned') {
      filtered = filtered.filter((p) => p.providerId === 'P001'); // Mock logged-in provider
    } else if (activeTab === 'waiting-provider') {
      filtered = filtered.filter((p) => p.status === 'Waiting Provider');
    } else if (activeTab === 'discharge') {
      filtered = filtered.filter((p) => p.dischargeDate !== null);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.mrn.toLowerCase().includes(searchLower) ||
          p.chiefComplaint.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'mrn') {
        aVal = a.mrn;
        bVal = b.mrn;
      } else if (sortBy === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortBy === 'admissionDate') {
        aVal = new Date(a.admissionDate);
        bVal = new Date(b.admissionDate);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [patients, activeTab, search, sortBy, sortOrder]);

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  const calculateTLOS = (admissionDate, dischargeDate) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Waiting Provider': 'bg-amber-100 text-amber-800',
      'In Process': 'bg-primary/10 text-primary',
      'Check-In': 'bg-green-100 text-green-800',
      'Check-Out': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleProviderChange = (patientId, providerId) => {
    const provider = mockProviders.find((p) => p.id === providerId);
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, providerId, provider: provider?.name || null }
          : p
      )
    );
  };

  const toggleColumn = (key) => {
    setColumnsVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Triage Tracking Board</h1>
          <p className="text-muted-foreground">Monitor and manage patient triage</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button variant="outline" onClick={() => setColumnMenuOpen(!columnMenuOpen)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
            {columnMenuOpen && (
              <div className="absolute z-20 mt-2 right-0 w-64 rounded-lg border bg-popover p-3 shadow-lg">
                <p className="mb-2 text-sm font-semibold">Visible Columns</p>
                <div className="flex max-h-64 flex-col gap-2 overflow-auto pr-1">
                  {allColumns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={columnsVisible[col.key]}
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="my-assigned">My Assigned Patients</TabsTrigger>
          <TabsTrigger value="waiting-provider">Waiting Provider</TabsTrigger>
          <TabsTrigger value="discharge">Discharge</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mrn">MRN</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="admissionDate">Time</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
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
                  {columnsVisible.action && <TableHead className="w-32">Action</TableHead>}
                  {columnsVisible.patientDetails && <TableHead className="w-48">Patient Details</TableHead>}
                  {columnsVisible.mrn && <TableHead className="w-32">MRN</TableHead>}
                  {columnsVisible.ageSex && <TableHead className="w-24">Age / Sex</TableHead>}
                  {columnsVisible.tlos && <TableHead className="w-32">TLOS</TableHead>}
                  {columnsVisible.chiefComplaint && <TableHead className="w-64">Chief Complaint</TableHead>}
                  {columnsVisible.provider && <TableHead className="w-48">Provider</TableHead>}
                  {columnsVisible.nurse && <TableHead className="w-40">Nurse</TableHead>}
                  {columnsVisible.modeOfArrival && <TableHead className="w-32">Mode of Arrival</TableHead>}
                  {columnsVisible.vitals && <TableHead className="w-48">Vitals</TableHead>}
                  {columnsVisible.labResults && <TableHead className="w-48">Lab Results</TableHead>}
                  {columnsVisible.medications && <TableHead className="w-48">Medications</TableHead>}
                  {columnsVisible.imagingResults && <TableHead className="w-48">Imaging Results</TableHead>}
                  {columnsVisible.status && <TableHead className="w-32">Status</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(columnsVisible).filter(Boolean).length} className="text-center h-32">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/patient-dashboard/${patient.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1 icon-action-view" />
                            Patient Chart
                          </Button>
                        </TableCell>
                      )}
                      {columnsVisible.patientDetails && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">
                              DOB: {new Date(patient.dob).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {columnsVisible.mrn && <TableCell className="font-medium">{patient.mrn}</TableCell>}
                      {columnsVisible.ageSex && (
                        <TableCell>{patient.age} Y / {patient.sex}</TableCell>
                      )}
                      {columnsVisible.tlos && (
                        <TableCell>
                          {calculateTLOS(patient.admissionDate, patient.dischargeDate)}
                        </TableCell>
                      )}
                      {columnsVisible.chiefComplaint && (
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate max-w-[250px]">{patient.chiefComplaint}</div>
                            </TooltipTrigger>
                            <TooltipContent>{patient.chiefComplaint}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      )}
                      {columnsVisible.provider && (
                        <TableCell>
                          <Select
                            value={patient.providerId || ''}
                            onValueChange={(value) => handleProviderChange(patient.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Assign provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockProviders.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {columnsVisible.nurse && <TableCell>{patient.nurse}</TableCell>}
                      {columnsVisible.modeOfArrival && <TableCell>{patient.modeOfArrival}</TableCell>}
                      {columnsVisible.vitals && (
                        <TableCell>
                          <div className="text-sm">
                            <div>BP: {patient.vitals.bp}</div>
                            <div>HR: {patient.vitals.hr}</div>
                            <div>Temp: {patient.vitals.temp}</div>
                          </div>
                        </TableCell>
                      )}
                      {columnsVisible.labResults && (
                        <TableCell>
                          {patient.labResults.map((lab, i) => (
                            <div key={i} className="text-sm">
                              {lab.test}: <Badge variant="outline">{lab.status}</Badge>
                            </div>
                          ))}
                        </TableCell>
                      )}
                      {columnsVisible.medications && (
                        <TableCell>
                          {patient.medications.length > 0 ? (
                            patient.medications.map((med, i) => (
                              <div key={i} className="text-sm">
                                {med.name}: <Badge variant="outline">{med.status}</Badge>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnsVisible.imagingResults && (
                        <TableCell>
                          {patient.imagingResults.length > 0 ? (
                            patient.imagingResults.map((img, i) => (
                              <div key={i} className="text-sm">
                                {img.test}: <Badge variant="outline">{img.status}</Badge>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {columnsVisible.status && (
                        <TableCell>
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredPatients.length > pageSize && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredPatients.length)} of{' '}
                {filteredPatients.length} patients
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(filteredPatients.length / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(Math.ceil(filteredPatients.length / pageSize), p + 1))}
                  disabled={page >= Math.ceil(filteredPatients.length / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


