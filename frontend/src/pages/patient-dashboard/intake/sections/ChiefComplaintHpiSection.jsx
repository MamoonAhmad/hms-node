import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { chiefComplaintApi } from '@/services/api/chiefComplaint.api';
import { usePatientChart } from '../../PatientChartContext';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { IntakeHistoryDrawer } from '../components/IntakeHistoryDrawer';
import { useIntake } from '../IntakeContext';
import {
  INTAKE_SECTIONS,
  HPI_ONSET_OPTIONS,
  HPI_LOCATION_OPTIONS,
  HPI_DURATION_OPTIONS,
  HPI_CHARACTER_OPTIONS,
  HPI_TIMING_OPTIONS,
  HPI_SEVERITY_OPTIONS,
  HPI_ASSOCIATED_SYMPTOMS,
  buildHpiNarrative,
} from '../intakeConstants';

const emptyForm = () => ({
  reasonOfVisit: '',
  chiefComplaintId: '',
  chiefComplaintName: '',
  chiefComplaintCode: '',
  hpi: {
    onset: '',
    location: '',
    duration: '',
    character: '',
    timing: '',
    severity: '',
    aggravating: '',
    relieving: '',
    associatedSymptoms: [],
    additionalNotes: '',
  },
});

function normalizeForm(payload) {
  const base = emptyForm();
  if (!payload) return base;
  return {
    ...base,
    ...payload,
    hpi: { ...base.hpi, ...(payload.hpi || {}) },
  };
}

/** Prefill from appointment.visitReason (appointment form "Reason for Visit" / chief complaint name). */
function formFromAppointment(appointment, complaints = []) {
  const base = emptyForm();
  const visitReason = String(appointment?.visitReason || appointment?.reason || '').trim();
  if (!visitReason) return base;

  const match = complaints.find(
    (c) =>
      String(c.name || '').trim().toLowerCase() === visitReason.toLowerCase() ||
      String(c.code || '').trim().toLowerCase() === visitReason.toLowerCase() ||
      `${c.name}${c.code ? ` (${c.code})` : ''}`.trim().toLowerCase() === visitReason.toLowerCase(),
  );

  return {
    ...base,
    reasonOfVisit: visitReason,
    chiefComplaintId: match?.id || '',
    chiefComplaintName: match?.name || visitReason,
    chiefComplaintCode: match?.code || '',
  };
}

