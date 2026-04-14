import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';

const TECHNIQUE_OPTIONS = [
  { value: 'X-Ray', label: 'X-Ray' },
  { value: 'CT', label: 'CT' },
  { value: 'MRI', label: 'MRI' },
  { value: 'Ultrasound', label: 'Ultrasound' },
  { value: 'Fluoroscopy', label: 'Fluoroscopy' },
  { value: 'Mammography', label: 'Mammography' },
  { value: 'Nuclear', label: 'Nuclear' },
];

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toISOString().slice(0, 16);
}

function toDateLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toISOString().slice(0, 10);
}

export function EditRadiologyReportDialog({ open, onClose, order, patient, onSave }) {
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    techniques: [],
    findings: '',
    impressions: '',
    testNotes: '',
    priority: 'Routine',
    status: 'Pending',
    interpretedBy: '',
    imagingDetailDateTime: '',
  });
  const [sendOutLocation, setSendOutLocation] = useState('');
  const [sendOutDate, setSendOutDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportReceivedDate, setReportReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportReceivedNotes, setReportReceivedNotes] = useState('');

  useEffect(() => {
    if (order) {
      setFormData({
        chiefComplaint: order.chiefComplaint ?? patient?.admission?.chiefComplaint ?? '',
        techniques: Array.isArray(order.techniques) ? order.techniques : [],
        findings: order.findings ?? '',
        impressions: order.impressions ?? '',
        testNotes: order.testNotes ?? '',
        priority: order.priority ?? 'Routine',
        status: order.status ?? 'Pending',
        interpretedBy: order.interpretedBy ?? '',
        imagingDetailDateTime: toDatetimeLocal(order.imagingDetailDateTime || order.orderDateTime),
      });
      setSendOutLocation(order.sendOutLocation ?? '');
      setSendOutDate(order.sendOutDate ? toDateLocal(order.sendOutDate) : new Date().toISOString().slice(0, 10));
      setReportReceivedDate(order.reportReceivedAt ? toDateLocal(order.reportReceivedAt) : new Date().toISOString().slice(0, 10));
      setReportReceivedNotes(order.reportReceivedNotes ?? '');
    }
  }, [order, patient, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!order?.id) return;
    onSave({
      ...order,
      chiefComplaint: formData.chiefComplaint,
      techniques: formData.techniques,
      findings: formData.findings,
      impressions: formData.impressions,
      testNotes: formData.testNotes,
      priority: formData.priority,
      status: formData.status,
      interpretedBy: formData.interpretedBy,
      imagingDetailDateTime: formData.imagingDetailDateTime ? new Date(formData.imagingDetailDateTime).toISOString() : order.orderDateTime,
    });
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Radiology Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-muted-foreground">Order name</Label>
            <Input value={order.orderName ?? ''} readOnly className="bg-muted" />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <Label className="text-base font-medium">Send out / Receive</Label>
            <p className="text-sm text-muted-foreground">Send this radiology order to another location or record that the report was received.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Send order to another location</Label>
                <Input
                  placeholder="Location or facility name"
                  value={sendOutLocation}
                  onChange={(e) => setSendOutLocation(e.target.value)}
                />
                <Input
                  type="date"
                  value={sendOutDate}
                  onChange={(e) => setSendOutDate(e.target.value)}
                  className="mt-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (!sendOutLocation.trim()) return;
                    onSave({
                      ...order,
                      ...formData,
                      sendOutLocation: sendOutLocation.trim(),
                      sendOutDate: sendOutDate ? new Date(sendOutDate).toISOString() : new Date().toISOString(),
                      lastUpdatedAt: new Date().toISOString(),
                      lastUpdatedBy: 'Current User',
                    });
                    onClose();
                  }}
                >
                  Send to location
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Receive radiology report</Label>
                <Input
                  type="date"
                  value={reportReceivedDate}
                  onChange={(e) => setReportReceivedDate(e.target.value)}
                />
                <Input
                  placeholder="Notes (optional)"
                  value={reportReceivedNotes}
                  onChange={(e) => setReportReceivedNotes(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onSave({
                      ...order,
                      ...formData,
                      reportReceivedAt: reportReceivedDate ? new Date(reportReceivedDate).toISOString() : new Date().toISOString(),
                      reportReceivedNotes: reportReceivedNotes.trim() || undefined,
                      status: 'Completed',
                      lastUpdatedAt: new Date().toISOString(),
                      lastUpdatedBy: 'Current User',
                    });
                    onClose();
                  }}
                >
                  Receive report
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Chief complaint</Label>
            <Input
              value={formData.chiefComplaint}
              onChange={(e) => setFormData((f) => ({ ...f, chiefComplaint: e.target.value }))}
              placeholder="Chief complaint"
            />
          </div>
          <div>
            <Label>Techniques</Label>
            <MultiSelect
              options={TECHNIQUE_OPTIONS}
              value={formData.techniques}
              onChange={(v) => setFormData((f) => ({ ...f, techniques: v }))}
              placeholder="Select techniques"
            />
          </div>
          <div>
            <Label>Finding</Label>
            <Textarea
              value={formData.findings}
              onChange={(e) => setFormData((f) => ({ ...f, findings: e.target.value }))}
              placeholder="Findings"
              rows={4}
              className="resize-none"
            />
          </div>
          <div>
            <Label>Impressions</Label>
            <Textarea
              value={formData.impressions}
              onChange={(e) => setFormData((f) => ({ ...f, impressions: e.target.value }))}
              placeholder="Impressions"
              rows={3}
              className="resize-none"
            />
          </div>
          <div>
            <Label>Test notes</Label>
            <Textarea
              value={formData.testNotes}
              onChange={(e) => setFormData((f) => ({ ...f, testNotes: e.target.value }))}
              placeholder="Test notes"
              rows={2}
              className="resize-none"
            />
          </div>
          <div>
            <Label>Upload attachments</Label>
            <Input type="file" multiple className="cursor-pointer" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Stat">Stat</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Progress">In progress</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Interpreted By</Label>
            <Input
              value={formData.interpretedBy}
              onChange={(e) => setFormData((f) => ({ ...f, interpretedBy: e.target.value }))}
              placeholder="Name"
            />
          </div>
          <div>
            <Label>Imaging Detail</Label>
            <Input
              type="datetime-local"
              value={formData.imagingDetailDateTime}
              onChange={(e) => setFormData((f) => ({ ...f, imagingDetailDateTime: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
