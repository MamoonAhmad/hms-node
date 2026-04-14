import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function formatDateTime(str) {
  if (!str) return '-';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function ViewTransportDialog({ open, onOpenChange, labTest }) {
  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Specimen Transport</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div><Label className="text-xs text-muted-foreground">Test Name</Label><Input value={labTest.testName || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Test ID</Label><Input value={labTest.testId || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Specimen Status</Label><Input value={labTest.specimenStatus || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Transport Status</Label><Input value={labTest.transportStatus || '-'} readOnly className="bg-background" /></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Transport Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">Origin Location</Label><Input value={labTest.originLocation || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Origin Department</Label><Input value={labTest.originDepartment || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Destination Lab</Label><Input value={labTest.destinationLab || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Batch Number</Label><Input value={labTest.batchNumber || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Transport Timestamp</Label><Input value={formatDateTime(labTest.transportTimestamp)} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Transport by</Label><Input value={labTest.transportStaff || labTest.transportBy || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Transport Condition</Label><Input value={labTest.transportCondition || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Transport Priority</Label><Input value={labTest.transportPriority || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Transport Carrier</Label><Input value={labTest.transportCarrier || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Tracking Number</Label><Input value={labTest.trackingNumber || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Container Type</Label><Input value={labTest.containerType || '-'} readOnly className="bg-muted" /></div>
              <div><Label className="text-muted-foreground">Transport Temperature</Label><Input value={labTest.transportTemperature || '-'} readOnly className="bg-muted" /></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
