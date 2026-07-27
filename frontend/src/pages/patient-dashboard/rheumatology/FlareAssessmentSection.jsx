import { Badge } from '@/components/ui/badge';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  FLARE_ACTIONS,
  FLARE_SEVERITY_OPTIONS,
  FLARE_SYSTEMIC_SYMPTOMS,
  FLARE_TRIGGERS,
  FUNCTIONAL_IMPACT_OPTIONS,
  YES_NO_OPTIONS,
} from './rheumatologyConstants';
import { interpretFlare, toggleListValue } from './rheumatologyUtils';

const VARIANT_CLASS = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
  info: 'status-soft-info',
  muted: 'status-soft-muted',
};

export function FlareAssessmentSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const result = interpretFlare(value);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Capture flare status, severity, triggers, systemic features, and the action plan for this
        encounter.
      </p>

      <SectionCard title="A. Flare status" accent="warning">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={VARIANT_CLASS[result.variant] || VARIANT_CLASS.muted}>
            {result.label}
          </Badge>
          <span className="text-sm text-muted-foreground">{result.interpretation}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Currently in flare?">
            <TextSelect
              value={value.inFlare}
              onChange={(v) => set('inFlare', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Assessment date">
            <TextInput
              type="date"
              value={value.assessedAt}
              onChange={(v) => set('assessedAt', v)}
            />
          </Field>
          <Field label="Onset date">
            <TextInput
              type="date"
              value={value.onsetDate}
              onChange={(v) => set('onsetDate', v)}
            />
          </Field>
          <Field label="Severity">
            <TextSelect
              value={value.severity}
              onChange={(v) => set('severity', v)}
              options={FLARE_SEVERITY_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Triggers & symptoms" accent="info">
        <Field label="Likely triggers">
          <MultiSelectChips
            idPrefix="rheum-flare-triggers"
            options={FLARE_TRIGGERS}
            values={value.triggers}
            onToggle={(opt) => set('triggers', toggleListValue(value.triggers, opt))}
          />
        </Field>
        <Field label="Joints / regions involved" className="mt-3">
          <TextInput
            value={value.jointsInvolved}
            onChange={(v) => set('jointsInvolved', v)}
            placeholder="e.g. bilateral wrists, R knee, small hand joints"
          />
        </Field>
        <Field label="Systemic symptoms" className="mt-3">
          <MultiSelectChips
            idPrefix="rheum-flare-systemic"
            options={FLARE_SYSTEMIC_SYMPTOMS}
            values={value.systemicSymptoms}
            onToggle={(opt) =>
              set('systemicSymptoms', toggleListValue(value.systemicSymptoms, opt))
            }
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Functional impact">
            <TextSelect
              value={value.functionalImpact}
              onChange={(v) => set('functionalImpact', v)}
              options={FUNCTIONAL_IMPACT_OPTIONS}
            />
          </Field>
          <Field label="Current therapy">
            <TextInput
              value={value.currentTherapy}
              onChange={(v) => set('currentTherapy', v)}
              placeholder="MTX, biologic, steroids…"
            />
          </Field>
        </div>
        <Field label="Response to current therapy" className="mt-3">
          <TextTextarea
            value={value.responseToTherapy}
            onChange={(v) => set('responseToTherapy', v)}
            rows={2}
            placeholder="Partial response, non-adherence, recent dose change…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Action plan" accent="primary">
        <Field label="Actions selected">
          <MultiSelectChips
            idPrefix="rheum-flare-actions"
            options={FLARE_ACTIONS}
            values={value.actions}
            onToggle={(opt) => set('actions', toggleListValue(value.actions, opt))}
          />
        </Field>
        <Field label="Plan details" className="mt-3">
          <TextTextarea
            value={value.plan}
            onChange={(v) => set('plan', v)}
            rows={3}
            placeholder="Steroid dose, hold biologic, labs ordered, return precautions…"
          />
        </Field>
        <Field label="Notes" className="mt-3">
          <TextTextarea
            value={value.notes}
            onChange={(v) => set('notes', v)}
            rows={2}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
