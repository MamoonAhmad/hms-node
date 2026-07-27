import { useMemo, useState, useCallback, useEffect } from 'react';
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
import { mapOrderToRadiologyRow } from '@/lib/orderWorklist';
import { EditOutsideRadiologyOrderDialog } from './EditOutsideRadiologyOrderDialog';
import { ViewRadiologyReportDialog } from '../ViewRadiologyReportDialog';

function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

function OrdersTable({ orders, patient, onViewOrder, onEditOrder, formatDateTime: fmt }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient Information</TableHead>
          <TableHead>Order Detail</TableHead>
          <TableHead>Order Status</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead>Updated At</TableHead>
          <TableHead className="w-[180px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No orders</TableCell></TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{patient?.name}</div>
                  <div className="text-muted-foreground">MRN: {patient?.mrn}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="font-medium">{order.orderName}</div>
                  <div className="text-sm text-muted-foreground">Code: {order.procedureCode || order.id?.slice(0, 8)}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{fmt(order.orderDateTime)}</TableCell>
              <TableCell className="text-muted-foreground">{fmt(order.lastUpdatedAt)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onViewOrder(order)} title="View"><Eye className="h-4 w-4 icon-action-view" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditOrder(order)} title="Edit"><Edit className="h-4 w-4 icon-action-edit" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/radiology-management/order/${order.id}/report`, '_blank')} title="Print report"><FileText className="h-4 w-4 icon-action-print" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/radiology-management/order/${order.id}/labels`, '_blank')} title="Print barcode"><Printer className="h-4 w-4 icon-action-print" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function PatientOutsideRadiologyDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ testName: '', status: '' });
  const [editOrder, setEditOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrders({
        patientId,
        category: 'Radiology',
        destination: 'external',
        limit: 500,
      });
      setOrders(
        (res?.data || [])
          .filter((o) => o.status !== 'Cancelled')
          .map(mapOrderToRadiologyRow)
      );
    } catch (err) {
      setOrders([]);
      setError(err.message || 'Failed to load outside radiology orders');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const patient = useMemo(() => (orders.length ? orders[0].patient : null), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filters.testName && !(o.orderName || '').toLowerCase().includes(filters.testName.toLowerCase())) return false;
      if (filters.status && o.status !== filters.status) return false;
      return true;
    });
  }, [orders, filters]);

  const handleSaveOrder = useCallback(async (updatedOrder) => {
    try {
      if (updatedOrder?.id && updatedOrder?.status) {
        await orderApi.updateOrderStatus(updatedOrder.id, updatedOrder.status);
      }
      setEditOrder(null);
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order');
    }
  }, [loadOrders]);

  if (!loading && !patient && !error) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No outside radiology orders found for this patient.</p>
        <Button variant="link" onClick={() => navigate('/radiology-management/outside-radiology-orders')}>
          Back to Outside radiology orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/radiology-management/outside-radiology-orders')} title="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Patient Order Detail</h1>
          <p className="text-muted-foreground">Outside radiology orders for {patient?.name || 'patient'}</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-6">
            <div><Label className="text-muted-foreground">MRN</Label><p>{patient.mrn}</p></div>
            <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{patient.name}</p></div>
            <div><Label className="text-muted-foreground">Age</Label><p>{patient.age}</p></div>
            <div><Label className="text-muted-foreground">DOB</Label><p>{patient.dob}</p></div>
            <div><Label className="text-muted-foreground">Gender</Label><p>{patient.gender}</p></div>
          </CardContent>
        </Card>
      )}

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
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resulted">Resulted</SelectItem>
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
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <OrdersTable orders={filteredOrders} patient={patient} onViewOrder={setViewOrder} onEditOrder={setEditOrder} formatDateTime={formatDateTime} />
          )}
        </CardContent>
      </Card>

      {editOrder && (
        <EditOutsideRadiologyOrderDialog
          open={!!editOrder}
          onOpenChange={(open) => !open && setEditOrder(null)}
          order={editOrder}
          patient={patient}
          onSave={handleSaveOrder}
        />
      )}
      {viewOrder && (
        <ViewRadiologyReportDialog
          open={!!viewOrder}
          onClose={() => setViewOrder(null)}
          order={viewOrder}
          patient={patient}
        />
      )}
    </div>
  );
}
