import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ANNUAL_CARE_OPTIONS,
  CGM_DEVICE_OPTIONS,
  COMPLICATION_OPTIONS,
  DM_TYPE_OPTIONS,
  DM_VISIT_TYPE_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  GLYCEMIC_CONTROL_OPTIONS,
  HYPO_SEVERITY_OPTIONS,
  INSULIN_REGIMEN_OPTIONS,
  YES_NO_OPTIONS,
} from './endocrinologyConstants';
import { toggleListValue } from './endocrinologyUtils';

export function DiabetesCgmForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document diabetes type, glycemic control, CGM metrics, hypoglycemia risk, regimen, and
        complication screening for this encounter.
      </p>

      <SectionCard
        title="A. Visit & diabetes profile"
        description="Encounter context and diabetes classification."
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
              options={DM_VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Diabetes Type">
            <TextSelect
              value={value.dmType}
              onChange={(v) => set('dmType', v)}
              options={DM_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Diagnosis Date">
            <TextInput
              type="date"
              value={value.diagnosisDate}
              onChange={(v) => set('diagnosisDate', v)}
            />
          </Field>
          <Field label="Duration (years)">
            <TextInput
              value={value.durationYears}
              onChange={(v) => set('durationYears', v)}
              placeholder="e.g. 8"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Glycemic control"
        description="HbA1c, goals, and clinic glucose values."
        accent="warning"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Overall Control">
            <TextSelect
              value={value.glycemicControl}
              onChange={(v) => set('glycemicControl', v)}
              options={GLYCEMIC_CONTROL_OPTIONS}
            />
          </Field>
          <Field label="Latest HbA1c (%)">
            <TextInput
              value={value.latestA1c}
              onChange={(v) => set('latestA1c', v)}
              placeholder="7.4"
            />
          </Field>
          <Field label="HbA1c Date">
            <TextInput type="date" value={value.a1cDate} onChange={(v) => set('a1cDate', v)} />
          </Field>
          <Field label="Goal HbA1c (%)">
            <TextInput
              value={value.goalA1c}
              onChange={(v) => set('goalA1c', v)}
              placeholder="7.0"
            />
          </Field>
          <Field label="Fasting Glucose">
            <TextInput
              value={value.fastingGlucose}
              onChange={(v) => set('fastingGlucose', v)}
              placeholder="mg/dL"
            />
          </Field>
          <Field label="Post-prandial Glucose">
            <TextInput
              value={value.postPrandialGlucose}
              onChange={(v) => set('postPrandialGlucose', v)}
              placeholder="mg/dL"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. CGM metrics"
        description="Device status and ambulatory glucose profile summary."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CGM In Use">
            <TextSelect
              value={value.cgmInUse}
              onChange={(v) => set('cgmInUse', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="CGM Device">
            <TextSelect
              value={value.cgmDevice}
              onChange={(v) => set('cgmDevice', v)}
              options={CGM_DEVICE_OPTIONS}
            />
          </Field>
          <Field label="CGM Start Date">
            <TextInput
              type="date"
              value={value.cgmStartDate}
              onChange={(v) => set('cgmStartDate', v)}
            />
          </Field>
          <Field label="Time in Range (%)" hint="Typically 70–180 mg/dL">
            <TextInput
              value={value.timeInRange}
              onChange={(v) => set('timeInRange', v)}
              placeholder="68"
            />
          </Field>
          <Field label="Time Below Range (%)">
            <TextInput
              value={value.timeBelowRange}
              onChange={(v) => set('timeBelowRange', v)}
              placeholder="3"
            />
          </Field>
          <Field label="Time Above Range (%)">
            <TextInput
              value={value.timeAboveRange}
              onChange={(v) => set('timeAboveRange', v)}
              placeholder="29"
            />
          </Field>
          <Field label="GMI (%)">
            <TextInput value={value.gmi} onChange={(v) => set('gmi', v)} placeholder="7.2" />
          </Field>
          <Field label="Average Glucose">
            <TextInput
              value={value.avgGlucose}
              onChange={(v) => set('avgGlucose', v)}
              placeholder="mg/dL"
            />
          </Field>
          <Field label="Coefficient of Variation (%)">
            <TextInput
              value={value.coefficientOfVariation}
              onChange={(v) => set('coefficientOfVariation', v)}
              placeholder="36"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Hypo / hyperglycemia">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Hypoglycemia Severity">
            <TextSelect
              value={value.hypoSeverity}
              onChange={(v) => set('hypoSeverity', v)}
              options={HYPO_SEVERITY_OPTIONS}
            />
          </Field>
          <Field label="Hypoglycemia Episodes" className="sm:col-span-2">
            <TextTextarea
              value={value.hypoEpisodes}
              onChange={(v) => set('hypoEpisodes', v)}
              placeholder="Frequency, timing, triggers, unawareness…"
              rows={2}
            />
          </Field>
          <Field label="Hyperglycemia Notes" className="sm:col-span-3">
            <TextTextarea
              value={value.hyperEpisodes}
              onChange={(v) => set('hyperEpisodes', v)}
              placeholder="Dawn phenomenon, post-meal spikes, illness…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Medication & regimen">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Insulin Regimen">
            <TextSelect
              value={value.insulinRegimen}
              onChange={(v) => set('insulinRegimen', v)}
              options={INSULIN_REGIMEN_OPTIONS}
            />
          </Field>
          <Field label="GLP-1">
            <TextSelect value={value.glp1} onChange={(v) => set('glp1', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="SGLT2">
            <TextSelect
              value={value.sglt2}
              onChange={(v) => set('sglt2', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Oral / Non-insulin Agents" className="sm:col-span-2">
            <TextInput
              value={value.oralAgents}
              onChange={(v) => set('oralAgents', v)}
              placeholder="Metformin, DPP-4, etc."
            />
          </Field>
          <Field label="Compliance">
            <TextSelect
              value={value.compliance}
              onChange={(v) => set('compliance', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Insulin / Pump Details" className="sm:col-span-3">
            <TextTextarea
              value={value.insulinDetails}
              onChange={(v) => set('insulinDetails', v)}
              placeholder="Basal dose, ICR, ISF, pump settings…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="F. Complications & annual care">
        <Field label="Complication Screen">
          <MultiSelectChips
            values={value.complications || []}
            options={COMPLICATION_OPTIONS}
            onToggle={(opt) => set('complications', toggleListValue(value.complications, opt))}
            idPrefix="endo-dm-comp"
          />
        </Field>
        <Field label="Annual Care Completed / Reviewed">
          <MultiSelectChips
            values={value.annualCare || []}
            options={ANNUAL_CARE_OPTIONS}
            onToggle={(opt) => set('annualCare', toggleListValue(value.annualCare, opt))}
            idPrefix="endo-dm-annual"
          />
        </Field>
      </SectionCard>

      <SectionCard title="G. Lifestyle, plan & follow-up" accent="success">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Diet Education Provided">
            <TextSelect
              value={value.dietEducation}
              onChange={(v) => set('dietEducation', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Exercise Plan Discussed">
            <TextSelect
              value={value.exercisePlan}
              onChange={(v) => set('exercisePlan', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Weight Goal">
            <TextInput
              value={value.weightGoal}
              onChange={(v) => set('weightGoal', v)}
              placeholder="e.g. −5%"
            />
          </Field>
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
          <Field label="Clinical Notes" className="sm:col-span-3">
            <TextTextarea
              value={value.diabetesNotes}
              onChange={(v) => set('diabetesNotes', v)}
              placeholder="Additional diabetes / CGM narrative…"
              rows={2}
            />
          </Field>
          <Field label="Diabetes Plan" className="sm:col-span-3">
            <TextTextarea
              value={value.diabetesPlan}
              onChange={(v) => set('diabetesPlan', v)}
              placeholder="Regimen changes, CGM goals, referrals…"
              rows={3}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
