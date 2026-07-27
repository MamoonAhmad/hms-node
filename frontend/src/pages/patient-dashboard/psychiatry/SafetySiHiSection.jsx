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
  DISPOSITION_OPTIONS,
  PROTECTIVE_FACTOR_OPTIONS,
  RISK_FACTOR_OPTIONS,
  SAFETY_PRECAUTION_OPTIONS,
  SI_HI_QUESTIONS,
  VISIT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './psychiatryConstants';
import {
  countPositiveSiHi,
  interpretSafetyRisk,
  isSiHiQuestionVisible,
  toggleListValue,
} from './psychiatryUtils';

const VARIANT_CLASS = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
  info: 'status-soft-info',
};

export function SafetySiHiSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));
  const responses = value.responses || {};

  const setResponse = (id, val) => {
    set('responses', { ...responses, [id]: val });
  };

  const risk = interpretSafetyRisk(responses);
  const positiveCount = countPositiveSiHi(responses);
  const siQuestions = SI_HI_QUESTIONS.filter((q) => q.domain === 'SI');
  const hiQuestions = SI_HI_QUESTIONS.filter((q) => q.domain === 'HI');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Specialty safety workspace for suicidal ideation (SI) and homicidal ideation (HI). Risk
        banding updates as items are answered; complete disposition and precautions when indicated.
      </p>

      <SectionCard title="A. Visit Information" accent="info">
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
        </div>
      </SectionCard>

      <SectionCard
        title="B. Risk summary"
        description="Computed from SI-HI responses for this encounter."
        accent={risk.variant === 'danger' ? 'danger' : risk.variant === 'warning' ? 'warning' : 'success'}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={VARIANT_CLASS[risk.variant] || VARIANT_CLASS.info}>{risk.label}</Badge>
          <span className="text-sm text-muted-foreground">
            {positiveCount} positive item{positiveCount === 1 ? '' : 's'} · {risk.interpretation}
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Suicidal ideation (SI)"
        description="C-SSRS-style specialty screen. Dependent items appear when parent is Yes."
        accent="danger"
      >
        <div className="space-y-3">
          {siQuestions.map((q) => {
            if (!isSiHiQuestionVisible(q, responses)) return null;
            return (
              <div
                key={q.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="min-w-0 text-sm font-medium text-foreground">{q.label}</p>
                <div className="flex shrink-0 items-center gap-4">
                  {YES_NO_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`psych-si-${q.id}`}
                        className="h-4 w-4"
                        checked={responses[q.id] === opt}
                        onChange={() => setResponse(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="D. Homicidal ideation (HI)"
        description="Assess thoughts, target, plan/intent, and access to means."
        accent="warning"
      >
        <div className="space-y-3">
          {hiQuestions.map((q) => {
            if (!isSiHiQuestionVisible(q, responses)) return null;
            return (
              <div
                key={q.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="min-w-0 text-sm font-medium text-foreground">{q.label}</p>
                <div className="flex shrink-0 items-center gap-4">
                  {YES_NO_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`psych-hi-${q.id}`}
                        className="h-4 w-4"
                        checked={responses[q.id] === opt}
                        onChange={() => setResponse(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="E. Means, risk & protective factors" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Access to Lethal Means">
            <TextSelect
              value={value.accessToMeans}
              onChange={(v) => set('accessToMeans', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Firearms in Home">
            <TextSelect
              value={value.firearmsInHome}
              onChange={(v) => set('firearmsInHome', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Collateral Contacted">
            <TextSelect
              value={value.collateralContacted}
              onChange={(v) => set('collateralContacted', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Means Details" className="mt-3">
          <TextInput
            value={value.meansDetails}
            onChange={(v) => set('meansDetails', v)}
            placeholder="e.g. unlocked firearm, stockpiled meds"
          />
        </Field>
        <Field label="Risk Factors" className="mt-3">
          <MultiSelectChips
            idPrefix="psych-risk"
            options={RISK_FACTOR_OPTIONS}
            values={value.riskFactors}
            onToggle={(opt) => toggle('riskFactors', opt)}
          />
        </Field>
        <Field label="Protective Factors" className="mt-3">
          <MultiSelectChips
            idPrefix="psych-protect"
            options={PROTECTIVE_FACTOR_OPTIONS}
            values={value.protectiveFactors}
            onToggle={(opt) => toggle('protectiveFactors', opt)}
          />
        </Field>
        <Field label="Collateral Notes" className="mt-3">
          <TextTextarea
            value={value.collateralNotes}
            onChange={(v) => set('collateralNotes', v)}
            rows={2}
            placeholder="Who was contacted, what was shared…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="F. Precautions, disposition & plan" accent="info">
        <Field label="Safety Precautions">
          <MultiSelectChips
            idPrefix="psych-prec"
            options={SAFETY_PRECAUTION_OPTIONS}
            values={value.precautions}
            onToggle={(opt) => toggle('precautions', opt)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Disposition" required>
            <TextSelect
              value={value.disposition}
              onChange={(v) => set('disposition', v)}
              options={DISPOSITION_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Safety Plan Summary" className="mt-3">
          <TextTextarea
            value={value.safetyPlanSummary}
            onChange={(v) => set('safetyPlanSummary', v)}
            rows={3}
            placeholder="Warning signs, coping strategies, people/places for support, crisis contacts, means reduction…"
          />
        </Field>
        <Field label="Clinical Impression" className="mt-3">
          <TextTextarea
            value={value.clinicalImpression}
            onChange={(v) => set('clinicalImpression', v)}
            rows={2}
            placeholder="Clinical formulation of acute safety risk…"
          />
        </Field>
        <Field label="Provider Notes" className="mt-3">
          <TextTextarea
            value={value.providerNotes}
            onChange={(v) => set('providerNotes', v)}
            rows={2}
            placeholder="Additional documentation…"
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard title="G. Longitudinal safety history" accent="default">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Exam date</th>
                  <th className="px-2 py-2 font-medium">Risk</th>
                  <th className="px-2 py-2 font-medium">+ Items</th>
                  <th className="px-2 py-2 font-medium">Disposition</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row) => (
                  <tr key={`${row.at}-${row.appointmentId}`} className="border-b border-border/60">
                    <td className="px-2 py-2 text-muted-foreground">
                      {row.at ? new Date(row.at).toLocaleString() : '—'}
                    </td>
                    <td className="px-2 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-2 py-2 font-medium">{row.riskLabel || '—'}</td>
                    <td className="px-2 py-2">{row.positiveSiHi ?? '—'}</td>
                    <td className="px-2 py-2">{row.disposition || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
