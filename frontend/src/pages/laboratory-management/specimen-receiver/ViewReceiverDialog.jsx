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
import { Textarea } from '@/components/ui/textarea';

function formatDateTime(str) {
  if (!str) return '-';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function ViewReceiverDialog({ open, onOpenChange, labTest }) {
  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Receive Specimen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Test Name</Label>
            <Input value={labTest.testName || ''} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Test ID</Label>
            <Input value={labTest.testId || ''} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Received Timestamp</Label>
            <Input value={formatDateTime(labTest.receivedTimestamp)} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Received By</Label>
            <Input value={labTest.receivedBy || '-'} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Receive Status</Label>
            <Input value={labTest.receiveStatus || 'Pending'} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Specimen Condition</Label>
            <Input value={labTest.specimenCondition || '-'} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Transport Notes</Label>
            <Textarea value={labTest.transportNotes || '-'} readOnly className="bg-muted" rows={2} />
          </div>
          {labTest.receiveStatus === 'Rejected' && labTest.rejectReason && (
            <div>
              <Label className="text-muted-foreground">Rejection Reason</Label>
              <Input value={labTest.rejectReason || '-'} readOnly className="bg-muted" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
