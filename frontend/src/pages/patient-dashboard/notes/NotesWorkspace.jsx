import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, FileText, Plus, Save, PenLine, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clinicalNoteApi } from '@/services/api';
import { NOTE_TYPE_OPTIONS } from './noteConstants';
import { NoteEditor } from './NoteEditor';
import { AddendumDialog } from './AddendumDialog';
import { DiagnosisPickerDialog } from './DiagnosisPickerDialog';

export function NotesWorkspace({
  patientId,
  appointmentId,
  encounter,
  onNoteChanged,
  onDirtyChange,
  initialNoteId,
  clearInitialNoteId,
}) {
  const [activeNote, setActiveNote] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addendumOpen, setAddendumOpen] = useState(false);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadNote = useCallback(
    async (noteId) => {
      const res = await clinicalNoteApi.getById(patientId, noteId);
      setActiveNote(res.data);
      setDirty(false);
      onDirtyChange?.(false);
    },
    [patientId, onDirtyChange],
  );

  useEffect(() => {
    if (initialNoteId) {
      loadNote(initialNoteId).finally(() => clearInitialNoteId?.());
    }
  }, [initialNoteId, loadNote, clearInitialNoteId]);

  const handleCreate = async (noteType) => {
    setMenuOpen(false);
    setSaving(true);
    try {
      const res = await clinicalNoteApi.create(patientId, {
        noteType,
        appointmentId: appointmentId || undefined,
        providerName: encounter?.provider,
        location: encounter?.location,
      });
      setActiveNote(res.data);
      setDirty(false);
      onNoteChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!activeNote || activeNote.status === 'Signed') return;
    setSaving(true);
    try {
      const res = await clinicalNoteApi.update(patientId, activeNote.id, {
        title: activeNote.title,
        content: activeNote.content,
        diagnoses: activeNote.diagnoses,
        attachments: activeNote.attachments,
      });
      setActiveNote(res.data);
      setDirty(false);
      onDirtyChange?.(false);
      onNoteChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!activeNote) return;
    if (dirty) await handleSaveDraft();
    setSaving(true);
    try {
      const res = await clinicalNoteApi.sign(patientId, activeNote.id);
      setActiveNote(res.data);
      onNoteChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleAddendum = async (payload) => {
    setSaving(true);
    try {
      await clinicalNoteApi.addAddendum(patientId, activeNote.id, payload);
      await loadNote(activeNote.id);
      setAddendumOpen(false);
      onNoteChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleNoteChange = (next) => {
    setActiveNote(next);
    setDirty(true);
    onDirtyChange?.(true);
  };

  const handlePrint = () => window.print();

  const isSigned = activeNote?.status === 'Signed';

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <CardTitle className="text-lg">Notes Workspace</CardTitle>
        <div className="relative">
          <Button type="button" onClick={() => setMenuOpen((o) => !o)} disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />
            Add Notes
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          {menuOpen && (
            <>
              <button type="button" className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border bg-popover p-1 shadow-lg">
                {NOTE_TYPE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleCreate(opt.id)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!activeNote ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <FileText className="h-10 w-10 opacity-40" />
            <p className="text-sm">Select a prior note to view or click Add Notes to create documentation.</p>
          </div>
        ) : (
          <>
            <NoteEditor
              note={activeNote}
              onChange={handleNoteChange}
              readOnly={isSigned}
              onAddDiagnosis={() => setDiagnosisOpen(true)}
            />

            <div className="flex flex-wrap gap-2 border-t pt-4">
              {!isSigned && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
                    <Save className="mr-1 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button type="button" size="sm" onClick={handleSign} disabled={saving}>
                    <PenLine className="mr-1 h-4 w-4" />
                    Sign Note
                  </Button>
                </>
              )}
              {isSigned && (
                <Button type="button" variant="outline" size="sm" onClick={() => setAddendumOpen(true)}>
                  Add Addendum
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-1 h-4 w-4" />
                Print
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Download className="mr-1 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <AddendumDialog
        open={addendumOpen}
        onOpenChange={setAddendumOpen}
        noteType={activeNote?.noteType}
        onSubmit={handleAddendum}
        saving={saving}
      />

      <DiagnosisPickerDialog
        open={diagnosisOpen}
        onOpenChange={setDiagnosisOpen}
        selected={activeNote?.diagnoses || []}
        onConfirm={(diagnoses) => handleNoteChange({ ...activeNote, diagnoses })}
      />
    </Card>
  );
}
