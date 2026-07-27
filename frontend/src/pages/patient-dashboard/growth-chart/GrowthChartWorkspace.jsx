import { useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartTabShell, SectionCard } from '../components/chart-ui';
import { useIntake } from '../intake/IntakeContext';
import {
  calculateAge,
  FEEDING_TYPE_OPTIONS,
  INTAKE_SECTIONS,
} from '../intake/intakeConstants';
import { calculateBmi } from '@/pages/nurses/nurse-dashboard/vitals/VitalsForm';
import { IntakeRecordActions } from '../intake/components/IntakeRecordActions';

const emptyForm = () => ({
  measurementDate: new Date().toISOString().slice(0, 10),
  weightLbs: '',
  weightOz: '',
  heightFeet: '',
  heightInches: '',
  headCircumferenceCm: '',
  weightPercentile: '',
  heightPercentile: '',
  headCircumferencePercentile: '',
  bmiPercentile: '',
  feedingType: '',
  growthConcerns: '',
  notes: '',
});

function totalHeightInches(form) {
  const feet = parseFloat(form.heightFeet) || 0;
  const inches = parseFloat(form.heightInches) || 0;
  return feet * 12 + inches;
}

function weightDisplay(payload = {}) {
  if (!payload.weightLbs && payload.weightLbs !== 0) return '—';
  const oz = payload.weightOz ? ` ${payload.weightOz} oz` : '';
  return `${payload.weightLbs} lbs${oz}`;
}

function heightDisplay(payload = {}) {
  const ft = payload.heightFeet || 0;
  const inch = payload.heightInches || 0;
  if (!ft && !inch) return '—';
  return `${ft || 0}' ${inch || 0}"`;
}

function validateGrowth(form, ageYears) {
  const errors = [];
  if (!form.measurementDate) errors.push('Measurement date is required');
  if (form.weightLbs === '' || form.weightLbs == null) {
    errors.push('Weight is required');
  } else {
    const w = Number(form.weightLbs);
    if (!Number.isFinite(w) || w < 1 || w > 200) {
      errors.push('Weight must be between 1 and 200 lbs for pediatric patients');
    }
  }
  if (form.weightOz !== '' && form.weightOz != null) {
    const oz = Number(form.weightOz);
    if (!Number.isFinite(oz) || oz < 0 || oz >= 16) {
      errors.push('Weight ounces must be between 0 and 15.9');
    }
  }

  const inches = totalHeightInches(form);
  if (!form.heightFeet && !form.heightInches) {
    errors.push('Height / length is required');
  } else if (inches < 10 || inches > 72) {
    errors.push('Height / length must be between 10 and 72 inches');
  }

  const needsHead = ageYears !== null && ageYears < 3;
  if (needsHead && (form.headCircumferenceCm === '' || form.headCircumferenceCm == null)) {
    errors.push('Head circumference is required for patients under 3 years');
  }
  if (form.headCircumferenceCm !== '' && form.headCircumferenceCm != null) {
    const hc = Number(form.headCircumferenceCm);
    if (!Number.isFinite(hc) || hc < 25 || hc > 65) {
      errors.push('Head circumference must be between 25 and 65 cm');
    }
  }

  const pctFields = [
    ['weightPercentile', 'Weight percentile'],
    ['heightPercentile', 'Height percentile'],
    ['headCircumferencePercentile', 'Head circumference percentile'],
    ['bmiPercentile', 'BMI percentile'],
  ];
  for (const [key, label] of pctFields) {
    if (form[key] === '' || form[key] == null) continue;
    const n = Number(form[key]);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      errors.push(`${label} must be between 0 and 100`);
    }
  }

  return errors;
}

