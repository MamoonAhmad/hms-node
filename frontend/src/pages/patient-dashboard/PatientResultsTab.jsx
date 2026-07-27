import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Ban,
  FlaskConical,
  Loader2,
  PauseCircle,
  RefreshCw,
  ScanLine,
  Upload,
  X,
} from 'lucide-react';
import { orderApi } from '@/services/api';
import { patientApi } from '@/services/api/patient.api';
import {
  ACCEPTED_DOCUMENT_INPUT,
  formatFileSize,
  readFileAsDataUrl,
  validateDocumentFile,
} from '@/lib/fileUpload';
import { STATUS_SOFT } from '@/lib/statusColors';
import { usePatientChart } from './PatientChartContext';
import { ChartTabShell, EmptyState, RowActionMenu, StatusBadge } from './components/chart-ui';

const ORDER_STATUS_CLASSES = {
  Scheduled: STATUS_SOFT.info,
  Pending: STATUS_SOFT.warning,
  'In Progress': STATUS_SOFT.info,
  'On Hold': STATUS_SOFT.warning,
  Cancelled: STATUS_SOFT.muted,
  Completed: STATUS_SOFT.success,
  Resulted: STATUS_SOFT.success,
};

const RESULT_CATEGORY_META = {
  Lab: { category: 'Lab', documentType: 'Lab Report' },
  Radiology: { category: 'Imaging', documentType: 'Imaging Report' },
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function UploadResultDialog({ open, onOpenChange, order, onUpload, uploading, error }) {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setNotes('');
      setLocalError(null);
    }
  }, [open, order?.id]);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    const accepted = [];
    for (const file of selected) {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        setLocalError(`${file.name}: ${validation.message}`);
        continue;
      }
      accepted.push(file);
    }
    setFiles((prev) => {
      const merged = [...prev];
      accepted.forEach((file) => {
        const id = `${file.name}-${file.size}-${file.lastModified}`;
        if (!merged.some((f) => f.id === id)) merged.push({ id, file });
      });
      return merged;
    });
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload result{order ? ` — ${order.procedureName}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-1">
          <p className="text-sm text-muted-foreground">
            Attach one or more result files. Files are saved to the patient&apos;s documents and the
            order is marked completed.
          </p>
          <div className="space-y-2">
            <Label htmlFor="result-files">Result files *</Label>
            <Input
              id="result-files"
              type="file"
              multiple
              accept={ACCEPTED_DOCUMENT_INPUT}
              onChange={handleFileChange}
            />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.file.name}</div>
                    <div className="text-muted-foreground">{formatFileSize(item.file.size)}</div>
                  </div>
                  {!uploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFile(item.id)}
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="result-notes">Notes (optional)</Label>
            <Textarea
              id="result-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preliminary report, addendum to follow"
            />
          </div>
          {(localError || error) && (
            <p className="text-sm text-destructive">{localError || error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={() => onUpload(files.map((f) => f.file), notes.trim())}
            disabled={uploading || files.length === 0}
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrdersSection({ title, icon: Icon, orders, onAction, busyId }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={Icon} title={`No ${title.toLowerCase()} on file`} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order name</TableHead>
                <TableHead>Ordered by</TableHead>
                <TableHead>Ordered date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const terminal = order.status === 'Cancelled' || order.status === 'Completed';
                const items = [
                  { id: 'hold', label: 'Put On Hold', icon: PauseCircle, hidden: terminal || order.status === 'On Hold' },
                  { id: 'cancel', label: 'Cancel Order', icon: Ban, destructive: true, hidden: terminal },
                  { id: 'upload', label: 'Upload Result', icon: Upload, hidden: order.status === 'Cancelled' },
                ];
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.procedureName}</div>
                      {order.procedureCode && (
                        <div className="font-mono text-xs text-muted-foreground">{order.procedureCode}</div>
                      )}
                    </TableCell>
                    <TableCell>{order.orderedBy || '—'}</TableCell>
                    <TableCell>{formatDate(order.orderDateTime || order.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} className={ORDER_STATUS_CLASSES[order.status] || ''} />
                    </TableCell>
                    <TableCell className="text-right">
                      {busyId === order.id ? (
                        <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <RowActionMenu
                          items={items}
                          label="Order actions"
                          onSelect={(actionId) => onAction(actionId, order)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

export function PatientResultsTab() {
  const { patientId, appointmentId, isSampleChart, refreshChart } = usePatientChart();
  const canFetch = Boolean(patientId && !isSampleChart);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [uploadOrder, setUploadOrder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loadOrders = useCallback(async () => {
    if (!canFetch) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrders({ patientId, limit: 500 });
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, patientId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const { labOrders, radiologyOrders } = useMemo(
    () => ({
      labOrders: orders.filter((o) => o.category === 'Lab'),
      radiologyOrders: orders.filter((o) => o.category === 'Radiology'),
    }),
    [orders],
  );

  const changeStatus = async (order, status) => {
    setBusyId(order.id);
    setError(null);
    try {
      await orderApi.updateOrderStatus(order.id, status);
      await loadOrders();
      refreshChart?.();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = (actionId, order) => {
    if (actionId === 'hold') return changeStatus(order, 'On Hold');
    if (actionId === 'cancel') return changeStatus(order, 'Cancelled');
    if (actionId === 'upload') {
      setUploadError(null);
      setUploadOrder(order);
    }
    return undefined;
  };

  const handleUpload = async (files, notes) => {
    if (!uploadOrder || !files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const meta = RESULT_CATEGORY_META[uploadOrder.category] || {
        category: 'Clinical',
        documentType: 'Other',
      };
      for (const file of files) {
        const fileData = await readFileAsDataUrl(file);
        await patientApi.createDocument(patientId, {
          title: `${uploadOrder.procedureName} — ${file.name}`,
          documentType: meta.documentType,
          category: meta.category,
          source: 'Lab / Imaging',
          encounterId: uploadOrder.appointmentId || appointmentId || null,
          description: notes || `Result for order ${uploadOrder.procedureName} (${uploadOrder.procedureCode})`,
          tags: [`order:${uploadOrder.id}`, uploadOrder.category],
          fileName: file.name,
          fileData,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          patientVisible: false,
        });
      }
      await orderApi.updateOrderStatus(uploadOrder.id, 'Resulted');
      setUploadOrder(null);
      setSuccessMessage(`Result${files.length > 1 ? 's' : ''} uploaded and order marked as resulted.`);
      await loadOrders();
      refreshChart?.();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload result');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ChartTabShell
      title="Results & orders"
      description="Lab and radiology orders for this patient. Update status or upload results."
      actions={
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading || !canFetch}>
          <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
          Refresh
        </Button>
      }
      error={error}
    >
      {!canFetch ? (
        <EmptyState icon={FlaskConical} title="Demo chart" description="Open a live patient chart to review orders and results." />
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading orders…</span>
        </div>
      ) : (
        <>
          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
              {successMessage}
            </div>
          )}
          <OrdersSection
            title="Laboratory orders"
            icon={FlaskConical}
            orders={labOrders}
            onAction={handleAction}
            busyId={busyId}
          />
          <OrdersSection
            title="Radiology orders"
            icon={ScanLine}
            orders={radiologyOrders}
            onAction={handleAction}
            busyId={busyId}
          />
        </>
      )}

      <UploadResultDialog
        open={Boolean(uploadOrder)}
        onOpenChange={(open) => !open && setUploadOrder(null)}
        order={uploadOrder}
        onUpload={handleUpload}
        uploading={uploading}
        error={uploadError}
      />
    </ChartTabShell>
  );
}
