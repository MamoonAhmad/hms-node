import { AlertTriangle } from 'lucide-react';
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
  AFFECTED_REGION_OPTIONS,
  ALARM_FEATURE_OPTIONS,
  FAMILY_HISTORY_OPTIONS,
  GI_SYMPTOM_OPTIONS,
  LIFESTYLE_RISK_OPTIONS,
  PAIN_AGGRAVATING_OPTIONS,
  PAIN_CHARACTER_OPTIONS,
  PAIN_FREQUENCY_OPTIONS,
  PAIN_LOCATION_OPTIONS,
  PAIN_RELIEVING_OPTIONS,
  STOOL_CONSISTENCY_OPTIONS,
  SYMPTOM_DURATION_OPTIONS,
  SYMPTOM_ONSET_OPTIONS,
  VISIT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from './gastroenterologyConstants';
import {
  hasAlarmFeatures,
  recommendedInvestigations,
  toggleListValue,
} from './gastroenterologyUtils';

export function GiSymptomsForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));
  const alarmsActive = hasAlarmFeatures(value);
  const investigations = recommendedInvestigations(value);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document gastrointestinal symptoms, duration, severity, alarm features, bowel habits, and
        risk factors to guide diagnosis and urgent evaluation.
      </p>

      <SectionCard title="A. Visit Information" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Visit Type" required>
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Symptom Duration" required>
            <TextSelect
              value={value.symptomDuration}
              onChange={(v) => set('symptomDuration', v)}
              options={SYMPTOM_DURATION_OPTIONS}
            />
          </Field>
          <Field label="Symptom Onset" required>
            <TextSelect
              value={value.symptomOnset}
              onChange={(v) => set('symptomOnset', v)}
              options={SYMPTOM_ONSET_OPTIONS}
            />
          </Field>
          <Field label="Affected GI Region" required>
            <TextSelect
              value={value.affectedRegion}
              onChange={(v) => set('affectedRegion', v)}
              options={AFFECTED_REGION_OPTIONS}
            />
          </Field>
          <Field label="Chief GI Complaint" required className="sm:col-span-2">
            <TextInput
              value={value.chiefGiComplaint}
              onChange={(v) => set('chiefGiComplaint', v)}
              placeholder="Primary GI complaint for this visit…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. GI Symptoms">
        <MultiSelectChips
          values={value.symptoms || []}
          options={GI_SYMPTOM_OPTIONS}
          onToggle={(opt) => toggle('symptoms', opt)}
          idPrefix="gi-symptom"
        />
      </SectionCard>

      <SectionCard title="C. Abdominal Pain Assessment">
        <div className="space-y-4">
          <Field label="Pain Location">
            <MultiSelectChips
              values={value.painLocation || []}
              options={PAIN_LOCATION_OPTIONS}
              onToggle={(opt) => toggle('painLocation', opt)}
              idPrefix="gi-pain-loc"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Pain Score (0-10)">
              <TextInput
                type="number"
                min={0}
                max={10}
                step={1}
                value={value.painScore}
                onChange={(v) => set('painScore', v)}
              />
            </Field>
            <Field label="Frequency">
              <TextSelect
                value={value.frequency}
                onChange={(v) => set('frequency', v)}
                options={PAIN_FREQUENCY_OPTIONS}
              />
            </Field>
            <Field label="Radiation">
              <TextInput
                value={value.radiation}
                onChange={(v) => set('radiation', v)}
                placeholder="e.g. to back, shoulder…"
              />
            </Field>
          </div>
          <Field label="Pain Character">
            <MultiSelectChips
              values={value.painCharacter || []}
              options={PAIN_CHARACTER_OPTIONS}
              onToggle={(opt) => toggle('painCharacter', opt)}
              idPrefix="gi-pain-char"
            />
          </Field>
          <Field label="Aggravating Factors">
            <MultiSelectChips
              values={value.aggravatingFactors || []}
              options={PAIN_AGGRAVATING_OPTIONS}
              onToggle={(opt) => toggle('aggravatingFactors', opt)}
              idPrefix="gi-agg"
            />
          </Field>
          <Field label="Relieving Factors">
            <MultiSelectChips
              values={value.relievingFactors || []}
              options={PAIN_RELIEVING_OPTIONS}
              onToggle={(opt) => toggle('relievingFactors', opt)}
              idPrefix="gi-rel"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Bowel Habit Assessment">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Bowel Movements per Day">
            <TextInput
              type="number"
              min={0}
              step={1}
              value={value.bowelMovementsPerDay}
              onChange={(v) => set('bowelMovementsPerDay', v)}
            />
          </Field>
          <Field label="Stool Consistency" className="sm:col-span-2">
            <TextSelect
              value={value.stoolConsistency}
              onChange={(v) => set('stoolConsistency', v)}
              options={STOOL_CONSISTENCY_OPTIONS}
            />
          </Field>
          <Field label="Blood in Stool">
            <TextSelect
              value={value.bloodInStool}
              onChange={(v) => set('bloodInStool', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Mucus in Stool">
            <TextSelect
              value={value.mucusInStool}
              onChange={(v) => set('mucusInStool', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Nocturnal Bowel Movements">
            <TextSelect
              value={value.nocturnalBowelMovements}
              onChange={(v) => set('nocturnalBowelMovements', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Urgency">
            <TextSelect
              value={value.urgency}
              onChange={(v) => set('urgency', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Incontinence">
            <TextSelect
              value={value.incontinence}
              onChange={(v) => set('incontinence', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="E. Alarm Features (Red Flags)"
        description="Document presence of alarm features that may warrant urgent GI evaluation."
        accent={alarmsActive ? 'danger' : 'default'}
        className={alarmsActive ? 'ring-1 ring-destructive/30' : undefined}
      >
        <MultiSelectChips
          values={value.alarmFeatures || []}
          options={ALARM_FEATURE_OPTIONS}
          onToggle={(opt) => {
            const next = toggleListValue(value.alarmFeatures, opt);
            onChange({
              ...value,
              alarmFeatures: next,
              alarmAcknowledged: next.length === 0 ? false : value.alarmAcknowledged,
            });
          }}
          idPrefix="gi-alarm"
        />

        {alarmsActive && (
          <div className="mt-4 space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Urgent GI Evaluation Recommended
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One or more alarm features are selected. Document acknowledgement and a management
                  plan before completing this encounter.
                </p>
              </div>
            </div>
            {investigations.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended investigations
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                  {investigations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <Field label="Alarm Feature Management Plan" required>
              <TextTextarea
                value={value.alarmManagementPlan}
                onChange={(v) =>
                  onChange({
                    ...value,
                    alarmManagementPlan: v,
                    alarmAcknowledged: Boolean(String(v || '').trim()),
                  })
                }
                placeholder="Document urgent workup, referral, and follow-up plan…"
                rows={3}
              />
            </Field>
          </div>
        )}
      </SectionCard>

      <SectionCard title="F. Family History">
        <MultiSelectChips
          values={value.familyHistory || []}
          options={FAMILY_HISTORY_OPTIONS}
          onToggle={(opt) => toggle('familyHistory', opt)}
          idPrefix="gi-fh"
        />
      </SectionCard>

      <SectionCard title="G. Lifestyle & Risk Factors">
        <MultiSelectChips
          values={value.lifestyleRisks || []}
          options={LIFESTYLE_RISK_OPTIONS}
          onToggle={(opt) => toggle('lifestyleRisks', opt)}
          idPrefix="gi-risk"
        />
      </SectionCard>

      <SectionCard title="H. Assessment" accent="primary">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary Diagnosis">
            <IcdSearchField
              value={
                value.primaryDiagnosisCode
                  ? `${value.primaryDiagnosisCode}${
                      value.primaryDiagnosis ? ` — ${value.primaryDiagnosis}` : ''
                    }`
                  : value.primaryDiagnosis || ''
              }
              code={value.primaryDiagnosisCode}
              onSelect={(item) =>
                onChange({
                  ...value,
                  primaryDiagnosisId: item.id,
                  primaryDiagnosisCode: item.code,
                  primaryDiagnosis: item.description || item.display,
                })
              }
            />
          </Field>
          <Field label="Secondary Diagnosis">
            <IcdSearchField
              value={
                value.secondaryDiagnosisCode
                  ? `${value.secondaryDiagnosisCode}${
                      value.secondaryDiagnosis ? ` — ${value.secondaryDiagnosis}` : ''
                    }`
                  : value.secondaryDiagnosis || ''
              }
              code={value.secondaryDiagnosisCode}
              onSelect={(item) =>
                onChange({
                  ...value,
                  secondaryDiagnosisId: item.id,
                  secondaryDiagnosisCode: item.code,
                  secondaryDiagnosis: item.description || item.display,
                })
              }
            />
          </Field>
          <Field label="Clinical Impression" className="sm:col-span-2">
            <TextTextarea
              value={value.clinicalImpression}
              onChange={(v) => set('clinicalImpression', v)}
              rows={3}
            />
          </Field>
          <Field label="Provider Notes" className="sm:col-span-2">
            <TextTextarea
              value={value.providerNotes}
              onChange={(v) => set('providerNotes', v)}
              rows={3}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
