import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePatientChart } from '../PatientChartContext';
import { formatPatientName } from '../patientChartUtils';
import { NotesListingCard } from './NotesListingCard';
import { loadNotes, upsertNote } from './notesStorage';
import { NoteSignActions } from './NoteSignActions';
import { syncStatusForNotePersist } from '@/lib/syncEncounterVisitStatus';
import {
  AddendumsList,
  LockedNoteBanner,
  ReadOnlyValue,
} from './ReadOnlyNoteFields';

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function defaultMeta(patient, appointment, encounter) {
  return {
    patientName: patient ? formatPatientName(patient) : '',
    dateOfService: encounter?.appointmentDate || new Date().toISOString().slice(0, 10),
    provider: encounter?.visitProvider || appointment?.provider || '',
    location: encounter?.location || appointment?.department || '',
  };
}

function LockedNoteTypeView({ title, fields, note, onClose, onAddAddendum, addendumPanel }) {
  const content = note?.content || {};
  return (
    <div className="space-y-6">
      <LockedNoteBanner noteTypeLabel={title} date={note?.date} provider={note?.provider} />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onAddAddendum}>
          Add addendum
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close signed note
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Note details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnlyValue label="Patient" value={content.patientName} />
          <ReadOnlyValue label="Date of service" value={content.dateOfService || note?.date} />
          <ReadOnlyValue label="Author / Provider" value={content.provider || note?.provider} />
          <ReadOnlyValue label="Location / Clinic" value={content.location} className="sm:col-span-2 lg:col-span-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title} content</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <ReadOnlyValue
              key={f.key}
              label={f.label}
              value={content[f.key]}
              className={f.span === 2 ? 'sm:col-span-2' : ''}
            />
          ))}
        </CardContent>
      </Card>

      <AddendumsList addendums={note?.addendums} />
      {addendumPanel}
    </div>
  );
}

/**
 * Configurable clinical note form used for non-SOAP note types.
 * `fields` is an array of { key, label, type: 'text'|'textarea'|'date'|'select'|'time', options?, rows?, span? }
 */
