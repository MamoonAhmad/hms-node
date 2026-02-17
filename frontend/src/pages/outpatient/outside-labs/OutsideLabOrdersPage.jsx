import { useState, useEffect } from 'react';
import { Plus, Eye, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { CreateLabOrderFormDialog } from './CreateLabOrderFormDialog';
import { UploadReportDialog } from './UploadReportDialog';
import { LabOrderDetailDialog } from './LabOrderDetailDialog';
import { outsideLabsStore } from './outsideLabsMock';

const STATUS_OPTIONS = ['Ordered', 'Sent to External Lab', 'Result Received', 'Reviewed', 'Closed'];

export function OutsideLabOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [externalLabs, setExternalLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    externalLabId: '',
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await outsideLabsStore.getLabOrders(filters);
      setOrders(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load orders' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLabs = async () => {
    const data = await outsideLabsStore.getExternalLabs(false);
    setExternalLabs(data);
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filters.dateFrom, filters.dateTo, filters.status, filters.externalLabId]);

  const handleCreateOrder = async (data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await outsideLabsStore.createLabOrder(data);
      setMessage({ type: 'success', text: 'Lab order saved successfully' });
      setIsCreateOpen(false);
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save order' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPrint = async (data) => {
    await handleCreateOrder(data);
    setTimeout(() => window.print(), 300);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleUploadReport = (order) => {
    setSelectedOrder(order);
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (orderId, data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await outsideLabsStore.uploadReport(orderId, data);
      setMessage({ type: 'success', text: 'Report uploaded. Status updated to Result Received.' });
      setIsUploadOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkResultReceived = async (order) => {
    try {
      await outsideLabsStore.markResultReceived(order.id);
      setMessage({ type: 'success', text: 'Marked as Result Received' });
      fetchOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  const handleMarkReviewed = async (orderId, comments) => {
    await outsideLabsStore.markReviewed(orderId, comments);
    setMessage({ type: 'success', text: 'Order marked as reviewed' });
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lab Orders (Outpatient)</h1>
          <p className="text-muted-foreground">View and track external lab orders</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Lab Order
        </Button>
      </div>

      {message.text && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'error'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">External Lab</label>
          <Select value={filters.externalLabId} onValueChange={(v) => setFilters((f) => ({ ...f, externalLabId: v }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All labs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All labs</SelectItem>
              {externalLabs.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>{l.labName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Lab Test Name(s)</TableHead>
              <TableHead>External Lab</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ordering Provider</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No lab orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.orderId}</TableCell>
                  <TableCell className="font-medium">{row.patientName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{row.labTestNames}</TableCell>
                  <TableCell>{row.externalLabName}</TableCell>
                  <TableCell>{row.orderDate}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.orderingProviderName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrder(row)} title="View Order">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleUploadReport(row)} title="Upload Report">
                        <Upload className="h-4 w-4" />
                      </Button>
                      {row.uploadedReports?.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => handleViewOrder(row)} title="View Report">
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {row.status !== 'Result Received' && row.status !== 'Reviewed' && row.status !== 'Closed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkResultReceived(row)}
                          title="Mark as Result Received"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateLabOrderFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateOrder}
        onSaveAndPrint={handleSaveAndPrint}
        isLoading={isSubmitting}
      />
      <UploadReportDialog
        open={isUploadOpen}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        order={selectedOrder}
        onSubmit={handleUploadSubmit}
        isLoading={isSubmitting}
      />
      <LabOrderDetailDialog
        open={isDetailOpen}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        order={selectedOrder}
        onMarkReviewed={handleMarkReviewed}
      />
    </div>
  );
}
