import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartTabShell } from './components/chart-ui';
import { usePatientChart } from './PatientChartContext';
import { SOAPNotesTab } from './SOAPNotesTab';
import { NOTE_TYPES } from './notes/notesStorage';
import { NoteTypeForm } from './notes/NoteTypeForm';
import {
  TELEPHONIC_FIELDS,
  PROGRESS_FIELDS,
  PROCEDURE_FIELDS,
  COMMUNICATION_FIELDS,
  BLANK_FIELDS,
} from './notes/noteTypeFields';

function truncate(text, max = 80) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '—';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function NotesTab({ onDirtyChange }) {
  const { patientId, appointmentId } = usePatientChart();
  const [activeNoteType, setActiveNoteType] = useState('soap');
  const scopeKey = `${patientId || 'p'}::${appointmentId || 'a'}`;

  return (
    <ChartTabShell
      title="Notes"
      description="Document the encounter with SOAP, telephonic, progress, procedure, communication, or free-text notes. SOAP fields are prefilled from Intake and other encounter data when available."
    >
      <Tabs value={activeNoteType} onValueChange={setActiveNoteType} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {NOTE_TYPES.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="soap" className="mt-0 focus-visible:outline-none">
          <SOAPNotesTab key={`soap-${scopeKey}`} embedded onDirtyChange={onDirtyChange} />
        </TabsContent>

        <TabsContent value="telephonic" className="mt-0 focus-visible:outline-none">
          <NoteTypeForm
            key={`telephonic-${scopeKey}`}
            noteType="telephonic"
            title="Telephonic Notes"
            description="Document phone triage and telephone encounters with the patient or caregiver."
            fields={TELEPHONIC_FIELDS}
            buildSummary={(f) =>
              truncate(f.reasonForCall || f.discussion || `${f.direction || 'Call'} — ${f.callerName || ''}`)
            }
            onDirtyChange={onDirtyChange}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-0 focus-visible:outline-none">
          <NoteTypeForm
            key={`progress-${scopeKey}`}
            noteType="progress"
            title="Progress Notes"
            description="Interval updates on the patient’s course during this encounter or admission."
            fields={PROGRESS_FIELDS}
            buildSummary={(f) => truncate(f.assessment || f.intervalHistory || f.plan)}
            onDirtyChange={onDirtyChange}
          />
        </TabsContent>

        <TabsContent value="procedure" className="mt-0 focus-visible:outline-none">
          <NoteTypeForm
            key={`procedure-${scopeKey}`}
            noteType="procedure"
            title="Procedure Notes"
            description="Structured documentation for procedures performed during the visit."
            fields={PROCEDURE_FIELDS}
            buildSummary={(f) =>
              truncate(
                [f.procedureName, f.cptCode].filter(Boolean).join(' — ') || f.indication || f.findings,
              )
            }
            onDirtyChange={onDirtyChange}
          />
        </TabsContent>

        <TabsContent value="communication" className="mt-0 focus-visible:outline-none">
          <NoteTypeForm
            key={`communication-${scopeKey}`}
            noteType="communication"
            title="Communication Notes"
            description="Record care-team and external communications related to this patient."
            fields={COMMUNICATION_FIELDS}
            buildSummary={(f) =>
              truncate([f.commType, f.method, f.topic].filter(Boolean).join(' · ') || f.summary)
            }
            onDirtyChange={onDirtyChange}
          />
        </TabsContent>

        <TabsContent value="blank" className="mt-0 focus-visible:outline-none">
          <NoteTypeForm
            key={`blank-${scopeKey}`}
            noteType="blank"
            title="Blank Notes"
            description="Unstructured free-text note when another template does not fit."
            fields={BLANK_FIELDS}
            buildSummary={(f) => truncate(f.noteTitle || f.body)}
            onDirtyChange={onDirtyChange}
          />
        </TabsContent>
      </Tabs>
    </ChartTabShell>
  );
}