export function NoteTypeForm({
  noteType,
  title,
  description,
  fields,
  buildSummary,
  onDirtyChange,
}) {
  const { patient, encounter, appointment, patientId, appointmentId, refreshChart } =
    usePatientChart();
  const [form, setForm] = useState(() => {
    const base = defaultMeta(patient, appointment, encounter);
    const fieldDefaults = Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? '']));
    return { ...base, ...fieldDefaults };
  });
  const [notes, setNotes] = useState(() => loadNotes(patientId, appointmentId, noteType));
  const [editingId, setEditingId] = useState(null);
  const [lockedNote, setLockedNote] = useState(null);
  const [addendumNoteId, setAddendumNoteId] = useState(null);
  const [addendumText, setAddendumText] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);

  useEffect(() => {
    if (lockedNote) {
      onDirtyChange?.(false);
      return;
    }
    const dirty = fields.some((f) => String(form[f.key] || '').trim());
    onDirtyChange?.(dirty);
  }, [form, fields, onDirtyChange, lockedNote]);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const resetBodyFields = () => {
    const fieldDefaults = Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? '']));
    setForm({
      ...defaultMeta(patient, appointment, encounter),
      ...fieldDefaults,
    });
    setEditingId(null);
    setConfirmComplete(false);
  };

  const persist = (status) => {
    if (status === 'locked' && !confirmComplete) return;
    const note = {
      id: editingId || `note-${Date.now()}`,
      date: form.dateOfService,
      provider: form.provider || '—',
      status,
      summary: buildSummary(form),
      content: { ...form },
      addendums: notes.find((n) => n.id === editingId)?.addendums || [],
      updatedAt: new Date().toISOString(),
    };
    const next = upsertNote(patientId, appointmentId, noteType, note);
    setNotes(next);
    onDirtyChange?.(false);
    setConfirmComplete(false);

    if (status === 'locked') {
      setLockedNote(note);
      setEditingId(null);
    } else {
      setEditingId(note.id);
      setLockedNote(null);
    }

    // Draft notes → With Provider; signed & locked notes → Provider Out
    void syncStatusForNotePersist(appointmentId, status, appointment?.status).then((updated) => {
      if (updated) refreshChart?.();
    });
  };

  const handleEdit = (note) => {
    if (note.status === 'locked') return;
    setLockedNote(null);
    setAddendumNoteId(null);
    setEditingId(note.id);
    setConfirmComplete(false);
    setForm({ ...defaultMeta(patient, appointment, encounter), ...(note.content || {}) });
  };

  const openLockedNote = (note) => {
    const latest = notes.find((n) => n.id === note.id) || note;
    setLockedNote(latest);
    setEditingId(null);
    setConfirmComplete(false);
    setAddendumNoteId(null);
    setAddendumText('');
  };

  const handleSaveAddendum = () => {
    if (!addendumNoteId || !addendumText.trim()) return;
    const target = notes.find((n) => n.id === addendumNoteId) || lockedNote;
    if (!target) return;
    const updated = {
      ...target,
      addendums: [
        ...(target.addendums || []),
        {
          id: Date.now(),
          text: addendumText.trim(),
          addedBy: form.provider || target.provider || 'Provider',
          dateTime: new Date().toISOString(),
        },
      ],
    };
    const next = upsertNote(patientId, appointmentId, noteType, updated);
    setNotes(next);
    setLockedNote(updated);
    setAddendumNoteId(null);
    setAddendumText('');
  };

  const addendumPanel =
    addendumNoteId && lockedNote ? (
      <Card className="border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Add addendum</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddendumNoteId(null);
              setAddendumText('');
            }}
          >
            Cancel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={addendumText}
            onChange={(e) => setAddendumText(e.target.value)}
            placeholder="Enter addendum..."
            rows={4}
          />
          <Button onClick={handleSaveAddendum} disabled={!addendumText.trim()}>
            Save addendum
          </Button>
        </CardContent>
      </Card>
    ) : null;

  if (lockedNote) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        <NotesListingCard
          title={`Saved ${title}`}
          notes={notes}
          emptyMessage={`No ${title.toLowerCase()} yet. Complete the form below and save.`}
          onEdit={handleEdit}
          onAddendum={openLockedNote}
        />

        <LockedNoteTypeView
          title={title}
          fields={fields}
          note={lockedNote}
          onClose={() => {
            setLockedNote(null);
            resetBodyFields();
          }}
          onAddAddendum={() => setAddendumNoteId(lockedNote.id)}
          addendumPanel={addendumPanel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <NotesListingCard
        title={`Saved ${title}`}
        notes={notes}
        emptyMessage={`No ${title.toLowerCase()} yet. Complete the form below and save.`}
        onEdit={handleEdit}
        onAddendum={openLockedNote}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Note details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Patient">
            <Input value={form.patientName} onChange={(e) => update('patientName', e.target.value)} />
          </Field>
          <Field label="Date of service">
            <Input
              type="date"
              value={form.dateOfService}
              onChange={(e) => update('dateOfService', e.target.value)}
            />
          </Field>
          <Field label="Author / Provider">
            <Input value={form.provider} onChange={(e) => update('provider', e.target.value)} />
          </Field>
          <Field label="Location / Clinic" className="sm:col-span-2 lg:col-span-3">
            <Input value={form.location} onChange={(e) => update('location', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title} content</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} className={f.span === 2 ? 'sm:col-span-2' : ''}>
              {f.type === 'textarea' ? (
                <Textarea
                  rows={f.rows || 3}
                  value={form[f.key] || ''}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              ) : f.type === 'select' ? (
                <Select value={form[f.key] || undefined} onValueChange={(v) => update(f.key, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={f.placeholder || 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </Field>
          ))}
        </CardContent>
      </Card>

      <NoteSignActions
        confirmChecked={confirmComplete}
        onConfirmChange={setConfirmComplete}
        onSaveDraft={() => persist('draft')}
        onSignAndLock={() => persist('locked')}
        onCancelEdit={resetBodyFields}
        draftLabel={editingId ? 'Update draft' : 'Save as draft'}
        showCancelEdit={!!editingId}
      />
    </div>
  );
}
