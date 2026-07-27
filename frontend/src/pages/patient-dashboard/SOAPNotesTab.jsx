import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePatientChart } from './PatientChartContext';
import { formatPatientName } from './patientChartUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, LayoutTemplate, BookmarkPlus, RefreshCw, Loader2, Stethoscope } from 'lucide-react';
import {
  BUILTIN_SOAP_TEMPLATES,
  loadCustomTemplates,
  saveCustomTemplates,
  applySoapTemplateContent,
} from '@/pages/patient-dashboard/soapNoteTemplates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddAllergyDialog } from '@/pages/nurses/nurse-dashboard/allergies/AddAllergyDialog';
import { AddVitalsDialog } from './AddVitalsDialog';
import { ScreeningScoresPanel } from './intake/ScreeningScoresPanel';
import { ChartTabShell } from './components/chart-ui';
import { fetchSoapEncounterPrefill } from './notes/mapEncounterDataToSoap';
import { loadNotes, upsertNote } from './notes/notesStorage';
import { NotesListingCard } from './notes/NotesListingCard';
import { PhysicalExamPickerDialog } from './notes/PhysicalExamPickerDialog';
import { NoteSignActions } from './notes/NoteSignActions';
import { SoapNoteReadOnlyView } from './notes/SoapNoteReadOnlyView';
import { syncStatusForNotePersist } from '@/lib/syncEncounterVisitStatus';

const defaultAllergyForm = () => ({
  allergen: '',
  adverseEvent: '',
  severity: '',
  reaction: '',
  onset: '',
  onsetDate: '',
  endDate: '',
  updated: '',
  redApplied: '',
  active: '',
  comment: '',
});

