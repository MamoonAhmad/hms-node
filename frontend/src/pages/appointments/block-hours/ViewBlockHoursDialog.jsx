import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

function formatDateRange(start, end) {
  if (!start && !end) return '-';
  if (start && !end) return `${start} → (no end)`;
  if (!start && end) return `(no start) → ${end}`;
  return `${start} → ${end}`;
}

export function ViewBlockHoursDialog({ open, onOpenChange, block }) {
  if (!block) return null;
  const daysLabel = (block.days || []).join(', ') || '-';
  const locationsLabel = (block.locations || []).join(', ') || '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-lg">
        <DialogHeader>
          <DialogTitle>Block Hours Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Provider</Label>
              <p className="font-medium">{block.providerName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Status</Label>
              <Badge variant={block.status === 'Active' ? 'default' : 'secondary'}>{block.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Date range</Label>
              <p className="font-medium">{formatDateRange(block.effectiveStartDate, block.effectiveEndDate)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Time range</Label>
              <p className="font-medium">{formatTimeSlot(block.startTime, block.endTime)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground">Days</Label>
            <p className="font-medium">{daysLabel}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground">Locations</Label>
            <p className="font-medium">{locationsLabel}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground">Reason</Label>
            <p className="font-medium whitespace-pre-wrap">{block.reason || '-'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

