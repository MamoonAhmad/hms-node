import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  CESSATION_INTERVENTION_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  PRODUCT_OPTIONS,
  QUIT_READINESS_OPTIONS,
  TOBACCO_STATUS_OPTIONS,
  VAPING_STATUS_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './pulmonologyConstants';
import { toggleListValue } from './pulmonologyUtils';

export function SmokingVapingScreenSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Specialty smoking and vaping screen with pack-year history, quit readiness, and cessation
        interventions.
      </p>

      <SectionCard title="A. Tobacco Use" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tobacco Status" required>
            <TextSelect
              value={value.tobaccoStatus}
              onChange={(v) => set('tobaccoStatus', v)}
              options={TOBACCO_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Cigarettes / Day">
            <TextInput
              type="number"
              min={0}
              value={value.cigarettesPerDay}
              onChange={(v) => set('cigarettesPerDay', v)}
            />
          </Field>
          <Field label="Years Smoked">
            <TextInput
              type="number"
              min={0}
              value={value.yearsSmoked}
              onChange={(v) => set('yearsSmoked', v)}
            />
          </Field>
          <Field label="Pack-Years">
            <TextInput
              type="number"
              min={0}
              step="0.1"
              value={value.packYears}
              onChange={(v) => set('packYears', v)}
              placeholder="e.g. 25"
            />
          </Field>
          <Field label="Quit Date (if former)">
            <TextInput
              type="date"
              value={value.quitDate}
              onChange={(v) => set('quitDate', v)}
            />
          </Field>
          <Field label="Prior Quit Attempts">
            <TextInput
              value={value.priorQuitAttempts}
              onChange={(v) => set('priorQuitAttempts', v)}
              placeholder="e.g. 2 attempts"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Vaping / Other Products" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vaping Status" required>
            <TextSelect
              value={value.vapingStatus}
              onChange={(v) => set('vapingStatus', v)}
              options={VAPING_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Vape Device / Brand">
            <TextInput
              value={value.vapingDevice}
              onChange={(v) => set('vapingDevice', v)}
              placeholder="Device or brand"
            />
          </Field>
          <Field label="Vaping Frequency">
            <TextInput
              value={value.vapingFrequency}
              onChange={(v) => set('vapingFrequency', v)}
              placeholder="e.g. daily, weekends"
            />
          </Field>
          <Field label="Secondhand Smoke Exposure">
            <TextSelect
              value={value.secondhandExposure}
              onChange={(v) => set('secondhandExposure', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Products Used">
          <MultiSelectChips
            idPrefix="pulm-product"
            options={PRODUCT_OPTIONS}
            values={value.productsUsed}
            onToggle={(opt) => toggle('productsUsed', opt)}
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Quit Readiness & Interventions" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Quit Readiness">
            <TextSelect
              value={value.quitReadiness}
              onChange={(v) => set('quitReadiness', v)}
              options={QUIT_READINESS_OPTIONS}
            />
          </Field>
          <Field label="Counseling Provided">
            <TextSelect
              value={value.counselingProvided}
              onChange={(v) => set('counselingProvided', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Cessation Referral Placed">
            <TextSelect
              value={value.cessationReferral}
              onChange={(v) => set('cessationReferral', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Cessation Interventions">
          <MultiSelectChips
            idPrefix="pulm-cess"
            options={CESSATION_INTERVENTION_OPTIONS}
            values={value.interventions}
            onToggle={(opt) => toggle('interventions', opt)}
          />
        </Field>
        <Field label="Clinical Notes">
          <TextTextarea
            value={value.clinicalNotes}
            onChange={(v) => set('clinicalNotes', v)}
            rows={3}
            placeholder="Motivation, barriers, pharmacotherapy plan…"
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard
          title="Longitudinal Tobacco / Vaping"
          description="Recent smoking and vaping status across visits."
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Tobacco</th>
                  <th className="px-3 py-2 font-medium">Vaping</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.at}-${idx}`} className={idx % 2 === 1 ? 'bg-muted/20' : undefined}>
                    <td className="px-3 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-3 py-2">{row.tobaccoStatus || '—'}</td>
                    <td className="px-3 py-2">{row.vapingStatus || '—'}</td>
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
