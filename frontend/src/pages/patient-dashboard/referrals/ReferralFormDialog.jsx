import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Paperclip, Plus, Search, Trash2, X } from 'lucide-react';
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { providerApi } from '@/services/api/provider.api';
import { referralApi } from '@/services/api/referral.api';
import {
  ACCEPTED_DOCUMENT_INPUT,
  formatFileSize,
  readFileAsDataUrl,
  validateDocumentFile,
} from '@/lib/fileUpload';
import { loadNotes } from '../notes/notesStorage';
import {
  ATTACHMENT_TYPES,
  AUTH_STATUS_OPTIONS,
  DESTINATION_TYPES,
  REFERRAL_PRIORITIES,
  SPECIALTY_OPTIONS,
} from './referralConstants';

const emptyDiagnosis = () => ({
  icd10Code: '',
  description: '',
  isPrimary: false,
  isSecondary: false,
});

function pickFilled(defaults = {}, overrides = {}) {
  const next = { ...defaults };
  Object.entries(overrides || {}).forEach(([key, value]) => {
    if (value == null) return;
    if (typeof value === 'string' && !value.trim()) return;
    next[key] = value;
  });
  return next;
}

/** Latest SOAP note for this encounter → HPI + Assessment. */
function getSoapClinicalPrefill(patientId, appointmentId) {
  const notes = loadNotes(patientId, appointmentId, 'soap');
  if (!notes.length) return {};
  const note = notes.find((n) => n.status === 'locked') || notes[0];
  const content = note?.content || {};
  const subjective = content.subjective || {};

  const assessmentParts = [];
  if (content.clinicalImpression) assessmentParts.push(content.clinicalImpression);
  const dxLines = (content.diagnoses || [])
    .filter((d) => d.code || d.description)
    .map((d) => [d.code, d.description].filter(Boolean).join(' — '));
  if (dxLines.length) assessmentParts.push(`Diagnoses: ${dxLines.join('; ')}`);
  if (content.differential) assessmentParts.push(`Differential: ${content.differential}`);

  return {
    historyOfPresentIllness: subjective.hpi || '',
    assessment: assessmentParts.join('\n\n'),
  };
}

function buildEmptyForm(appointmentId) {
  return {
    appointmentId: appointmentId || '',
    referralType: '',
    specialty: '',
    priority: 'Routine',
    referralDate: new Date().toISOString().slice(0, 10),
    expirationDate: '',
    referralReason: '',
    destinationType: 'external',
    autoPopulateFromEncounter: true,
    referringProvider: {
      providerName: '',
      npi: '',
      department: '',
      clinicLocation: '',
      contactInformation: '',
    },
    referredTo: {
      providerId: '',
      providerName: '',
      specialty: '',
      organization: '',
      npi: '',
      phone: '',
      fax: '',
      email: '',
      address: '',
      facilityName: '',
      facilityType: '',
      contactPerson: '',
    },
    diagnoses: [emptyDiagnosis()],
    clinicalInformation: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      assessment: '',
      treatmentHistory: '',
      currentMedications: '',
      allergies: '',
      activeProblems: '',
      notes: '',
    },
    attachments: [],
    insurance: {
      primaryInsurance: '',
      secondaryInsurance: '',
      payer: '',
      memberId: '',
      groupNumber: '',
      authorizationRequired: false,
      authorizationNumber: '',
      authorizationStatus: 'Not Required',
      submissionDate: '',
      approvalDate: '',
      authorizationExpirationDate: '',
    },
    referralLetter: { body: '', isEdited: false },
  };
}

