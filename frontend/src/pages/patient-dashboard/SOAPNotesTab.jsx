import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePatientChart } from './PatientChartContext';
import { ScreeningScoresSection } from './ScreeningScoresSection';
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
import { Plus, Trash2, Edit, FileText, LayoutTemplate, BookmarkPlus } from 'lucide-react';
import {
  BUILTIN_SOAP_TEMPLATES,
  loadCustomTemplates,
  saveCustomTemplates,
  applySoapTemplateContent,
  emptyMedicationRow,
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

export function SOAPNotesTab({ onDirtyChange }) {
  const { patient, encounter, appointment } = usePatientChart();

  const [header, setHeader] = useState({
    patientName: '',
    encounterId: '',
    dateOfService: new Date().toISOString().slice(0, 10),
    chiefComplaint: '',
    provider: '',
    location: '',
  });

  useEffect(() => {
    if (!patient) return;
    setHeader((h) => ({
      ...h,
      patientName: formatPatientName(patient),
      encounterId: appointment?.id?.slice(0, 8).toUpperCase() || encounter?.id?.slice(0, 8) || '—',
      chiefComplaint: encounter?.reason || appointment?.visitReason || h.chiefComplaint,
      provider: encounter?.visitProvider || appointment?.provider || '—',
      location: encounter?.location || appointment?.department || '—',
      dateOfService: encounter?.appointmentDate || h.dateOfService,
    }));
  }, [patient, encounter, appointment]);

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
  const [diagnosticTestingResults, setDiagnosticTestingResults] = useState('');

  const [diagnoses, setDiagnoses] = useState([{ code: '', description: '' }]);
  const [differential, setDifferential] = useState('');
  const [clinicalImpression, setClinicalImpression] = useState('');

  const [planText, setPlanText] = useState('');
  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', duration: '' }]);
  const [followUp, setFollowUp] = useState('');
  const [patientEducation, setPatientEducation] = useState('');
  const [referrals, setReferrals] = useState('');

  const [soapNotes, setSoapNotes] = useState([
    { id: 1, date: '2025-01-20', provider: 'Dr. Sarah Smith', status: 'locked' },
    { id: 2, date: '2025-01-15', provider: 'Dr. John Williams', status: 'draft' },
  ]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [addendumNoteId, setAddendumNoteId] = useState(null);
  const [addendumText, setAddendumText] = useState('');

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

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

  const updateHeader = (field, value) => setHeader((p) => ({ ...p, [field]: value }));
  const updateSubjective = (field, value) => setSubjective((p) => ({ ...p, [field]: value }));

  const handleAllergySave = () => {
    const timestamp = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    setAllergies((prev) => [...prev, { ...allergyForm, id: Date.now(), timestamp }]);
    setAllergyForm(defaultAllergyForm());
    setShowAllergyDialog(false);
  };

  const handleAddVitals = (vitals) => {
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

  const handleSaveDraft = () => {
    const newNote = {
      id: Date.now(),
      date: header.dateOfService,
      provider: header.provider,
      status: 'draft',
    };
    setSoapNotes((prev) => [newNote, ...prev]);
    setEditingNoteId(newNote.id);
    onDirtyChange?.(false);
  };

  const handleSignAndLock = () => {
    const newNote = {
      id: Date.now(),
      date: header.dateOfService,
      provider: header.provider,
      status: 'locked',
    };
    setSoapNotes((prev) => [newNote, ...prev]);
    onDirtyChange?.(false);
  };

  const handleSaveAddendum = () => {
    if (!addendumNoteId || !addendumText.trim()) return;
    setSoapNotes((prev) =>
      prev.map((n) =>
        n.id === addendumNoteId
          ? { ...n, addendums: [...(n.addendums || []), { id: Date.now(), text: addendumText, addedBy: header.provider, dateTime: new Date().toISOString() }] }
          : n
      )
    );
    setAddendumNoteId(null);
    setAddendumText('');
  };

  const formatVitalsSummary = (v) => {
    const parts = [];
    if (v.bpSys || v.bpDia) parts.push(`BP ${v.bpSys || '–'}/${v.bpDia || '–'}`);
    if (v.pulse) parts.push(`Pulse ${v.pulse}`);
    if (v.temperature) parts.push(`Temp ${v.temperature}°F`);
    if (v.o2) parts.push(`SpO2 ${v.o2}%`);
    return parts.length ? parts.join(', ') : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SOAP Note</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Document this encounter in SOAP format. Use templates to load common structures, then edit
            for this patient.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="default" className="gap-2" onClick={openTemplateDialog}>
            <LayoutTemplate className="h-4 w-4" />
            SOAP templates
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setSaveTemplateOpen(true)}>
            <BookmarkPlus className="h-4 w-4" />
            Save as template
          </Button>
        </div>
      </div>

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

      {/* SOAP Notes listing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SOAP Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soapNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No SOAP notes yet. Complete the form below and save as draft or sign & lock.
                  </TableCell>
                </TableRow>
              ) : (
                soapNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{note.date}</TableCell>
                    <TableCell>{note.provider}</TableCell>
                    <TableCell>
                      <span className={note.status === 'locked' ? 'text-green-600' : 'text-amber-600'}>
                        {note.status === 'locked' ? 'Locked' : 'Draft'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {note.status === 'draft' ? (
                        <Button variant="ghost" size="sm" onClick={() => setEditingNoteId(note.id)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setAddendumNoteId(note.id)}>
                          <FileText className="h-4 w-4 mr-1" />
                          Add addendum
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Addendum modal */}
      {addendumNoteId && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Add addendum</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setAddendumNoteId(null); setAddendumText(''); }}>Cancel</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Addendum text</Label>
              <Textarea value={addendumText} onChange={(e) => setAddendumText(e.target.value)} placeholder="Enter addendum..." rows={4} />
            </div>
            <Button onClick={handleSaveAddendum}>Save addendum</Button>
          </CardContent>
        </Card>
      )}

      {/* Note metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Note metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input value={header.patientName} onChange={(e) => updateHeader('patientName', e.target.value)} placeholder="Patient name or ID" />
          </div>
          <div className="space-y-2">
            <Label>Visit / Encounter ID</Label>
            <Input value={header.encounterId} onChange={(e) => updateHeader('encounterId', e.target.value)} placeholder="Encounter ID" />
          </div>
          <div className="space-y-2">
            <Label>Date of service</Label>
            <Input type="date" value={header.dateOfService} onChange={(e) => updateHeader('dateOfService', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Chief complaint</Label>
            <Input value={header.chiefComplaint} onChange={(e) => updateHeader('chiefComplaint', e.target.value)} placeholder="Reason for visit" />
          </div>
          <div className="space-y-2">
            <Label>Author / Provider</Label>
            <Input value={header.provider} onChange={(e) => updateHeader('provider', e.target.value)} placeholder="Provider name" />
          </div>
          <div className="space-y-2">
            <Label>Location / Clinic</Label>
            <Input value={header.location} onChange={(e) => updateHeader('location', e.target.value)} placeholder="Clinic or site" />
          </div>
        </CardContent>
      </Card>

      <ScreeningScoresSection />

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
            <Label>Physical exam</Label>
            <Textarea value={physicalExam} onChange={(e) => setPhysicalExam(e.target.value)} placeholder="By system: general, HEENT, cardiovascular, lungs, abdomen, extremities, neuro, skin, etc." rows={5} className="min-h-28" />
          </div>
          <div className="space-y-2">
            <Label>Diagnostic testing results</Label>
            <Textarea value={diagnosticTestingResults} onChange={(e) => setDiagnosticTestingResults(e.target.value)} placeholder="Values or links relevant to this visit" rows={2} />
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
            <Textarea value={differential} onChange={(e) => setDifferential(e.target.value)} placeholder="When not yet definitive" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Clinical impression</Label>
            <Textarea value={clinicalImpression} onChange={(e) => setClinicalImpression(e.target.value)} placeholder="Brief summary of reasoning" rows={2} />
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
            <Textarea value={planText} onChange={(e) => setPlanText(e.target.value)} placeholder="For each problem: meds, procedures, referrals, etc." rows={4} className="min-h-24" />
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
            <Input value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="When to return, what to watch for" />
          </div>
          <div className="space-y-2">
            <Label>Patient education</Label>
            <Textarea value={patientEducation} onChange={(e) => setPatientEducation(e.target.value)} placeholder="Topics discussed" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Referrals</Label>
            <Textarea value={referrals} onChange={(e) => setReferrals(e.target.value)} placeholder="To whom and why" rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSaveDraft}>Save as draft</Button>
        <Button variant="outline" onClick={handleSignAndLock}>Sign & lock note</Button>
      </div>
    </div>
  );
}
