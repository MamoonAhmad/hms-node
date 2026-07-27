import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  FOLLOW_UP_INTERVAL_OPTIONS,
  PAIN_LOCATION_OPTIONS,
  PAIN_QUALITY_OPTIONS,
  ROM_JOINT_OPTIONS,
  ROM_SIDE_OPTIONS,
  STRENGTH_GRADE_OPTIONS,
} from './pmrPtConstants';
import { toggleListValue } from './pmrPtUtils';

function painTone(score) {
  const n = Number(score);
  if (Number.isNaN(n) || score === '' || score == null) return null;
  if (n <= 3) return { label: 'Mild', tone: 'success' };
  if (n <= 6) return { label: 'Moderate', tone: 'warning' };
  return { label: 'Severe', tone: 'danger' };
}

const TONE_CLASS = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
};

export function PainRomStrengthForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  const activityTone = painTone(value.painWithActivity);
  const restTone = painTone(value.painAtRest);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Capture pain scores, range of motion, and strength findings for rehab decision-making.
      </p>

      <SectionCard
        title="A. Visit context"
        description="Encounter details for this rehab exam."
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
          <Field label="Primary pain location">
            <TextSelect
              value={value.painLocation}
              onChange={(v) => set('painLocation', v)}
              options={PAIN_LOCATION_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Pain assessment"
        description="0–10 numeric pain rating and quality."
        accent="warning"
        actions={
          (activityTone || restTone) && (
            <div className="flex flex-wrap gap-2">
              {restTone && (
                <Badge variant="outline" className={cn(TONE_CLASS[restTone.tone])}>
                  Rest {value.painAtRest}/10 · {restTone.label}
                </Badge>
              )}
              {activityTone && (
                <Badge variant="outline" className={cn(TONE_CLASS[activityTone.tone])}>
                  Activity {value.painWithActivity}/10 · {activityTone.label}
                </Badge>
              )}
            </div>
          )
        }
      >
        <Field label="Pain regions">
          <MultiSelectChips
            idPrefix="pmr-pain-loc"
            values={value.painLocations || []}
            options={PAIN_LOCATION_OPTIONS}
            onToggle={(opt) => toggle('painLocations', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Pain at rest (0–10)">
            <TextInput
              type="number"
              min={0}
              max={10}
              step={1}
              value={value.painAtRest}
              onChange={(v) => set('painAtRest', v)}
              placeholder="0–10"
            />
          </Field>
          <Field label="Pain with activity (0–10)">
            <TextInput
              type="number"
              min={0}
              max={10}
              step={1}
              value={value.painWithActivity}
              onChange={(v) => set('painWithActivity', v)}
              placeholder="0–10"
            />
          </Field>
          <Field label="Worst (0–10)">
            <TextInput
              type="number"
              min={0}
              max={10}
              step={1}
              value={value.painWorst}
              onChange={(v) => set('painWorst', v)}
            />
          </Field>
          <Field label="Best (0–10)">
            <TextInput
              type="number"
              min={0}
              max={10}
              step={1}
              value={value.painBest}
              onChange={(v) => set('painBest', v)}
            />
          </Field>
        </div>
        <Field label="Pain quality">
          <MultiSelectChips
            idPrefix="pmr-pain-q"
            values={value.painQuality || []}
            options={PAIN_QUALITY_OPTIONS}
            onToggle={(opt) => toggle('painQuality', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aggravating factors">
            <TextTextarea
              value={value.painAggravators}
              onChange={(v) => set('painAggravators', v)}
              placeholder="Sitting, stairs, lifting…"
              rows={2}
            />
          </Field>
          <Field label="Easing factors">
            <TextTextarea
              value={value.painEasers}
              onChange={(v) => set('painEasers', v)}
              placeholder="Rest, ice, positioning…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Range of motion"
        description="Active / passive ROM for the joint of focus."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Joint">
            <TextSelect
              value={value.romJoint}
              onChange={(v) => set('romJoint', v)}
              options={ROM_JOINT_OPTIONS}
            />
          </Field>
          <Field label="Side">
            <TextSelect
              value={value.romSide}
              onChange={(v) => set('romSide', v)}
              options={ROM_SIDE_OPTIONS}
            />
          </Field>
          <Field label="End-feel">
            <TextInput
              value={value.romEndFeel}
              onChange={(v) => set('romEndFeel', v)}
              placeholder="Firm, empty, soft…"
            />
          </Field>
          <Field label="Active ROM">
            <TextInput
              value={value.romActive}
              onChange={(v) => set('romActive', v)}
              placeholder="e.g. Flexion 90°, Extension −5°"
            />
          </Field>
          <Field label="Passive ROM">
            <TextInput
              value={value.romPassive}
              onChange={(v) => set('romPassive', v)}
              placeholder="e.g. Flexion 110°"
            />
          </Field>
          <Field label="ROM notes" className="sm:col-span-2 lg:col-span-3">
            <TextTextarea
              value={value.romNotes}
              onChange={(v) => set('romNotes', v)}
              placeholder="Compare to contralateral side, pain with motion…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="D. Strength"
        description="Manual muscle testing / strength grade."
        accent="success"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Joint / muscle group">
            <TextInput
              value={value.strengthJoint}
              onChange={(v) => set('strengthJoint', v)}
              placeholder="e.g. Quadriceps, shoulder abductors"
            />
          </Field>
          <Field label="Side">
            <TextSelect
              value={value.strengthSide}
              onChange={(v) => set('strengthSide', v)}
              options={ROM_SIDE_OPTIONS}
            />
          </Field>
          <Field label="Strength grade">
            <TextSelect
              value={value.strengthGrade}
              onChange={(v) => set('strengthGrade', v)}
              options={STRENGTH_GRADE_OPTIONS}
            />
          </Field>
          <Field label="Strength notes" className="sm:col-span-2 lg:col-span-3">
            <TextTextarea
              value={value.strengthNotes}
              onChange={(v) => set('strengthNotes', v)}
              placeholder="Fatigue, compensatory patterns, MMT comments…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Additional findings & plan">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Special tests">
            <TextTextarea
              value={value.specialTests}
              onChange={(v) => set('specialTests', v)}
              placeholder="Positive / negative special tests…"
              rows={2}
            />
          </Field>
          <Field label="Functional mobility">
            <TextTextarea
              value={value.functionalMobility}
              onChange={(v) => set('functionalMobility', v)}
              placeholder="Gait, transfers, sit-to-stand…"
              rows={2}
            />
          </Field>
          <Field label="Clinical notes" className="sm:col-span-2">
            <TextTextarea
              value={value.clinicalNotes}
              onChange={(v) => set('clinicalNotes', v)}
              placeholder="Impression and rehab implications…"
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
