import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VitalsForm, getDefaultVitalsData } from '@/pages/nurses/nurse-dashboard/vitals/VitalsForm';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { IntakeHistoryDrawer } from '../components/IntakeHistoryDrawer';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS, showFemaleVitalsFields, showChildbearingFields } from '../intakeConstants';
import { validateVitalsData } from '../vitalsReferenceRanges';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function FemaleVitalsFields({ data, onChange, patient }) {
  if (!showFemaleVitalsFields(patient)) return null;
  const update = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));
  const childbearing = showChildbearingFields(patient);

  return (
    <div className="space-y-4 border-t pt-4">
      <Label className="text-base font-semibold">Female-Specific Vitals</Label>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Last Menstrual Period (LMP)</Label>
          <Input type="date" value={data.lmp || ''} onChange={(e) => update('lmp', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Pregnancy Status</Label>
          <Select value={data.pregnancyStatus || ''} onValueChange={(v) => update('pregnancyStatus', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {['Pregnant', 'Not Pregnant', 'Unknown', 'Not Applicable'].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data.pregnancyStatus === 'Pregnant' && (
          <div className="space-y-2">
            <Label>Estimated Due Date (EDD)</Label>
            <Input type="date" value={data.edd || ''} onChange={(e) => update('edd', e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Breastfeeding Status</Label>
          <Select value={data.breastfeeding || ''} onValueChange={(v) => update('breastfeeding', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {['Yes', 'No'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Menstrual Status</Label>
          <Select value={data.menstrualStatus || ''} onValueChange={(v) => update('menstrualStatus', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {['Regular Cycles', 'Irregular Cycles', 'Post-Menopausal', 'Pre-Menarchal', 'Hysterectomy', 'Unknown'].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Menarche Status</Label>
          <Select value={data.menarcheStatus || ''} onValueChange={(v) => update('menarcheStatus', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {['Started', 'Not Started'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {childbearing && (
          <>
            <div className="space-y-2">
              <Label>Pregnancy Test Performed</Label>
              <Select value={data.pregnancyTestPerformed || ''} onValueChange={(v) => update('pregnancyTestPerformed', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['Yes', 'No', 'Not Indicated'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {data.pregnancyTestPerformed === 'Yes' && (
              <div className="space-y-2">
                <Label>Pregnancy Test Result</Label>
                <Select value={data.pregnancyTestResult || ''} onValueChange={(v) => update('pregnancyTestResult', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Positive', 'Negative', 'Pending'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatVitalsSummary(payload = {}) {
  return [
    payload.bpSys && payload.bpDia ? `BP ${payload.bpSys}/${payload.bpDia}` : null,
    payload.pulse ? `Pulse ${payload.pulse}` : null,
    payload.temperature ? `Temp ${payload.temperature}°F` : null,
    payload.respiratoryRate ? `RR ${payload.respiratoryRate}` : null,
    payload.bmi ? `BMI ${payload.bmi}` : null,
  ].filter(Boolean).join(' · ') || '—';
}

export function VitalsIntakeSection() {
  const { patient, getRecordsBySection, saveSection, updateRecord, addAddendum, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.VITALS);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create'); // create | edit | amend
  const [activeRecord, setActiveRecord] = useState(null);
  const [vitalsData, setVitalsData] = useState(getDefaultVitalsData);
  const [amendNotes, setAmendNotes] = useState('');
  const [errors, setErrors] = useState([]);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const openCreate = () => {
    setMode('create');
    setActiveRecord(null);
    setVitalsData(getDefaultVitalsData());
    setAmendNotes('');
    setErrors([]);
    setOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActiveRecord(record);
    setVitalsData({ ...getDefaultVitalsData(), ...(record.payload || {}) });
    setErrors([]);
    setOpen(true);
  };

  const openAmend = (record) => {
    setMode('amend');
    setActiveRecord(record);
    setVitalsData({ ...getDefaultVitalsData(), ...(record.payload || {}) });
    setAmendNotes('');
    setErrors([]);
    setOpen(true);
  };

  const handleSave = async () => {
    const validationErrors = validateVitalsData(vitalsData, patient);
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload: vitalsData });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload: vitalsData, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.VITALS, payload: vitalsData });
    }
    setOpen(false);
    setVitalsData(getDefaultVitalsData());
  };

  const dialogTitle =
    mode === 'edit' ? 'Edit Vitals' : mode === 'amend' ? 'Amend Vitals' : 'Record Patient Vitals';

  return (
    <IntakeSectionCard id="assessment-vitals" title="Patient Vitals" onAdd={openCreate}>
      {records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Summary</TableHead>
              <TableHead>Pain</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatVitalsSummary(r.payload)}</TableCell>
                <TableCell>
                  {r.payload?.painAssessed === 'yes' ? `Level ${r.payload.painLevel || '—'}` : 'No'}
                </TableCell>
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
        <p className="text-sm text-muted-foreground">No vitals recorded yet. Use the + button to add.</p>
      )}

      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save Vitals'}
            </Button>
          </>
        }
      >
        <VitalsForm
          data={vitalsData}
          onChange={setVitalsData}
          showTimestamp
          dateOfBirth={patient?.dateOfBirth}
        />
        <FemaleVitalsFields data={vitalsData} onChange={setVitalsData} patient={patient} />

        {mode === 'amend' && (
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="vitals-amend-notes">Amendment Reason / Notes</Label>
            <Textarea
              id="vitals-amend-notes"
              value={amendNotes}
              onChange={(e) => setAmendNotes(e.target.value)}
              placeholder="Reason for amendment..."
              rows={3}
            />
          </div>
        )}

        {errors.length > 0 && (
          <div className="text-sm text-destructive space-y-1">
            {errors.map((e) => <p key={e}>{e}</p>)}
          </div>
        )}
      </IntakeInlineFormPanel>

      <IntakeHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Vitals History"
        subtitle={historyRecord ? formatVitalsSummary(historyRecord.payload) : undefined}
        record={historyRecord}
        renderPayload={(p) => <span>{formatVitalsSummary(p)}</span>}
      />
    </IntakeSectionCard>
  );
}
