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
  ADVANCE_DIRECTIVE_OPTIONS,
  CODE_STATUS_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  GOALS_OF_CARE_OPTIONS,
  SUPPORTIVE_CARE_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './oncologyHematologyConstants';
import { toggleListValue } from './oncologyHematologyUtils';

export function ChemoSupportiveAdvanceCareSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Reconcile chemo supportive care (antiemetics, growth factors, symptom support) and document
        advance care preferences for this visit.
      </p>

      {(value.codeStatus || value.goalsOfCare) && (
        <div className="flex flex-wrap items-center gap-2">
          {value.codeStatus && (
            <Badge
              variant="secondary"
              className={
                value.codeStatus === 'Full Code'
                  ? 'status-soft-info font-medium'
                  : 'status-soft-warning font-medium'
              }
            >
              {value.codeStatus}
            </Badge>
          )}
          {value.goalsOfCare && (
            <Badge variant="secondary" className="status-soft-muted font-medium">
              {value.goalsOfCare}
            </Badge>
          )}
        </div>
      )}

      <SectionCard
        title="A. Chemo Supportive Care"
        description="Antiemetics, growth factors, pain, nutrition, and other supportive measures."
        accent="info"
      >
        <Field label="Supportive Measures Reviewed / Ordered">
          <MultiSelectChips
            idPrefix="onc-support"
            options={SUPPORTIVE_CARE_OPTIONS}
            values={value.supportiveMeasures}
            onToggle={(opt) => toggle('supportiveMeasures', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Antiemetic Regimen">
            <TextTextarea
              value={value.antiemeticRegimen}
              onChange={(v) => set('antiemeticRegimen', v)}
              rows={2}
              placeholder="e.g. Olanzapine + 5-HT3 + NK1; breakthrough plan…"
            />
          </Field>
          <Field label="Growth Factor Plan">
            <TextTextarea
              value={value.growthFactorPlan}
              onChange={(v) => set('growthFactorPlan', v)}
              rows={2}
              placeholder="e.g. Pegfilgrastim day +1; hold if ANC recovers…"
            />
          </Field>
          <Field label="Pain Score (0–10)">
            <TextInput
              type="number"
              min={0}
              max={10}
              value={value.painScore}
              onChange={(v) => set('painScore', v)}
            />
          </Field>
          <Field label="Pain Management Plan">
            <TextInput
              value={value.painPlan}
              onChange={(v) => set('painPlan', v)}
              placeholder="Opioid / adjuvant / non-pharm plan"
            />
          </Field>
          <Field label="Nutrition / Appetite Concerns">
            <TextTextarea
              value={value.nutritionConcerns}
              onChange={(v) => set('nutritionConcerns', v)}
              rows={2}
              placeholder="Weight loss, mucositis diet, dietitian referral…"
            />
          </Field>
          <Field label="Hydration Plan">
            <TextTextarea
              value={value.hydrationPlan}
              onChange={(v) => set('hydrationPlan', v)}
              rows={2}
              placeholder="IV fluids, oral goals, TLS hydration…"
            />
          </Field>
        </div>
        <Field label="Transfusion Support Plan">
          <TextInput
            value={value.transfusionPlan}
            onChange={(v) => set('transfusionPlan', v)}
            placeholder="RBC / platelet thresholds, irradiated products…"
          />
        </Field>
        <Field label="Other Supportive Notes">
          <TextTextarea
            value={value.otherSupportiveNotes}
            onChange={(v) => set('otherSupportiveNotes', v)}
            rows={2}
            placeholder="Constipation, mucositis, VTE, fertility…"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Advance Care Preferences"
        description="Directives, code status, goals of care, and palliative discussion."
        accent="warning"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Advance Directive Status" required>
            <TextSelect
              value={value.advanceDirectiveStatus}
              onChange={(v) => set('advanceDirectiveStatus', v)}
              options={ADVANCE_DIRECTIVE_OPTIONS}
            />
          </Field>
          <Field label="Code Status" required>
            <TextSelect
              value={value.codeStatus}
              onChange={(v) => set('codeStatus', v)}
              options={CODE_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Goals of Care">
            <TextSelect
              value={value.goalsOfCare}
              onChange={(v) => set('goalsOfCare', v)}
              options={GOALS_OF_CARE_OPTIONS}
            />
          </Field>
          <Field label="Healthcare Proxy / Surrogate">
            <TextInput
              value={value.healthcareProxy}
              onChange={(v) => set('healthcareProxy', v)}
              placeholder="Name / relationship"
            />
          </Field>
          <Field label="Palliative Care Discussed">
            <TextSelect
              value={value.palliativeDiscussed}
              onChange={(v) => set('palliativeDiscussed', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Hospice Discussed">
            <TextSelect
              value={value.hospiceDiscussed}
              onChange={(v) => set('hospiceDiscussed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Advance Care Notes">
          <TextTextarea
            value={value.advanceCareNotes}
            onChange={(v) => set('advanceCareNotes', v)}
            rows={3}
            placeholder="Patient values, trade-offs discussed, documents updated…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Follow-up & Education" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Patient / Caregiver Education">
          <TextTextarea
            value={value.patientEducation}
            onChange={(v) => set('patientEducation', v)}
            rows={3}
            placeholder="Fever precautions, meds, when to call / go to ED…"
          />
        </Field>
      </SectionCard>

      {history.some((h) => h.codeStatus || h.goalsOfCare) && (
        <SectionCard title="Prior advance-care snapshots">
          <ul className="space-y-2">
            {history
              .filter((h) => h.codeStatus || h.goalsOfCare)
              .slice(0, 5)
              .map((h) => (
                <li
                  key={`${h.appointmentId || 'none'}-${h.at}-acp`}
                  className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {h.examinationDate || new Date(h.at).toLocaleDateString()}
                  </span>
                  {' — '}
                  {[h.codeStatus, h.goalsOfCare].filter(Boolean).join(' · ') || '—'}
                </li>
              ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
