import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NOTE_TYPE_LABELS } from './noteConstants';

function IntakeBlock({ label, value }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        From intake — {label}
      </p>
      <pre className="whitespace-pre-wrap text-sm text-foreground">{value || 'No data available.'}</pre>
    </div>
  );
}

function ProviderNotes({
  label,
  value,
  onChange,
  readOnly,
  rows = 4,
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder="Provider notes…"
      />
    </div>
  );
}

function SectionBlock({ title, intakeBlocks = [], providerLabel, providerValue, onProviderChange, readOnly }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {intakeBlocks.map((b) => (
        <IntakeBlock key={b.label} label={b.label} value={b.value} />
      ))}
      <ProviderNotes
        label={providerLabel}
        value={providerValue}
        onChange={onProviderChange}
        readOnly={readOnly}
      />
    </div>
  );
}

export function NoteEditor({ note, onChange, readOnly = false, onAddDiagnosis }) {
  if (!note) return null;

  const updateContent = (path, value) => {
    const next = JSON.parse(JSON.stringify(note.content || {}));
    const keys = path.split('.');
    let cur = next;
    for (let i = 0; i < keys.length - 1; i += 1) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    onChange({ ...note, content: next });
  };

  const content = note.content || {};
  const isSigned = note.status === 'Signed';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{NOTE_TYPE_LABELS[note.noteType] || note.noteType}</Badge>
        <Badge variant={isSigned ? 'default' : 'secondary'}>{note.status}</Badge>
        {note.signedByName && (
          <span className="text-xs text-muted-foreground">
            Signed by {note.signedByName} · {note.signedAt ? new Date(note.signedAt).toLocaleString() : ''}
          </span>
        )}
      </div>

      {note.noteType === 'soap' && (
        <>
          <div className="space-y-2">
            <Label>Header</Label>
            <Textarea
              rows={2}
              value={content.header || ''}
              onChange={(e) => updateContent('header', e.target.value)}
              readOnly={readOnly}
            />
          </div>
          <SectionBlock
            title="Subjective (S)"
            intakeBlocks={[
              { label: 'Chief Complaint', value: content.subjective?.intakeChiefComplaint },
              { label: 'HPI', value: content.subjective?.intakeHpi },
              { label: 'ROS', value: content.subjective?.intakeRos },
              { label: 'Allergies', value: content.subjective?.intakeAllergies },
              { label: 'Medications', value: content.subjective?.intakeMeds },
            ]}
            providerLabel="Provider Notes"
            providerValue={content.subjective?.providerNotes}
            onProviderChange={(v) => updateContent('subjective.providerNotes', v)}
            readOnly={readOnly}
          />
          <SectionBlock
            title="Objective (O)"
            intakeBlocks={[{ label: 'Vitals', value: content.objective?.intakeVitals }]}
            providerLabel="Provider Notes"
            providerValue={content.objective?.providerNotes}
            onProviderChange={(v) => updateContent('objective.providerNotes', v)}
            readOnly={readOnly}
          />
          <SectionBlock
            title="Assessment (A)"
            intakeBlocks={[{ label: 'Active Problems', value: content.assessment?.intakeProblems }]}
            providerLabel="Provider Notes"
            providerValue={content.assessment?.providerNotes}
            onProviderChange={(v) => updateContent('assessment.providerNotes', v)}
            readOnly={readOnly}
          />
          <SectionBlock
            title="Plan (P)"
            providerLabel="Provider Notes"
            providerValue={content.plan?.providerNotes}
            onProviderChange={(v) => updateContent('plan.providerNotes', v)}
            readOnly={readOnly}
          />
        </>
      )}

      {note.noteType === 'progress' && (
        <>
          <div className="space-y-2">
            <Label>Note Header</Label>
            <Textarea rows={2} value={content.header || ''} onChange={(e) => updateContent('header', e.target.value)} readOnly={readOnly} />
          </div>
          <SectionBlock
            title="Clinical Summary"
            intakeBlocks={[{ label: 'HPI', value: content.clinicalSummary?.providerNotes }]}
            providerLabel="Clinical Summary Notes"
            providerValue={content.clinicalSummary?.providerNotes}
            onProviderChange={(v) => updateContent('clinicalSummary.providerNotes', v)}
            readOnly={readOnly}
          />
          <SectionBlock
            title="Assessment"
            providerLabel="Assessment"
            providerValue={content.assessment?.providerNotes}
            onProviderChange={(v) => updateContent('assessment.providerNotes', v)}
            readOnly={readOnly}
          />
          <SectionBlock
            title="Plan"
            providerLabel="Plan"
            providerValue={content.plan?.providerNotes}
            onProviderChange={(v) => updateContent('plan.providerNotes', v)}
            readOnly={readOnly}
          />
        </>
      )}

      {note.noteType === 'telephonic' && (
        <>
          <div className="space-y-2">
            <Label>Caller Information</Label>
            <Input value={content.callerInformation || ''} onChange={(e) => updateContent('callerInformation', e.target.value)} readOnly={readOnly} />
          </div>
          <SectionBlock title="Call Reason" providerLabel="Call Reason" providerValue={content.callReason?.providerNotes} onProviderChange={(v) => updateContent('callReason.providerNotes', v)} readOnly={readOnly} />
          <SectionBlock title="Discussion" providerLabel="Discussion" providerValue={content.discussion?.providerNotes} onProviderChange={(v) => updateContent('discussion.providerNotes', v)} readOnly={readOnly} />
          <div className="space-y-2">
            <Label>Recommendations</Label>
            <Textarea rows={3} value={content.recommendations || ''} onChange={(e) => updateContent('recommendations', e.target.value)} readOnly={readOnly} />
          </div>
          <SectionBlock title="Follow-up Instructions" providerLabel="Follow-up" providerValue={content.followUp?.providerNotes} onProviderChange={(v) => updateContent('followUp.providerNotes', v)} readOnly={readOnly} />
        </>
      )}

      {note.noteType === 'nurse' && (
        <>
          <SectionBlock title="Nursing Assessment" intakeBlocks={[{ label: 'Vitals', value: content.nursingAssessment?.providerNotes }]} providerLabel="Nursing Assessment" providerValue={content.nursingAssessment?.providerNotes} onProviderChange={(v) => updateContent('nursingAssessment.providerNotes', v)} readOnly={readOnly} />
          <SectionBlock title="Interventions" providerLabel="Interventions" providerValue={content.interventions?.providerNotes} onProviderChange={(v) => updateContent('interventions.providerNotes', v)} readOnly={readOnly} />
          <SectionBlock title="Observations" providerLabel="Observations" providerValue={content.observations?.providerNotes} onProviderChange={(v) => updateContent('observations.providerNotes', v)} readOnly={readOnly} />
          <SectionBlock title="Patient Education" providerLabel="Patient Education" providerValue={content.patientEducation?.providerNotes} onProviderChange={(v) => updateContent('patientEducation.providerNotes', v)} readOnly={readOnly} />
          <SectionBlock title="Follow-up" providerLabel="Follow-up" providerValue={content.followUp?.providerNotes} onProviderChange={(v) => updateContent('followUp.providerNotes', v)} readOnly={readOnly} />
        </>
      )}

      {note.noteType === 'blank' && (
        <>
          <div className="space-y-2">
            <Label>Note Title</Label>
            <Input value={note.title || content.title || ''} onChange={(e) => onChange({ ...note, title: e.target.value })} readOnly={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea rows={12} value={content.content || ''} onChange={(e) => updateContent('content', e.target.value)} readOnly={readOnly} />
          </div>
        </>
      )}

      {note.diagnoses?.length > 0 && (
        <div className="space-y-2">
          <Label>Diagnoses</Label>
          <ul className="space-y-1 text-sm">
            {note.diagnoses.map((d, i) => (
              <li key={i}>{d.code} — {d.description}</li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={onAddDiagnosis}>
          Add Diagnosis
        </Button>
      )}

      {note.addendums?.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold">Addendums</h3>
          {note.addendums.map((a, idx) => (
            <div key={a.id} className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Addendum #{idx + 1} — {a.signedByName}</p>
              <p className="text-xs text-muted-foreground">{a.signedAt ? new Date(a.signedAt).toLocaleString() : ''}</p>
              <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(a.content, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
