import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { chiefComplaintApi } from '@/services/api';
import { IntakeSectionShell } from '../IntakeSectionShell';
import { useIntake } from '../IntakeContext';

const emptyForm = () => ({
  reasonForVisit: '',
  chiefComplaintId: '',
  chiefComplaintName: '',
  chiefComplaintCode: '',
  hpiLocation: '',
  hpiQuality: '',
  hpiSeverity: '',
  hpiDuration: '',
  hpiTiming: '',
  hpiContext: '',
  hpiModifyingFactors: '',
  hpiAssociatedSymptoms: '',
  hpiGeneratedText: '',
});

function ChiefComplaintForm({ open, onOpenChange, onSave, initialData }) {
  const [form, setForm] = useState(emptyForm);
  const [complaints, setComplaints] = useState([]);
  const [saving, setSaving] = useState(false);
  const { saveSection } = useIntake();

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...emptyForm(), ...initialData } : emptyForm());
      chiefComplaintApi
        .getAll({ limit: 200, isActive: true })
        .then((res) => setComplaints(Array.isArray(res.data) ? res.data : []))
        .catch(() => setComplaints([]));
    }
  }, [open, initialData]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleChiefComplaintSelect = (id) => {
    const row = complaints.find((c) => c.id === id);
    update('chiefComplaintId', id);
    update('chiefComplaintName', row?.name || '');
    update('chiefComplaintCode', row?.code || '');
  };

  const handleGenerateHpi = () => {
    const parts = [
      form.hpiLocation && `Location: ${form.hpiLocation}`,
      form.hpiQuality && `Quality: ${form.hpiQuality}`,
      form.hpiSeverity && `Severity: ${form.hpiSeverity}`,
      form.hpiDuration && `Duration: ${form.hpiDuration}`,
      form.hpiTiming && `Timing: ${form.hpiTiming}`,
      form.hpiContext && `Context: ${form.hpiContext}`,
      form.hpiModifyingFactors && `Modifying factors: ${form.hpiModifyingFactors}`,
      form.hpiAssociatedSymptoms && `Associated symptoms: ${form.hpiAssociatedSymptoms}`,
    ].filter(Boolean);
    update('hpiGeneratedText', parts.join('\n'));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await saveSection('chief_complaint_hpi', form, { isAddendum: Boolean(initialData) });
      onSave?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chief Complaint & HPI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason for visit</Label>
            <Input value={form.reasonForVisit} onChange={(e) => update('reasonForVisit', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Chief complaint</Label>
            <Select value={form.chiefComplaintId} onValueChange={handleChiefComplaintSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select chief complaint" />
              </SelectTrigger>
              <SelectContent>
                {complaints.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code ? `${c.code} — ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.hpiLocation} onChange={(e) => update('hpiLocation', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quality</Label>
              <Input value={form.hpiQuality} onChange={(e) => update('hpiQuality', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Input value={form.hpiSeverity} onChange={(e) => update('hpiSeverity', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input value={form.hpiDuration} onChange={(e) => update('hpiDuration', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Timing</Label>
              <Input value={form.hpiTiming} onChange={(e) => update('hpiTiming', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Context</Label>
              <Input value={form.hpiContext} onChange={(e) => update('hpiContext', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Modifying factors</Label>
            <Input
              value={form.hpiModifyingFactors}
              onChange={(e) => update('hpiModifyingFactors', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Associated symptoms</Label>
            <Input
              value={form.hpiAssociatedSymptoms}
              onChange={(e) => update('hpiAssociatedSymptoms', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated HPI</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleGenerateHpi}>
                Generate
              </Button>
            </div>
            <Textarea
              rows={5}
              value={form.hpiGeneratedText}
              onChange={(e) => update('hpiGeneratedText', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChiefComplaintHPISection() {
  return (
    <IntakeSectionShell
      title="Chief Complaint & HPI"
      sectionKey="chief_complaint_hpi"
      emptyMessage="No chief complaint recorded."
      renderSummary={(data) =>
        [data.chiefComplaintName || data.reasonForVisit, data.hpiGeneratedText]
          .filter(Boolean)
          .join(' — ')
      }
    >
      {({ open, onOpenChange, onSaved }) => (
        <ChiefComplaintForm open={open} onOpenChange={onOpenChange} onSave={onSaved} />
      )}
    </IntakeSectionShell>
  );
}
