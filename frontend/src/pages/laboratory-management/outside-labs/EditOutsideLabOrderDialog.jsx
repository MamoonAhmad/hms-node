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
import { labApi } from '@/services/api';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_REPORT_TYPES = '.pdf,image/*,.jpg,.jpeg,.png';

function OrderStatusBadge({ status }) {
  const isReceived = status === 'Received report';
  const className = isReceived
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

export function EditOutsideLabOrderDialog({ open, onOpenChange, labTest, patientId, onSaved }) {
  const attachmentInputRef = useRef(null);
  const reportInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Section 1: Send attachment with order
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentNotes, setAttachmentNotes] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  // Section 2: Receive lab report (first time or update existing order)
  const [reportDate, setReportDate] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [performingLab, setPerformingLab] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (open && labTest) {
      setAttachmentFile(null);
      setAttachmentNotes('');
      setAttachmentError('');
      setReportDate('');
      setReportFile(null);
      setPerformingLab(labTest.performingLab || '');
      setReportNotes('');
      setReportError('');
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      if (reportInputRef.current) reportInputRef.current.value = '';
    }
  }, [open, labTest]);

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

  const handleSave = async () => {
    if (!labTest?.id) return;

    const receivingReport = reportDate.trim() || reportFile;
    if (receivingReport && !reportDate.trim()) {
      setReportError('Report date is required when receiving a lab report.');
      return;
    }
    if (receivingReport && !reportFile) {
      setReportError('Report file is required when receiving a lab report.');
      return;
    }

    setSaving(true);
    setReportError('');
    setAttachmentError('');

    try {
      const payload = {
        updatedAt: new Date().toISOString(),
      };

      // Section 1: attachment with order
      if (attachmentFile) {
        payload.orderAttachmentFileName = attachmentFile.name;
        payload.orderAttachmentNotes = attachmentNotes.trim() || undefined;
        // In a real app you would upload the file and set payload.orderAttachmentUrl = url;
      }

      // Section 2: receive lab report (first visit or update existing order)
      if (receivingReport) {
        payload.reportReceivedAt = new Date(reportDate).toISOString();
        payload.reportFileName = reportFile?.name;
        payload.performingLab = performingLab.trim() || undefined;
        payload.reportNotes = reportNotes.trim() || undefined;
        payload.resultStatus = 'Completed';
        // In a real app you would upload the report file and set payload.reportFileUrl = url;
      }

      if (labTest.source === 'order') {
        await onSaved?.({
          ...labTest,
          ...payload,
          orderStatus: receivingReport ? 'Received report' : labTest.orderStatus,
        });
      } else {
        await labApi.updateLabTest(labTest.id, payload);
        onSaved?.();
      }
      onOpenChange?.(false);
    } catch (e) {
      alert(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit outside lab order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order info (read-only) */}
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">{labTest.testName}</div>
            <div className="text-muted-foreground">Test ID: {labTest.testId}</div>
            <div className="mt-1">
              <OrderStatusBadge status={labTest.orderStatus} />
            </div>
          </div>

          {/* Section 1: Send attachment with order */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Send attachment with order
            </h4>
            <p className="text-sm text-muted-foreground">
              Attach a referral, requisition, or other document to this order (e.g. when sending out to an external lab).
            </p>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,image/*,.doc,.docx"
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()}>
                Choose file
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
                placeholder="e.g. Referral for outside lab"
                value={attachmentNotes}
                onChange={(e) => setAttachmentNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Section 2: Receive lab report */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Receive lab report
            </h4>
            <p className="text-sm text-muted-foreground">
              First-time visit: patient brings external lab report. Second encounter: update this order by receiving the lab report for this test.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Report date *</Label>
                <Input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Performing lab / facility</Label>
                <Input
                  placeholder="External lab or facility name"
                  value={performingLab}
                  onChange={(e) => setPerformingLab(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Report file (PDF or image) *</Label>
              <input
                ref={reportInputRef}
                type="file"
                accept={ACCEPTED_REPORT_TYPES}
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
