import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { IntakeHistoryDrawer } from '../components/IntakeHistoryDrawer';
import { useIntake } from '../IntakeContext';
import {
  CONTRACEPTION_OPTIONS,
  INTAKE_SECTIONS,
  MENSTRUAL_FLOW_OPTIONS,
  MENSTRUAL_PAIN_OPTIONS,
  MENSTRUAL_REGULARITY_OPTIONS,
  MENSTRUAL_SYMPTOMS,
  showMenstrualAssessment,
} from '../intakeConstants';

const emptyForm = () => ({
  lastMenstrualPeriod: '',
  ageAtMenarche: '',
  cycleRegularity: '',
  cycleLengthDays: '',
  flowDurationDays: '',
  flowAmount: '',
  dysmenorrhea: '',
  currentlyMenstruating: '',
  intermenstrualBleeding: '',
  postcoitalBleeding: '',
  padsTamponsPerDay: '',
  contraceptionMethod: '',
  associatedSymptoms: [],
  notes: '',
});

function validateMenstrual(form) {
  const errors = [];
  if (!form.lastMenstrualPeriod) errors.push('Last menstrual period (LMP) is required');
  if (!form.cycleRegularity) errors.push('Cycle regularity is required');

  if (form.ageAtMenarche !== '' && form.ageAtMenarche != null) {
    const age = Number(form.ageAtMenarche);
    if (!Number.isFinite(age) || age < 8 || age > 18) {
      errors.push('Age at menarche must be between 8 and 18 years');
    }
  }
  if (form.cycleLengthDays !== '' && form.cycleLengthDays != null) {
    const n = Number(form.cycleLengthDays);
    if (!Number.isFinite(n) || n < 14 || n > 90) {
      errors.push('Cycle length must be between 14 and 90 days');
    }
  }
  if (form.flowDurationDays !== '' && form.flowDurationDays != null) {
    const n = Number(form.flowDurationDays);
    if (!Number.isFinite(n) || n < 1 || n > 14) {
      errors.push('Flow duration must be between 1 and 14 days');
    }
  }
  if (form.padsTamponsPerDay !== '' && form.padsTamponsPerDay != null) {
    const n = Number(form.padsTamponsPerDay);
    if (!Number.isFinite(n) || n < 0 || n > 30) {
      errors.push('Pads/tampons per day must be between 0 and 30');
    }
  }
  return errors;
}

function formatSummary(payload = {}) {
  return [
    payload.lastMenstrualPeriod ? `LMP ${payload.lastMenstrualPeriod}` : null,
    payload.cycleRegularity || null,
    payload.flowAmount ? `Flow: ${payload.flowAmount}` : null,
    payload.dysmenorrhea && payload.dysmenorrhea !== 'None' ? `Pain: ${payload.dysmenorrhea}` : null,
  ].filter(Boolean).join(' · ') || '—';
}

export function MenstrualAssessmentSection() {
  const { patient } = useIntake();
  if (!showMenstrualAssessment(patient)) return null;
  return <MenstrualAssessmentSectionInner />;
}

