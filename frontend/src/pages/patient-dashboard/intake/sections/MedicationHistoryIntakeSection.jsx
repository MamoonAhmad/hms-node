import { useState } from 'react';
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
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { IntakeHistoryDrawer } from '../components/IntakeHistoryDrawer';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS, PROBLEM_STATUSES, PROBLEM_SEVERITIES, PROBLEM_CHRONICITIES } from '../intakeConstants';

const emptyForm = () => ({
  conditionName: '',
  conditionCode: '',
  status: 'Inactive',
  onsetDate: '',
  ageAtOnset: '',
  severity: '',
  chronicity: '',
  notes: '',
});

export function MedicationHistoryIntakeSection() {
  const { getRecordsBySection, saveSection, updateRecord, addAddendum, deleteRecord, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.MEDICATION_HISTORY);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amendNotes, setAmendNotes] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const searchIcd = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await diagnosisCodeApi.getAll({ search: term, limit: 10 });
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectCondition = (row) => {
    setForm((p) => ({ ...p, conditionName: row.description, conditionCode: row.icdCode }));
    setSearchResults([]);
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
    if (!form.conditionName) return;
    if (form.onsetDate && new Date(form.onsetDate) > new Date()) return;
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload: form });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload: form, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.MEDICATION_HISTORY, payload: form });
    }
    setForm(emptyForm());
    setOpen(false);
  };

  const dialogTitle =
    mode === 'edit' ? 'Edit Medical History'
      : mode === 'amend' ? 'Amend Medical History'
        : 'Add Past Medical History';

  return (
    <IntakeSectionCard
      id="assessment-medication-history"
      title="Past Medical History"
      onAdd={openCreate}
    >
      {records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead>ICD-10</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onset</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.payload?.conditionName}</TableCell>
                <TableCell>{r.payload?.conditionCode || '—'}</TableCell>
                <TableCell>{r.payload?.status}</TableCell>
                <TableCell>{r.payload?.onsetDate || r.payload?.ageAtOnset || '—'}</TableCell>
                <TableCell>{r.payload?.severity || '—'}</TableCell>
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
        <p className="text-sm text-muted-foreground">No medical history recorded yet. Use the + button to add.</p>
      )}

      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.conditionName}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Row 1: Condition name, Status, Onset date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative min-w-0 space-y-2">
              <Label htmlFor="pmh-condition">Condition Name (ICD-10 Search) *</Label>
              <Input
                id="pmh-condition"
                className="h-9 w-full"
                value={form.conditionName}
                onChange={(e) => {
                  setForm((p) => ({ ...p, conditionName: e.target.value }));
                  searchIcd(e.target.value);
                }}
                placeholder="Search ICD-10..."
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                  {searchResults.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => selectCondition(row)}
                    >
                      {row.icdCode} — {row.description}
                    </button>
                  ))}
                </div>
              )}
              {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="pmh-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger id="pmh-status" className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROBLEM_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="pmh-onset-date">Onset Date</Label>
              <Input
                id="pmh-onset-date"
                type="date"
                className="h-9 w-full"
                max={new Date().toISOString().slice(0, 10)}
                value={form.onsetDate}
                onChange={(e) => setForm((p) => ({ ...p, onsetDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 2: Age at onset, Severity, Chronicity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="pmh-age-onset">Age at Onset</Label>
              <Input
                id="pmh-age-onset"
                className="h-9 w-full"
                value={form.ageAtOnset}
                onChange={(e) => setForm((p) => ({ ...p, ageAtOnset: e.target.value }))}
                placeholder="e.g. 30 or childhood"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="pmh-severity">Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
                <SelectTrigger id="pmh-severity" className="h-9 w-full"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  {PROBLEM_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="pmh-chronicity">Chronicity</Label>
              <Select value={form.chronicity} onValueChange={(v) => setForm((p) => ({ ...p, chronicity: v }))}>
                <SelectTrigger id="pmh-chronicity" className="h-9 w-full"><SelectValue placeholder="Chronicity" /></SelectTrigger>
                <SelectContent>
                  {PROBLEM_CHRONICITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Notes */}
          <div className="space-y-2">
            <Label htmlFor="pmh-notes">Notes</Label>
            <Textarea
              id="pmh-notes"
              className="min-h-[5.5rem] w-full resize-y"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {mode === 'amend' && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="pmh-amend">Amendment Reason / Notes</Label>
              <Textarea
                id="pmh-amend"
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
        title="Medical History"
        subtitle={historyRecord?.payload?.conditionName}
        record={historyRecord}
        renderPayload={(p) => (
          <div className="space-y-1">
            <p className="font-medium">{p.conditionName}{p.conditionCode ? ` (${p.conditionCode})` : ''}</p>
            {p.status && <p className="text-muted-foreground">Status: {p.status}</p>}
            {p.severity && <p className="text-muted-foreground">Severity: {p.severity}</p>}
          </div>
        )}
      />
    </IntakeSectionCard>
  );
}
