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
  BIOLOGIC_CLEARANCE_OPTIONS,
  BIOLOGIC_RISK_QUESTIONS,
  HEP_STATUS_OPTIONS,
  TB_STATUS_OPTIONS,
  VACCINE_CHECK_OPTIONS,
} from './rheumatologyConstants';
import { interpretBiologicRisk, toggleListValue } from './rheumatologyUtils';

const VARIANT_CLASS = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
  info: 'status-soft-info',
  muted: 'status-soft-muted',
};

export function BiologicInfectionRiskSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const responses = value.responses || {};
  const result = interpretBiologicRisk(responses, value.clearance);

  const setResponse = (id, val) => {
    set('responses', { ...responses, [id]: val });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Infection-risk screen before starting or continuing biologic / targeted therapy. Blocking
        items should defer treatment until resolved.
      </p>

      <SectionCard title="A. Planned therapy & clearance" accent="info">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={VARIANT_CLASS[result.variant] || VARIANT_CLASS.muted}>
            {result.label}
          </Badge>
          <span className="text-sm text-muted-foreground">{result.interpretation}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Assessment date">
            <TextInput
              type="date"
              value={value.assessedAt}
              onChange={(v) => set('assessedAt', v)}
            />
          </Field>
          <Field label="Planned / current biologic / JAKi">
            <TextInput
              value={value.plannedTherapy}
              onChange={(v) => set('plannedTherapy', v)}
              placeholder="e.g. Adalimumab, Tocilizumab, Tofacitinib"
            />
          </Field>
          <Field label="Clearance decision">
            <TextSelect
              value={value.clearance}
              onChange={(v) => set('clearance', v)}
              options={BIOLOGIC_CLEARANCE_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Infection-risk checklist"
        description="Yes on a blocking item recommends deferral."
        accent="warning"
      >
        <div className="space-y-3">
          {BIOLOGIC_RISK_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{q.label}</p>
                <p className="text-xs text-muted-foreground">
                  {q.yesBlocks ? 'Blocking if Yes' : 'Caution if Yes'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`rheum-bio-${q.id}`}
                    className="h-4 w-4"
                    checked={responses[q.id] === 'yes'}
                    onChange={() => setResponse(q.id, 'yes')}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`rheum-bio-${q.id}`}
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
      </SectionCard>

      <SectionCard title="C. Screening labs & vaccines" accent="primary">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="TB status">
            <TextSelect
              value={value.tbStatus}
              onChange={(v) => set('tbStatus', v)}
              options={TB_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Hepatitis B">
            <TextSelect
              value={value.hepBStatus}
              onChange={(v) => set('hepBStatus', v)}
              options={HEP_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Hepatitis C">
            <TextSelect
              value={value.hepCStatus}
              onChange={(v) => set('hepCStatus', v)}
              options={HEP_STATUS_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Vaccine / prevention checklist" className="mt-3">
          <MultiSelectChips
            idPrefix="rheum-bio-vax"
            options={VACCINE_CHECK_OPTIONS}
            values={value.vaccineChecks}
            onToggle={(opt) =>
              set('vaccineChecks', toggleListValue(value.vaccineChecks, opt))
            }
          />
        </Field>

        <Field label="Labs reviewed" className="mt-3">
          <TextTextarea
            value={value.labsReviewed}
            onChange={(v) => set('labsReviewed', v)}
            rows={2}
            placeholder="IGRA date/result, HBsAg, anti-HBc, HCV Ab, CBC, LFTs…"
          />
        </Field>
        <Field label="Precautions / counseling" className="mt-3">
          <TextTextarea
            value={value.precautions}
            onChange={(v) => set('precautions', v)}
            rows={2}
            placeholder="Hold for fever, infection precautions, prophylaxis…"
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
