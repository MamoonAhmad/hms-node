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
  HEMATURIA_DURATION_OPTIONS,
  HEMATURIA_PLAN_OPTIONS,
  HEMATURIA_RISK_OPTIONS,
  HEMATURIA_SYMPTOM_OPTIONS,
  HEMATURIA_TIMING_OPTIONS,
  HEMATURIA_TYPE_OPTIONS,
  HEMATURIA_WORKUP_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './urologyConstants';
import { toggleListValue } from './urologyUtils';

export function HematuriaWorkupForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Risk-stratified hematuria assessment — type, timing, risk factors, workup, and plan.
      </p>

      <SectionCard
        title="A. Characterization"
        description="Gross vs microscopic, timing, and episode history."
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
          <Field label="Hematuria Type">
            <TextSelect
              value={value.hematuriaType}
              onChange={(v) => set('hematuriaType', v)}
              options={HEMATURIA_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Timing in Stream">
            <TextSelect
              value={value.timing}
              onChange={(v) => set('timing', v)}
              options={HEMATURIA_TIMING_OPTIONS}
            />
          </Field>
          <Field label="Duration / Pattern">
            <TextSelect
              value={value.duration}
              onChange={(v) => set('duration', v)}
              options={HEMATURIA_DURATION_OPTIONS}
            />
          </Field>
          <Field label="RBC / HPF">
            <TextInput
              value={value.rbcPerHpf}
              onChange={(v) => set('rbcPerHpf', v)}
              placeholder="e.g. 10–20"
            />
          </Field>
          <Field label="First Episode?">
            <TextSelect
              value={value.firstEpisode}
              onChange={(v) => set('firstEpisode', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Associated symptoms" accent="warning">
        <Field label="Symptoms">
          <MultiSelectChips
            values={value.associatedSymptoms || []}
            options={HEMATURIA_SYMPTOM_OPTIONS}
            onToggle={(opt) =>
              set('associatedSymptoms', toggleListValue(value.associatedSymptoms, opt))
            }
            idPrefix="uro-hem-sx"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="C. Risk factors"
        description="Factors that escalate imaging / cystoscopy need."
        accent="danger"
      >
        <Field label="Risk Factors">
          <MultiSelectChips
            values={value.riskFactors || []}
            options={HEMATURIA_RISK_OPTIONS}
            onToggle={(opt) => set('riskFactors', toggleListValue(value.riskFactors, opt))}
            idPrefix="uro-hem-risk"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="On Anticoagulation / Antiplatelet">
            <TextSelect
              value={value.anticoagulated}
              onChange={(v) => set('anticoagulated', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Recent UTI">
            <TextSelect
              value={value.recentUtI}
              onChange={(v) => set('recentUtI', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Smoking Status">
            <TextInput
              value={value.smokingStatus}
              onChange={(v) => set('smokingStatus', v)}
              placeholder="Never / Former / Current"
            />
          </Field>
          <Field label="Pack-Years">
            <TextInput
              value={value.packYears}
              onChange={(v) => set('packYears', v)}
              placeholder="e.g. 20"
            />
          </Field>
          <Field label="Occupational Exposure" className="sm:col-span-2">
            <TextInput
              value={value.occupationExposure}
              onChange={(v) => set('occupationExposure', v)}
              placeholder="Dyes, solvents, aromatic amines…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Workup ordered / completed" accent="primary">
        <Field label="Studies & Labs">
          <MultiSelectChips
            values={value.workupOrdered || []}
            options={HEMATURIA_WORKUP_OPTIONS}
            onToggle={(opt) =>
              set('workupOrdered', toggleListValue(value.workupOrdered, opt))
            }
            idPrefix="uro-hem-workup"
          />
        </Field>
        <Field label="Imaging Findings">
          <TextTextarea
            value={value.imagingFindings}
            onChange={(v) => set('imagingFindings', v)}
            placeholder="CTU / US summary…"
            rows={2}
          />
        </Field>
        <Field label="Cystoscopy Findings">
          <TextTextarea
            value={value.cystoscopyFindings}
            onChange={(v) => set('cystoscopyFindings', v)}
            placeholder="Bladder mucosa, tumors, stones…"
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="E. Plan & follow-up" accent="success">
        <Field label="Plan">
          <MultiSelectChips
            values={value.planItems || []}
            options={HEMATURIA_PLAN_OPTIONS}
            onToggle={(opt) => set('planItems', toggleListValue(value.planItems, opt))}
            idPrefix="uro-hem-plan"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Clinical Notes">
          <TextTextarea
            value={value.clinicalNotes}
            onChange={(v) => set('clinicalNotes', v)}
            placeholder="Additional hematuria documentation…"
            rows={3}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
