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

function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function ViewRadiologyReportDialog({ open, onClose, order, patient }) {
  if (!order) return null;

  const chiefComplaint = order.chiefComplaint ?? patient?.admission?.chiefComplaint ?? '-';
  const techniques = Array.isArray(order.techniques) ? order.techniques.join(', ') : '-';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Radiology Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-muted-foreground">Order name</Label>
            <Input value={order.orderName ?? ''} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Chief complaint</Label>
            <Input value={chiefComplaint} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Techniques</Label>
            <Input value={techniques} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Finding</Label>
            <Textarea value={order.findings ?? ''} readOnly className="bg-muted resize-none" rows={4} />
          </div>
          <div>
            <Label className="text-muted-foreground">Impressions</Label>
            <Textarea value={order.impressions ?? ''} readOnly className="bg-muted resize-none" rows={3} />
          </div>
          <div>
            <Label className="text-muted-foreground">Test notes</Label>
            <Textarea value={order.testNotes ?? ''} readOnly className="bg-muted resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Priority</Label>
              <Input value={order.priority ?? '-'} readOnly className="bg-muted" />
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Input value={order.status ?? '-'} readOnly className="bg-muted" />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Interpreted By</Label>
            <Input value={order.interpretedBy ?? '-'} readOnly className="bg-muted" />
          </div>
          <div>
            <Label className="text-muted-foreground">Imaging Detail</Label>
            <Input value={formatDateTime(order.imagingDetailDateTime || order.orderDateTime)} readOnly className="bg-muted" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
