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
import { labApi } from '@/services/api';

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toISOString().slice(0, 16);
}

export function ReceiveSpecimenDialog({ open, onOpenChange, labTest, onSaved }) {
  const [formData, setFormData] = useState({
    receivedTimestamp: formatDateTime(new Date()),
    receivedBy: '',
    receiveStatus: 'Pending',
    specimenCondition: '',
    transportNotes: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labTest) {
      setFormData({
        receivedTimestamp: labTest.receivedTimestamp ? formatDateTime(labTest.receivedTimestamp) : formatDateTime(new Date()),
        receivedBy: labTest.receivedBy || '',
        receiveStatus: labTest.receiveStatus || 'Pending',
        specimenCondition: labTest.specimenCondition || '',
        transportNotes: labTest.transportNotes || '',
      });
    }
  }, [labTest]);

  const handleSave = async () => {
    if (!labTest?.id) return;
    if (!formData.receivedBy?.trim()) { alert('Received By is required.'); return; }
    if (formData.receiveStatus === 'Rejected' && !rejectReason?.trim()) { alert('Rejection reason is required.'); return; }
    setSaving(true);
    try {
      await labApi.updateLabTest(labTest.id, {
        receivedTimestamp: formData.receivedTimestamp ? new Date(formData.receivedTimestamp).toISOString() : new Date().toISOString(),
        receivedBy: formData.receivedBy,
        receiveStatus: formData.receiveStatus,
        specimenCondition: formData.specimenCondition,
        transportNotes: formData.transportNotes,
        rejectReason: formData.receiveStatus === 'Rejected' ? rejectReason : undefined,
      });
      onSaved?.();
      onOpenChange?.(false);
    } catch (e) {
      alert(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const quickAccept = () => {
    setFormData((f) => ({ ...f, receiveStatus: 'Accepted', specimenCondition: 'Good' }));
  };
  const quickReject = () => {
    setFormData((f) => ({ ...f, receiveStatus: 'Rejected' }));
  };

  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Specimen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={quickAccept}>Quick Accept</Button>
            <Button type="button" size="sm" variant="destructive" onClick={quickReject}>Quick Reject</Button>
          </div>
          <div>
            <Label>Received Timestamp *</Label>
            <Input type="datetime-local" value={formData.receivedTimestamp} onChange={(e) => setFormData((f) => ({ ...f, receivedTimestamp: e.target.value }))} />
          </div>
          <div>
            <Label>Received By *</Label>
            <Input value={formData.receivedBy} onChange={(e) => setFormData((f) => ({ ...f, receivedBy: e.target.value }))} placeholder="Name" />
          </div>
          <div>
            <Label>Receive Status *</Label>
            <Select value={formData.receiveStatus} onValueChange={(v) => setFormData((f) => ({ ...f, receiveStatus: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Specimen Condition</Label>
            <Input value={formData.specimenCondition} onChange={(e) => setFormData((f) => ({ ...f, specimenCondition: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <Label>Transport Notes</Label>
            <Textarea value={formData.transportNotes} onChange={(e) => setFormData((f) => ({ ...f, transportNotes: e.target.value }))} rows={2} />
          </div>
          {formData.receiveStatus === 'Rejected' && (
            <div>
              <Label>Rejection Reason *</Label>
              <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Update Lab Test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
