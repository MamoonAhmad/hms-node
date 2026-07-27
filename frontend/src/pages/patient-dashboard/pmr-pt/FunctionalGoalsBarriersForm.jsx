import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ASSISTIVE_DEVICE_OPTIONS,
  BARRIER_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  FUNCTIONAL_DOMAIN_OPTIONS,
  GOAL_STATUS_OPTIONS,
  GOAL_TIMEFRAME_OPTIONS,
  VISIT_TYPE_OPTIONS,
} from './pmrPtConstants';
import { toggleListValue } from './pmrPtUtils';

export function FunctionalGoalsBarriersForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document functional goals, current vs prior level of function, and barriers that may
        affect rehab progress for this encounter.
      </p>

      <SectionCard
        title="A. Visit context"
        description="Encounter details for this PM&R / PT goals review."
        accent="info"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Examination Date" required>
            <TextInput
              type="date"
              value={value.examinationDate}
              onChange={(v) => set('examinationDate', v)}
            />
          </Field>
          <Field label="Provider" required>
            <TextInput
              value={value.provider}
              onChange={(v) => set('provider', v)}
              placeholder="Encounter provider"
            />
          </Field>
          <Field label="Visit Type">
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Primary rehab diagnosis" className="sm:col-span-2 lg:col-span-3">
            <TextInput
              value={value.primaryDiagnosis}
              onChange={(v) => set('primaryDiagnosis', v)}
              placeholder="e.g. Right knee OA s/p TKA, lumbar radiculopathy…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Functional status"
        description="Domains of focus and level of function."
        accent="primary"
      >
        <Field label="Functional domains">
          <MultiSelectChips
            idPrefix="pmr-domain"
            values={value.functionalDomains || []}
            options={FUNCTIONAL_DOMAIN_OPTIONS}
            onToggle={(opt) => toggle('functionalDomains', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prior level of function">
            <TextTextarea
              value={value.priorLevelOfFunction}
              onChange={(v) => set('priorLevelOfFunction', v)}
              placeholder="Baseline function before injury / decline…"
              rows={3}
            />
          </Field>
          <Field label="Current level of function">
            <TextTextarea
              value={value.currentLevelOfFunction}
              onChange={(v) => set('currentLevelOfFunction', v)}
              placeholder="Current abilities, assistance needed…"
              rows={3}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Goals"
        description="Short- and long-term functional goals with status."
        accent="success"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Short-term goal" className="sm:col-span-2">
            <TextTextarea
              value={value.shortTermGoal}
              onChange={(v) => set('shortTermGoal', v)}
              placeholder="Measurable short-term functional goal…"
              rows={2}
            />
          </Field>
          <Field label="Short-term status">
            <TextSelect
              value={value.shortTermStatus}
              onChange={(v) => set('shortTermStatus', v)}
              options={GOAL_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Short-term timeframe">
            <TextSelect
              value={value.shortTermTimeframe}
              onChange={(v) => set('shortTermTimeframe', v)}
              options={GOAL_TIMEFRAME_OPTIONS}
            />
          </Field>
          <Field label="Long-term goal" className="sm:col-span-2">
            <TextTextarea
              value={value.longTermGoal}
              onChange={(v) => set('longTermGoal', v)}
              placeholder="Measurable long-term functional goal…"
              rows={2}
            />
          </Field>
          <Field label="Long-term status">
            <TextSelect
              value={value.longTermStatus}
              onChange={(v) => set('longTermStatus', v)}
              options={GOAL_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Long-term timeframe">
            <TextSelect
              value={value.longTermTimeframe}
              onChange={(v) => set('longTermTimeframe', v)}
              options={GOAL_TIMEFRAME_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="D. Barriers & supports"
        description="Factors limiting progress and devices in use."
        accent="warning"
      >
        <Field label="Barriers">
          <MultiSelectChips
            idPrefix="pmr-barrier"
            values={value.barriers || []}
            options={BARRIER_OPTIONS}
            onToggle={(opt) => toggle('barriers', opt)}
          />
        </Field>
        <Field label="Barrier notes">
          <TextTextarea
            value={value.barrierNotes}
            onChange={(v) => set('barrierNotes', v)}
            placeholder="Details on barriers and mitigation plan…"
            rows={2}
          />
        </Field>
        <Field label="Assistive devices">
          <MultiSelectChips
            idPrefix="pmr-device"
            values={value.assistiveDevices || []}
            options={ASSISTIVE_DEVICE_OPTIONS}
            onToggle={(opt) => toggle('assistiveDevices', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Safety concerns">
            <TextTextarea
              value={value.safetyConcerns}
              onChange={(v) => set('safetyConcerns', v)}
              placeholder="Fall risk, precautions, supervision needs…"
              rows={2}
            />
          </Field>
          <Field label="Engagement / motivation">
            <TextTextarea
              value={value.patientMotivation}
              onChange={(v) => set('patientMotivation', v)}
              placeholder="Patient engagement, learning preferences…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Plan notes" description="Additional clinical notes and follow-up.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Clinical notes" className="sm:col-span-2">
            <TextTextarea
              value={value.clinicalNotes}
              onChange={(v) => set('clinicalNotes', v)}
              placeholder="Additional goals / barriers documentation…"
              rows={3}
            />
          </Field>
          <Field label="Follow-up">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
