import { useMemo, useState } from 'react';
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
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { IntakeHistoryDrawer } from '../components/IntakeHistoryDrawer';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS, VISIT_TYPES, VISIT_OUTCOMES } from '../intakeConstants';

const emptyForm = () => ({
  visitType: '',
  otherVisitType: '',
  facilityName: '',
  facilityAddress: '',
  facilityPhone: '',
  admissionDate: '',
  dischargeDate: '',
  isCurrentlyAdmitted: false,
  chiefComplaint: '',
  primaryDiagnosisCode: '',
  primaryDiagnosisDescription: '',
  outcome: '',
  dischargeDisposition: '',
  followUpRequired: false,
  followUpDate: '',
  isReadmission: false,
  readmissionWithin30Days: false,
  notes: '',
});

function calcLos(admission, discharge) {
  if (!admission || !discharge) return null;
  const days = Math.ceil((new Date(discharge) - new Date(admission)) / (1000 * 60 * 60 * 24));
  return `${days} Day${days === 1 ? '' : 's'}`;
}

export function HospitalEdVisitSection() {
  const { getRecordsBySection, saveSection, updateRecord, addAddendum, deleteRecord, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.HOSPITAL_ED_VISIT);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amendNotes, setAmendNotes] = useState('');
  const [dxResults, setDxResults] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const lengthOfStay = useMemo(
    () => (form.isCurrentlyAdmitted ? 'Ongoing' : calcLos(form.admissionDate, form.dischargeDate)),
    [form.admissionDate, form.dischargeDate, form.isCurrentlyAdmitted],
  );

  const searchDx = async (term) => {
    if (!term || term.length < 2) {
      setDxResults([]);
      return;
    }
    try {
      const res = await diagnosisCodeApi.getAll({ search: term, limit: 8 });
      setDxResults(res.data || []);
    } catch {
      setDxResults([]);
    }
  };

  const openCreate = () => {
    setMode('create');
    setActiveRecord(null);
    setForm(emptyForm());
    setAmendNotes('');
    setOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActiveRecord(record);
    setForm({ ...emptyForm(), ...(record.payload || {}) });
    setOpen(true);
  };

  const openAmend = (record) => {
    setMode('amend');
    setActiveRecord(record);
    setForm({ ...emptyForm(), ...(record.payload || {}) });
    setAmendNotes('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.visitType || !form.facilityName || !form.admissionDate || !form.chiefComplaint || !form.primaryDiagnosisDescription || !form.outcome) return;
    const payload = { ...form, lengthOfStay };
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.HOSPITAL_ED_VISIT, payload });
    }
    setForm(emptyForm());
    setOpen(false);
  };

  const dialogTitle =
    mode === 'edit' ? 'Edit Hospital / ED Visit'
      : mode === 'amend' ? 'Amend Hospital / ED Visit'
        : 'Recent Hospital / ED Visit';

  return (
    <IntakeSectionCard id="assessment-hospital-ed" title="Recent Hospital / ED Visit" onAdd={openCreate}>
      {records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visit Type</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Admission</TableHead>
              <TableHead>Discharge</TableHead>
              <TableHead>LOS</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.payload?.visitType}</TableCell>
                <TableCell>{r.payload?.facilityName}</TableCell>
                <TableCell>{r.payload?.admissionDate}</TableCell>
                <TableCell>{r.payload?.isCurrentlyAdmitted ? 'Current' : r.payload?.dischargeDate || '—'}</TableCell>
                <TableCell>{r.payload?.lengthOfStay || '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{r.payload?.primaryDiagnosisDescription}</TableCell>
                <TableCell>{r.payload?.outcome}</TableCell>
                <TableCell className="text-right">
                  <IntakeRecordActions
                    isCertified={isCertified}
                    onEdit={() => openEdit(r)}
                    onAmend={() => openAmend(r)}
                    onDelete={() => deleteRecord(r.id)}
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
        <p className="text-sm text-muted-foreground">No hospital / ED visits recorded yet. Use the + button to add.</p>
      )}

      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Row 1: Visit type, Facility name */}
          <div className={`grid grid-cols-1 gap-4 ${form.visitType === 'Other' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hed-visit-type">Visit Type *</Label>
              <Select value={form.visitType} onValueChange={(v) => setForm((p) => ({ ...p, visitType: v }))}>
                <SelectTrigger id="hed-visit-type" className="h-9 w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.visitType === 'Other' && (
              <div className="min-w-0 space-y-2">
                <Label htmlFor="hed-other-type">Specify Visit Type *</Label>
                <Input
                  id="hed-other-type"
                  className="h-9 w-full"
                  value={form.otherVisitType}
                  onChange={(e) => setForm((p) => ({ ...p, otherVisitType: e.target.value }))}
                />
              </div>
            )}
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hed-facility">Facility Name *</Label>
              <Input
                id="hed-facility"
                className="h-9 w-full"
                value={form.facilityName}
                onChange={(e) => setForm((p) => ({ ...p, facilityName: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 2: Admission date, Currently admitted, Length of stay */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hed-admission">Admission / Visit Date *</Label>
              <Input
                id="hed-admission"
                type="date"
                className="h-9 w-full"
                max={new Date().toISOString().slice(0, 10)}
                value={form.admissionDate}
                onChange={(e) => setForm((p) => ({ ...p, admissionDate: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Currently Admitted</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
                <Checkbox
                  id="hed-currently-admitted"
                  checked={form.isCurrentlyAdmitted}
                  onCheckedChange={(c) => setForm((p) => ({
                    ...p,
                    isCurrentlyAdmitted: !!c,
                    dischargeDate: c ? '' : p.dischargeDate,
                  }))}
                />
                <Label htmlFor="hed-currently-admitted" className="font-normal">Yes</Label>
                {!form.isCurrentlyAdmitted && (
                  <Input
                    type="date"
                    className="ml-auto h-7 w-auto border-0 shadow-none"
                    value={form.dischargeDate}
                    onChange={(e) => setForm((p) => ({ ...p, dischargeDate: e.target.value }))}
                    aria-label="Discharge date"
                  />
                )}
              </div>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hed-los">Length of Stay</Label>
              <Input
                id="hed-los"
                className="h-9 w-full bg-muted"
                value={lengthOfStay || ''}
                readOnly
              />
            </div>
          </div>

          {/* Row 3: Primary diagnosis, Chief complaint, Outcome */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative min-w-0 space-y-2">
              <Label htmlFor="hed-dx">Primary Diagnosis (ICD-10) *</Label>
              <Input
                id="hed-dx"
                className="h-9 w-full"
                value={form.primaryDiagnosisDescription}
                onChange={(e) => {
                  setForm((p) => ({ ...p, primaryDiagnosisDescription: e.target.value }));
                  searchDx(e.target.value);
                }}
              />
              {dxResults.length > 0 && (
                <div className="absolute z-10 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                  {dxResults.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          primaryDiagnosisCode: row.icdCode,
                          primaryDiagnosisDescription: row.description,
                        }));
                        setDxResults([]);
                      }}
                    >
                      {row.icdCode} — {row.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hed-cc">Chief Complaint *</Label>
              <Input
                id="hed-cc"
                className="h-9 w-full"
                value={form.chiefComplaint}
                onChange={(e) => setForm((p) => ({ ...p, chiefComplaint: e.target.value }))}
                maxLength={1000}
                placeholder="Reason for visit"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hed-outcome">Outcome *</Label>
              <Select value={form.outcome} onValueChange={(v) => setForm((p) => ({ ...p, outcome: v }))}>
                <SelectTrigger id="hed-outcome" className="h-9 w-full"><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  {VISIT_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Notes */}
          <div className="space-y-2">
            <Label htmlFor="hed-notes">Notes</Label>
            <Textarea
              id="hed-notes"
              className="min-h-[5.5rem] w-full resize-y"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              maxLength={2000}
              rows={3}
            />
          </div>

          {mode === 'amend' && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="hed-amend">Amendment Reason / Notes</Label>
              <Textarea
                id="hed-amend"
                className="min-h-[4.5rem] w-full resize-y"
                value={amendNotes}
                onChange={(e) => setAmendNotes(e.target.value)}
                placeholder="Reason for amendment..."
                rows={2}
              />
            </div>
          )}
        </div>
      </IntakeInlineFormPanel>

      <IntakeHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Hospital / ED Visit History"
        subtitle={historyRecord?.payload?.facilityName}
        record={historyRecord}
        renderPayload={(p) => (
          <div className="space-y-1">
            <p className="font-medium">{p.visitType} — {p.facilityName}</p>
            {p.admissionDate && <p className="text-muted-foreground">Admission: {p.admissionDate}</p>}
            {p.primaryDiagnosisDescription && <p className="text-muted-foreground">Dx: {p.primaryDiagnosisDescription}</p>}
            {p.outcome && <p className="text-muted-foreground">Outcome: {p.outcome}</p>}
          </div>
        )}
      />
    </IntakeSectionCard>
  );
}
