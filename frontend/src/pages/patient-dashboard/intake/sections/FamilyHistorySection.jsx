import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
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
import { INTAKE_SECTIONS, FAMILY_RELATIONSHIPS } from '../intakeConstants';

let entryUid = 0;
const emptyEntry = () => ({
  uid: `fh-${Date.now()}-${entryUid++}`,
  relationship: '',
  otherRelationship: '',
  condition: '',
  status: 'Unknown',
  ageAtOnset: '',
  isApproximateAgeAtOnset: false,
  vitalStatus: 'Unknown',
  currentAge: '',
  ageAtDeath: '',
  causeOfDeath: '',
  notes: '',
});

function entryToPayload(entry) {
  const { uid, ...rest } = entry;
  return rest;
}

export function FamilyHistorySection() {
  const { getRecordsBySection, saveSection, updateRecord, addAddendum, deleteRecord, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.FAMILY_HISTORY);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create'); // create | edit | amend
  const [activeRecord, setActiveRecord] = useState(null);
  const [entries, setEntries] = useState([emptyEntry()]);
  const [noKnown, setNoKnown] = useState(false);
  const [amendNotes, setAmendNotes] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const updateEntry = (uid, field, value) => {
    setEntries((prev) => prev.map((e) => (e.uid === uid ? { ...e, [field]: value } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);
  const removeEntry = (uid) => setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.uid !== uid) : prev));

  const openCreate = () => {
    setMode('create');
    setActiveRecord(null);
    setEntries([emptyEntry()]);
    setNoKnown(false);
    setAmendNotes('');
    setOpen(true);
  };

  const openEdit = (record) => {
    setMode('edit');
    setActiveRecord(record);
    setEntries([{ ...emptyEntry(), ...(record.payload || {}) }]);
    setNoKnown(false);
    setOpen(true);
  };

  const openAmend = (record) => {
    setMode('amend');
    setActiveRecord(record);
    setEntries([{ ...emptyEntry(), ...(record.payload || {}) }]);
    setAmendNotes('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (mode === 'create' && noKnown) {
      await saveSection({
        sectionType: INTAKE_SECTIONS.FAMILY_HISTORY,
        payload: {
          noKnownFamilyHistory: true,
          statement: 'No known family history of significant medical conditions.',
        },
      });
      setOpen(false);
      return;
    }

    const valid = entries.filter((e) => e.relationship && e.condition);
    if (!valid.length) return;

    if (mode === 'edit' && activeRecord) {
      await updateRecord(activeRecord.id, { payload: entryToPayload(valid[0]) });
    } else if (mode === 'amend' && activeRecord) {
      await addAddendum(activeRecord.id, { payload: entryToPayload(valid[0]), notes: amendNotes });
    } else {
      for (const entry of valid) {
        // eslint-disable-next-line no-await-in-loop
        await saveSection({ sectionType: INTAKE_SECTIONS.FAMILY_HISTORY, payload: entryToPayload(entry) });
      }
    }
    setEntries([emptyEntry()]);
    setNoKnown(false);
    setOpen(false);
  };

  const nkfhRecord = records.find((r) => r.payload?.noKnownFamilyHistory);
  const detailRecords = records.filter((r) => !r.payload?.noKnownFamilyHistory);
  const isSingleMode = mode === 'edit' || mode === 'amend';

  const dialogTitle =
    mode === 'edit' ? 'Edit Family History'
      : mode === 'amend' ? 'Amend Family History'
        : 'Family History';

  return (
    <IntakeSectionCard id="assessment-family-history" title="Family History" onAdd={openCreate}>
      {nkfhRecord ? (
        <p className="text-sm font-medium">No known family history of significant medical conditions.</p>
      ) : detailRecords.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Relationship</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Age at Onset</TableHead>
              <TableHead>Vital Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailRecords.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.payload?.relationship === 'Other Relative' ? r.payload?.otherRelationship : r.payload?.relationship}</TableCell>
                <TableCell className="font-medium">{r.payload?.condition}</TableCell>
                <TableCell>{r.payload?.status}</TableCell>
                <TableCell>{r.payload?.ageAtOnset || '—'}{r.payload?.isApproximateAgeAtOnset ? ' (approx)' : ''}</TableCell>
                <TableCell>
                  {r.payload?.vitalStatus || r.payload?.livingStatus || 'Unknown'}
                  {r.payload?.vitalStatus === 'Deceased' && r.payload?.ageAtDeath ? ` (d. ${r.payload.ageAtDeath})` : ''}
                </TableCell>
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
        <p className="text-sm text-muted-foreground">No family history recorded yet. Use the + button to add.</p>
      )}

      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        footer={
          <>
            {!noKnown && !isSingleMode ? (
              <Button type="button" variant="outline" onClick={addEntry} className="mr-auto">
                <Plus className="mr-1 h-4 w-4" />
                Add More History
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {mode === 'edit' ? 'Save Changes' : mode === 'amend' ? 'Save Amendment' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-4">
            {mode === 'create' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={noKnown}
                  onCheckedChange={(c) => setNoKnown(!!c)}
                />
                <Label>No Known Family History</Label>
              </div>
            )}

            {!noKnown && entries.map((entry, index) => (
              <div key={entry.uid} className="rounded-lg border p-4 space-y-4">
                {!isSingleMode && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground">Family Member {index + 1}</p>
                    {entries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeEntry(entry.uid)}
                        aria-label="Remove entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Relationship *</Label>
                    <Select value={entry.relationship} onValueChange={(v) => updateEntry(entry.uid, 'relationship', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {FAMILY_RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {entry.relationship === 'Other Relative' && (
                    <div className="space-y-2">
                      <Label>Specify Relationship *</Label>
                      <Input value={entry.otherRelationship} onChange={(e) => updateEntry(entry.uid, 'otherRelationship', e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Condition *</Label>
                    <Input value={entry.condition} onChange={(e) => updateEntry(entry.uid, 'condition', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={entry.status} onValueChange={(v) => updateEntry(entry.uid, 'status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Active', 'Resolved', 'Unknown'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Age at Onset</Label>
                    <Input type="number" min={0} max={120} value={entry.ageAtOnset} onChange={(e) => updateEntry(entry.uid, 'ageAtOnset', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={entry.isApproximateAgeAtOnset} onCheckedChange={(c) => updateEntry(entry.uid, 'isApproximateAgeAtOnset', !!c)} />
                    <Label>Approximate age at onset</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Deceased?</Label>
                    <Select value={entry.vitalStatus} onValueChange={(v) => updateEntry(entry.uid, 'vitalStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Living', 'Deceased', 'Unknown'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {entry.vitalStatus === 'Living' && (
                    <div className="space-y-2">
                      <Label>Current Age</Label>
                      <Input type="number" min={0} max={120} value={entry.currentAge} onChange={(e) => updateEntry(entry.uid, 'currentAge', e.target.value)} />
                    </div>
                  )}
                  {entry.vitalStatus === 'Deceased' && (
                    <>
                      <div className="space-y-2">
                        <Label>Age at Deceased</Label>
                        <Input type="number" min={0} max={120} value={entry.ageAtDeath} onChange={(e) => updateEntry(entry.uid, 'ageAtDeath', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cause of Death</Label>
                        <Input value={entry.causeOfDeath} onChange={(e) => updateEntry(entry.uid, 'causeOfDeath', e.target.value)} />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={entry.notes} onChange={(e) => updateEntry(entry.uid, 'notes', e.target.value)} maxLength={2000} rows={2} />
                  </div>
                </div>
              </div>
            ))}

            {mode === 'amend' && (
              <div className="space-y-2 border-t pt-4">
                <Label>Amendment Reason / Notes</Label>
                <Textarea value={amendNotes} onChange={(e) => setAmendNotes(e.target.value)} placeholder="Reason for amendment..." rows={2} />
              </div>
            )}
        </div>
      </IntakeInlineFormPanel>

      <IntakeHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Family History"
        subtitle={historyRecord?.payload?.condition}
        record={historyRecord}
        renderPayload={(p) => (
          <div className="space-y-1">
            <p className="font-medium">
              {(p.relationship === 'Other Relative' ? p.otherRelationship : p.relationship) || '—'} — {p.condition}
            </p>
            {p.status && <p className="text-muted-foreground">Status: {p.status}</p>}
            {(p.vitalStatus || p.livingStatus) && <p className="text-muted-foreground">Vital status: {p.vitalStatus || p.livingStatus}</p>}
          </div>
        )}
      />
    </IntakeSectionCard>
  );
}