export function ChiefComplaintHpiSection() {
  const { getRecordsBySection, saveSection, updateRecord, addAddendum, saving, isCertified } = useIntake();
  const { appointment } = usePatientChart();
  const records = getRecordsBySection(INTAKE_SECTIONS.CHIEF_COMPLAINT_HPI);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amendNotes, setAmendNotes] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  useEffect(() => {
    chiefComplaintApi.getActive().then((res) => setComplaints(res.data || [])).catch(() => {});
  }, []);

  // If create dialog opened before complaint catalog loaded, finish matching chief complaint.
  useEffect(() => {
    if (!open || mode !== 'create' || !complaints.length) return;
    if (form.chiefComplaintId) return;
    const visitReason = String(form.reasonOfVisit || appointment?.visitReason || '').trim();
    if (!visitReason) return;
    const match = complaints.find(
      (c) => String(c.name || '').trim().toLowerCase() === visitReason.toLowerCase(),
    );
    if (!match) return;
    setForm((prev) => ({
      ...prev,
      reasonOfVisit: prev.reasonOfVisit || visitReason,
      chiefComplaintId: match.id,
      chiefComplaintName: match.name || visitReason,
      chiefComplaintCode: match.code || '',
    }));
  }, [open, mode, complaints, form.chiefComplaintId, form.reasonOfVisit, appointment?.visitReason]);

  const generatedHpi = useMemo(() => buildHpiNarrative(form.hpi), [form.hpi]);

  const updateHpi = (field, value) => {
    setForm((prev) => ({ ...prev, hpi: { ...prev.hpi, [field]: value } }));
  };

  const toggleSymptom = (symptom) => {
    setForm((prev) => {
      const current = prev.hpi.associatedSymptoms || [];
      const next = current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom];
      return { ...prev, hpi: { ...prev.hpi, associatedSymptoms: next } };
    });
  };

  const handleComplaintSelect = (id) => {
    const cc = complaints.find((c) => c.id === id);
    setForm((prev) => ({
      ...prev,
      chiefComplaintId: id,
      chiefComplaintName: cc?.name || '',
      chiefComplaintCode: cc?.code || '',
    }));
  };

  const openCreate = () => {
    setMode('create');
    setActiveRecord(null);
    setForm(formFromAppointment(appointment, complaints));
    setAmendNotes('');
    setOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActiveRecord(record);
    setForm(normalizeForm(record.payload));
    setOpen(true);
  };

  const openAmend = (record) => {
    setMode('amend');
    setActiveRecord(record);
    setForm(normalizeForm(record.payload));
    setAmendNotes('');
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, generatedHpi };
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.CHIEF_COMPLAINT_HPI, payload });
    }
    setForm(emptyForm());
    setOpen(false);
  };

  const dialogTitle =
    mode === 'edit' ? 'Edit Chief Complaint & HPI'
      : mode === 'amend' ? 'Amend Chief Complaint & HPI'
        : 'Chief Complaint & HPI';

  return (
    <IntakeSectionCard
      id="assessment-chief-complaint"
      title="Chief Complaint & HPI"
      onAdd={openCreate}
    >
      {records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason of Visit</TableHead>
              <TableHead>Chief Complaint</TableHead>
              <TableHead>HPI Summary</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.payload?.reasonOfVisit || '—'}</TableCell>
                <TableCell>
                  {r.payload?.chiefComplaintName || '—'}
                  {r.payload?.chiefComplaintCode && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({r.payload.chiefComplaintCode})
                    </span>
                  )}
                  {(r.addendums || []).length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">Amended</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-md truncate">{r.payload?.generatedHpi || '—'}</TableCell>
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
        <p className="text-sm text-muted-foreground">No chief complaint recorded yet. Use the + button to add.</p>
      )}

      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.reasonOfVisit}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reason of Visit</Label>
                <Input
                  value={form.reasonOfVisit}
                  onChange={(e) => setForm((p) => ({ ...p, reasonOfVisit: e.target.value }))}
                  placeholder={
                    appointment?.visitReason
                      ? 'From appointment'
                      : 'Reason of visit'
                  }
                />
                {mode === 'create' && appointment?.visitReason && (
                  <p className="text-xs text-muted-foreground">
                    Prefill from appointment reason for visit
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Chief Complaint</Label>
                <Select value={form.chiefComplaintId || undefined} onValueChange={handleComplaintSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chief complaint" />
                  </SelectTrigger>
                  <SelectContent>
                    {complaints.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.code ? ` (${c.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mode === 'create' && appointment?.visitReason && !form.chiefComplaintId && (
                  <p className="text-xs text-amber-700">
                    Appointment reason “{appointment.visitReason}” was not found in chief complaints — select one manually.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Structured HPI Builder</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Onset</Label>
                  <Select value={form.hpi.onset} onValueChange={(v) => updateHpi('onset', v)}>
                    <SelectTrigger><SelectValue placeholder="Onset" /></SelectTrigger>
                    <SelectContent>
                      {HPI_ONSET_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={form.hpi.location} onValueChange={(v) => updateHpi('location', v)}>
                    <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                    <SelectContent>
                      {HPI_LOCATION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={form.hpi.duration} onValueChange={(v) => updateHpi('duration', v)}>
                    <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                    <SelectContent>
                      {HPI_DURATION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Character</Label>
                  <Select value={form.hpi.character} onValueChange={(v) => updateHpi('character', v)}>
                    <SelectTrigger><SelectValue placeholder="Character" /></SelectTrigger>
                    <SelectContent>
                      {HPI_CHARACTER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timing</Label>
                  <Select value={form.hpi.timing} onValueChange={(v) => updateHpi('timing', v)}>
                    <SelectTrigger><SelectValue placeholder="Timing" /></SelectTrigger>
                    <SelectContent>
                      {HPI_TIMING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={form.hpi.severity} onValueChange={(v) => updateHpi('severity', v)}>
                    <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>
                      {HPI_SEVERITY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Aggravating Factors</Label>
                  <Input value={form.hpi.aggravating} onChange={(e) => updateHpi('aggravating', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Relieving Factors</Label>
                  <Input value={form.hpi.relieving} onChange={(e) => updateHpi('relieving', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Associated Symptoms</Label>
                <div className="flex flex-wrap gap-2">
                  {HPI_ASSOCIATED_SYMPTOMS.map((s) => (
                    <Badge
                      key={s}
                      variant={form.hpi.associatedSymptoms?.includes(s) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSymptom(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Additional HPI Notes</Label>
                <Textarea
                  value={form.hpi.additionalNotes}
                  onChange={(e) => updateHpi('additionalNotes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <Label>Generated HPI Output</Label>
              <p className="text-sm leading-relaxed">{generatedHpi || 'Complete the fields above to generate HPI narrative.'}</p>
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
      </IntakeInlineFormPanel>

      <IntakeHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Chief Complaint History"
        subtitle={historyRecord?.payload?.chiefComplaintName || historyRecord?.payload?.reasonOfVisit}
        record={historyRecord}
        renderPayload={(p) => (
          <div className="space-y-1">
            {p.reasonOfVisit && <p><span className="text-muted-foreground">Reason: </span>{p.reasonOfVisit}</p>}
            {p.chiefComplaintName && <p><span className="text-muted-foreground">Complaint: </span>{p.chiefComplaintName}</p>}
            {p.generatedHpi && <p><span className="text-muted-foreground">HPI: </span>{p.generatedHpi}</p>}
          </div>
        )}
      />
    </IntakeSectionCard>
  );
}
