import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
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
import { labApi, orderApi } from '@/services/api';
import { COLLECTION_SITES, SPECIMEN_TYPES } from '@/lib/labConstants';
import { specimenStatusToOrderStatus } from '@/lib/orderWorklist';

function formatDateTimeLocal(str) {
  if (!str) return '';
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SPECIMEN_STATUS_OPTIONS = ['Pending', 'Collected', 'Cancelled'];

function normalizeSpecimenStatus(status) {
  if (SPECIMEN_STATUS_OPTIONS.includes(status)) return status;
  const s = String(status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  if (s === 'collected' || s === 'completed') return 'Collected';
  return 'Pending';
}

function isPendingStatus(status) {
  return normalizeSpecimenStatus(status) === 'Pending';
}

export function EditSpecimenDialog({ open, onOpenChange, labTest, onSaved }) {
  const [formData, setFormData] = useState({
    collectionSite: '',
    specimenType: '',
    specimenStatus: 'Pending',
    collectedBy: '',
    collectionDateTime: formatDateTimeLocal(new Date()),
    collectionNotes: '',
  });
  const [saving, setSaving] = useState(false);

  const isAddMode = isPendingStatus(labTest?.specimenStatus);

  useEffect(() => {
    if (!labTest || !open) return;
    setFormData({
      collectionSite: labTest.collectionSite || '',
      specimenType: labTest.specimenType || '',
      specimenStatus: normalizeSpecimenStatus(labTest.specimenStatus),
      collectedBy: labTest.collectedBy || '',
      collectionDateTime: labTest.collectionDateTime
        ? formatDateTimeLocal(labTest.collectionDateTime)
        : formatDateTimeLocal(new Date()),
      collectionNotes: labTest.collectionNotes || '',
    });
  }, [labTest, open]);

  const handleSave = async () => {
    if (!labTest?.id) return;
    setSaving(true);
    try {
      const collectionDateTime = formData.collectionDateTime
        ? new Date(formData.collectionDateTime).toISOString()
        : new Date().toISOString();
      const payload = {
        ...labTest,
        collectionSite: formData.collectionSite,
        specimenType: formData.specimenType,
        specimenStatus: formData.specimenStatus,
        collectedBy: formData.collectedBy,
        collectionDateTime,
        collectionNotes: formData.collectionNotes,
        specimenNo: labTest.specimenNo || `SP-${labTest.id}`,
      };

      if (labTest.source === 'order') {
        await orderApi.updateOrderSpecimen(labTest.id, {
          status: specimenStatusToOrderStatus(formData.specimenStatus),
          collectionSite: formData.collectionSite || null,
          specimenType: formData.specimenType || null,
          collectedBy: formData.collectedBy || null,
          collectionDateTime,
          collectionNotes: formData.collectionNotes || null,
        });
        await onSaved?.(payload);
      } else {
        await labApi.updateLabTest(labTest.id, payload);
        await onSaved?.(payload);
      }
      onOpenChange?.(false);
    } catch (e) {
      alert(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="min-w-[960px] w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto"
        closeOnOverlayClick={false}
      >
        <DialogHeader>
          <DialogTitle>
            {isAddMode ? 'Add Specimen Collection' : 'Edit Specimen (Collection Step)'}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Lab Order Name</Label>
              <Input value={labTest.testName || ''} readOnly className="bg-background" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Input value={labTest.department || 'Lab'} readOnly className="bg-background" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created By</Label>
              <Input value={labTest.createdBy || labTest.orderedBy || ''} readOnly className="bg-background" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <Input
                value={labTest.createdAt ? new Date(labTest.createdAt).toLocaleString() : ''}
                readOnly
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Collection Site *</Label>
              <Select
                value={formData.collectionSite || undefined}
                onValueChange={(v) => setFormData((f) => ({ ...f, collectionSite: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_SITES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Specimen Type *</Label>
              <Select
                value={formData.specimenType || undefined}
                onValueChange={(v) => setFormData((f) => ({ ...f, specimenType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIMEN_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Specimen Status</Label>
              <Select
                value={formData.specimenStatus}
                onValueChange={(v) => setFormData((f) => ({ ...f, specimenStatus: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Collected By *</Label>
              <Input
                value={formData.collectedBy}
                onChange={(e) => setFormData((f) => ({ ...f, collectedBy: e.target.value }))}
                placeholder="Name"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Collection Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.collectionDateTime}
                onChange={(e) => setFormData((f) => ({ ...f, collectionDateTime: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Collection Notes</Label>
              <Textarea
                value={formData.collectionNotes}
                onChange={(e) => setFormData((f) => ({ ...f, collectionNotes: e.target.value }))}
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange?.(false);
              onSaved?.();
            }}
          >
            Transferred to lab
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {isAddMode ? 'Save Specimen' : 'Update Lab Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
