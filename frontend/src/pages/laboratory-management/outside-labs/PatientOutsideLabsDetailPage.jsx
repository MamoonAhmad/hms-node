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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Eye, Edit, Printer } from 'lucide-react';
import { labApi } from '@/services/api';
import { EditOutsideLabOrderDialog } from './EditOutsideLabOrderDialog';

const ORDER_STATUS_OPTIONS = ['Send out', 'Received report'];

function formatDateTime(str) {
  if (!str) return '-';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

function calcAge(dob) {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function OrderStatusBadge({ status }) {
  const isReceived = status === 'Received report';
  const className = isReceived
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

export function PatientOutsideLabsDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filters, setFilters] = useState({
    testId: '',
    testName: '',
    orderStatus: '',
  });
  const [viewTest, setViewTest] = useState(null);
  const [editTest, setEditTest] = useState(null);

  useEffect(() => {
    labApi.getPatientOutsideLabs(patientId, filters).then(({ data }) => setTests(data || []));
  }, [patientId, filters]);

  const handleClearFilters = () =>
    setFilters({ testId: '', testName: '', orderStatus: '' });

  const handleSaved = () => {
    setEditTest(null);
    labApi.getPatientOutsideLabs(patientId, filters).then(({ data }) => setTests(data || []));
  };

  const patient = tests.length > 0 ? { ...tests[0].patient, admission: tests[0].admission } : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/laboratory-management/outside-labs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Patient Outside Labs Detail</h1>
          <p className="text-muted-foreground">View and manage outside lab orders for this patient</p>
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
            <div><Label className="text-muted-foreground">Patient Status</Label><p>{patient.admission?.admissionStatus ?? 'Active'}</p></div>
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
          <Select value={filters.orderStatus || '_'} onValueChange={(v) => setFilters((f) => ({ ...f, orderStatus: v === '_' ? '' : v }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Order Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">All</SelectItem>
              <SelectItem value="Send out">Send out</SelectItem>
              <SelectItem value="Received report">Received report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear All</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Information</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Order created date and time</TableHead>
                <TableHead>Order updated date and time</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No outside lab orders</TableCell></TableRow>
              ) : (
                tests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">{row.testName}</div>
                        <div className="text-sm text-muted-foreground">Test ID: {row.testId}</div>
                        <div className="text-sm text-muted-foreground">Test Status: {row.resultStatus || 'Ordered'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={row.orderStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(row.orderCreatedAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(row.orderUpdatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewTest(row)} title="View"><Eye className="h-4 w-4 icon-action-view" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditTest(row)} title="Edit"><Edit className="h-4 w-4 icon-action-edit" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/laboratory-management/specimen-collection/labels?specimenId=${row.id}&count=1`)} title="Print"><Printer className="h-4 w-4 icon-action-print" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewTest && (
        <Dialog open={!!viewTest} onOpenChange={(open) => !open && setViewTest(null)}>
          <DialogContent className="min-w-[800px] max-w-lg">
            <DialogHeader>
              <DialogTitle>Outside Lab Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 text-sm">
              <div><Label className="text-muted-foreground">Test Name</Label><p className="font-medium">{viewTest.testName}</p></div>
              <div><Label className="text-muted-foreground">Test ID</Label><p>{viewTest.testId}</p></div>
              <div><Label className="text-muted-foreground">Order Status</Label><p><OrderStatusBadge status={viewTest.orderStatus} /></p></div>
              <div><Label className="text-muted-foreground">Order created</Label><p>{formatDateTime(viewTest.orderCreatedAt)}</p></div>
              <div><Label className="text-muted-foreground">Order updated</Label><p>{formatDateTime(viewTest.orderUpdatedAt)}</p></div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editTest && (
        <EditOutsideLabOrderDialog
          open={!!editTest}
          onOpenChange={(open) => !open && setEditTest(null)}
          labTest={editTest}
          patientId={patientId}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
