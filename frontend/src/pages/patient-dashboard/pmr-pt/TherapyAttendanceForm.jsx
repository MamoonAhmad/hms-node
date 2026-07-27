import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ATTENDANCE_STATUS_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  HEP_COMPLIANCE_OPTIONS,
  THERAPY_FREQUENCY_OPTIONS,
  WORK_RESTRICTION_OPTIONS,
  WORK_STATUS_OPTIONS,
  YES_NO_OPTIONS,
} from './pmrPtConstants';
import { toggleListValue } from './pmrPtUtils';

export function TherapyAttendanceForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track therapy attendance, home exercise program compliance, and work restrictions for
        this encounter.
      </p>

      <SectionCard
        title="A. Visit context"
        description="Encounter details for therapy / work documentation."
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
          <Field label="Prescribed therapy frequency">
            <TextSelect
              value={value.therapyFrequency}
              onChange={(v) => set('therapyFrequency', v)}
              options={THERAPY_FREQUENCY_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Therapy attendance"
        description="Session adherence for the current episode of care."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Attendance today">
            <TextSelect
              value={value.attendanceStatus}
              onChange={(v) => set('attendanceStatus', v)}
              options={ATTENDANCE_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Sessions attended">
            <TextInput
              type="number"
              min={0}
              value={value.sessionsAttended}
              onChange={(v) => set('sessionsAttended', v)}
              placeholder="e.g. 6"
            />
          </Field>
          <Field label="Sessions scheduled">
            <TextInput
              type="number"
              min={0}
              value={value.sessionsScheduled}
              onChange={(v) => set('sessionsScheduled', v)}
              placeholder="e.g. 12"
            />
          </Field>
          <Field label="Attendance notes" className="sm:col-span-2 lg:col-span-4">
            <TextTextarea
              value={value.attendanceNotes}
              onChange={(v) => set('attendanceNotes', v)}
              placeholder="Missed visits, transportation issues, make-up plan…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Home exercise program (HEP)"
        description="Exercises issued and patient compliance."
        accent="success"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="HEP issued / reviewed">
            <TextSelect
              value={value.hepIssued}
              onChange={(v) => set('hepIssued', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="HEP compliance">
            <TextSelect
              value={value.hepCompliance}
              onChange={(v) => set('hepCompliance', v)}
              options={HEP_COMPLIANCE_OPTIONS}
            />
          </Field>
          <Field label="HEP exercises" className="sm:col-span-2">
            <TextTextarea
              value={value.hepExercises}
              onChange={(v) => set('hepExercises', v)}
              placeholder="List key HEP exercises, sets/reps, frequency…"
              rows={3}
            />
          </Field>
          <Field label="HEP barriers">
            <TextTextarea
              value={value.hepBarriers}
              onChange={(v) => set('hepBarriers', v)}
              placeholder="Pain, time, understanding, equipment…"
              rows={2}
            />
          </Field>
          <Field label="HEP progression">
            <TextTextarea
              value={value.hepProgression}
              onChange={(v) => set('hepProgression', v)}
              placeholder="Progressions / regressions made today…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="D. Work restrictions"
        description="Work status and duty restrictions for this visit."
        accent="warning"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Work status">
            <TextSelect
              value={value.workStatus}
              onChange={(v) => set('workStatus', v)}
              options={WORK_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Restriction start">
            <TextInput
              type="date"
              value={value.workRestrictionStart}
              onChange={(v) => set('workRestrictionStart', v)}
            />
          </Field>
          <Field label="Restriction end / review">
            <TextInput
              type="date"
              value={value.workRestrictionEnd}
              onChange={(v) => set('workRestrictionEnd', v)}
            />
          </Field>
        </div>
        <Field label="Restrictions">
          <MultiSelectChips
            idPrefix="pmr-work-rest"
            values={value.workRestrictions || []}
            options={WORK_RESTRICTION_OPTIONS}
            onToggle={(opt) => toggle('workRestrictions', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Restriction notes">
            <TextTextarea
              value={value.workRestrictionNotes}
              onChange={(v) => set('workRestrictionNotes', v)}
              placeholder="Specific duties, hours, employer instructions…"
              rows={2}
            />
          </Field>
          <Field label="Return-to-work plan">
            <TextTextarea
              value={value.returnToWorkPlan}
              onChange={(v) => set('returnToWorkPlan', v)}
              placeholder="Criteria / timeline for advancing duty…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Plan notes">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Clinical notes" className="sm:col-span-2">
            <TextTextarea
              value={value.clinicalNotes}
              onChange={(v) => set('clinicalNotes', v)}
              placeholder="Additional therapy / HEP / work documentation…"
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
