import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  STRENGTH_UNITS,
  DOSAGE_FORMS,
  ROUTES,
  CONTROLLED_SCHEDULES,
  FREQUENCIES,
  DURATION_UNITS,
  THERAPEUTIC_CATEGORIES,
  MEDICATION_TYPES,
  FORMULARY_STATUSES,
  PREGNANCY_OPTIONS,
  LACTATION_OPTIONS,
  emptyFormularyForm,
} from './formularyConstants';

const FORM_TABS = [
  'basic',
  'strength',
  'clinical',
  'prescribing',
  'coding',
  'formulary',
];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function Field({ label, htmlFor, required, error, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function FormularyFormDialog({
  open,
  onOpenChange,
  record,
  mode = 'create',
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(emptyFormularyForm());
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;
    if (record) {
      setFormData({
        name: record.name || '',
        genericName: record.genericName || '',
        brandName: record.brandName || '',
        medicationType: record.medicationType || '',
        therapeuticCategory: record.therapeuticCategory || '',
        medicationClass: record.medicationClass || '',
        isActive: record.isActive !== false,
        strength: record.strength || '',
        strengthUnit: record.strengthUnit || '',
        dosageForm: record.dosageForm || '',
        route: Array.isArray(record.route) ? record.route : [],
        concentration: record.concentration || '',
        defaultDose: record.defaultDose || '',
        defaultDoseUnit: record.defaultDoseUnit || '',
        defaultFrequency: record.defaultFrequency || '',
        defaultDuration: record.defaultDuration ?? '',
        durationUnit: record.durationUnit || '',
        instructions: record.instructions || '',
        indications: record.indications || '',
        contraindications: record.contraindications || '',
        warnings: record.warnings || '',
        pregnancy: record.pregnancy || '',
        lactation: record.lactation || '',
        renalHepaticAdjustments: record.renalHepaticAdjustments || '',
        isControlledSubstance: !!record.isControlledSubstance,
        controlledSubstanceSchedule: record.controlledSubstanceSchedule || '',
        priorAuthorization: !!record.priorAuthorization,
        ageRestrictions: record.ageRestrictions || '',
        diagnosisRequired: !!record.diagnosisRequired,
        weightBasedDosing: !!record.weightBasedDosing,
        rxNorm: record.rxNorm || '',
        ndc: record.ndc || '',
        atc: record.atc || '',
        snomedCt: record.snomedCt || '',
        hcpcs: record.hcpcs || '',
        formularyStatus: record.formularyStatus || '',
        preferredDrug: !!record.preferredDrug,
        alternativeMedication: record.alternativeMedication || '',
        manufacturer: record.manufacturer || '',
        drugMonograph: record.drugMonograph || '',
        patientLeaflet: record.patientLeaflet || '',
      });
    } else {
      setFormData(emptyFormularyForm());
    }
    setErrors({});
    setActiveTab('basic');
  }, [record, open, mode]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'isControlledSubstance' && !value) {
        next.controlledSubstanceSchedule = '';
      }
      if (field === 'defaultDuration' && (value === '' || value == null)) {
        next.durationUnit = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Display Name is required';
    if (!formData.genericName.trim()) newErrors.genericName = 'Generic Name is required';
    if (!String(formData.strength).trim()) newErrors.strength = 'Strength is required';
    if (!formData.strengthUnit) newErrors.strengthUnit = 'Strength Unit is required';
    if (!formData.dosageForm) newErrors.dosageForm = 'Dosage Form is required';
    if (!formData.route?.length) newErrors.route = 'At least one Route is required';

    if (
      formData.defaultDuration !== '' &&
      formData.defaultDuration != null &&
      !formData.durationUnit
    ) {
      newErrors.durationUnit = 'Duration Unit is required when Duration is entered';
    }
    if (formData.isControlledSubstance && !formData.controlledSubstanceSchedule) {
      newErrors.controlledSubstanceSchedule =
        'Schedule is required when Controlled Substance is Yes';
    }

    const numericFields = [
      ['strength', formData.strength],
      ['defaultDose', formData.defaultDose],
      ['defaultDuration', formData.defaultDuration],
    ];
    numericFields.forEach(([key, value]) => {
      if (value === '' || value == null) return;
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) {
        newErrors[key] = 'Must be a non-negative number';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name || newErrors.genericName) setActiveTab('basic');
      else if (
        newErrors.strength ||
        newErrors.strengthUnit ||
        newErrors.dosageForm ||
        newErrors.route ||
        newErrors.durationUnit ||
        newErrors.defaultDuration ||
        newErrors.defaultDose
      ) {
        setActiveTab('strength');
      } else if (newErrors.controlledSubstanceSchedule) {
        setActiveTab('prescribing');
      }
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    genericName: formData.genericName.trim(),
    brandName: formData.brandName.trim() || null,
    medicationType: formData.medicationType || null,
    therapeuticCategory: formData.therapeuticCategory || null,
    medicationClass: formData.medicationClass.trim() || null,
    isActive: !!formData.isActive,
    strength: String(formData.strength).trim(),
    strengthUnit: formData.strengthUnit,
    dosageForm: formData.dosageForm,
    route: formData.route,
    concentration: formData.concentration.trim() || null,
    defaultDose: formData.defaultDose !== '' ? String(formData.defaultDose).trim() : null,
    defaultDoseUnit: formData.defaultDoseUnit || null,
    defaultFrequency: formData.defaultFrequency || null,
    defaultDuration:
      formData.defaultDuration === '' || formData.defaultDuration == null
        ? null
        : Number(formData.defaultDuration),
    durationUnit: formData.durationUnit || null,
    instructions: formData.instructions.trim() || null,
    indications: formData.indications.trim() || null,
    contraindications: formData.contraindications.trim() || null,
    warnings: formData.warnings.trim() || null,
    pregnancy: formData.pregnancy || null,
    lactation: formData.lactation || null,
    renalHepaticAdjustments: formData.renalHepaticAdjustments.trim() || null,
    isControlledSubstance: !!formData.isControlledSubstance,
    controlledSubstanceSchedule: formData.isControlledSubstance
      ? formData.controlledSubstanceSchedule || null
      : null,
    priorAuthorization: !!formData.priorAuthorization,
    ageRestrictions: formData.ageRestrictions.trim() || null,
    diagnosisRequired: !!formData.diagnosisRequired,
    weightBasedDosing: !!formData.weightBasedDosing,
    rxNorm: formData.rxNorm.trim() || null,
    ndc: formData.ndc.trim() || null,
    atc: formData.atc.trim() || null,
    snomedCt: formData.snomedCt.trim() || null,
    hcpcs: formData.hcpcs.trim() || null,
    formularyStatus: formData.formularyStatus || null,
    preferredDrug: !!formData.preferredDrug,
    alternativeMedication: formData.alternativeMedication.trim() || null,
    manufacturer: formData.manufacturer.trim() || null,
    drugMonograph: formData.drugMonograph.trim() || null,
    patientLeaflet: formData.patientLeaflet.trim() || null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    onSubmit(buildPayload());
  };

  const tabIndex = FORM_TABS.indexOf(activeTab);
  const isFirstTab = tabIndex <= 0;
  const isLastTab = tabIndex >= FORM_TABS.length - 1;

  const goToPreviousTab = () => {
    if (isFirstTab) return;
    setActiveTab(FORM_TABS[tabIndex - 1]);
  };

  const goToNextTab = () => {
    if (isLastTab) return;
    setActiveTab(FORM_TABS[tabIndex + 1]);
  };

  const title = isView
    ? 'View Medication Formulary'
    : isEdit
      ? 'Edit Medication Formulary'
      : 'Add Medication Formulary';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(96vw,72rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col px-6 pt-4"
          >
            <TabsList className="h-auto shrink-0 flex-wrap">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="strength">Strength & Administration</TabsTrigger>
              <TabsTrigger value="clinical">Clinical Information</TabsTrigger>
              <TabsTrigger value="prescribing">Prescribing Rules</TabsTrigger>
              <TabsTrigger value="coding">Coding</TabsTrigger>
              <TabsTrigger value="formulary">Formulary & References</TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto py-4 pb-2">
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Generic Name" htmlFor="ff-generic" required error={errors.genericName}>
                    <Input
                      id="ff-generic"
                      value={formData.genericName}
                      onChange={(e) => handleChange('genericName', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="Brand Name" htmlFor="ff-brand">
                    <Input
                      id="ff-brand"
                      value={formData.brandName}
                      onChange={(e) => handleChange('brandName', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="Display Name" htmlFor="ff-display" required error={errors.name}>
                    <Input
                      id="ff-display"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      disabled={readOnly}
                      placeholder="Name shown in orders and ePrescribe"
                    />
                  </Field>
                  <Field label="Medication Type" htmlFor="ff-type">
                    <Select
                      value={formData.medicationType || undefined}
                      onValueChange={(v) => handleChange('medicationType', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Therapeutic Category" htmlFor="ff-theracat">
                    <Select
                      value={formData.therapeuticCategory || undefined}
                      onValueChange={(v) => handleChange('therapeuticCategory', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-theracat">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {THERAPEUTIC_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Pharmacologic Class" htmlFor="ff-pharmclass">
                    <Input
                      id="ff-pharmclass"
                      value={formData.medicationClass}
                      onChange={(e) => handleChange('medicationClass', e.target.value)}
                      disabled={readOnly}
                      placeholder="e.g. ACE Inhibitor"
                    />
                  </Field>
                  <Field label="Status" htmlFor="ff-status">
                    <Select
                      value={formData.isActive ? 'Active' : 'Inactive'}
                      onValueChange={(v) => handleChange('isActive', v === 'Active')}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="strength" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Strength" htmlFor="ff-strength" required error={errors.strength}>
                    <Input
                      id="ff-strength"
                      value={formData.strength}
                      onChange={(e) => handleChange('strength', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="Strength Unit" htmlFor="ff-strength-unit" required error={errors.strengthUnit}>
                    <Select
                      value={formData.strengthUnit || undefined}
                      onValueChange={(v) => handleChange('strengthUnit', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-strength-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {STRENGTH_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Dosage Form" htmlFor="ff-form" required error={errors.dosageForm}>
                    <Select
                      value={formData.dosageForm || undefined}
                      onValueChange={(v) => handleChange('dosageForm', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-form">
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOSAGE_FORMS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Route" htmlFor="ff-route" required error={errors.route}>
                    <MultiSelect
                      options={ROUTES.map((r) => ({ label: r, value: r }))}
                      value={formData.route}
                      onChange={(v) => handleChange('route', v)}
                      disabled={readOnly}
                      placeholder="Select route(s)"
                    />
                  </Field>
                  <Field label="Concentration" htmlFor="ff-conc">
                    <Input
                      id="ff-conc"
                      value={formData.concentration}
                      onChange={(e) => handleChange('concentration', e.target.value)}
                      disabled={readOnly}
                      placeholder="e.g. 5 mg/mL"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Default Dose" htmlFor="ff-dose" error={errors.defaultDose}>
                      <Input
                        id="ff-dose"
                        value={formData.defaultDose}
                        onChange={(e) => handleChange('defaultDose', e.target.value)}
                        disabled={readOnly}
                      />
                    </Field>
                    <Field label="Dose Unit" htmlFor="ff-dose-unit">
                      <Select
                        value={formData.defaultDoseUnit || undefined}
                        onValueChange={(v) => handleChange('defaultDoseUnit', v)}
                        disabled={readOnly}
                      >
                        <SelectTrigger id="ff-dose-unit">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {STRENGTH_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Frequency" htmlFor="ff-freq">
                    <Select
                      value={formData.defaultFrequency || undefined}
                      onValueChange={(v) => handleChange('defaultFrequency', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-freq">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Duration" htmlFor="ff-duration" error={errors.defaultDuration}>
                      <Input
                        id="ff-duration"
                        type="number"
                        min="0"
                        value={formData.defaultDuration}
                        onChange={(e) => handleChange('defaultDuration', e.target.value)}
                        disabled={readOnly}
                      />
                    </Field>
                    <Field label="Duration Unit" htmlFor="ff-duration-unit" error={errors.durationUnit}>
                      <Select
                        value={formData.durationUnit || undefined}
                        onValueChange={(v) => handleChange('durationUnit', v)}
                        disabled={readOnly}
                      >
                        <SelectTrigger id="ff-duration-unit">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
                <Field label="SIG" htmlFor="ff-sig">
                  <Textarea
                    id="ff-sig"
                    value={formData.instructions}
                    onChange={(e) => handleChange('instructions', e.target.value)}
                    disabled={readOnly}
                    rows={3}
                    placeholder="Default SIG / directions for use"
                  />
                </Field>
              </TabsContent>

              <TabsContent value="clinical" className="mt-0 space-y-4">
                <Field label="Indications" htmlFor="ff-indications">
                  <Textarea
                    id="ff-indications"
                    value={formData.indications}
                    onChange={(e) => handleChange('indications', e.target.value)}
                    disabled={readOnly}
                    rows={3}
                  />
                </Field>
                <Field label="Contraindications" htmlFor="ff-contra">
                  <Textarea
                    id="ff-contra"
                    value={formData.contraindications}
                    onChange={(e) => handleChange('contraindications', e.target.value)}
                    disabled={readOnly}
                    rows={3}
                  />
                </Field>
                <Field label="Warnings" htmlFor="ff-warnings">
                  <Textarea
                    id="ff-warnings"
                    value={formData.warnings}
                    onChange={(e) => handleChange('warnings', e.target.value)}
                    disabled={readOnly}
                    rows={3}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Pregnancy" htmlFor="ff-pregnancy">
                    <Select
                      value={formData.pregnancy || undefined}
                      onValueChange={(v) => handleChange('pregnancy', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-pregnancy">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PREGNANCY_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Lactation" htmlFor="ff-lactation">
                    <Select
                      value={formData.lactation || undefined}
                      onValueChange={(v) => handleChange('lactation', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-lactation">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        {LACTATION_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Renal/Hepatic adjustments" htmlFor="ff-renal">
                  <Textarea
                    id="ff-renal"
                    value={formData.renalHepaticAdjustments}
                    onChange={(e) => handleChange('renalHepaticAdjustments', e.target.value)}
                    disabled={readOnly}
                    rows={3}
                  />
                </Field>
              </TabsContent>

              <TabsContent value="prescribing" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      id="ff-controlled"
                      checked={formData.isControlledSubstance}
                      onCheckedChange={(checked) =>
                        handleChange('isControlledSubstance', !!checked)
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="ff-controlled" className="cursor-pointer">
                      Controlled Substance
                    </Label>
                  </div>
                  <Field
                    label="Controlled Substance Schedule"
                    htmlFor="ff-schedule"
                    error={errors.controlledSubstanceSchedule}
                  >
                    <Select
                      value={formData.controlledSubstanceSchedule || undefined}
                      onValueChange={(v) => handleChange('controlledSubstanceSchedule', v)}
                      disabled={readOnly || !formData.isControlledSubstance}
                    >
                      <SelectTrigger id="ff-schedule">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTROLLED_SCHEDULES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      id="ff-pa"
                      checked={formData.priorAuthorization}
                      onCheckedChange={(checked) => handleChange('priorAuthorization', !!checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor="ff-pa" className="cursor-pointer">
                      Prior Authorization
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      id="ff-dx"
                      checked={formData.diagnosisRequired}
                      onCheckedChange={(checked) => handleChange('diagnosisRequired', !!checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor="ff-dx" className="cursor-pointer">
                      Diagnosis Required
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      id="ff-wbd"
                      checked={formData.weightBasedDosing}
                      onCheckedChange={(checked) => handleChange('weightBasedDosing', !!checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor="ff-wbd" className="cursor-pointer">
                      Weight-Based Dosing
                    </Label>
                  </div>
                  <Field label="Age Restrictions" htmlFor="ff-age">
                    <Input
                      id="ff-age"
                      value={formData.ageRestrictions}
                      onChange={(e) => handleChange('ageRestrictions', e.target.value)}
                      disabled={readOnly}
                      placeholder="e.g. Not for use under 18 years"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="coding" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="RxNorm" htmlFor="ff-rxnorm">
                    <Input
                      id="ff-rxnorm"
                      value={formData.rxNorm}
                      onChange={(e) => handleChange('rxNorm', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="NDC" htmlFor="ff-ndc">
                    <Input
                      id="ff-ndc"
                      value={formData.ndc}
                      onChange={(e) => handleChange('ndc', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="ATC" htmlFor="ff-atc">
                    <Input
                      id="ff-atc"
                      value={formData.atc}
                      onChange={(e) => handleChange('atc', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="SNOMED CT" htmlFor="ff-snomed">
                    <Input
                      id="ff-snomed"
                      value={formData.snomedCt}
                      onChange={(e) => handleChange('snomedCt', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="HCPCS" htmlFor="ff-hcpcs">
                    <Input
                      id="ff-hcpcs"
                      value={formData.hcpcs}
                      onChange={(e) => handleChange('hcpcs', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="formulary" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Formulary Status" htmlFor="ff-fstatus">
                    <Select
                      value={formData.formularyStatus || undefined}
                      onValueChange={(v) => handleChange('formularyStatus', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="ff-fstatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMULARY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-center gap-3 rounded-md border p-3 self-end">
                    <Checkbox
                      id="ff-preferred"
                      checked={formData.preferredDrug}
                      onCheckedChange={(checked) => handleChange('preferredDrug', !!checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor="ff-preferred" className="cursor-pointer">
                      Preferred Drug
                    </Label>
                  </div>
                  <Field label="Alternative Medication" htmlFor="ff-alt">
                    <Input
                      id="ff-alt"
                      value={formData.alternativeMedication}
                      onChange={(e) => handleChange('alternativeMedication', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                  <Field label="Manufacturer" htmlFor="ff-mfr">
                    <Input
                      id="ff-mfr"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      disabled={readOnly}
                    />
                  </Field>
                </div>
                <Field label="Drug Monograph" htmlFor="ff-monograph">
                  <Textarea
                    id="ff-monograph"
                    value={formData.drugMonograph}
                    onChange={(e) => handleChange('drugMonograph', e.target.value)}
                    disabled={readOnly}
                    rows={4}
                  />
                </Field>
                <Field label="Patient Leaflet" htmlFor="ff-leaflet">
                  <Textarea
                    id="ff-leaflet"
                    value={formData.patientLeaflet}
                    onChange={(e) => handleChange('patientLeaflet', e.target.value)}
                    disabled={readOnly}
                    rows={4}
                  />
                </Field>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-between">
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                disabled={isFirstTab}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={goToNextTab}
                disabled={isLastTab}
              >
                Next
              </Button>
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isView ? 'Close' : 'Cancel'}
              </Button>
              {!isView && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving…' : isEdit ? 'Update' : 'Save'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
