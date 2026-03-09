import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function LabOrderDetailDialog({ open, onOpenChange, order, onMarkReviewed }) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) setComments(order.providerComments ?? '');
  }, [order]);

  if (!order) return null;

  const handleMarkReviewed = async () => {
    setIsSubmitting(true);
    try {
      await onMarkReviewed?.(order.id, comments);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lab Order Detail - {order.orderId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold border-b pb-2 mb-2">Patient Information</h3>
            <p className="text-sm">{order.patientName}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold border-b pb-2 mb-2">Ordered Tests</h3>
            <p className="text-sm">{order.labTestNames}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold border-b pb-2 mb-2">External Lab Details</h3>
            <p className="text-sm">{order.externalLabName}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold border-b pb-2 mb-2">Uploaded Reports</h3>
            {order.uploadedReports?.length ? (
              <ul className="text-sm space-y-1">
                {order.uploadedReports.map((r) => (
                  <li key={r.id}>
                    {r.fileName} ({r.reportType}) - Test: {r.testDate} - Received: {r.reportReceivedDate}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reports uploaded yet.</p>
            )}
          </section>
          <section>
            <h3 className="text-sm font-semibold border-b pb-2 mb-2">Provider Review</h3>
            <div className="space-y-2">
              <Label>Provider Comments</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add provider comments..."
                rows={3}
              />
            </div>
          </section>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleMarkReviewed} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Mark as Reviewed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
