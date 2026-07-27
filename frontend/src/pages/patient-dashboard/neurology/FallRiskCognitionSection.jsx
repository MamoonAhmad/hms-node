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
  COGNITION_DOMAINS,
  FALL_RISK_QUESTIONS,
  PRECAUTION_OPTIONS,
} from './neurologyConstants';
import {
  cognitionMaxTotal,
  computeCognitionTotal,
  computeFallRiskScore,
  interpretCognition,
  interpretFallRisk,
  toggleListValue,
} from './neurologyUtils';

const VARIANT_CLASS = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
  info: 'status-soft-info',
};

export function FallRiskCognitionSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const responses = value.fallResponses || {};
  const scores = value.cognitionScores || {};

  const setResponse = (id, val) => {
    set('fallResponses', { ...responses, [id]: val });
  };

  const setScore = (id, val) => {
    set('cognitionScores', { ...scores, [id]: val });
  };

  const fallScore = computeFallRiskScore(responses);
  const fallResult = interpretFallRisk(fallScore, responses);
  const cogTotal = computeCognitionTotal(scores);
  const cogMax = cognitionMaxTotal();
  const cogResult = interpretCognition(cogTotal);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Specialty fall-risk and cognition workflow for neurology encounters. NIH Stroke Scale remains
        available under Intake when indicated; use this tab for ongoing fall/cognition management.
      </p>

      <SectionCard
        title="A. Fall risk screen"
        description="Scored specialty fall-risk checklist."
        accent="warning"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={VARIANT_CLASS[fallResult.variant] || VARIANT_CLASS.warning}>
            {fallResult.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Score {fallScore} · {fallResult.interpretation}
          </span>
        </div>

        <div className="space-y-3">
          {FALL_RISK_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{q.label}</p>
                <p className="text-xs text-muted-foreground">Yes = {q.yesPoints} pts</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`neuro-fall-${q.id}`}
                    className="h-4 w-4"
                    checked={responses[q.id] === 'yes'}
                    onChange={() => setResponse(q.id, 'yes')}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`neuro-fall-${q.id}`}
                    className="h-4 w-4"
                    checked={responses[q.id] !== 'yes'}
                    onChange={() => setResponse(q.id, 'no')}
                  />
                  No
                </label>
              </div>
            </div>
          ))}
        </div>

        <Field label="Fall risk notes" className="mt-3">
          <TextTextarea
            value={value.fallNotes}
            onChange={(v) => set('fallNotes', v)}
            rows={2}
            placeholder="Circumstances, injuries, near-falls…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="B. Cognition screen" accent="info">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={VARIANT_CLASS[cogResult.variant] || VARIANT_CLASS.info}>
            {cogResult.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {cogTotal}/{cogMax} · {cogResult.interpretation}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Assessment date">
            <TextInput
              type="date"
              value={value.assessedAt}
              onChange={(v) => set('assessedAt', v)}
            />
          </Field>
          <Field label="Tool">
            <TextSelect
              value={value.cognitionTool}
              onChange={(v) => set('cognitionTool', v)}
              options={[
                'Bedside screen (30-point)',
                'MMSE-style',
                'MoCA-style',
                'Clinical impression only',
              ]}
            />
          </Field>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COGNITION_DOMAINS.map((domain) => (
            <Field key={domain.id} label={`${domain.label} (max ${domain.max})`}>
              <TextInput
                type="number"
                min={0}
                max={domain.max}
                step={1}
                value={scores[domain.id]}
                onChange={(v) => setScore(domain.id, v)}
                placeholder={`0–${domain.max}`}
              />
            </Field>
          ))}
        </div>

        <Field label="Cognition notes" className="mt-3">
          <TextTextarea
            value={value.cognitionNotes}
            onChange={(v) => set('cognitionNotes', v)}
            rows={2}
            placeholder="Word-finding, memory complaints, occupational impact…"
          />
        </Field>
        <Field label="Caregiver / collateral concerns" className="mt-3">
          <TextTextarea
            value={value.caregiverConcerns}
            onChange={(v) => set('caregiverConcerns', v)}
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Precautions & plan" accent="primary">
        <Field label="Interventions selected">
          <MultiSelectChips
            idPrefix="neuro-precautions"
            options={PRECAUTION_OPTIONS}
            values={value.precautions}
            onToggle={(opt) => set('precautions', toggleListValue(value.precautions, opt))}
          />
        </Field>
        <Field label="Follow-up plan" className="mt-3">
          <TextTextarea
            value={value.followUpPlan}
            onChange={(v) => set('followUpPlan', v)}
            rows={3}
            placeholder="PT referral, home safety, neuropsych testing, med review…"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
