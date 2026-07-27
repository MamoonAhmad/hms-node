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
import { procedureApi } from '@/services/api/procedure.api';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { IntakeHistoryDrawer } from '../components/IntakeHistoryDrawer';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS, ANESTHESIA_TYPES, SURGICAL_OUTCOMES } from '../intakeConstants';

const emptyForm = () => ({
  procedureName: '',
  cptCode: '',
  procedureDate: '',
  surgeon: '',
  facility: '',
  anesthesiaType: '',
  outcome: '',
  complications: '',
  notes: '',
});

export function SurgicalHistorySection() {
  const { getRecordsBySection, saveSection, updateRecord, addAddendum, deleteRecord, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.SURGICAL_HISTORY);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amendNotes, setAmendNotes] = useState('');
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const getProcedureDescription = (row) =>
    String(row?.procedureDescription || row?.genericDescription || row?.name || '').trim();

  const formatProcedureLabel = (row) => {
    const description = getProcedureDescription(row);
    const code = String(row?.cptCode || '').trim();
    if (code && description) return `${code} — ${description}`;
    return description || code;
  };

  const procedureFieldValue =
    form.cptCode && form.procedureName
      ? `${form.cptCode} — ${form.procedureName}`
      : form.procedureName || form.cptCode || '';

  const searchCpt = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await procedureApi.getAll({ search: term, limit: 10 });
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  const selectProcedure = (row) => {
    const description = getProcedureDescription(row);
    const code = String(row?.cptCode || '').trim();
    setForm((p) => ({
      ...p,
      procedureName: description || code,
      cptCode: code,
    }));
    setSearchResults([]);
  };

  const openCreate = () => {
    setMode('create');
    setActiveRecord(null);
    setForm(emptyForm());
    setAmendNotes('');
    setError('');
    setOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActiveRecord(record);
    setForm({ ...emptyForm(), ...(record.payload || {}) });
    setError('');
    setOpen(true);
  };

  const openAmend = (record) => {
    setMode('amend');
    setActiveRecord(record);
    setForm({ ...emptyForm(), ...(record.payload || {}) });
    setAmendNotes('');
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.procedureName?.trim()) {
      setError('Procedure name is required.');
      return;
    }
    setError('');
    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload: form });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload: form, notes: amendNotes });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.SURGICAL_HISTORY, payload: form });
    }
    setForm(emptyForm());
    setOpen(false);
  };

  const dialogTitle =
    mode === 'edit' ? 'Edit Surgical History'
      : mode === 'amend' ? 'Amend Surgical History'
        : 'Surgical History Entry';

  return (
    <IntakeSectionCard id="assessment-surgical-history" title="Past Surgical History" onAdd={openCreate}>
      {records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Procedure</TableHead>
              <TableHead>CPT</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Surgeon</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.payload?.procedureName}</TableCell>
                <TableCell>{r.payload?.cptCode || '—'}</TableCell>
                <TableCell>{r.payload?.procedureDate || '—'}</TableCell>
                <TableCell>{r.payload?.surgeon || '—'}</TableCell>
                <TableCell>{r.payload?.outcome || '—'}</TableCell>
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
        <p className="text-sm text-muted-foreground">No surgical history recorded yet. Use the + button to add.</p>
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
          {/* Row 1: Procedure name */}
          <div className="relative min-w-0 space-y-2">
            <Label htmlFor="sx-procedure">Procedure Name (CPT Search) *</Label>
            <Input
              id="sx-procedure"
              className="h-9 w-full"
              value={procedureFieldValue}
              onChange={(e) => {
                const value = e.target.value;
                setForm((p) => ({ ...p, procedureName: value, cptCode: '' }));
                searchCpt(value);
              }}
              placeholder="Search by CPT code or description..."
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                {searchResults.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => selectProcedure(row)}
                  >
                    {formatProcedureLabel(row)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Procedure date, Surgeon, Facility */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sx-date">Procedure Date</Label>
              <Input
                id="sx-date"
                type="date"
                className="h-9 w-full"
                max={new Date().toISOString().slice(0, 10)}
                value={form.procedureDate}
                onChange={(e) => setForm((p) => ({ ...p, procedureDate: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sx-surgeon">Surgeon</Label>
              <Input
                id="sx-surgeon"
                className="h-9 w-full"
                value={form.surgeon}
                onChange={(e) => setForm((p) => ({ ...p, surgeon: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sx-facility">Facility</Label>
              <Input
                id="sx-facility"
                className="h-9 w-full"
                value={form.facility}
                onChange={(e) => setForm((p) => ({ ...p, facility: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 3: Anesthesia, Outcome, then Complications / Notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sx-anesthesia">Anesthesia Type</Label>
              <Select value={form.anesthesiaType} onValueChange={(v) => setForm((p) => ({ ...p, anesthesiaType: v }))}>
                <SelectTrigger id="sx-anesthesia" className="h-9 w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {ANESTHESIA_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="sx-outcome">Outcome</Label>
              <Select value={form.outcome} onValueChange={(v) => setForm((p) => ({ ...p, outcome: v }))}>
                <SelectTrigger id="sx-outcome" className="h-9 w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SURGICAL_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sx-complications-notes">Complications / Notes</Label>
            <Textarea
              id="sx-complications-notes"
              className="min-h-[5.5rem] w-full resize-y"
              rows={3}
              value={form.complications || form.notes}
              onChange={(e) => setForm((p) => ({
                ...p,
                complications: e.target.value,
                notes: e.target.value,
              }))}
              placeholder="Complications and notes..."
            />
          </div>

          {mode === 'amend' && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="sx-amend">Amendment Reason / Notes</Label>
              <Textarea
                id="sx-amend"
                className="min-h-[4.5rem] w-full resize-y"
                value={amendNotes}
                onChange={(e) => setAmendNotes(e.target.value)}
                placeholder="Reason for amendment..."
                rows={2}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </IntakeInlineFormPanel>

      <IntakeHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Surgical History"
        subtitle={historyRecord?.payload?.procedureName}
        record={historyRecord}
        renderPayload={(p) => (
          <div className="space-y-1">
            <p className="font-medium">{p.procedureName}{p.cptCode ? ` (${p.cptCode})` : ''}</p>
            {p.procedureDate && <p className="text-muted-foreground">Date: {p.procedureDate}</p>}
            {p.surgeon && <p className="text-muted-foreground">Surgeon: {p.surgeon}</p>}
            {p.outcome && <p className="text-muted-foreground">Outcome: {p.outcome}</p>}
          </div>
        )}
      />
    </IntakeSectionCard>
  );
}
