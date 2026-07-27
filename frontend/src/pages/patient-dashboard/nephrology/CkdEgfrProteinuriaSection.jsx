import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../womens-health/WomensHealthFields';
import {
  A_STAGE_OPTIONS,
  CKD_CAUSE_OPTIONS,
  CKD_STAGE_OPTIONS,
  EGFR_METHOD_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  PROTEINURIA_METHOD_OPTIONS,
  TREND_OPTIONS,
  VISIT_TYPE_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
  ckdStageFromEgfr,
  proteinuriaBandFromAcr,
} from './nephrologyConstants';

export function CkdEgfrProteinuriaSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const egfrBand = ckdStageFromEgfr(value.egfr);
  const acrBand = proteinuriaBandFromAcr(value.acr);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track CKD stage, eGFR trend, and proteinuria for this encounter. Suggested stage bands
        update from numeric eGFR / ACR when entered.
      </p>

      <SectionCard title="A. Visit information" accent="info">
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
          <Field label="Visit type">
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="CKD stage">
            <TextSelect
              value={value.ckdStage}
              onChange={(v) => set('ckdStage', v)}
              options={CKD_STAGE_OPTIONS}
            />
          </Field>
          <Field label="Primary cause">
            <TextSelect
              value={value.ckdCause}
              onChange={(v) => set('ckdCause', v)}
              options={CKD_CAUSE_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. eGFR / creatinine"
        description="Document current labs and trend vs prior value."
        accent="primary"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {egfrBand && (
            <Badge
              variant="outline"
              className={cn(
                egfrBand.tone === 'danger' && 'status-soft-danger',
                egfrBand.tone === 'warning' && 'status-soft-warning',
                egfrBand.tone === 'success' && 'status-soft-success',
              )}
            >
              Suggested {egfrBand.label}
            </Badge>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Creatinine (mg/dL)">
            <TextInput
              value={value.creatinine}
              onChange={(v) => set('creatinine', v)}
              placeholder="e.g. 1.4"
            />
          </Field>
          <Field label="eGFR (mL/min/1.73m²)">
            <TextInput
              value={value.egfr}
              onChange={(v) => set('egfr', v)}
              placeholder="e.g. 48"
            />
          </Field>
          <Field label="eGFR method">
            <TextSelect
              value={value.egfrMethod}
              onChange={(v) => set('egfrMethod', v)}
              options={EGFR_METHOD_OPTIONS}
            />
          </Field>
          <Field label="Lab date">
            <TextInput
              type="date"
              value={value.egfrDate}
              onChange={(v) => set('egfrDate', v)}
            />
          </Field>
          <Field label="Prior eGFR">
            <TextInput
              value={value.priorEgfr}
              onChange={(v) => set('priorEgfr', v)}
              placeholder="Carry-forward if available"
            />
          </Field>
          <Field label="eGFR trend">
            <TextSelect
              value={value.egfrTrend}
              onChange={(v) => set('egfrTrend', v)}
              options={TREND_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="C. Proteinuria / albuminuria" accent="warning">
        <div className="mb-3 flex flex-wrap gap-2">
          {acrBand && (
            <Badge
              variant="outline"
              className={cn(
                acrBand.tone === 'danger' && 'status-soft-danger',
                acrBand.tone === 'warning' && 'status-soft-warning',
                acrBand.tone === 'success' && 'status-soft-success',
              )}
            >
              Suggested {acrBand.label}
            </Badge>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Measurement method">
            <TextSelect
              value={value.proteinuriaMethod}
              onChange={(v) => set('proteinuriaMethod', v)}
              options={PROTEINURIA_METHOD_OPTIONS}
            />
          </Field>
          <Field label="Urine ACR (mg/g)">
            <TextInput
              value={value.acr}
              onChange={(v) => set('acr', v)}
              placeholder="e.g. 120"
            />
          </Field>
          <Field label="Urine PCR (mg/g)">
            <TextInput
              value={value.pcr}
              onChange={(v) => set('pcr', v)}
              placeholder="Optional"
            />
          </Field>
          <Field label="24-hour protein (g/day)">
            <TextInput
              value={value.urineProtein24h}
              onChange={(v) => set('urineProtein24h', v)}
              placeholder="Optional"
            />
          </Field>
          <Field label="A stage (albuminuria)">
            <TextSelect
              value={value.aStage}
              onChange={(v) => set('aStage', v)}
              options={A_STAGE_OPTIONS}
            />
          </Field>
          <Field label="Proteinuria trend">
            <TextSelect
              value={value.proteinuriaTrend}
              onChange={(v) => set('proteinuriaTrend', v)}
              options={TREND_OPTIONS}
            />
          </Field>
          <Field label="Hematuria">
            <TextSelect
              value={value.hematuria}
              onChange={(v) => set('hematuria', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Related labs & BP">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="BP systolic">
            <TextInput
              value={value.bpSystolic}
              onChange={(v) => set('bpSystolic', v)}
              placeholder="mmHg"
            />
          </Field>
          <Field label="BP diastolic">
            <TextInput
              value={value.bpDiastolic}
              onChange={(v) => set('bpDiastolic', v)}
              placeholder="mmHg"
            />
          </Field>
          <Field label="Potassium">
            <TextInput
              value={value.potassium}
              onChange={(v) => set('potassium', v)}
              placeholder="mEq/L"
            />
          </Field>
          <Field label="Bicarbonate">
            <TextInput
              value={value.bicarbonate}
              onChange={(v) => set('bicarbonate', v)}
              placeholder="mEq/L"
            />
          </Field>
          <Field label="Hemoglobin">
            <TextInput
              value={value.hemoglobin}
              onChange={(v) => set('hemoglobin', v)}
              placeholder="g/dL"
            />
          </Field>
          <Field label="Follow-up interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-3">
          <Field label="Clinical notes">
            <TextTextarea
              value={value.clinicalNotes}
              onChange={(v) => set('clinicalNotes', v)}
              rows={2}
              placeholder="Interpretation, AKI vs CKD progression, complications…"
            />
          </Field>
          <Field label="Plan">
            <TextTextarea
              value={value.planNotes}
              onChange={(v) => set('planNotes', v)}
              rows={2}
              placeholder="Labs, BP target, ACE/ARB/SGLT2, nephrology follow-up…"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
