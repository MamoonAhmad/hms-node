import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function ViewPhysiologicalOrderDialog({ open, onClose, order, patient }) {
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="min-w-[800px] max-w-md">
        <DialogHeader>
          <DialogTitle>Order details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          {patient && (
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-muted-foreground">Patient</p>
              <p className="font-medium">{patient.name}</p>
              <p className="text-muted-foreground">MRN: {patient.mrn}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div><Label className="text-muted-foreground">Test name</Label><p className="font-medium">{order.testName}</p></div>
            <div><Label className="text-muted-foreground">Test type</Label><p>{order.testType}</p></div>
            <div><Label className="text-muted-foreground">Department</Label><p>{order.department}</p></div>
            <div><Label className="text-muted-foreground">Status</Label><p>{order.status}</p></div>
            <div><Label className="text-muted-foreground">Priority</Label><p>{order.priority}</p></div>
            <div><Label className="text-muted-foreground">Ordering provider</Label><p>{order.orderingProvider}</p></div>
            {order.externalFacility && (
              <div className="col-span-2"><Label className="text-muted-foreground">External facility</Label><p>{order.externalFacility}</p></div>
            )}
            <div><Label className="text-muted-foreground">Order date</Label><p>{formatDateTime(order.orderDateTime)}</p></div>
            <div><Label className="text-muted-foreground">Last updated</Label><p>{formatDateTime(order.lastUpdatedAt)}</p></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
