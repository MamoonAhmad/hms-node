import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AUA_FREQUENCY_OPTIONS,
  AUA_NOCTURIA_OPTIONS,
  AUA_QOL_OPTIONS,
  AUA_SYMPTOM_QUESTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  LUTS_DURATION_OPTIONS,
  LUTS_PLAN_OPTIONS,
  LUTS_VISIT_TYPE_OPTIONS,
} from './urologyConstants';
import { auaSeverityLabel, computeAuaScore, toggleListValue } from './urologyUtils';

const SEVERITY_BADGE = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
};

function ScoreSelect({ value, onChange, options, placeholder = 'Select score…' }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LutsAuaScoreForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setAnswer = (id, next) =>
    onChange({ ...value, answers: { ...(value.answers || {}), [id]: next } });

  const score = computeAuaScore(value.answers);
  const severity = score?.complete ? auaSeverityLabel(score.total) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document lower urinary tract symptoms and complete the AUA Symptom Index (IPSS).
        Score range 0–35; quality of life is scored separately (0–6).
      </p>

      <SectionCard
        title="A. Visit context"
        description="Encounter details for this LUTS / AUA assessment."
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
              options={LUTS_VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Symptom Duration">
            <TextSelect
              value={value.symptomDuration}
              onChange={(v) => set('symptomDuration', v)}
              options={LUTS_DURATION_OPTIONS}
            />
          </Field>
          <Field label="Prior Therapy" className="sm:col-span-2">
            <TextInput
              value={value.priorTherapy}
              onChange={(v) => set('priorTherapy', v)}
              placeholder="e.g. tamsulosin 0.4 mg, prior TURP…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. AUA Symptom Index (IPSS)"
        description="Seven questions over the past month. Each item 0–5."
        accent="primary"
        actions={
          score ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="status-soft-info tabular-nums">
                Score {score.total}
                {!score.complete ? ` / partial (${score.answered}/7)` : ' / 35'}
              </Badge>
              {severity && (
                <Badge variant="outline" className={cn(SEVERITY_BADGE[severity.tone])}>
                  {severity.label}
                </Badge>
              )}
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          {AUA_SYMPTOM_QUESTIONS.map((q, idx) => {
            const options =
              q.id === 'nocturia' ? AUA_NOCTURIA_OPTIONS : AUA_FREQUENCY_OPTIONS;
            return (
              <div
                key={q.id}
                className="rounded-lg border border-border/80 bg-muted/20 px-3 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {idx + 1}. {q.label}
                </p>
                <p className="mt-1 text-sm text-foreground">{q.prompt}</p>
                <div className="mt-2 max-w-lg">
                  <ScoreSelect
                    value={value.answers?.[q.id] || ''}
                    onChange={(v) => setAnswer(q.id, v)}
                    options={options}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="C. Quality of life" accent="warning">
        <Field
          label="If you were to spend the rest of your life with your urinary condition just the way it is now, how would you feel about that?"
          hint="AUA QoL score 0 (delighted) – 6 (terrible)."
        >
          <div className="max-w-lg">
            <ScoreSelect
              value={value.qualityOfLife}
              onChange={(v) => set('qualityOfLife', v)}
              options={AUA_QOL_OPTIONS}
              placeholder="Select QoL…"
            />
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="D. Objective measures">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Post-void residual (mL)">
            <TextInput
              value={value.pvrMl}
              onChange={(v) => set('pvrMl', v)}
              placeholder="e.g. 80"
            />
          </Field>
          <Field label="Uroflow / other notes">
            <TextInput
              value={value.uroflowNotes}
              onChange={(v) => set('uroflowNotes', v)}
              placeholder="Qmax, pattern…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Plan & follow-up" accent="success">
        <Field label="Plan">
          <MultiSelectChips
            values={value.planItems || []}
            options={LUTS_PLAN_OPTIONS}
            onToggle={(opt) => set('planItems', toggleListValue(value.planItems, opt))}
            idPrefix="uro-luts-plan"
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
            placeholder="Additional LUTS / AUA documentation…"
            rows={3}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
