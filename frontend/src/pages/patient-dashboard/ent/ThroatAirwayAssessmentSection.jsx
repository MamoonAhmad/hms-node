import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import { IcdSearchField } from '../dermatology/IcdSearchField';
import {
  AIRWAY_RED_FLAG_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  LIPS_OPTIONS,
  NECK_EXAM_OPTIONS,
  ORAL_MUCOSA_OPTIONS,
  PHARYNX_OPTIONS,
  PRESENT_ABSENT_OPTIONS,
  RESPIRATORY_DISTRESS_OPTIONS,
  TEETH_GUMS_OPTIONS,
  THROAT_DIAGNOSTIC_OPTIONS,
  THROAT_SYMPTOM_OPTIONS,
  THROAT_TREATMENT_OPTIONS,
  TONGUE_OPTIONS,
  TONSIL_GRADE_OPTIONS,
  VOICE_QUALITY_OPTIONS,
  YES_NO_OPTIONS,
} from './entConstants';
import { getPresentAirwayRedFlags, hasUnresolvedAirwayEmergency, toggleListValue } from './entUtils';

export function ThroatAirwayAssessmentSection({
  value,
  onChange,
  history = [],
  linkedMedications = [],
  medicationsLoading = false,
  onRefreshMedications,
  onOpenOrders,
  onOpenMedications,
  onOpenResults,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  const setRedFlag = (flag, status) => {
    const nextFlags = { ...(value.redFlags || {}), [flag]: status };
    const next = { ...value, redFlags: nextFlags };
    const present = getPresentAirwayRedFlags(next);
    if (!present.length) {
      next.redFlagAcknowledged = false;
    }
    onChange(next);
  };

  const presentFlags = getPresentAirwayRedFlags(value);
  const unresolved = hasUnresolvedAirwayEmergency(value);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document oral cavity, pharynx, larynx, neck, and airway findings. Airway red flags require
        acknowledgement and an immediate management plan before the encounter can be completed.
      </p>

      {presentFlags.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 border-l-4 border-l-destructive bg-destructive/5 px-4 py-3"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-destructive">Airway Emergency Alert</p>
              <p className="text-sm text-foreground">
                One or more airway red flags are marked Present. Document acknowledgement and an
                immediate management plan before completing this encounter.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presentFlags.map((flag) => (
                  <Badge key={flag} variant="destructive" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionCard title="A. Presenting Symptoms" accent="info">
        <MultiSelectChips
          idPrefix="ent-throat-sx"
          options={THROAT_SYMPTOM_OPTIONS}
          values={value.symptoms}
          onToggle={(opt) => toggle('symptoms', opt)}
        />
      </SectionCard>

      <SectionCard title="B. Oral Cavity Examination">
        <Field label="Lips">
          <MultiSelectChips
            idPrefix="ent-lips"
            options={LIPS_OPTIONS}
            values={value.lips}
            onToggle={(opt) => toggle('lips', opt)}
          />
        </Field>
        <Field label="Oral Mucosa">
          <MultiSelectChips
            idPrefix="ent-oral-mucosa"
            options={ORAL_MUCOSA_OPTIONS}
            values={value.oralMucosa}
            onToggle={(opt) => toggle('oralMucosa', opt)}
          />
        </Field>
        <Field label="Tongue">
          <MultiSelectChips
            idPrefix="ent-tongue"
            options={TONGUE_OPTIONS}
            values={value.tongue}
            onToggle={(opt) => toggle('tongue', opt)}
          />
        </Field>
        <Field label="Teeth & Gums">
          <MultiSelectChips
            idPrefix="ent-teeth"
            options={TEETH_GUMS_OPTIONS}
            values={value.teethGums}
            onToggle={(opt) => toggle('teethGums', opt)}
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Pharynx Examination">
        <MultiSelectChips
          idPrefix="ent-pharynx"
          options={PHARYNX_OPTIONS}
          values={value.pharynx}
          onToggle={(opt) => toggle('pharynx', opt)}
        />
      </SectionCard>

      <SectionCard title="D. Tonsil Grading">
        <Field label="Tonsil Grade" className="max-w-xs">
          <TextSelect
            value={value.tonsilGrade}
            onChange={(v) => set('tonsilGrade', v)}
            options={TONSIL_GRADE_OPTIONS}
          />
        </Field>
      </SectionCard>

      <SectionCard title="E. Neck Examination">
        <MultiSelectChips
          idPrefix="ent-neck"
          options={NECK_EXAM_OPTIONS}
          values={value.neckExam}
          onToggle={(opt) => toggle('neckExam', opt)}
        />
      </SectionCard>

      <SectionCard title="F. Airway Assessment" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Airway Patent">
            <TextSelect
              value={value.airwayPatent}
              onChange={(v) => set('airwayPatent', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Stridor">
            <TextSelect
              value={value.stridor}
              onChange={(v) => set('stridor', v)}
              options={PRESENT_ABSENT_OPTIONS}
            />
          </Field>
          <Field label="Respiratory Distress">
            <TextSelect
              value={value.respiratoryDistress}
              onChange={(v) => set('respiratoryDistress', v)}
              options={RESPIRATORY_DISTRESS_OPTIONS}
            />
          </Field>
          <Field label="Oxygen Saturation (%)">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={value.oxygenSaturation}
              onChange={(v) => set('oxygenSaturation', v)}
              placeholder="%"
            />
          </Field>
          <Field label="Voice Quality">
            <TextSelect
              value={value.voiceQuality}
              onChange={(v) => set('voiceQuality', v)}
              options={VOICE_QUALITY_OPTIONS}
            />
          </Field>
          <Field label="Difficulty Managing Secretions">
            <TextSelect
              value={value.difficultyManagingSecretions}
              onChange={(v) => set('difficultyManagingSecretions', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="G. Airway Red Flag Assessment"
        description="Mark Present or Absent for each emergency finding."
        accent="danger"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {AIRWAY_RED_FLAG_OPTIONS.map((flag) => {
            const status = value.redFlags?.[flag] || '';
            const isPresent = status === 'Present';
            return (
              <div
                key={flag}
                className={cn(
                  'flex flex-col gap-1.5 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between',
                  isPresent
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'border-border/80 bg-card',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPresent ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {flag}
                </span>
                <div className="w-full sm:w-36">
                  <TextSelect
                    value={status}
                    onChange={(v) => setRedFlag(flag, v)}
                    options={PRESENT_ABSENT_OPTIONS}
                    placeholder="Status…"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {presentFlags.length > 0 && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <Field label="Immediate Management Plan" required hint="Required when any red flag is Present.">
              <TextTextarea
                value={value.immediateManagementPlan}
                onChange={(v) => set('immediateManagementPlan', v)}
                rows={3}
                placeholder="Document immediate airway management, ED transfer, interventions…"
              />
            </Field>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <Checkbox
                checked={Boolean(value.redFlagAcknowledged)}
                onCheckedChange={(v) => set('redFlagAcknowledged', Boolean(v))}
                className="mt-0.5"
              />
              <span>
                I acknowledge these airway emergency findings and have documented the immediate
                management plan.
              </span>
            </label>
            {unresolved && (
              <p className="text-xs font-medium text-destructive">
                Encounter completion is blocked until acknowledgement and management plan are
                documented.
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="H. Diagnostic Orders"
        actions={
          <div className="flex flex-wrap gap-2">
            {onOpenOrders && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Orders
              </Button>
            )}
            {onOpenResults && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenResults}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Results
              </Button>
            )}
          </div>
        }
      >
        <MultiSelectChips
          idPrefix="ent-throat-orders"
          options={THROAT_DIAGNOSTIC_OPTIONS}
          values={value.diagnostics}
          onToggle={(opt) => toggle('diagnostics', opt)}
        />
      </SectionCard>

      <SectionCard
        title="I. Treatment Plan"
        description="Medications (antibiotics, sprays, drops, steroids) are ordered from the Medications tab."
        actions={
          <div className="flex flex-wrap gap-2">
            {onRefreshMedications && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={medicationsLoading}
                onClick={onRefreshMedications}
              >
                Refresh meds
              </Button>
            )}
            {onOpenMedications && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenMedications}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Medications
              </Button>
            )}
          </div>
        }
      >
        <MultiSelectChips
          idPrefix="ent-treatment"
          options={THROAT_TREATMENT_OPTIONS}
          values={value.treatmentPlan}
          onToggle={(opt) => toggle('treatmentPlan', opt)}
        />
        {linkedMedications.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Linked medication orders
            </p>
            <ul className="mt-2 space-y-1">
              {linkedMedications.slice(0, 8).map((med) => (
                <li key={med.id || med.medicationName} className="text-sm">
                  <span className="font-medium">
                    {med.medicationName || med.drugName || med.name || 'Medication'}
                  </span>
                  {med.status && (
                    <span className="ml-2 text-xs text-muted-foreground">{med.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <SectionCard title="J. Provider Assessment & Plan" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary Diagnosis">
            <IcdSearchField
              value={value.primaryDiagnosisDisplay}
              code={value.primaryDiagnosisCode}
              onSelect={(item) =>
                setMany({
                  primaryDiagnosisCode: item.code || '',
                  primaryDiagnosisDescription: item.description || '',
                  primaryDiagnosisDisplay: item.display || '',
                })
              }
            />
          </Field>
          <Field label="Secondary Diagnosis">
            <IcdSearchField
              value={value.secondaryDiagnosisDisplay}
              code={value.secondaryDiagnosisCode}
              onSelect={(item) =>
                setMany({
                  secondaryDiagnosisCode: item.code || '',
                  secondaryDiagnosisDescription: item.description || '',
                  secondaryDiagnosisDisplay: item.display || '',
                })
              }
            />
          </Field>
        </div>
        <Field label="Clinical Impression">
          <TextTextarea
            value={value.clinicalImpression}
            onChange={(v) => set('clinicalImpression', v)}
            rows={3}
          />
        </Field>
        <Field label="Management Plan">
          <TextTextarea
            value={value.managementPlan}
            onChange={(v) => set('managementPlan', v)}
            rows={3}
          />
        </Field>
        <Field label="Follow-up Interval" className="max-w-xs">
          <TextSelect
            value={value.followUpInterval}
            onChange={(v) => set('followUpInterval', v)}
            options={FOLLOW_UP_INTERVAL_OPTIONS}
          />
        </Field>
        <Field label="Patient Education">
          <TextTextarea
            value={value.patientEducation}
            onChange={(v) => set('patientEducation', v)}
            rows={3}
            placeholder="Education provided…"
          />
        </Field>
      </SectionCard>

      {history.some((h) => h.tonsilGrade || (h.airwayRedFlags || []).length) && (
        <SectionCard title="Tonsillar / airway history">
          <ul className="space-y-2">
            {history.slice(0, 6).map((h) => (
              <li
                key={`${h.at}-throat`}
                className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {h.examinationDate || new Date(h.at).toLocaleDateString()}
                  {h.tonsilGrade ? ` · Tonsils ${h.tonsilGrade}` : ''}
                </p>
                {(h.airwayRedFlags || []).length > 0 && (
                  <p className="text-xs text-destructive">
                    Red flags: {h.airwayRedFlags.join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