function MenstrualAssessmentSectionInner() {
  const { getRecordsBySection, saveSection, updateRecord, addAddendum, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.MENSTRUAL_ASSESSMENT);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amendNotes, setAmendNotes] = useState('');
  const [errors, setErrors] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSymptom = (symptom) => {
    setForm((prev) => {
      const set = new Set(prev.associatedSymptoms || []);
      if (set.has(symptom)) set.delete(symptom);
      else set.add(symptom);
      return { ...prev, associatedSymptoms: [...set] };
    });
  };

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
    const validationErrors = validateMenstrual(form);
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload: form });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload: form, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.MENSTRUAL_ASSESSMENT, payload: form });
    }
    setOpen(false);
    setForm(emptyForm());
  };

  const dialogTitle =
    mode === 'edit'
      ? 'Edit Menstrual Assessment'
      : mode === 'amend'
        ? 'Amend Menstrual Assessment'
        : 'Menstrual Assessment';

  return (
    <IntakeSectionCard id="assessment-menstrual" title="Menstrual Assessment" onAdd={openCreate}>
      {records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Summary</TableHead>
              <TableHead>Contraception</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatSummary(r.payload)}</TableCell>
                <TableCell>{r.payload?.contraceptionMethod || '—'}</TableCell>
                <TableCell>{r.createdByName || '—'}</TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <IntakeRecordActions
                    isCertified={isCertified}
                    onEdit={() => openEdit(r)}
                    onAmend={() => openAmend(r)}
                    hasHistory={(r.addendums || []).length > 0}
                    onHistory={() => {
                      setHistoryRecord(r);
                      setHistoryOpen(true);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No menstrual assessment recorded. Use the + button to add.
        </p>
      )}

      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save Assessment'}
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  Last Menstrual Period (LMP) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.lastMenstrualPeriod}
                  onChange={(e) => update('lastMenstrualPeriod', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Age at Menarche</Label>
                <Input
                  type="number"
                  min={8}
                  max={18}
                  placeholder="Years (8–18)"
                  value={form.ageAtMenarche}
                  onChange={(e) => update('ageAtMenarche', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Cycle Regularity <span className="text-destructive">*</span>
                </Label>
                <Select value={form.cycleRegularity} onValueChange={(v) => update('cycleRegularity', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MENSTRUAL_REGULARITY_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cycle Length (days)</Label>
                <Input
                  type="number"
                  min={14}
                  max={90}
                  placeholder="e.g. 28"
                  value={form.cycleLengthDays}
                  onChange={(e) => update('cycleLengthDays', e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Typical 21–35 days · Entry 14–90</p>
              </div>
              <div className="space-y-2">
                <Label>Flow Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  placeholder="e.g. 5"
                  value={form.flowDurationDays}
                  onChange={(e) => update('flowDurationDays', e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Typical 3–7 days · Entry 1–14</p>
              </div>
              <div className="space-y-2">
                <Label>Flow Amount</Label>
                <Select value={form.flowAmount} onValueChange={(v) => update('flowAmount', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MENSTRUAL_FLOW_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dysmenorrhea</Label>
                <Select value={form.dysmenorrhea} onValueChange={(v) => update('dysmenorrhea', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MENSTRUAL_PAIN_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currently Menstruating</Label>
                <Select value={form.currentlyMenstruating} onValueChange={(v) => update('currentlyMenstruating', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Yes', 'No'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pads / Tampons per Day</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  placeholder="0–30"
                  value={form.padsTamponsPerDay}
                  onChange={(e) => update('padsTamponsPerDay', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Intermenstrual Bleeding</Label>
                <Select value={form.intermenstrualBleeding} onValueChange={(v) => update('intermenstrualBleeding', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Yes', 'No', 'Unknown'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Postcoital Bleeding</Label>
                <Select value={form.postcoitalBleeding} onValueChange={(v) => update('postcoitalBleeding', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Yes', 'No', 'Unknown', 'Not Applicable'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contraception Method</Label>
                <Select value={form.contraceptionMethod} onValueChange={(v) => update('contraceptionMethod', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CONTRACEPTION_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Associated Symptoms</Label>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                {MENSTRUAL_SYMPTOMS.map((symptom) => (
                  <label key={symptom} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(form.associatedSymptoms || []).includes(symptom)}
                      onCheckedChange={() => toggleSymptom(symptom)}
                    />
                    {symptom}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Additional menstrual history notes..."
              />
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
        </div>
      </IntakeInlineFormPanel>

      <IntakeHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Menstrual Assessment History"
        subtitle={historyRecord ? formatSummary(historyRecord.payload) : undefined}
        record={historyRecord}
        renderPayload={(p) => <span>{formatSummary(p)}</span>}
      />
    </IntakeSectionCard>
  );
}
