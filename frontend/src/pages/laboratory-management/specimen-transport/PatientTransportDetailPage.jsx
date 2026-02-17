import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Eye, Edit, Printer } from 'lucide-react';
import { labApi } from '@/services/api';
import { getLabStatusBadgeClass } from '@/lib/labConstants';
import { EditTransportDialog } from './EditTransportDialog';
import { ViewTransportDialog } from './ViewTransportDialog';

function calcAge(dob) {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function PatientTransportDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filters, setFilters] = useState({
    testId: '',
    testName: '',
    specimenStatus: 'Collected',
    transportStatus: '',
  });
  const [editTest, setEditTest] = useState(null);
  const [viewTest, setViewTest] = useState(null);

  useEffect(() => {
    const params = { ...filters };
    labApi.getPatientSpecimens(patientId, params).then(({ data }) => setTests(data || []));
  }, [patientId, filters]);

  const handleClearFilters = () =>
    setFilters({ testId: '', testName: '', specimenStatus: 'Collected', transportStatus: '' });

  const handleSaved = () => {
    setEditTest(null);
    labApi.getPatientSpecimens(patientId, filters).then(({ data }) => setTests(data || []));
  };

  const patient = tests.length > 0 ? { ...tests[0].patient, admission: tests[0].admission } : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/laboratory-management/specimen-transport')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Patient Transport Detail</h1>
          <p className="text-muted-foreground">View and edit transport for this patient&apos;s specimens</p>
        </div>
      </div>

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="text-muted-foreground">Patient Name</Label><p className="font-medium">{patient.name}</p></div>
            <div><Label className="text-muted-foreground">MRN</Label><p>{patient.mrn}</p></div>
            <div><Label className="text-muted-foreground">DOB</Label><p>{patient.dob}</p></div>
            <div><Label className="text-muted-foreground">Age</Label><p>{calcAge(patient.dob)}</p></div>
            <div><Label className="text-muted-foreground">Gender</Label><p>{patient.gender}</p></div>
            <div><Label className="text-muted-foreground">Chief Complaint</Label><p>{patient.admission?.chiefComplaint ?? '-'}</p></div>
            <div><Label className="text-muted-foreground">Patient Status</Label><p>{patient.admission?.admissionStatus ?? '-'}</p></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input placeholder="Test ID" value={filters.testId} onChange={(e) => setFilters((f) => ({ ...f, testId: e.target.value }))} className="max-w-[120px]" />
          <Input placeholder="Test Name" value={filters.testName} onChange={(e) => setFilters((f) => ({ ...f, testName: e.target.value }))} className="max-w-[180px]" />
          <Select value={filters.specimenStatus || '_'} onValueChange={(v) => setFilters((f) => ({ ...f, specimenStatus: v === '_' ? '' : v }))}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Specimen Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">All</SelectItem>
              <SelectItem value="Collected">Collected</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.transportStatus || '_'} onValueChange={(v) => setFilters((f) => ({ ...f, transportStatus: v === '_' ? '' : v }))}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Transport Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Transit">In Transit</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear All</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient / Test Information</TableHead>
                <TableHead>Specimen Status</TableHead>
                <TableHead>Specimen Transport</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No orders</TableCell></TableRow>
              ) : (
                tests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">MRN: {row.patient?.mrn ?? '-'} · {row.patient?.name ?? '-'}</div>
                        <div className="font-medium">{row.testName}</div>
                        <div className="text-sm text-muted-foreground">Test ID: {row.testId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabStatusBadgeClass(row.specimenStatus)}`}>
                        {row.specimenStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabStatusBadgeClass(row.transportStatus)}`}>
                        {row.transportStatus || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewTest(row)} title="View"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditTest(row)} title="Edit Transport"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/laboratory-management/specimen-collection/labels?specimenId=${row.id}&count=1`)} title="Print Barcode"><Printer className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editTest && (
        <EditTransportDialog
          open={!!editTest}
          onOpenChange={(open) => !open && setEditTest(null)}
          labTest={editTest}
          onSaved={handleSaved}
        />
      )}

      {viewTest && (
        <ViewTransportDialog
          open={!!viewTest}
          onOpenChange={(open) => !open && setViewTest(null)}
          labTest={viewTest}
        />
      )}
    </div>
  );
}
