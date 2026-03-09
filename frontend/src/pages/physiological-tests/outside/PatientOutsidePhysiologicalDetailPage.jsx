import { useMemo, useState } from 'react';
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
import { loadPhysiologicalStore, getPatientById, getOrdersByPatientIdOutside, updateOrder } from '../physiologicalStore';
import { ViewPhysiologicalOrderDialog } from '../ViewPhysiologicalOrderDialog';
import { EditOutsidePhysiologicalOrderDialog } from './EditOutsidePhysiologicalOrderDialog';

function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

function OrdersTable({ orders, patient, onViewOrder, onEditOrder, formatDateTime, onPrintLabels }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient Information</TableHead>
          <TableHead>Test / Order Detail</TableHead>
          <TableHead>External Facility</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Order Date</TableHead>
          <TableHead>Updated At</TableHead>
          <TableHead className="w-[180px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No orders</TableCell></TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-muted-foreground">MRN: {patient.mrn}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="font-medium">{order.testName}</div>
                  <div className="text-sm text-muted-foreground">{order.testType} · {order.department}</div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{order.externalFacility || '-'}</TableCell>
              <TableCell>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(order.orderDateTime)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(order.lastUpdatedAt)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onViewOrder(order)} title="View"><Eye className="h-4 w-4 icon-action-view" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditOrder(order)} title="Edit"><Edit className="h-4 w-4 icon-action-edit" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onPrintLabels(patient.id)} title="Print barcode"><Printer className="h-4 w-4 icon-action-print" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function PatientOutsidePhysiologicalDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(() => loadPhysiologicalStore());
  const [filters, setFilters] = useState({ testName: '', status: '' });
  const [viewOrder, setViewOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);

  const patient = useMemo(() => getPatientById(store, patientId), [store, patientId]);
  const allOrders = useMemo(() => getOrdersByPatientIdOutside(store, patientId), [store, patientId]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      if (filters.testName && !(o.testName || '').toLowerCase().includes(filters.testName.toLowerCase())) return false;
      if (filters.status && o.status !== filters.status) return false;
      return true;
    });
  }, [allOrders, filters]);

  const handlePrintLabels = (pid) => {
    navigate(`/physiological-tests/outside/patient/${pid}/labels`);
  };

  const handleSaveOrder = (updatedOrder) => {
    const patch = {
      orderAttachmentFileName: updatedOrder.orderAttachmentFileName,
      orderAttachmentNotes: updatedOrder.orderAttachmentNotes,
      reportReceivedAt: updatedOrder.reportReceivedAt,
      reportFileName: updatedOrder.reportFileName,
      reportReceivedNotes: updatedOrder.reportReceivedNotes,
      sendOutDate: updatedOrder.sendOutDate,
      status: updatedOrder.status,
      lastUpdatedAt: updatedOrder.lastUpdatedAt,
      lastUpdatedBy: updatedOrder.lastUpdatedBy,
    };
    const next = updateOrder(updatedOrder.id, patch);
    setStore(next);
    setEditOrder(null);
  };

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button variant="link" onClick={() => navigate('/physiological-tests/outside')}>
          Back to Outside physiological tests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/physiological-tests/outside')} title="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Outside physiological test detail</h1>
          <p className="text-muted-foreground">Outside physiological test orders for {patient.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-6">
          <div><Label className="text-muted-foreground">MRN</Label><p>{patient.mrn}</p></div>
          <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{patient.name}</p></div>
          <div><Label className="text-muted-foreground">Age</Label><p>{patient.age}</p></div>
          <div><Label className="text-muted-foreground">DOB</Label><p>{patient.dob}</p></div>
          <div><Label className="text-muted-foreground">Gender</Label><p>{patient.gender === 'M' ? 'Male' : 'Female'}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input placeholder="Test name" value={filters.testName} onChange={(e) => setFilters((f) => ({ ...f, testName: e.target.value }))} className="max-w-[180px]" />
          <Select value={filters.status || '_'} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === '_' ? '' : v }))}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">All</SelectItem>
              <SelectItem value="Results Pending">Results Pending</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setFilters({ testName: '', status: '' })}>Clear</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable
            orders={filteredOrders}
            patient={patient}
            onViewOrder={setViewOrder}
            onEditOrder={setEditOrder}
            formatDateTime={formatDateTime}
            onPrintLabels={handlePrintLabels}
          />
        </CardContent>
      </Card>

      {viewOrder && (
        <ViewPhysiologicalOrderDialog
          open={!!viewOrder}
          onClose={() => setViewOrder(null)}
          order={viewOrder}
          patient={patient}
        />
      )}
      {editOrder && (
        <EditOutsidePhysiologicalOrderDialog
          open={!!editOrder}
          onOpenChange={(open) => !open && setEditOrder(null)}
          order={editOrder}
          patient={patient}
          onSave={handleSaveOrder}
        />
      )}
    </div>
  );
}
