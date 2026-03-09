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

export function ViewSpecimenDialog({ open, onOpenChange, labTest }) {
  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Specimen (Collection Step)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div><Label className="text-xs text-muted-foreground">Lab Order Name</Label><Input value={labTest.testName || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Test ID</Label><Input value={labTest.testId || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Department</Label><Input value={labTest.department || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Created By</Label><Input value={labTest.createdBy || ''} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Created At</Label><Input value={formatDateTime(labTest.createdAt)} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Test Status</Label><Input value={labTest.resultStatus || 'Ordered'} readOnly className="bg-background" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-muted-foreground">Collection Site</Label><Input value={labTest.collectionSite || '-'} readOnly className="bg-muted" /></div>
            <div><Label className="text-muted-foreground">Specimen Type</Label><Input value={labTest.specimenType || '-'} readOnly className="bg-muted" /></div>
            <div><Label className="text-muted-foreground">Specimen Status</Label><Input value={labTest.specimenStatus || '-'} readOnly className="bg-muted" /></div>
            <div><Label className="text-muted-foreground">Collected By</Label><Input value={labTest.collectedBy || '-'} readOnly className="bg-muted" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground">Collection Date & Time</Label><Input value={formatDateTime(labTest.collectionDateTime)} readOnly className="bg-muted" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground">Collection Notes</Label><Textarea value={labTest.collectionNotes || '-'} readOnly className="bg-muted" rows={3} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
