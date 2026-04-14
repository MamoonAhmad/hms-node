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
import { COLLECTION_SITES, SPECIMEN_TYPES } from '@/lib/labConstants';

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toISOString().slice(0, 16);
}

export function EditSpecimenDialog({ open, onOpenChange, labTest, onSaved }) {
  const [formData, setFormData] = useState({
    collectionSite: '',
    specimenType: '',
    specimenStatus: 'Pending',
    collectedBy: '',
    collectionDateTime: formatDateTime(new Date()),
    collectionNotes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labTest) {
      setFormData({
        collectionSite: labTest.collectionSite || '',
        specimenType: labTest.specimenType || '',
        specimenStatus: labTest.specimenStatus || 'Pending',
        collectedBy: labTest.collectedBy || '',
        collectionDateTime: labTest.collectionDateTime ? formatDateTime(labTest.collectionDateTime) : formatDateTime(new Date()),
        collectionNotes: labTest.collectionNotes || '',
      });
    }
  }, [labTest]);

  const handleSave = async () => {
    if (!labTest?.id) return;
    if (!formData.collectionNotes?.trim()) {
      alert('Collection Notes is mandatory.');
      return;
    }
    setSaving(true);
    try {
      await labApi.updateLabTest(labTest.id, {
        collectionSite: formData.collectionSite,
        specimenType: formData.specimenType,
        specimenStatus: formData.specimenStatus,
        collectedBy: formData.collectedBy,
        collectionDateTime: formData.collectionDateTime ? new Date(formData.collectionDateTime).toISOString() : new Date().toISOString(),
        collectionNotes: formData.collectionNotes,
        specimenNo: labTest.specimenNo || `SP-${labTest.id}`,
      });
      onSaved?.();
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
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Specimen (Collection Step)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div><Label className="text-xs text-muted-foreground">Lab Order Name</Label><Input value={labTest.testName} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Department</Label><Input value={labTest.department} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Created By</Label><Input value={labTest.createdBy} readOnly className="bg-background" /></div>
            <div><Label className="text-xs text-muted-foreground">Created At</Label><Input value={labTest.createdAt ? new Date(labTest.createdAt).toLocaleString() : ''} readOnly className="bg-background" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Collection Site *</Label>
              <Select value={formData.collectionSite} onValueChange={(v) => setFormData((f) => ({ ...f, collectionSite: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {COLLECTION_SITES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specimen Type *</Label>
              <Select value={formData.specimenType} onValueChange={(v) => setFormData((f) => ({ ...f, specimenType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SPECIMEN_TYPES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specimen Status</Label>
              <Select value={formData.specimenStatus} onValueChange={(v) => setFormData((f) => ({ ...f, specimenStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Collected By *</Label>
              <Input value={formData.collectedBy} onChange={(e) => setFormData((f) => ({ ...f, collectedBy: e.target.value }))} placeholder="Name" />
            </div>
            <div className="col-span-2">
              <Label>Collection Date & Time</Label>
              <Input type="datetime-local" value={formData.collectionDateTime} onChange={(e) => setFormData((f) => ({ ...f, collectionDateTime: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Collection Notes *</Label>
              <Textarea value={formData.collectionNotes} onChange={(e) => setFormData((f) => ({ ...f, collectionNotes: e.target.value }))} placeholder="Mandatory" rows={3} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button variant="secondary" onClick={() => { /* Transferred to lab action */ onOpenChange?.(false); onSaved?.(); }}>
            Transferred to lab
          </Button>
          <Button onClick={handleSave} disabled={saving}>Update Lab Test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