export function GrowthChartWorkspace() {
  const {
    patient,
    loading,
    error,
    getRecordsBySection,
    saveSection,
    updateRecord,
    addAddendum,
    saving,
    isCertified,
  } = useIntake();

  const ageYears = calculateAge(patient?.dateOfBirth);
  const records = getRecordsBySection(INTAKE_SECTIONS.GROWTH_CHART);
  const sorted = useMemo(
    () =>
      [...records].sort((a, b) => {
        const da = a.payload?.measurementDate || a.createdAt;
        const db = b.payload?.measurementDate || b.createdAt;
        return new Date(db) - new Date(da);
      }),
    [records],
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amendNotes, setAmendNotes] = useState('');
  const [errors, setErrors] = useState([]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const bmi = calculateBmi({
    weight: form.weightLbs,
    heightFeet: form.heightFeet,
    heightInches: form.heightInches,
  });

  const openCreate = () => {
    setMode('create');
    setActiveRecord(null);
    setForm(emptyForm());
    setAmendNotes('');
    setErrors([]);
    setOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActiveRecord(record);
    setForm({ ...emptyForm(), ...(record.payload || {}) });
    setErrors([]);
    setOpen(true);
  };

  const openAmend = (record) => {
    setMode('amend');
    setActiveRecord(record);
    setForm({ ...emptyForm(), ...(record.payload || {}) });
    setAmendNotes('');
    setErrors([]);
    setOpen(true);
  };

  const handleSave = async () => {
    const validationErrors = validateGrowth(form, ageYears);
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    const payload = { ...form, bmi: bmi || null };
    setErrors([]);
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.GROWTH_CHART, payload });
    }
    setOpen(false);
    setForm(emptyForm());
  };

  if (loading) {
    return (
      <ChartTabShell title="Growth Chart" description="Pediatric growth measurements and percentiles.">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading growth chart…</span>
        </div>
      </ChartTabShell>
    );
  }

  return (
    <ChartTabShell
      title="Growth Chart"
      description="Record weight, height/length, head circumference, and growth percentiles for pediatric patients under 10 years."
      error={error}
      actions={
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Measurement
        </Button>
      }
    >
      <SectionCard title="Growth Measurements" contentClassName="space-y-4">
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-900">
          Patient age: {ageYears != null ? `${ageYears} years` : '—'}
          {ageYears != null && ageYears < 3
            ? ' · Head circumference is required for patients under 3 years.'
            : ''}
        </div>

        {sorted.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Height</TableHead>
                <TableHead>HC (cm)</TableHead>
                <TableHead>BMI</TableHead>
                <TableHead>Percentiles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const p = r.payload || {};
                const pcts = [
                  p.weightPercentile != null && p.weightPercentile !== '' ? `Wt ${p.weightPercentile}%` : null,
                  p.heightPercentile != null && p.heightPercentile !== '' ? `Ht ${p.heightPercentile}%` : null,
                  p.headCircumferencePercentile != null && p.headCircumferencePercentile !== ''
                    ? `HC ${p.headCircumferencePercentile}%`
                    : null,
                  p.bmiPercentile != null && p.bmiPercentile !== '' ? `BMI ${p.bmiPercentile}%` : null,
                ].filter(Boolean).join(' · ') || '—';
                return (
                  <TableRow key={r.id}>
                    <TableCell>{p.measurementDate || new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{weightDisplay(p)}</TableCell>
                    <TableCell>{heightDisplay(p)}</TableCell>
                    <TableCell>{p.headCircumferenceCm || '—'}</TableCell>
                    <TableCell>{p.bmi || '—'}</TableCell>
                    <TableCell className="text-sm">{pcts}</TableCell>
                    <TableCell className="text-right">
                      <IntakeRecordActions
                        isCertified={isCertified}
                        onEdit={() => openEdit(r)}
                        onAmend={() => openAmend(r)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No growth measurements recorded yet. Add the first measurement to start the growth chart.
          </p>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit'
                ? 'Edit Growth Measurement'
                : mode === 'amend'
                  ? 'Amend Growth Measurement'
                  : 'Add Growth Measurement'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  Measurement Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.measurementDate}
                  onChange={(e) => update('measurementDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Weight (lbs) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  step="0.1"
                  value={form.weightLbs}
                  onChange={(e) => update('weightLbs', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (oz)</Label>
                <Input
                  type="number"
                  min={0}
                  max={15.9}
                  step="0.1"
                  placeholder="Optional 0–15.9"
                  value={form.weightOz}
                  onChange={(e) => update('weightOz', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Height / Length <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-0">
                  <Input
                    type="number"
                    min={0}
                    max={6}
                    placeholder="Feet"
                    className="rounded-r-none border-r-0"
                    value={form.heightFeet}
                    onChange={(e) => update('heightFeet', e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={11.9}
                    step="0.1"
                    placeholder="Inches"
                    className="rounded-l-none"
                    value={form.heightInches}
                    onChange={(e) => update('heightInches', e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Use length for infants; total 10–72 in</p>
              </div>
              <div className="space-y-2">
                <Label>
                  Head Circumference (cm)
                  {ageYears != null && ageYears < 3 && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                  type="number"
                  min={25}
                  max={65}
                  step="0.1"
                  placeholder="25–65 cm"
                  value={form.headCircumferenceCm}
                  onChange={(e) => update('headCircumferenceCm', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>BMI</Label>
                <Input value={bmi || ''} readOnly className="bg-muted" placeholder="Auto-calculated" />
              </div>
              <div className="space-y-2">
                <Label>Weight-for-Age Percentile</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={form.weightPercentile}
                  onChange={(e) => update('weightPercentile', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height-for-Age Percentile</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={form.heightPercentile}
                  onChange={(e) => update('heightPercentile', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>HC-for-Age Percentile</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={form.headCircumferencePercentile}
                  onChange={(e) => update('headCircumferencePercentile', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>BMI-for-Age Percentile</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={form.bmiPercentile}
                  onChange={(e) => update('bmiPercentile', e.target.value)}
                />
              </div>
              {ageYears != null && ageYears < 2 && (
                <div className="space-y-2">
                  <Label>Feeding Type</Label>
                  <Select value={form.feedingType} onValueChange={(v) => update('feedingType', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {FEEDING_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 md:col-span-3">
                <Label>Growth Concerns</Label>
                <Input
                  placeholder="e.g. Failure to thrive, crossing percentiles..."
                  value={form.growthConcerns}
                  onChange={(e) => update('growthConcerns', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Additional growth chart notes..."
                />
              </div>
            </div>

            {mode === 'amend' && (
              <div className="space-y-2 border-t pt-4">
                <Label>Amendment Reason / Notes</Label>
                <Textarea
                  value={amendNotes}
                  onChange={(e) => setAmendNotes(e.target.value)}
                  placeholder="Reason for amendment..."
                  rows={3}
                />
              </div>
            )}

            {errors.length > 0 && (
              <div className="space-y-1 text-sm text-destructive">
                {errors.map((e) => <p key={e}>{e}</p>)}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save Measurement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChartTabShell>
  );
}
