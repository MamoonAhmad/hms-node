import { useCallback, useEffect, useState } from 'react';
import { clinicalNoteApi } from '@/services/api';
import { usePatientChart } from './PatientChartContext';
import { NotesChartSummary } from './notes/NotesChartSummary';
import { NotesWorkspace } from './notes/NotesWorkspace';
import { AllEncountersNotesDialog } from './notes/AllEncountersNotesDialog';

export function ClinicalNotesTab({ onDirtyChange }) {
  const { patientId, appointmentId, isSampleChart } = usePatientChart();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allNotesOpen, setAllNotesOpen] = useState(false);
  const [allNotes, setAllNotes] = useState([]);
  const [allNotesLoading, setAllNotesLoading] = useState(false);
  const [viewNoteId, setViewNoteId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadContext = useCallback(async () => {
    if (!patientId || isSampleChart) return;
    setLoading(true);
    try {
      const res = await clinicalNoteApi.getChartContext(patientId, {
        appointmentId: appointmentId || undefined,
      });
      setContext(res.data);
    } catch {
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId, isSampleChart, refreshKey]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const handleViewAllEncounters = async () => {
    setAllNotesOpen(true);
    setAllNotesLoading(true);
    try {
      const res = await clinicalNoteApi.getAll(patientId, { allEncounters: true });
      setAllNotes(res.data || []);
    } finally {
      setAllNotesLoading(false);
    }
  };

  if (isSampleChart) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="text-sm text-muted-foreground">Open a live patient chart to document clinical notes.</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 space-y-4 sm:-mx-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clinical Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Document SOAP, progress, telephonic, blank, and nurse notes. Intake data auto-populates from nursing documentation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <NotesChartSummary
            context={context}
            loading={loading}
            onViewNote={setViewNoteId}
            onViewAllEncounters={handleViewAllEncounters}
          />
        </div>
        <div className="lg:col-span-8">
          <NotesWorkspace
            patientId={patientId}
            appointmentId={appointmentId}
            encounter={context?.encounter}
            onNoteChanged={() => setRefreshKey((k) => k + 1)}
            onDirtyChange={onDirtyChange}
            initialNoteId={viewNoteId}
            clearInitialNoteId={() => setViewNoteId(null)}
          />
        </div>
      </div>

      <AllEncountersNotesDialog
        open={allNotesOpen}
        onOpenChange={setAllNotesOpen}
        notes={allNotes}
        loading={allNotesLoading}
        onViewNote={(id) => {
          setViewNoteId(id);
          setAllNotesOpen(false);
        }}
      />
    </div>
  );
}
