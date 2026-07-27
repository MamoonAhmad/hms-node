import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionCard } from '../components/chart-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  CheckboxField,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ALL_BODY_LOCATIONS,
  BIOPSY_PROCEDURE_TYPE_OPTIONS,
  CLOSURE_OPTIONS,
  COMPLICATION_OPTIONS,
  DRESSING_CHECK_FIELDS,
  HAEMOSTASIS_OPTIONS,
  LATERALITY_OPTIONS,
  YES_NO_OPTIONS,
} from './dermatologyConstants';
import {
  createEmptyBiopsyProcedure,
  formatLesionLabel,
  lesionSizeSummary,
  toggleListValue,
} from './dermatologyUtils';

export function BiopsyProcedureForm({
  value,
  onChange,
  lesions = [],
  performingProvider = '',
  onLinkPathology,
}) {
  const procedures = value.procedures || [];

  const updateProcedure = (id, patch) => {
    onChange({
      ...value,
      procedures: procedures.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const updateNested = (id, key, nestedPatch) => {
    const proc = procedures.find((p) => p.id === id);
    if (!proc) return;
    updateProcedure(id, { [key]: { ...(proc[key] || {}), ...nestedPatch } });
  };

  const addProcedure = (fromLesion) => {
    const defaults = {
      performingProvider,
      procedureDate: new Date().toISOString().slice(0, 10),
    };
    if (fromLesion) {
      defaults.lesionId = fromLesion.id;
      defaults.lesionNumber = fromLesion.label || '';
      defaults.clinicalDiagnosis =
        fromLesion.clinicalDiagnosis || fromLesion.primaryDiagnosisDescription || '';
      defaults.lesionSize = lesionSizeSummary(fromLesion);
      defaults.lesionLocation = (fromLesion.bodyLocations || []).join(', ');
      defaults.bodySite = fromLesion.bodyLocations?.[0] || '';
    }
    const proc = createEmptyBiopsyProcedure(defaults);
    onChange({ ...value, procedures: [...procedures, proc] });
  };

  const removeProcedure = (id) => {
    onChange({ ...value, procedures: procedures.filter((p) => p.id !== id) });
  };

  const linkLesion = (procId, lesionId) => {
    const lesion = lesions.find((l) => l.id === lesionId);
    if (!lesion) {
      updateProcedure(procId, { lesionId });
      return;
    }
    updateProcedure(procId, {
      lesionId,
      lesionNumber: lesion.label || '',
      clinicalDiagnosis: lesion.clinicalDiagnosis || lesion.primaryDiagnosisDescription || '',
      lesionSize: lesionSizeSummary(lesion),
      lesionLocation: (lesion.bodyLocations || []).join(', '),
      bodySite: lesion.bodyLocations?.[0] || '',
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents skin biopsy procedures performed during this outpatient encounter. Link each
        procedure to a lesion and track pathology specimen status.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => addProcedure()}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add biopsy
        </Button>
        {lesions.map((l, i) => (
          <Button
            key={l.id}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addProcedure(l)}
          >
            Biopsy {formatLesionLabel(l, i)}
          </Button>
        ))}
      </div>

      {procedures.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">No biopsy procedures documented yet.</p>
          <Button type="button" size="sm" className="mt-3" onClick={() => addProcedure()}>
            Start biopsy documentation
          </Button>
        </div>
      )}

      {procedures.map((proc, index) => (
        <SectionCard
          key={proc.id}
          title={`Biopsy ${index + 1}${proc.procedureType ? ` — ${proc.procedureType}` : ''}`}
          description={proc.bodySite || 'Procedure details'}
          accent="warning"
          actions={
            <div className="flex items-center gap-2">
              {proc.pathologyStatus && (
                <Badge
                  variant="outline"
                  className={
                    proc.pathologyStatus === 'Resulted'
                      ? 'status-soft-success'
                      : 'status-soft-warning'
                  }
                >
                  {proc.pathologyStatus}
                </Badge>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="Remove biopsy"
                onClick={() => removeProcedure(proc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          }
        >
          <Accordion type="multiple" defaultValue={['proc', 'lesion']} className="space-y-2">
            <AccordionItem value="proc" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                A. Procedure Information
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Procedure Date">
                    <TextInput
                      type="date"
                      value={proc.procedureDate}
                      onChange={(v) => updateProcedure(proc.id, { procedureDate: v })}
                    />
                  </Field>
                  <Field label="Performing Provider" hint="Auto from encounter when available">
                    <TextInput
                      value={proc.performingProvider}
                      onChange={(v) => updateProcedure(proc.id, { performingProvider: v })}
                      placeholder={performingProvider || 'Provider name'}
                    />
                  </Field>
                  <Field label="Procedure Type">
                    <TextSelect
                      value={proc.procedureType}
                      onChange={(v) => updateProcedure(proc.id, { procedureType: v })}
                      options={BIOPSY_PROCEDURE_TYPE_OPTIONS}
                    />
                  </Field>
                  <Field label="Indication" className="sm:col-span-2">
                    <TextInput
                      value={proc.indication}
                      onChange={(v) => updateProcedure(proc.id, { indication: v })}
                    />
                  </Field>
                  <Field label="Body Site">
                    <TextSelect
                      value={proc.bodySite}
                      onChange={(v) => updateProcedure(proc.id, { bodySite: v })}
                      options={ALL_BODY_LOCATIONS}
                    />
                  </Field>
                  <Field label="Laterality">
                    <TextSelect
                      value={proc.laterality}
                      onChange={(v) => updateProcedure(proc.id, { laterality: v })}
                      options={LATERALITY_OPTIONS}
                    />
                  </Field>
                  <Field label="Linked lesion">
                    <Select
                      value={proc.lesionId || undefined}
                      onValueChange={(v) => linkLesion(proc.id, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select lesion…" />
                      </SelectTrigger>
                      <SelectContent>
                        {lesions.map((l, i) => (
                          <SelectItem key={l.id} value={l.id}>
                            {formatLesionLabel(l, i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lesion" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                B. Lesion Details
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Lesion Number">
                    <TextInput
                      value={proc.lesionNumber}
                      onChange={(v) => updateProcedure(proc.id, { lesionNumber: v })}
                    />
                  </Field>
                  <Field label="Clinical Diagnosis">
                    <TextInput
                      value={proc.clinicalDiagnosis}
                      onChange={(v) => updateProcedure(proc.id, { clinicalDiagnosis: v })}
                    />
                  </Field>
                  <Field label="Lesion Size">
                    <TextInput
                      value={proc.lesionSize}
                      onChange={(v) => updateProcedure(proc.id, { lesionSize: v })}
                      placeholder="e.g. 6 × 4 mm"
                    />
                  </Field>
                  <Field label="Lesion Location">
                    <TextInput
                      value={proc.lesionLocation}
                      onChange={(v) => updateProcedure(proc.id, { lesionLocation: v })}
                    />
                  </Field>
                  <Field label="Pigmented">
                    <TextSelect
                      value={proc.pigmented}
                      onChange={(v) => updateProcedure(proc.id, { pigmented: v })}
                      options={YES_NO_OPTIONS}
                    />
                  </Field>
                  <Field label="Suspicious for Malignancy">
                    <TextSelect
                      value={proc.suspiciousForMalignancy}
                      onChange={(v) => updateProcedure(proc.id, { suspiciousForMalignancy: v })}
                      options={YES_NO_OPTIONS}
                    />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="anaesthesia" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                C. Anaesthesia
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Local Anaesthetic">
                    <TextInput
                      value={proc.localAnaesthetic}
                      onChange={(v) => updateProcedure(proc.id, { localAnaesthetic: v })}
                      placeholder="Lidocaine"
                    />
                  </Field>
                  <Field label="Concentration">
                    <TextInput
                      value={proc.concentration}
                      onChange={(v) => updateProcedure(proc.id, { concentration: v })}
                      placeholder="1%"
                    />
                  </Field>
                  <Field label="Volume">
                    <TextInput
                      value={proc.volume}
                      onChange={(v) => updateProcedure(proc.id, { volume: v })}
                      placeholder="2 mL"
                    />
                  </Field>
                  <Field label="Epinephrine Used">
                    <TextSelect
                      value={proc.epinephrineUsed}
                      onChange={(v) => updateProcedure(proc.id, { epinephrineUsed: v })}
                      options={YES_NO_OPTIONS}
                    />
                  </Field>
                  <Field label="Buffer Used">
                    <TextSelect
                      value={proc.bufferUsed}
                      onChange={(v) => updateProcedure(proc.id, { bufferUsed: v })}
                      options={YES_NO_OPTIONS}
                    />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                D. Procedure Details
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Skin Prepared">
                    <TextSelect
                      value={proc.skinPrepared}
                      onChange={(v) => updateProcedure(proc.id, { skinPrepared: v })}
                      options={YES_NO_OPTIONS}
                    />
                  </Field>
                  <Field label="Prep Solution">
                    <TextInput
                      value={proc.prepSolution}
                      onChange={(v) => updateProcedure(proc.id, { prepSolution: v })}
                    />
                  </Field>
                  <Field label="Instrument Used">
                    <TextInput
                      value={proc.instrumentUsed}
                      onChange={(v) => updateProcedure(proc.id, { instrumentUsed: v })}
                    />
                  </Field>
                  <Field label="Punch Size">
                    <TextInput
                      value={proc.punchSize}
                      onChange={(v) => updateProcedure(proc.id, { punchSize: v })}
                      placeholder="3 mm"
                    />
                  </Field>
                  <Field label="Excision Length">
                    <TextInput
                      value={proc.excisionLength}
                      onChange={(v) => updateProcedure(proc.id, { excisionLength: v })}
                    />
                  </Field>
                  <Field label="Excision Width">
                    <TextInput
                      value={proc.excisionWidth}
                      onChange={(v) => updateProcedure(proc.id, { excisionWidth: v })}
                    />
                  </Field>
                  <Field label="Specimen Orientation">
                    <TextInput
                      value={proc.specimenOrientation}
                      onChange={(v) => updateProcedure(proc.id, { specimenOrientation: v })}
                    />
                  </Field>
                  <Field label="Number of Specimens">
                    <TextInput
                      type="number"
                      min={0}
                      value={proc.numberOfSpecimens}
                      onChange={(v) => updateProcedure(proc.id, { numberOfSpecimens: v })}
                    />
                  </Field>
                  <Field label="Specimen Sent to Pathology">
                    <TextSelect
                      value={proc.specimenSentToPathology}
                      onChange={(v) => {
                        updateProcedure(proc.id, {
                          specimenSentToPathology: v,
                          pathologyStatus: v === 'Yes' ? 'Pending' : proc.pathologyStatus,
                        });
                      }}
                      options={YES_NO_OPTIONS}
                    />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="closure" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                E–G. Haemostasis, Closure & Dressing
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    E. Haemostasis
                  </p>
                  <MultiSelectChips
                    idPrefix={`bx-haemo-${proc.id}`}
                    options={HAEMOSTASIS_OPTIONS}
                    values={proc.haemostasis}
                    onToggle={(opt) =>
                      updateProcedure(proc.id, {
                        haemostasis: toggleListValue(proc.haemostasis, opt),
                      })
                    }
                  />
                </div>
                <Field label="F. Closure" className="max-w-sm">
                  <TextSelect
                    value={proc.closure}
                    onChange={(v) => updateProcedure(proc.id, { closure: v })}
                    options={CLOSURE_OPTIONS}
                  />
                </Field>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    G. Dressing
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DRESSING_CHECK_FIELDS.map((f) => (
                      <CheckboxField
                        key={f.key}
                        id={`dress-${proc.id}-${f.key}`}
                        label={f.label}
                        checked={Boolean(proc.dressing?.[f.key])}
                        onCheckedChange={(v) => updateNested(proc.id, 'dressing', { [f.key]: v })}
                      />
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="specimen" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                H. Specimen Information
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Specimen Label">
                    <TextInput
                      value={proc.specimenLabel}
                      onChange={(v) => updateProcedure(proc.id, { specimenLabel: v })}
                    />
                  </Field>
                  <Field label="Container Number">
                    <TextInput
                      value={proc.containerNumber}
                      onChange={(v) => updateProcedure(proc.id, { containerNumber: v })}
                    />
                  </Field>
                  <Field label="Pathology Laboratory">
                    <TextInput
                      value={proc.pathologyLaboratory}
                      onChange={(v) => updateProcedure(proc.id, { pathologyLaboratory: v })}
                    />
                  </Field>
                  <Field label="Pathology Order Number">
                    <TextInput
                      value={proc.pathologyOrderNumber}
                      onChange={(v) => updateProcedure(proc.id, { pathologyOrderNumber: v })}
                    />
                  </Field>
                  <Field label="Pathology Status">
                    <TextSelect
                      value={proc.pathologyStatus}
                      onChange={(v) => updateProcedure(proc.id, { pathologyStatus: v })}
                      options={['Pending', 'In Lab', 'Resulted', 'Cancelled']}
                    />
                  </Field>
                </div>
                {onLinkPathology && (
                  <Button type="button" size="sm" variant="outline" onClick={onLinkPathology}>
                    Open Orders / Results
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="followup" className="rounded-lg border px-3">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                I–J. Complications & Follow-up
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    I. Complications
                  </p>
                  <MultiSelectChips
                    idPrefix={`bx-comp-${proc.id}`}
                    options={COMPLICATION_OPTIONS}
                    values={proc.complications}
                    onToggle={(opt) => {
                      let next = toggleListValue(proc.complications, opt);
                      if (opt === 'None' && next.includes('None')) next = ['None'];
                      else next = next.filter((x) => x !== 'None');
                      updateProcedure(proc.id, { complications: next });
                    }}
                  />
                  {proc.complications?.includes('Other') && (
                    <Field label="Other complication" className="mt-3">
                      <TextInput
                        value={proc.complicationOther}
                        onChange={(v) => updateProcedure(proc.id, { complicationOther: v })}
                      />
                    </Field>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pathology Follow-up">
                    <TextTextarea
                      value={proc.pathologyFollowUp}
                      onChange={(v) => updateProcedure(proc.id, { pathologyFollowUp: v })}
                      rows={2}
                    />
                  </Field>
                  <div className="space-y-4">
                    <Field label="Suture Removal Date">
                      <TextInput
                        type="date"
                        value={proc.sutureRemovalDate}
                        onChange={(v) => updateProcedure(proc.id, { sutureRemovalDate: v })}
                      />
                    </Field>
                    <Field label="Return Visit">
                      <TextInput
                        value={proc.returnVisit}
                        onChange={(v) => updateProcedure(proc.id, { returnVisit: v })}
                        placeholder="e.g. 2 weeks"
                      />
                    </Field>
                  </div>
                </div>
                <Field label="Provider Notes">
                  <TextTextarea
                    value={proc.providerNotes}
                    onChange={(v) => updateProcedure(proc.id, { providerNotes: v })}
                    rows={3}
                  />
                </Field>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SectionCard>
      ))}
    </div>
  );
}
