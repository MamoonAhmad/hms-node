import { useState, useEffect, useMemo } from 'react';
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
import { ArrowLeft, Eye, Edit, Printer, FileText } from 'lucide-react';
import { orderApi } from '@/services/api';
import { getLabStatusBadgeClass } from '@/lib/labConstants';
import { ViewResultDialog } from './ViewResultDialog';
import { calcAge, mapOrderToLabRow } from '@/lib/orderWorklist';

export function PatientResultDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    testId: '',
    testName: '',
    specimenStatus: '',
    resultStatus: '',
  });
  const [viewTest, setViewTest] = useState(null);

  const loadTests = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrders({
        patientId,
        category: 'Lab',
        destination: 'onsite',
        limit: 500,
      });
      setTests(
        (res?.data || [])
          .filter((o) => o.status !== 'Cancelled')
          .map(mapOrderToLabRow)
      );
    } catch (err) {
      setTests([]);
      setError(err.message || 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const filteredTests = useMemo(() => {
    return tests.filter((row) => {
      if (filters.testId && !(row.testId || '').toLowerCase().includes(filters.testId.toLowerCase())) return false;
      if (filters.testName && !(row.testName || '').toLowerCase().includes(filters.testName.toLowerCase())) return false;
      if (filters.specimenStatus && row.specimenStatus !== filters.specimenStatus) return false;
      if (filters.resultStatus && (row.resultStatus || row.status) !== filters.resultStatus) return false;
      return true;
    });
  }, [tests, filters]);

  const handleClearFilters = () =>
    setFilters({ testId: '', testName: '', specimenStatus: '', resultStatus: '' });

  const patient = tests.length > 0 ? tests[0].patient : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/laboratory-management/result-management')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Patient Result Detail</h1>
          <p className="text-muted-foreground">View and edit results for this patient</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="text-muted-foreground">Patient Name</Label><p className="font-medium">{patient.name}</p></div>
            <div><Label className="text-muted-foreground">MRN</Label><p>{patient.mrn}</p></div>
            <div><Label className="text-muted-foreground">DOB</Label><p>{patient.dob}</p></div>
            <div><Label className="text-muted-foreground">Age</Label><p>{calcAge(patient.dateOfBirth)}</p></div>
            <div><Label className="text-muted-foreground">Gender</Label><p>{patient.gender}</p></div>
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
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Collected">Collected</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.resultStatus || '_'} onValueChange={(v) => setFilters((f) => ({ ...f, resultStatus: v === '_' ? '' : v }))}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Result Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">All</SelectItem>
              <SelectItem value="Ordered">Ordered</SelectItem>
              <SelectItem value="Resulted">Resulted</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
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
                <TableHead>Specimen Status</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Test Result Status</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filteredTests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No tests</TableCell></TableRow>
              ) : (
                filteredTests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="space-y-0.5">
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
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabStatusBadgeClass(row.resultStatus)}`}>
                        {row.resultStatus || 'Ordered'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewTest(row)} title="View result"><Eye className="h-4 w-4 icon-action-view" /></Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/laboratory-management/result-management/patient/${patientId}/edit/${row.id}`
                            )
                          }
                          title="Edit result"
                        >
                          <Edit className="h-4 w-4 icon-action-edit" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/laboratory-management/result-management/report/${row.id}`)} title="Print lab report"><FileText className="h-4 w-4 icon-action-print" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/laboratory-management/specimen-collection/labels?specimenId=${row.id}&count=1`)} title="Print barcode"><Printer className="h-4 w-4 icon-action-print" /></Button>
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
        <ViewResultDialog
          open={!!viewTest}
          onOpenChange={(open) => !open && setViewTest(null)}
          labTest={viewTest}
        />
      )}
    </div>
  );
}
