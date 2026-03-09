import { useMemo, useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  FileText,
  Tags,
  FileImage,
  Pencil,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import { loadRadiologyStore, getPatientById, getOrdersByPatientId, updateOrder, saveRadiologyStore } from './radiologyStore';
import { EditRadiologyReportDialog } from './EditRadiologyReportDialog';
import { PrintLabelModal } from './PrintLabelModal';

function statusVariant(status) {
  if (status === 'Completed') return 'default';
  if (status === 'Cancelled') return 'destructive';
  return 'secondary';
}

export function ImagingStudiesPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(() => loadRadiologyStore());
  const [filters, setFilters] = useState({ quick: '', orderName: '' });
  const [applied, setApplied] = useState(filters);
  const [editOrder, setEditOrder] = useState(null);
  const [printLabelOrder, setPrintLabelOrder] = useState(null);

  const patient = useMemo(() => getPatientById(store, patientId), [store, patientId]);
  const allOrders = useMemo(() => getOrdersByPatientId(store, patientId), [store, patientId]);

  const summary = useMemo(() => ({
    total: allOrders.length,
    pending: allOrders.filter((o) => ['Pending', 'Scheduled', 'In Progress'].includes(o.status)).length,
    completed: allOrders.filter((o) => o.status === 'Completed').length,
    cancelled: allOrders.filter((o) => o.status === 'Cancelled').length,
  }), [allOrders]);

  const filteredOrders = useMemo(() => {
    const q = (applied.quick || '').toLowerCase().trim();
    const name = (applied.orderName || '').toLowerCase().trim();
    return allOrders.filter((o) => {
      const haystack = `${o.orderName} ${o.cptCode} ${o.modality}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (name && !(o.orderName || '').toLowerCase().includes(name)) return false;
      return true;
    });
  }, [allOrders, applied]);

  const handleSaveReport = useCallback((updatedOrder) => {
    const patch = {
      chiefComplaint: updatedOrder.chiefComplaint,
      techniques: updatedOrder.techniques,
      findings: updatedOrder.findings,
      impressions: updatedOrder.impressions,
      testNotes: updatedOrder.testNotes,
      priority: updatedOrder.priority,
      status: updatedOrder.status,
      interpretedBy: updatedOrder.interpretedBy,
      imagingDetailDateTime: updatedOrder.imagingDetailDateTime,
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: 'Current User',
    };
    const next = updateOrder(updatedOrder.id, patch);
    setStore(next);
    setEditOrder(null);
  }, []);

  const handlePrintLabel = useCallback(({ order, count }) => {
    const url = `/radiology-management/order/${order.id}/labels?count=${count}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setPrintLabelOrder(null);
  }, []);

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button variant="link" onClick={() => navigate('/radiology-management')}>
          Back to Radiology Dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/radiology-management')} title="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Imaging Studies</h1>
            <p className="text-muted-foreground">
              {patient.name} • MRN: {patient.mrn || 'N/A'}
            </p>
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cancelled Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Global Search & Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick">Quick Search</Label>
                <Input
                  id="quick"
                  placeholder="Order Name, CPT Code, Modality"
                  value={filters.quick}
                  onChange={(e) => setFilters({ ...filters, quick: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderName">Order Name</Label>
                <Input
                  id="orderName"
                  placeholder="Search by order name"
                  value={filters.orderName}
                  onChange={(e) => setFilters({ ...filters, orderName: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="button" onClick={() => setApplied(filters)}>
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const cleared = { quick: '', orderName: '' };
                  setFilters(cleared);
                  setApplied(cleared);
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Imaging Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Imaging Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Patient Information</TableHead>
                    <TableHead>Admission Details</TableHead>
                    <TableHead>Order Details</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order, index) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            <div className="font-medium">{patient.name}</div>
                            <div>MRN: {patient.mrn || 'N/A'}</div>
                            <div>{patient.age} • {patient.gender === 'M' ? 'Male' : 'Female'}</div>
                            <div>DOB: {new Date(patient.dob).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            <div>{patient.admission?.erId || 'N/A'}</div>
                            <div>{patient.admission?.chiefComplaint || '-'}</div>
                            <div>{patient.admission?.arrivalMethod || '-'}</div>
                            <Badge variant="secondary" className="text-xs">
                              {patient.admission?.status || '-'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            <div className="font-medium">{order.orderName}</div>
                            <div>CPT: {order.cptCode}</div>
                            <div>{order.department}</div>
                            <div>{order.orderDateTime ? new Date(order.orderDateTime).toLocaleString() : '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] text-sm">
                          {order.description || 'No description available'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] text-sm truncate" title={order.findings}>
                          {order.findings || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.lastUpdatedAt ? new Date(order.lastUpdatedAt).toLocaleString() : '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">{order.lastUpdatedBy || '-'}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Edit Report"
                              onClick={() => setEditOrder(order)}
                            >
                              <Pencil className="h-4 w-4 icon-action-edit" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Generate Report"
                              onClick={() => window.open(`/radiology-management/order/${order.id}/report`, '_blank')}
                            >
                              <FileText className="h-4 w-4 icon-action-print" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Print Label"
                              onClick={() => setPrintLabelOrder(order)}
                            >
                              <Tags className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="View Files"
                              onClick={() => window.open(`/radiology-management/order/${order.id}/files`, '_blank')}
                            >
                              <FileImage className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditRadiologyReportDialog
        open={!!editOrder}
        onClose={() => setEditOrder(null)}
        order={editOrder}
        patient={patient}
        onSave={handleSaveReport}
      />
      <PrintLabelModal
        open={!!printLabelOrder}
        onClose={() => setPrintLabelOrder(null)}
        order={printLabelOrder}
        patient={patient}
        onPrint={handlePrintLabel}
      />
    </>
  );
}