export function ReferralFormDialog({
  open,
  onOpenChange,
  record,
  patientId,
  appointmentId,
  referralTypes = [],
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(buildEmptyForm(appointmentId));
  const [errors, setErrors] = useState({});
  const [icdSearch, setIcdSearch] = useState('');
  const [icdResults, setIcdResults] = useState([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [activeDiagnosisIndex, setActiveDiagnosisIndex] = useState(0);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerResults, setProviderResults] = useState([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [encounterMeta, setEncounterMeta] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');
  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  const isEdit = Boolean(record?.id);
  const typeOptions = referralTypes.length
    ? referralTypes.map((t) => (typeof t === 'string' ? t : t.name))
    : SPECIALTY_OPTIONS;

  const loadEncounterDefaults = useCallback(async () => {
    if (!patientId || !appointmentId) return;
    setLoadingDefaults(true);
    try {
      const res = await referralApi.getEncounterDefaults(patientId, appointmentId);
      const data = res.data || {};
      const soapClinical = getSoapClinicalPrefill(patientId, appointmentId);
      setEncounterMeta(data.appointment || null);
      setFormData((prev) => ({
        ...prev,
        appointmentId,
        referringProvider: pickFilled(prev.referringProvider, data.referringProvider || {}),
        clinicalInformation: pickFilled(
          pickFilled(prev.clinicalInformation, data.clinicalInformation || {}),
          // SOAP overrides intake for HPI / Assessment (and CC if present on SOAP)
          soapClinical,
        ),
        insurance: pickFilled(prev.insurance, data.insurance || {}),
      }));
    } catch {
      const soapClinical = getSoapClinicalPrefill(patientId, appointmentId);
      if (Object.keys(soapClinical).length) {
        setFormData((prev) => ({
          ...prev,
          appointmentId,
          clinicalInformation: pickFilled(prev.clinicalInformation, soapClinical),
        }));
      }
    } finally {
      setLoadingDefaults(false);
    }
  }, [patientId, appointmentId]);

  useEffect(() => {
    if (!open) return;

    if (record) {
      setEncounterMeta(
        record.appointment
          ? {
              id: record.appointment.id || record.appointmentId,
              encounterNumber: record.appointment.encounterNumber || null,
              visitReason: record.appointment.visitReason || null,
            }
          : { id: record.appointmentId || appointmentId },
      );
      setFormData({
        ...buildEmptyForm(record.appointmentId || appointmentId),
        ...record,
        appointmentId: record.appointmentId || appointmentId || '',
        referringProvider: record.referringProvider || buildEmptyForm().referringProvider,
        referredTo: record.referredTo || buildEmptyForm().referredTo,
        clinicalInformation: record.clinicalInformation || buildEmptyForm().clinicalInformation,
        insurance: record.insurance || buildEmptyForm().insurance,
        diagnoses: record.diagnoses?.length ? record.diagnoses : [emptyDiagnosis()],
        attachments: record.attachments || [],
        referralLetter: record.referralLetter || { body: '', isEdited: false },
      });
    } else {
      setFormData(buildEmptyForm(appointmentId));
      setEncounterMeta(appointmentId ? { id: appointmentId } : null);
      loadEncounterDefaults();
    }
    setErrors({});
    setAttachmentError('');
  }, [open, record, appointmentId, loadEncounterDefaults]);

  const updateField = (path, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        cursor[keys[i]] = { ...cursor[keys[i]] };
        cursor = cursor[keys[i]];
      }
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const searchIcd = (term, index) => {
    setActiveDiagnosisIndex(index);
    setIcdSearch(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term || term.length < 2) {
      setIcdResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIcdLoading(true);
      try {
        const res = await diagnosisCodeApi.getAll({ search: term, limit: 10, page: 1 });
        setIcdResults(res.data?.items || res.data || []);
      } catch {
        setIcdResults([]);
      } finally {
        setIcdLoading(false);
      }
    }, 300);
  };

  const selectIcd = (item) => {
    setFormData((prev) => {
      const diagnoses = [...prev.diagnoses];
      diagnoses[activeDiagnosisIndex] = {
        ...diagnoses[activeDiagnosisIndex],
        icd10Code: item.code,
        description: item.description,
      };
      return { ...prev, diagnoses };
    });
    setIcdResults([]);
    setIcdSearch('');
  };

  const searchProviders = (term) => {
    setProviderSearch(term);
    updateField('referredTo.providerName', term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term || term.length < 2 || formData.destinationType !== 'internal') {
      setProviderResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setProviderLoading(true);
      try {
        const res = await providerApi.getAll({ search: term, limit: 10, isActive: true });
        setProviderResults(res.data?.items || res.data || []);
      } catch {
        setProviderResults([]);
      } finally {
        setProviderLoading(false);
      }
    }, 300);
  };

  const selectProvider = (provider) => {
    const name = [provider.firstName, provider.lastName].filter(Boolean).join(' ');
    updateField('referredTo', {
      ...formData.referredTo,
      providerId: provider.id,
      providerName: name,
      npi: provider.npi || '',
      specialty: provider.specialty || formData.specialty,
      phone: provider.phone || '',
      email: provider.email || '',
    });
    setProviderResults([]);
    setProviderSearch(name);
  };

  const validate = () => {
    const next = {};
    if (!formData.referralType) next.referralType = 'Referral type is required';
    if (!formData.specialty) next.specialty = 'Specialty is required';
    if (!formData.referralReason?.trim()) next.referralReason = 'Referral reason is required';
    const hasDiagnosis = formData.diagnoses.some((d) => d.icd10Code || d.description);
    if (!hasDiagnosis) next.diagnoses = 'At least one diagnosis is required';
    if (!formData.appointmentId) next.appointmentId = 'Related encounter is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddAttachments = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setAttachmentError('');

    const nextAttachments = [];
    for (const file of files) {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        setAttachmentError(validation.message);
        continue;
      }
      try {
        const fileData = await readFileAsDataUrl(file);
        nextAttachments.push({
          attachmentType: 'Referral Letter Attachment',
          fileName: file.name,
          fileUrl: '',
          fileData,
          mimeType: file.type || '',
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        setAttachmentError(`Failed to read ${file.name}.`);
      }
    }

    if (nextAttachments.length) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...nextAttachments],
      }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ensuredAppointmentId = formData.appointmentId || appointmentId || '';
    if (!ensuredAppointmentId) {
      setErrors((prev) => ({ ...prev, appointmentId: 'Related encounter is required' }));
      return;
    }
    if (!validate()) return;
    const payload = {
      ...formData,
      appointmentId: ensuredAppointmentId,
      autoPopulateFromEncounter: true,
      diagnoses: formData.diagnoses.filter((d) => d.icd10Code || d.description),
      attachments: (formData.attachments || []).filter((a) => a.fileName || a.fileData || a.fileUrl),
    };
    if (!payload.diagnoses.some((d) => d.isPrimary) && payload.diagnoses.length) {
      payload.diagnoses[0].isPrimary = true;
    }
    onSubmit?.(payload);
  };

  const encounterLabel = encounterMeta?.encounterNumber
    || (formData.appointmentId ? `${String(formData.appointmentId).slice(0, 8).toUpperCase()}…` : '—');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-5xl overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Referral' : 'New Referral'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Accordion type="multiple" defaultValue={['basic', 'referring', 'referred', 'diagnosis', 'clinical']} className="w-full">
            <AccordionItem value="basic">
              <AccordionTrigger>Referral Information</AccordionTrigger>
              <AccordionContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Referral Type *</Label>
                  <Select value={formData.referralType} onValueChange={(v) => updateField('referralType', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.referralType && <p className="text-xs text-destructive">{errors.referralType}</p>}
                </div>
                <div>
                  <Label>Specialty *</Label>
                  <Select value={formData.specialty} onValueChange={(v) => updateField('specialty', v)}>
                    <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                    <SelectContent>
                      {SPECIALTY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.specialty && <p className="text-xs text-destructive">{errors.specialty}</p>}
                </div>
                <div>
                  <Label>Priority *</Label>
                  <Select value={formData.priority} onValueChange={(v) => updateField('priority', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REFERRAL_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Referral Date *</Label>
                  <Input type="date" value={formData.referralDate} onChange={(e) => updateField('referralDate', e.target.value)} />
                </div>
                <div>
                  <Label>Expiration Date</Label>
                  <Input type="date" value={formData.expirationDate || ''} onChange={(e) => updateField('expirationDate', e.target.value)} />
                </div>
                <div>
                  <Label>Related Encounter *</Label>
                  <Input value={encounterLabel} readOnly className="bg-muted" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Linked to this visit
                    {encounterMeta?.visitReason ? ` · ${encounterMeta.visitReason}` : ''}
                  </p>
                  {loadingDefaults && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading encounter clinical data…
                    </p>
                  )}
                  {errors.appointmentId && <p className="text-xs text-destructive">{errors.appointmentId}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label>Referral Reason *</Label>
                  <Textarea rows={3} value={formData.referralReason} onChange={(e) => updateField('referralReason', e.target.value)} />
                  {errors.referralReason && <p className="text-xs text-destructive">{errors.referralReason}</p>}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="referring">
              <AccordionTrigger>
                Referring Provider
                {loadingDefaults && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </AccordionTrigger>
              <AccordionContent className="grid gap-4 sm:grid-cols-2">
                {['providerName', 'npi', 'department', 'clinicLocation', 'contactInformation'].map((field) => (
                  <div key={field}>
                    <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      value={formData.referringProvider[field] || ''}
                      onChange={(e) => updateField(`referringProvider.${field}`, e.target.value)}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="referred">
              <AccordionTrigger>Referred To</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {DESTINATION_TYPES.map((dt) => (
                    <Button
                      key={dt.id}
                      type="button"
                      size="sm"
                      variant={formData.destinationType === dt.id ? 'default' : 'outline'}
                      onClick={() => updateField('destinationType', dt.id)}
                    >
                      {dt.label}
                    </Button>
                  ))}
                </div>

                {formData.destinationType === 'internal' && (
                  <div className="relative">
                    <Label>Search Internal Provider</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        value={providerSearch || formData.referredTo.providerName}
                        onChange={(e) => searchProviders(e.target.value)}
                        placeholder="Search by name, NPI, specialty..."
                      />
                    </div>
                    {providerLoading && <p className="text-xs text-muted-foreground">Searching…</p>}
                    {providerResults.length > 0 && (
                      <div className="mt-1 max-h-40 overflow-y-auto rounded-md border bg-popover p-1 shadow">
                        {providerResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                            onClick={() => selectProvider(p)}
                          >
                            {[p.firstName, p.lastName].filter(Boolean).join(' ')}
                            {p.npi ? ` · NPI ${p.npi}` : ''}
                            {p.specialty ? ` · ${p.specialty}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {(formData.destinationType === 'facility'
                    ? ['facilityName', 'facilityType', 'contactPerson', 'phone', 'fax', 'email', 'address']
                    : ['providerName', 'specialty', 'organization', 'npi', 'phone', 'fax', 'email', 'address']
                  ).map((field) => (
                    <div key={field} className={field === 'address' ? 'sm:col-span-2' : ''}>
                      <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        value={formData.referredTo[field] || ''}
                        onChange={(e) => updateField(`referredTo.${field}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="diagnosis">
              <AccordionTrigger>Diagnosis</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {errors.diagnoses && <p className="text-xs text-destructive">{errors.diagnoses}</p>}
                {formData.diagnoses.map((dx, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
                    <div className="relative">
                      <Label>Search ICD-10</Label>
                      <Input
                        value={index === activeDiagnosisIndex ? icdSearch : ''}
                        onFocus={() => setActiveDiagnosisIndex(index)}
                        onChange={(e) => searchIcd(e.target.value, index)}
                        placeholder="Search code or description"
                      />
                      {index === activeDiagnosisIndex && icdLoading && (
                        <Loader2 className="absolute right-2 top-8 h-4 w-4 animate-spin" />
                      )}
                      {index === activeDiagnosisIndex && icdResults.length > 0 && (
                        <div className="mt-1 max-h-32 overflow-y-auto rounded-md border bg-popover p-1 shadow">
                          {icdResults.map((item) => (
                            <button
                              key={item.id || item.code}
                              type="button"
                              className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-muted"
                              onClick={() => selectIcd(item)}
                            >
                              <span className="font-mono">{item.code}</span> — {item.description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="ICD-10 Code"
                        value={dx.icd10Code}
                        onChange={(e) => {
                          const diagnoses = [...formData.diagnoses];
                          diagnoses[index] = { ...diagnoses[index], icd10Code: e.target.value };
                          setFormData((prev) => ({ ...prev, diagnoses }));
                        }}
                      />
                      <Input
                        placeholder="Description"
                        value={dx.description}
                        onChange={(e) => {
                          const diagnoses = [...formData.diagnoses];
                          diagnoses[index] = { ...diagnoses[index], description: e.target.value };
                          setFormData((prev) => ({ ...prev, diagnoses }));
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={dx.isPrimary}
                          onCheckedChange={(v) => {
                            const diagnoses = formData.diagnoses.map((d, i) => ({
                              ...d,
                              isPrimary: i === index ? Boolean(v) : false,
                            }));
                            setFormData((prev) => ({ ...prev, diagnoses }));
                          }}
                        />
                        Primary
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={dx.isSecondary}
                          onCheckedChange={(v) => {
                            const diagnoses = [...formData.diagnoses];
                            diagnoses[index] = { ...diagnoses[index], isSecondary: Boolean(v) };
                            setFormData((prev) => ({ ...prev, diagnoses }));
                          }}
                        />
                        Secondary
                      </label>
                      {formData.diagnoses.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            diagnoses: prev.diagnoses.filter((_, i) => i !== index),
                          }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, diagnoses: [...prev.diagnoses, emptyDiagnosis()] }))}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Diagnosis
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="clinical">
              <AccordionTrigger>Clinical Information</AccordionTrigger>
              <AccordionContent className="grid gap-3">
                {[
                  ['chiefComplaint', 'Chief Complaint'],
                  ['historyOfPresentIllness', 'History of Present Illness'],
                  ['assessment', 'Assessment'],
                  ['treatmentHistory', 'Treatment History'],
                  ['currentMedications', 'Current Medications'],
                  ['allergies', 'Allergies'],
                  ['activeProblems', 'Active Problems'],
                  ['notes', 'Notes'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Textarea
                      rows={key === 'notes' ? 2 : 3}
                      value={formData.clinicalInformation[key] || ''}
                      onChange={(e) => updateField(`clinicalInformation.${key}`, e.target.value)}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="insurance">
              <AccordionTrigger>Insurance & Authorization</AccordionTrigger>
              <AccordionContent className="grid gap-4 sm:grid-cols-2">
                {[
                  'primaryInsurance',
                  'secondaryInsurance',
                  'payer',
                  'memberId',
                  'groupNumber',
                  'authorizationNumber',
                ].map((field) => (
                  <div key={field}>
                    <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      value={formData.insurance[field] || ''}
                      onChange={(e) => updateField(`insurance.${field}`, e.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <Label>Authorization Status</Label>
                  <Select
                    value={formData.insurance.authorizationStatus || 'Not Required'}
                    onValueChange={(v) => updateField('insurance.authorizationStatus', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUTH_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    checked={formData.insurance.authorizationRequired}
                    onCheckedChange={(v) => updateField('insurance.authorizationRequired', Boolean(v))}
                  />
                  <Label>Authorization Required</Label>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="letter">
              <AccordionTrigger>Referral Letter</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <Label>Letter Content (auto-generated; editable before sending)</Label>
                  <Textarea
                    rows={12}
                    className="mt-2 font-mono text-xs"
                    value={formData.referralLetter?.body || ''}
                    onChange={(e) => updateField('referralLetter', { body: e.target.value, isEdited: true })}
                  />
                </div>

                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label>Add attachment</Label>
                      <p className="text-xs text-muted-foreground">
                        Attach supporting files to this referral letter (PDF, images, Office docs).
                      </p>
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_DOCUMENT_INPUT}
                        className="hidden"
                        onChange={(e) => handleAddAttachments(e.target.files)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                        Add attachment
                      </Button>
                    </div>
                  </div>

                  {attachmentError && (
                    <p className="text-xs text-destructive">{attachmentError}</p>
                  )}

                  {(formData.attachments || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attachments added yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {formData.attachments.map((att, index) => (
                        <li
                          key={`${att.fileName}-${index}`}
                          className="flex items-start justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-medium">{att.fileName || 'Untitled file'}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Select
                                value={att.attachmentType || 'Referral Letter Attachment'}
                                onValueChange={(v) => {
                                  setFormData((prev) => {
                                    const attachments = [...prev.attachments];
                                    attachments[index] = { ...attachments[index], attachmentType: v };
                                    return { ...prev, attachments };
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 w-[200px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {['Referral Letter Attachment', ...ATTACHMENT_TYPES].map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(att.fileSize)}
                                {att.mimeType ? ` · ${att.mimeType}` : ''}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${att.fileName || 'attachment'}`}
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Referral'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
