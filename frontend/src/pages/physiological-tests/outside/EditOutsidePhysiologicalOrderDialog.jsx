import { useState, useEffect, useRef } from 'react';
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
import { Upload, X, FileText } from 'lucide-react';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function EditOutsidePhysiologicalOrderDialog({ open, onOpenChange, order, patient, onSave }) {
  const attachmentInputRef = useRef(null);
  const reportInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Send order with optional attachment
  const [sendOutDate, setSendOutDate] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentNotes, setAttachmentNotes] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  // Accept report with optional attachment
  const [reportReceivedAt, setReportReceivedAt] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [reportNotes, setReportNotes] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (open && order) {
      setSendOutDate(order.sendOutDate ? order.sendOutDate.slice(0, 10) : '');
      setAttachmentFile(null);
      setAttachmentNotes('');
      setAttachmentError('');
      setReportReceivedAt(order.reportReceivedAt ? order.reportReceivedAt.slice(0, 10) : '');
      setReportFile(null);
      setReportNotes('');
      setReportError('');
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      if (reportInputRef.current) reportInputRef.current.value = '';
    }
  }, [open, order]);

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachmentFile(null);
      setAttachmentError('');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAttachmentError(`File must be under ${MAX_FILE_SIZE_MB} MB`);
      setAttachmentFile(null);
      return;
    }
    setAttachmentError('');
    setAttachmentFile(file);
    e.target.value = '';
  };

  const handleReportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReportFile(null);
      setReportError('');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setReportError(`File must be under ${MAX_FILE_SIZE_MB} MB`);
      setReportFile(null);
      return;
    }
    setReportError('');
    setReportFile(file);
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentError('');
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const removeReportFile = () => {
    setReportFile(null);
    setReportError('');
    if (reportInputRef.current) reportInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!order?.id) return;

    const sendingOrder = sendOutDate.trim() || attachmentFile || attachmentNotes.trim();
    const acceptingReport = reportReceivedAt.trim() || reportFile || reportNotes.trim();

    if (acceptingReport && !reportReceivedAt.trim()) {
      setReportError('Report received date is required when accepting a report.');
      return;
    }

    setSaving(true);
    setReportError('');
    setAttachmentError('');

    const payload = {
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: 'Current User',
    };

    if (sendingOrder) {
      if (sendOutDate.trim()) payload.sendOutDate = new Date(sendOutDate).toISOString();
      if (attachmentFile) {
        payload.orderAttachmentFileName = attachmentFile.name;
        payload.orderAttachmentNotes = attachmentNotes.trim() || undefined;
      }
      if (attachmentNotes.trim() && !attachmentFile) payload.orderAttachmentNotes = attachmentNotes.trim();
    }

    if (acceptingReport) {
      payload.reportReceivedAt = new Date(reportReceivedAt).toISOString();
      if (reportFile) payload.reportFileName = reportFile.name;
      payload.reportReceivedNotes = reportNotes.trim() || undefined;
      payload.status = 'Received';
    }

    onSave?.({ ...order, ...payload });
    setSaving(false);
    onOpenChange?.(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit outside physiological test order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">{order.testName}</div>
            <div className="text-muted-foreground">Order ID: {order.id}</div>
            {order.externalFacility && (
              <div className="text-muted-foreground">External facility: {order.externalFacility}</div>
            )}
            <div className="mt-1">
              <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                {order.status}
              </span>
            </div>
          </div>

          {/* Send order (with or without attachment) */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Send order
            </h4>
            <p className="text-sm text-muted-foreground">
              Record sending this order to an external facility. You can attach a referral or requisition (optional).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Send date</Label>
                <Input
                  type="date"
                  value={sendOutDate}
                  onChange={(e) => setSendOutDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,image/*,.doc,.docx"
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()}>
                Attach file (optional)
              </Button>
              {attachmentFile && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {attachmentFile.name}
                  <button type="button" onClick={removeAttachment} className="text-destructive hover:underline" aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
            </div>
            {attachmentError && <p className="text-sm text-destructive">{attachmentError}</p>}
            <div>
              <Label className="text-muted-foreground">Notes (optional)</Label>
              <Input
                placeholder="e.g. Referral for outside EKG"
                value={attachmentNotes}
                onChange={(e) => setAttachmentNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Accept report (with or without attachment) */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Accept report
            </h4>
            <p className="text-sm text-muted-foreground">
              Record receipt of the physiological test report from the external facility. You can attach the report file (optional).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Report received date * (if accepting report)</Label>
                <Input
                  type="date"
                  value={reportReceivedAt}
                  onChange={(e) => setReportReceivedAt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Report file (optional)</Label>
              <input
                ref={reportInputRef}
                type="file"
                accept=".pdf,image/*,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleReportFileChange}
              />
              <div className="flex items-center gap-2 mt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => reportInputRef.current?.click()}>
                  Upload report
                </Button>
                {reportFile && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {reportFile.name}
                    <button type="button" onClick={removeReportFile} className="text-destructive hover:underline" aria-label="Remove file">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
            </div>
            {reportError && <p className="text-sm text-destructive">{reportError}</p>}
            <div>
              <Label className="text-muted-foreground">Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Summary or comments"
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
