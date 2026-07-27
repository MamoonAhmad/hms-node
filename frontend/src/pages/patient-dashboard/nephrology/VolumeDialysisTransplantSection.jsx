import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../womens-health/WomensHealthFields';
import {
  BP_CONTROL_OPTIONS,
  DIALYSIS_ACCESS_OPTIONS,
  DIALYSIS_MODALITY_OPTIONS,
  EDEMA_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  TRANSPLANT_STATUS_OPTIONS,
  VOLUME_STATUS_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './nephrologyConstants';

export function VolumeDialysisTransplantSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document volume status, dialysis modality / access, and transplant evaluation or
        post-transplant status.
      </p>

      <SectionCard title="A. Volume status" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Examination date" required>
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
          <Field label="Volume status">
            <TextSelect
              value={value.volumeStatus}
              onChange={(v) => set('volumeStatus', v)}
              options={VOLUME_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Edema">
            <TextSelect
              value={value.edema}
              onChange={(v) => set('edema', v)}
              options={EDEMA_OPTIONS}
            />
          </Field>
          <Field label="Current weight (kg)">
            <TextInput
              value={value.weightKg}
              onChange={(v) => set('weightKg', v)}
              placeholder="e.g. 78.2"
            />
          </Field>
          <Field label="Dry weight (kg)">
            <TextInput
              value={value.dryWeightKg}
              onChange={(v) => set('dryWeightKg', v)}
              placeholder="Target / estimated"
            />
          </Field>
          <Field label="Weight change">
            <TextInput
              value={value.weightChange}
              onChange={(v) => set('weightChange', v)}
              placeholder="e.g. +1.5 kg since last visit"
            />
          </Field>
          <Field label="Orthostasis">
            <TextSelect
              value={value.orthostasis}
              onChange={(v) => set('orthostasis', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Elevated JVP">
            <TextSelect
              value={value.jvpElevated}
              onChange={(v) => set('jvpElevated', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Lung findings" className="mt-3">
          <TextTextarea
            value={value.lungFindings}
            onChange={(v) => set('lungFindings', v)}
            rows={2}
            placeholder="Crackles, clear, oxygen requirement…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="B. Blood pressure" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="BP control vs goal">
            <TextSelect
              value={value.bpControl}
              onChange={(v) => set('bpControl', v)}
              options={BP_CONTROL_OPTIONS}
            />
          </Field>
          <Field label="Target BP">
            <TextInput
              value={value.targetBp}
              onChange={(v) => set('targetBp', v)}
              placeholder="e.g. <130/80"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Dialysis status"
        description="Leave as not on dialysis when not applicable."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Modality">
            <TextSelect
              value={value.dialysisModality}
              onChange={(v) => set('dialysisModality', v)}
              options={DIALYSIS_MODALITY_OPTIONS}
            />
          </Field>
          <Field label="Access">
            <TextSelect
              value={value.dialysisAccess}
              onChange={(v) => set('dialysisAccess', v)}
              options={DIALYSIS_ACCESS_OPTIONS}
            />
          </Field>
          <Field label="Schedule">
            <TextInput
              value={value.dialysisSchedule}
              onChange={(v) => set('dialysisSchedule', v)}
              placeholder="e.g. MWF, nightly PD"
            />
          </Field>
          <Field label="Last dialysis date">
            <TextInput
              type="date"
              value={value.lastDialysisDate}
              onChange={(v) => set('lastDialysisDate', v)}
            />
          </Field>
          <Field label="UF / fluid goal">
            <TextInput
              value={value.ufGoal}
              onChange={(v) => set('ufGoal', v)}
              placeholder="e.g. 2 L UF"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Transplant status">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Transplant status">
            <TextSelect
              value={value.transplantStatus}
              onChange={(v) => set('transplantStatus', v)}
              options={TRANSPLANT_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Transplant center">
            <TextInput
              value={value.transplantCenter}
              onChange={(v) => set('transplantCenter', v)}
              placeholder="Center / program"
            />
          </Field>
          <Field label="Transplant date">
            <TextInput
              type="date"
              value={value.transplantDate}
              onChange={(v) => set('transplantDate', v)}
            />
          </Field>
        </div>
        <Field label="Immunosuppression" className="mt-3">
          <TextTextarea
            value={value.immunosuppression}
            onChange={(v) => set('immunosuppression', v)}
            rows={2}
            placeholder="Regimen, levels, recent changes…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="E. Plan & notes">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Follow-up interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-3">
          <Field label="Volume / dialysis / transplant plan">
            <TextTextarea
              value={value.volumePlan}
              onChange={(v) => set('volumePlan', v)}
              rows={2}
              placeholder="Diuretic adjustment, UF target, access plan, transplant next steps…"
            />
          </Field>
          <Field label="Clinical notes">
            <TextTextarea
              value={value.clinicalNotes}
              onChange={(v) => set('clinicalNotes', v)}
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
