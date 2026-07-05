import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import { DiagnosisSearchField } from './DiagnosisSearchField';
import {
  CLINICAL_STATUSES,
  PROBLEM_STATUSES,
  VERIFICATION_STATUSES,
  emptyProblemForm,
  problemToForm,
} from './problemConstants';

function validateForm(form, patientDob) {
  const errors = {};
  if (!form.diagnosisId) errors.diagnosis = 'Diagnosis selection is required.';
  if (!form.status) errors.status = 'Status is required.';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (form.onsetDate) {
    const onset = new Date(`${form.onsetDate}T12:00:00`);
    if (onset > today) errors.onsetDate = 'Onset date cannot be in the future.';
    if (patientDob) {
      const dob = new Date(`${patientDob.slice(0, 10)}T12:00:00`);
      if (onset < dob) errors.onsetDate = 'Onset date cannot be before patient date of birth.';
    }
  }

  if (form.resolvedDate) {
    const resolved = new Date(`${form.resolvedDate}T12:00:00`);
    if (resolved > today) errors.resolvedDate = 'Resolved date cannot be in the future.';
    if (form.onsetDate) {
      const onset = new Date(`${form.onsetDate}T12:00:00`);
      if (resolved < onset) errors.resolvedDate = 'Resolved date cannot be earlier than onset date.';
    }
  }

  if (form.status === 'Resolved' && !form.resolvedDate) {
    errors.resolvedDate = 'Resolved date is required when status is Resolved.';
  }

  if (form.notes && form.notes.length > 2000) {
    errors.notes = 'Notes cannot exceed 2,000 characters.';
  }

  return errors;
}

export function AddProblemDialog({
  open,
  onOpenChange,
  mode = 'create',
  initialProblem,
  patientDob,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState(emptyProblemForm());
  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(mode === 'edit' ? problemToForm(initialProblem) : emptyProblemForm());
      setErrors({});
      setClinicalOpen(false);
    }
  }, [open, mode, initialProblem]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleDiagnosisSelect = ({ diagnosisId, icd10Code, diagnosisDescription }) => {
    update('diagnosisId', diagnosisId);
    update('icd10Code', icd10Code);
    update('diagnosisDescription', diagnosisDescription);
  };

  const handleSubmit = () => {
    const nextErrors = validateForm(form, patientDob);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit?.(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit problem' : 'Add problem'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <DiagnosisSearchField
            value={
              form.diagnosisId
                ? { id: form.diagnosisId, code: form.icd10Code, description: form.diagnosisDescription }
                : null
            }
            onSelect={handleDiagnosisSelect}
            error={errors.diagnosis}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.icd10Code} readOnly placeholder="e.g. E11.9" className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.diagnosisDescription}
                readOnly
                placeholder="e.g. Type 2 diabetes mellitus"
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
            </div>
            <div className="space-y-2">
              <Label>Clinical status</Label>
              <Select value={form.clinicalStatus} onValueChange={(v) => update('clinicalStatus', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLINICAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification</Label>
              <Select
                value={form.verificationStatus}
                onValueChange={(v) => update('verificationStatus', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Onset date</Label>
              <Input
                type="date"
                value={form.onsetDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => update('onsetDate', e.target.value)}
              />
              {errors.onsetDate && <p className="text-xs text-destructive">{errors.onsetDate}</p>}
            </div>
            <div className="space-y-2">
              <Label>Resolved date</Label>
              <Input
                type="date"
                value={form.resolvedDate}
                max={new Date().toISOString().slice(0, 10)}
                min={form.onsetDate || undefined}
                onChange={(e) => update('resolvedDate', e.target.value)}
              />
              {errors.resolvedDate && (
                <p className="text-xs text-destructive">{errors.resolvedDate}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
              onClick={() => setClinicalOpen((o) => !o)}
            >
              Add clinical details
              {clinicalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {clinicalOpen && (
              <div className="border-t px-4 pb-4 pt-2">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={4}
                    placeholder="Additional clinical notes..."
                    value={form.notes}
                    maxLength={2000}
                    onChange={(e) => update('notes', e.target.value)}
                  />
                  {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add problem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