export function SOAPNotesTab({ onDirtyChange, embedded = false }) {
  const {
    patient,
    encounter,
    appointment,
    patientId,
    appointmentId,
    isSampleChart,
    refreshChart,
  } = usePatientChart();
  const prefillAppliedRef = useRef(false);
  const userEditedRef = useRef(false);

  const [header, setHeader] = useState(() => ({
    patientName: patient ? formatPatientName(patient) : '',
    encounterId: appointment?.id?.slice(0, 8).toUpperCase() || encounter?.id?.slice(0, 8) || '—',
    dateOfService: encounter?.appointmentDate || new Date().toISOString().slice(0, 10),
    chiefComplaint: '',
    provider: encounter?.visitProvider || appointment?.provider || '',
    location: encounter?.location || appointment?.department || '',
  }));

  const [subjective, setSubjective] = useState({
    chiefComplaint: '',
    hpi: '',
    ros: '',
    currentMeds: '',
    pmh: '',
    pastSurgical: '',
    socialHx: '',
    familyHx: '',
  });

  const [allergies, setAllergies] = useState([]);
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);
  const [allergyForm, setAllergyForm] = useState(defaultAllergyForm());

  const [vitalsList, setVitalsList] = useState([]);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);

  const [physicalExam, setPhysicalExam] = useState('');
  const [showPhysicalExamPicker, setShowPhysicalExamPicker] = useState(false);
  const [diagnosticTestingResults, setDiagnosticTestingResults] = useState('');

  const [diagnoses, setDiagnoses] = useState([{ code: '', description: '' }]);
  const [differential, setDifferential] = useState('');
  const [clinicalImpression, setClinicalImpression] = useState('');

  const [planText, setPlanText] = useState('');
  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', duration: '' }]);
  const [followUp, setFollowUp] = useState('');
  const [patientEducation, setPatientEducation] = useState('');
  const [referrals, setReferrals] = useState('');

  const [soapNotes, setSoapNotes] = useState(() => loadNotes(patientId, appointmentId, 'soap'));
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [lockedNote, setLockedNote] = useState(null);
  const [addendumNoteId, setAddendumNoteId] = useState(null);
  const [addendumText, setAddendumText] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillMeta, setPrefillMeta] = useState({ hasIntake: false, sectionsPresent: [] });
  const [prefillError, setPrefillError] = useState(null);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const headerDisplay = {
    ...header,
    patientName: header.patientName || (patient ? formatPatientName(patient) : ''),
    encounterId:
      header.encounterId ||
      appointment?.id?.slice(0, 8).toUpperCase() ||
      encounter?.id?.slice(0, 8) ||
      '—',
    provider: header.provider || encounter?.visitProvider || appointment?.provider || '',
    location: header.location || encounter?.location || appointment?.department || '',
    dateOfService:
      header.dateOfService || encounter?.appointmentDate || new Date().toISOString().slice(0, 10),
  };

  const applyPrefill = useCallback(
    (snapshot, { force = false } = {}) => {
      if (!snapshot) return;
      if (!force && userEditedRef.current && prefillAppliedRef.current) return;

      const subj = snapshot.subjective || {};
      const pick = (incoming, previous) =>
        force ? (incoming ?? '') : (incoming || previous || '');

      setHeader((h) => ({
        ...h,
        chiefComplaint: pick(snapshot.header?.chiefComplaint, h.chiefComplaint),
      }));
      setSubjective((prev) => ({
        chiefComplaint: pick(subj.chiefComplaint, prev.chiefComplaint),
        hpi: pick(subj.hpi, prev.hpi),
        ros: pick(subj.ros, prev.ros),
        currentMeds: pick(subj.currentMeds, prev.currentMeds),
        pmh: pick(subj.pmh, prev.pmh),
        pastSurgical: pick(subj.pastSurgical, prev.pastSurgical),
        socialHx: pick(subj.socialHx, prev.socialHx),
        familyHx: pick(subj.familyHx, prev.familyHx),
      }));
      if (force || (snapshot.allergies || []).length) {
        setAllergies(snapshot.allergies || []);
      }
      if (force || (snapshot.vitalsList || []).length) {
        setVitalsList(snapshot.vitalsList || []);
      }
      if (force || (snapshot.diagnoses || []).some((d) => d.code || d.description)) {
        setDiagnoses(
          (snapshot.diagnoses || []).some((d) => d.code || d.description)
            ? snapshot.diagnoses
            : [{ code: '', description: '' }],
        );
      }
      if (force || snapshot.planText) {
        setPlanText((prev) => pick(snapshot.planText, prev));
      }
      if (force || snapshot.physicalExam) {
        setPhysicalExam((prev) => pick(snapshot.physicalExam, prev));
      }
      if (force || snapshot.referrals) {
        setReferrals((prev) => pick(snapshot.referrals, prev));
      }
      setPrefillMeta(snapshot.sourceMeta || { hasIntake: false, sectionsPresent: [] });
      prefillAppliedRef.current = true;
    },
    [],
  );

  const loadPrefill = useCallback(
    async ({ force = false } = {}) => {
      if (!patientId) return;
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        const snapshot = await fetchSoapEncounterPrefill({
          patientId,
          appointmentId,
          isSampleChart,
        });
        // Attach appointment/encounter context for chief complaint fallback
        if (appointment || encounter) {
          const withCtx = {
            ...snapshot,
            header: {
              ...snapshot.header,
              chiefComplaint:
                snapshot.header?.chiefComplaint ||
                encounter?.reason ||
                appointment?.visitReason ||
                '',
            },
            subjective: {
              ...snapshot.subjective,
              chiefComplaint:
                snapshot.subjective?.chiefComplaint ||
                encounter?.reason ||
                appointment?.visitReason ||
                '',
            },
          };
          if (force) userEditedRef.current = false;
          applyPrefill(withCtx, { force });
        } else {
          if (force) userEditedRef.current = false;
          applyPrefill(snapshot, { force });
        }
      } catch (err) {
        setPrefillError(err.message || 'Failed to load encounter data for notes');
      } finally {
        setPrefillLoading(false);
      }
    },
    [patientId, appointmentId, isSampleChart, appointment, encounter, applyPrefill],
  );

  useEffect(() => {
    prefillAppliedRef.current = false;
    userEditedRef.current = false;
    loadPrefill({ force: true });
  }, [patientId, appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTemplateDialog = () => {
    setCustomTemplates(loadCustomTemplates());
    setTemplateDialogOpen(true);
  };

  useEffect(() => {
    const dirty =
      Boolean(
        subjective.hpi ||
          subjective.chiefComplaint ||
          physicalExam ||
          planText ||
          diagnosticTestingResults,
      );
    onDirtyChange?.(dirty);
  }, [subjective, physicalExam, planText, diagnosticTestingResults, onDirtyChange]);

  const buildCurrentContentSnapshot = useCallback(
    () => ({
      headerChiefComplaint: header.chiefComplaint,
      subjective: { ...subjective },
      physicalExam,
      diagnosticTestingResults,
      diagnoses: diagnoses.map((d) => ({ ...d })),
      differential,
      clinicalImpression,
      planText,
      medications: medications.map((m) => ({ ...m })),
      followUp,
      patientEducation,
      referrals,
    }),
    [
      header.chiefComplaint,
      subjective,
      physicalExam,
      diagnosticTestingResults,
      diagnoses,
      differential,
      clinicalImpression,
      planText,
      medications,
      followUp,
      patientEducation,
      referrals,
    ],
  );

  const templateSetters = useMemo(
    () => ({
      setHeader,
      setSubjective,
      setPhysicalExam,
      setDiagnosticTestingResults,
      setDiagnoses,
      setDifferential,
      setClinicalImpression,
      setPlanText,
      setMedications,
      setFollowUp,
      setPatientEducation,
      setReferrals,
    }),
    [],
  );

  const handleApplyTemplate = (template) => {
    applySoapTemplateContent(template.content, templateSetters);
    setTemplateDialogOpen(false);
  };

  const handleSaveCustomTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    const entry = {
      id: `custom-${Date.now()}`,
      name,
      description: newTemplateDescription.trim() || 'User-saved template',
      category: 'My templates',
      content: buildCurrentContentSnapshot(),
    };
    const next = [entry, ...customTemplates];
    setCustomTemplates(next);
    saveCustomTemplates(next);
    setSaveTemplateOpen(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
  };

  const handleDeleteCustomTemplate = (id) => {
    const next = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(next);
    saveCustomTemplates(next);
  };

  const markEdited = () => {
    userEditedRef.current = true;
  };

  const updateHeader = (field, value) => {
    markEdited();
    setHeader((p) => ({ ...p, [field]: value }));
  };
  const updateSubjective = (field, value) => {
    markEdited();
    setSubjective((p) => ({ ...p, [field]: value }));
  };

  const handleAllergySave = () => {
    markEdited();
    const timestamp = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    setAllergies((prev) => [...prev, { ...allergyForm, id: Date.now(), timestamp }]);
    setAllergyForm(defaultAllergyForm());
    setShowAllergyDialog(false);
  };

  const handleAddVitals = (vitals) => {
    markEdited();
    setVitalsList((prev) => [...prev, vitals]);
  };

  const addDiagnosis = () => setDiagnoses((p) => [...p, { code: '', description: '' }]);
  const removeDiagnosis = (i) => setDiagnoses((p) => p.filter((_, idx) => idx !== i));
  const updateDiagnosis = (i, field, value) =>
    setDiagnoses((p) => p.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));

  const addMedication = () =>
    setMedications((p) => [...p, { name: '', dose: '', frequency: '', duration: '' }]);
  const removeMedication = (i) => setMedications((p) => p.filter((_, idx) => idx !== i));
  const updateMedication = (i, field, value) =>
    setMedications((p) => p.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const buildSoapSummary = () => {
    const cc = subjective.chiefComplaint || header.chiefComplaint || '';
    const hpi = subjective.hpi || '';
    const text = [cc, hpi].filter(Boolean).join(' — ');
    return text.length > 80 ? `${text.slice(0, 80)}…` : text || 'SOAP note';
  };

  const persistSoapNote = (status) => {
    if (status === 'locked' && !confirmComplete) return;
    const note = {
      id: editingNoteId || `soap-${Date.now()}`,
      date: headerDisplay.dateOfService,
      provider: headerDisplay.provider || '—',
      status,
      summary: buildSoapSummary(),
      content: {
        ...buildCurrentContentSnapshot(),
        headerChiefComplaint: headerDisplay.chiefComplaint,
      },
      allergies,
      vitalsList,
      addendums: soapNotes.find((n) => n.id === editingNoteId)?.addendums || [],
      updatedAt: new Date().toISOString(),
    };
    const next = upsertNote(patientId, appointmentId, 'soap', note);
    setSoapNotes(next);
    setConfirmComplete(false);
    onDirtyChange?.(false);

    if (status === 'locked') {
      setLockedNote(note);
      setEditingNoteId(null);
    } else {
      setEditingNoteId(note.id);
      setLockedNote(null);
    }

    // Draft → With Provider; signed & locked → Provider Out
    void syncStatusForNotePersist(appointmentId, status, appointment?.status).then((updated) => {
      if (updated) refreshChart?.();
    });
  };

  const handleSaveDraft = () => persistSoapNote('draft');
  const handleSignAndLock = () => persistSoapNote('locked');

  const handleSaveAddendum = () => {
    if (!addendumNoteId || !addendumText.trim()) return;
    const target = soapNotes.find((n) => n.id === addendumNoteId) || lockedNote;
    if (!target) return;
    const updated = {
      ...target,
      addendums: [
        ...(target.addendums || []),
        {
          id: Date.now(),
          text: addendumText,
          addedBy: header.provider || target.provider,
          dateTime: new Date().toISOString(),
        },
      ],
    };
    const next = upsertNote(patientId, appointmentId, 'soap', updated);
    setSoapNotes(next);
    setLockedNote(updated);
    setAddendumNoteId(null);
    setAddendumText('');
  };

  const openLockedSoapNote = (note) => {
    const latest = soapNotes.find((n) => n.id === note.id) || note;
    setLockedNote(latest);
    setEditingNoteId(null);
    setConfirmComplete(false);
    setAddendumNoteId(null);
    setAddendumText('');
    onDirtyChange?.(false);
  };

  const handleEditSoapNote = (note) => {
    if (note.status === 'locked') {
      openLockedSoapNote(note);
      return;
    }
    setLockedNote(null);
    setAddendumNoteId(null);
    setConfirmComplete(false);
    setEditingNoteId(note.id);
    const c = note.content || {};
    if (c.headerChiefComplaint != null) {
      setHeader((h) => ({ ...h, chiefComplaint: c.headerChiefComplaint }));
    }
    if (c.subjective) setSubjective((prev) => ({ ...prev, ...c.subjective }));
    if (c.physicalExam != null) setPhysicalExam(c.physicalExam);
    if (c.diagnosticTestingResults != null) setDiagnosticTestingResults(c.diagnosticTestingResults);
    if (c.diagnoses) setDiagnoses(c.diagnoses);
    if (c.differential != null) setDifferential(c.differential);
    if (c.clinicalImpression != null) setClinicalImpression(c.clinicalImpression);
    if (c.planText != null) setPlanText(c.planText);
    if (c.medications) setMedications(c.medications);
    if (c.followUp != null) setFollowUp(c.followUp);
    if (c.patientEducation != null) setPatientEducation(c.patientEducation);
    if (c.referrals != null) setReferrals(c.referrals);
    if (note.allergies) setAllergies(note.allergies);
    if (note.vitalsList) setVitalsList(note.vitalsList);
    userEditedRef.current = true;
  };

  const closeLockedSoapNote = () => {
    setLockedNote(null);
    setAddendumNoteId(null);
    setAddendumText('');
    setConfirmComplete(false);
  };

  const formatVitalsSummary = (v) => {
    const parts = [];
    if (v.bpSys || v.bpDia) parts.push(`BP ${v.bpSys || '–'}/${v.bpDia || '–'}`);
    if (v.pulse) parts.push(`Pulse ${v.pulse}`);
    if (v.temperature) parts.push(`Temp ${v.temperature}°F`);
    if (v.o2) parts.push(`SpO2 ${v.o2}%`);
    return parts.length ? parts.join(', ') : '—';
  };

  const soapActions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => loadPrefill({ force: true })}
        disabled={prefillLoading}
      >
        {prefillLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Refresh from intake
      </Button>
      <Button type="button" variant="default" className="gap-2" onClick={openTemplateDialog}>
        <LayoutTemplate className="h-4 w-4" />
        SOAP templates
      </Button>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setSaveTemplateOpen(true)}>
        <BookmarkPlus className="h-4 w-4" />
        Save as template
      </Button>
    </>
  );

  const content = (
    <div className="space-y-6">
      {embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">SOAP Notes</h3>
            <p className="text-sm text-muted-foreground">
              Prefills from Intake and encounter data. Edit as needed, then save or sign.
            </p>
          </div>
          {!lockedNote && <div className="flex shrink-0 flex-wrap gap-2">{soapActions}</div>}
        </div>
      )}

      {!lockedNote && (prefillLoading || prefillMeta.sectionsPresent?.length > 0 || prefillError) && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          {prefillLoading ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading encounter data into SOAP fields…
            </p>
          ) : prefillError ? (
            <p className="text-destructive">{prefillError}</p>
          ) : prefillMeta.sectionsPresent?.length ? (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Pulled from encounter: </span>
              {prefillMeta.sectionsPresent.join(', ')}
            </p>
          ) : (
            <p className="text-muted-foreground">
              No intake or encounter clinical data found yet. Complete Intake (and Problems / Referrals) to prefill
              these fields, or enter them manually.
            </p>
          )}
        </div>
      )}

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="!m-0 flex flex-col gap-0 rounded-t-lg border-b border-white/20 bg-primary px-8 py-7 text-left sm:text-left">
            <DialogTitle className="text-xl font-semibold leading-snug tracking-tight text-white">
              SOAP note templates
            </DialogTitle>
            <DialogDescription asChild>
              <div className="mt-4 max-w-none space-y-3 text-[15px] font-normal leading-relaxed text-white/95">
                <p className="m-0 text-white">
                  Apply a template to fill Subjective, Objective, Assessment, and Plan fields.
                </p>
                <p className="m-0 text-white/95">
                  Patient metadata, allergies, and vitals you already entered are not removed—review and edit after
                  applying.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="library" className="flex min-h-0 flex-1 flex-col px-6 pb-4">
            <TabsList className="mt-2 grid w-full grid-cols-2">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="mine">My templates</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-4 max-h-[50vh] overflow-y-auto space-y-3 pr-1">
              {BUILTIN_SOAP_TEMPLATES.map((t) => (
                <Card key={t.id} className="border-border/80">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{t.name}</p>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {t.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                    <Button type="button" size="sm" className="shrink-0" onClick={() => handleApplyTemplate(t)}>
                      Apply
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="mine" className="mt-4 max-h-[50vh] overflow-y-auto space-y-3 pr-1">
              {customTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No saved templates yet. Use &quot;Save as template&quot; on the SOAP page to store your current
                  note structure.
                </p>
              ) : (
                customTemplates.map((t) => (
                  <Card key={t.id} className="border-border/80">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-foreground">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.description}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => handleDeleteCustomTemplate(t.id)}>
                          Delete
                        </Button>
                        <Button type="button" size="sm" onClick={() => handleApplyTemplate(t)}>
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="!m-0 flex flex-col gap-0 rounded-t-lg border-b border-white/20 bg-primary px-8 py-7 text-left sm:text-left">
            <DialogTitle className="text-xl font-semibold leading-snug tracking-tight text-white">
              Save current note as template
            </DialogTitle>
            <DialogDescription className="mt-4 max-w-none text-[15px] font-normal leading-relaxed text-white/95">
              Stores today&apos;s Subjective, Objective, Assessment, Plan text (and chief complaint) so you can reuse
              it later from My templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 bg-background px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input
                id="tpl-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., My clinic — diabetes follow-up"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description (optional)</Label>
              <Input
                id="tpl-desc"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Short reminder of when to use this"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border/80 bg-muted/25 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveCustomTemplate} disabled={!newTemplateName.trim()}>
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotesListingCard
        title="Saved SOAP Notes"
        notes={soapNotes}
        emptyMessage="No SOAP notes yet. Complete the form below and save as draft or sign & lock."
        onEdit={handleEditSoapNote}
        onAddendum={openLockedSoapNote}
      />

      {lockedNote ? (
        <>
          <SoapNoteReadOnlyView note={lockedNote} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setAddendumNoteId(lockedNote.id)}>
              Add addendum
            </Button>
            <Button type="button" variant="ghost" onClick={closeLockedSoapNote}>
              Close signed note
            </Button>
          </div>
          {addendumNoteId && (
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
                <div className="space-y-2">
                  <Label>Addendum text</Label>
                  <Textarea
                    value={addendumText}
                    onChange={(e) => setAddendumText(e.target.value)}
                    placeholder="Enter addendum..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSaveAddendum} disabled={!addendumText.trim()}>
                  Save addendum
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
      {/* Note metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Note metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input value={headerDisplay.patientName} onChange={(e) => updateHeader('patientName', e.target.value)} placeholder="Patient name or ID" />
          </div>
          <div className="space-y-2">
            <Label>Visit / Encounter ID</Label>
            <Input value={headerDisplay.encounterId} onChange={(e) => updateHeader('encounterId', e.target.value)} placeholder="Encounter ID" />
          </div>
          <div className="space-y-2">
            <Label>Date of service</Label>
            <Input type="date" value={headerDisplay.dateOfService} onChange={(e) => updateHeader('dateOfService', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Chief complaint</Label>
            <Input value={headerDisplay.chiefComplaint} onChange={(e) => updateHeader('chiefComplaint', e.target.value)} placeholder="Reason for visit" />
          </div>
          <div className="space-y-2">
            <Label>Author / Provider</Label>
            <Input value={headerDisplay.provider} onChange={(e) => updateHeader('provider', e.target.value)} placeholder="Provider name" />
          </div>
          <div className="space-y-2">
            <Label>Location / Clinic</Label>
            <Input value={headerDisplay.location} onChange={(e) => updateHeader('location', e.target.value)} placeholder="Clinic or site" />
          </div>
        </CardContent>
      </Card>

      {/* S – Subjective */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">S – Subjective</CardTitle>
          <p className="text-muted-foreground text-sm">Patient&apos;s story and history relevant to this visit.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chief complaint (CC)</Label>
            <Input value={subjective.chiefComplaint} onChange={(e) => updateSubjective('chiefComplaint', e.target.value)} placeholder="Can repeat or add detail to header CC" />
          </div>
          <div className="space-y-2">
            <Label>History of present illness (HPI)</Label>
            <Textarea value={subjective.hpi} onChange={(e) => updateSubjective('hpi', e.target.value)} placeholder="Onset, duration, severity, what makes it better/worse, associated symptoms" rows={4} className="min-h-24" />
          </div>
          <div className="space-y-2">
            <Label>Review of systems (ROS)</Label>
            <Textarea value={subjective.ros} onChange={(e) => updateSubjective('ros', e.target.value)} placeholder="Pertinent positives/negatives by system" rows={2} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Allergies</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAllergyDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add allergy
              </Button>
            </div>
            {allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No allergies recorded. Click &quot;Add allergy&quot; to add.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allergen</TableHead>
                    <TableHead>Reaction</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Onset</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allergies.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.allergen || '—'}</TableCell>
                      <TableCell>{item.reaction || '—'}</TableCell>
                      <TableCell>{item.severity || '—'}</TableCell>
                      <TableCell>{item.onset || '—'}</TableCell>
                      <TableCell>{item.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <AddAllergyDialog open={showAllergyDialog} onOpenChange={setShowAllergyDialog} form={allergyForm} onFormChange={setAllergyForm} onSave={handleAllergySave} />
          </div>
          <div className="space-y-2">
            <Label>Current medications</Label>
            <Textarea value={subjective.currentMeds} onChange={(e) => updateSubjective('currentMeds', e.target.value)} placeholder="From chart or note if changed this visit" rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Past medical history</Label>
              <Textarea value={subjective.pmh} onChange={(e) => updateSubjective('pmh', e.target.value)} placeholder="Relevant chronic conditions" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Past surgical</Label>
              <Textarea value={subjective.pastSurgical} onChange={(e) => updateSubjective('pastSurgical', e.target.value)} placeholder="Past surgical history" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Social history</Label>
              <Textarea value={subjective.socialHx} onChange={(e) => updateSubjective('socialHx', e.target.value)} placeholder="Social history" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Family history</Label>
              <Textarea value={subjective.familyHx} onChange={(e) => updateSubjective('familyHx', e.target.value)} placeholder="Family history" rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <ScreeningScoresPanel
        patientId={patientId}
        encounterId={appointmentId}
        isSampleChart={isSampleChart}
      />

      {/* O – Objective */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O – Objective</CardTitle>
          <p className="text-muted-foreground text-sm">Measurable and observable findings.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Vital signs</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowVitalsDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add vitals
              </Button>
            </div>
            {vitalsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vitals recorded. Click &quot;Add vitals&quot; to add.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recorded</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitalsList.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.recordedAt ? new Date(v.recordedAt).toLocaleString() : '—'}</TableCell>
                      <TableCell>{formatVitalsSummary(v)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <AddVitalsDialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog} onSave={handleAddVitals} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Physical exam</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowPhysicalExamPicker(true)}
              >
                <Stethoscope className="h-4 w-4" />
                Physical exam picker
              </Button>
            </div>
            <Textarea
              value={physicalExam}
              onChange={(e) => {
                markEdited();
                setPhysicalExam(e.target.value);
              }}
              placeholder="By system: general, HEENT, cardiovascular, lungs, abdomen, extremities, neuro, skin, etc. Or use the picker."
              rows={5}
              className="min-h-28"
            />
            <PhysicalExamPickerDialog
              open={showPhysicalExamPicker}
              onOpenChange={setShowPhysicalExamPicker}
              value={physicalExam}
              onApply={(narrative) => {
                markEdited();
                setPhysicalExam(narrative);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Diagnostic testing results</Label>
            <Textarea
              value={diagnosticTestingResults}
              onChange={(e) => {
                markEdited();
                setDiagnosticTestingResults(e.target.value);
              }}
              placeholder="Values or links relevant to this visit"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* A – Assessment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">A – Assessment</CardTitle>
          <p className="text-muted-foreground text-sm">Clinical conclusion for this encounter.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Diagnosis(es) / Problem list</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDiagnosis}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {diagnoses.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input className="w-32" placeholder="Code" value={d.code} onChange={(e) => updateDiagnosis(i, 'code', e.target.value)} />
                <Input className="flex-1" placeholder="Short description" value={d.description} onChange={(e) => updateDiagnosis(i, 'description', e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeDiagnosis(i)} disabled={diagnoses.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Differential</Label>
            <Textarea
              value={differential}
              onChange={(e) => {
                markEdited();
                setDifferential(e.target.value);
              }}
              placeholder="When not yet definitive"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Clinical impression</Label>
            <Textarea
              value={clinicalImpression}
              onChange={(e) => {
                markEdited();
                setClinicalImpression(e.target.value);
              }}
              placeholder="Brief summary of reasoning"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* P – Plan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">P – Plan</CardTitle>
          <p className="text-muted-foreground text-sm">What you will do for each problem and for the patient overall.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Plan (per diagnosis or free text)</Label>
            <Textarea
              value={planText}
              onChange={(e) => {
                markEdited();
                setPlanText(e.target.value);
              }}
              placeholder="For each problem: meds, procedures, referrals, etc."
              rows={4}
              className="min-h-24"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Medications (as needed)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {medications.map((m, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                <Input placeholder="Medication" value={m.name} onChange={(e) => updateMedication(i, 'name', e.target.value)} />
                <Input placeholder="Dose" value={m.dose} onChange={(e) => updateMedication(i, 'dose', e.target.value)} />
                <Input placeholder="Frequency" value={m.frequency} onChange={(e) => updateMedication(i, 'frequency', e.target.value)} />
                <div className="flex gap-1">
                  <Input placeholder="Duration" value={m.duration} onChange={(e) => updateMedication(i, 'duration', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeMedication(i)} disabled={medications.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Follow-up</Label>
            <Input
              value={followUp}
              onChange={(e) => {
                markEdited();
                setFollowUp(e.target.value);
              }}
              placeholder="When to return, what to watch for"
            />
          </div>
          <div className="space-y-2">
            <Label>Patient education</Label>
            <Textarea
              value={patientEducation}
              onChange={(e) => {
                markEdited();
                setPatientEducation(e.target.value);
              }}
              placeholder="Topics discussed"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Referrals</Label>
            <Textarea
              value={referrals}
              onChange={(e) => {
                markEdited();
                setReferrals(e.target.value);
              }}
              placeholder="To whom and why"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <NoteSignActions
        confirmChecked={confirmComplete}
        onConfirmChange={setConfirmComplete}
        onSaveDraft={handleSaveDraft}
        onSignAndLock={handleSignAndLock}
        onCancelEdit={() => {
          setEditingNoteId(null);
          setConfirmComplete(false);
        }}
        draftLabel={editingNoteId ? 'Update draft' : 'Save as draft'}
        showCancelEdit={!!editingNoteId}
      />
        </>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <ChartTabShell
      title="SOAP Notes"
      description="Document this encounter in SOAP format. Fields prefill from Intake and other encounter data when available."
      actions={lockedNote ? null : soapActions}
    >
      {content}
    </ChartTabShell>
  );
}
