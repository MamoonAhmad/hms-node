import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import { IcdSearchField } from '../dermatology/IcdSearchField';
import {
  ASTHMA_CLASS_OPTIONS,
  ASTHMA_CONTROL_OPTIONS,
  COPD_GOLD_OPTIONS,
  COPD_GROUP_OPTIONS,
  DISEASE_FOCUS_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  MMRC_OPTIONS,
  RESPIRATORY_SYMPTOM_OPTIONS,
  TRIGGER_OPTIONS,
  VISIT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from './pulmonologyConstants';
import { toggleListValue } from './pulmonologyUtils';

export function AsthmaCopdAssessmentSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document asthma and COPD severity, control scores, symptoms, triggers, and clinical
        impression for this encounter.
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
          <Field label="Disease Focus" required>
            <TextSelect
              value={value.diseaseFocus}
              onChange={(v) => set('diseaseFocus', v)}
              options={DISEASE_FOCUS_OPTIONS}
            />
          </Field>
          <Field label="Symptom Duration">
            <TextInput
              value={value.symptomDuration}
              onChange={(v) => set('symptomDuration', v)}
              placeholder="e.g. 3 days, chronic"
            />
          </Field>
        </div>
        <Field label="Chief Respiratory Complaint">
          <TextTextarea
            value={value.chiefComplaint}
            onChange={(v) => set('chiefComplaint', v)}
            rows={2}
            placeholder="Primary reason for visit…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="B. Symptoms & Triggers" accent="warning">
        <Field label="Current Symptoms">
          <MultiSelectChips
            idPrefix="pulm-sx"
            options={RESPIRATORY_SYMPTOM_OPTIONS}
            values={value.symptoms}
            onToggle={(opt) => toggle('symptoms', opt)}
          />
        </Field>
        <Field label="Known Triggers">
          <MultiSelectChips
            idPrefix="pulm-trig"
            options={TRIGGER_OPTIONS}
            values={value.triggers}
            onToggle={(opt) => toggle('triggers', opt)}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="C. Asthma Assessment"
        description="Classification, ACT, peak flow, and exacerbation history."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Classification">
            <TextSelect
              value={value.asthmaClass}
              onChange={(v) => set('asthmaClass', v)}
              options={ASTHMA_CLASS_OPTIONS}
            />
          </Field>
          <Field label="Control Level">
            <TextSelect
              value={value.asthmaControl}
              onChange={(v) => set('asthmaControl', v)}
              options={ASTHMA_CONTROL_OPTIONS}
            />
          </Field>
          <Field label="ACT Score" hint="Asthma Control Test (5–25)">
            <TextInput
              type="number"
              min={5}
              max={25}
              value={value.actScore}
              onChange={(v) => set('actScore', v)}
              placeholder="e.g. 19"
            />
          </Field>
          <Field label="Peak Flow Personal Best">
            <TextInput
              value={value.peakFlowPersonalBest}
              onChange={(v) => set('peakFlowPersonalBest', v)}
              placeholder="L/min"
            />
          </Field>
          <Field label="Peak Flow Today">
            <TextInput
              value={value.peakFlowToday}
              onChange={(v) => set('peakFlowToday', v)}
              placeholder="L/min"
            />
          </Field>
          <Field label="Daytime Symptoms">
            <TextSelect
              value={value.daytimeSymptoms}
              onChange={(v) => set('daytimeSymptoms', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Night Symptoms">
            <TextSelect
              value={value.nightSymptoms}
              onChange={(v) => set('nightSymptoms', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Rescue Inhaler Use / Week">
            <TextInput
              value={value.rescueUsePerWeek}
              onChange={(v) => set('rescueUsePerWeek', v)}
              placeholder="e.g. 2"
            />
          </Field>
          <Field label="Asthma Exacerbations (Last Year)">
            <TextInput
              type="number"
              min={0}
              value={value.asthmaExacerbationsLastYear}
              onChange={(v) => set('asthmaExacerbationsLastYear', v)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="D. COPD Assessment"
        description="GOLD stage/group, CAT, mMRC, and exacerbation risk."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="GOLD Stage">
            <TextSelect
              value={value.goldStage}
              onChange={(v) => set('goldStage', v)}
              options={COPD_GOLD_OPTIONS}
            />
          </Field>
          <Field label="GOLD Group">
            <TextSelect
              value={value.goldGroup}
              onChange={(v) => set('goldGroup', v)}
              options={COPD_GROUP_OPTIONS}
            />
          </Field>
          <Field label="CAT Score" hint="COPD Assessment Test (0–40)">
            <TextInput
              type="number"
              min={0}
              max={40}
              value={value.catScore}
              onChange={(v) => set('catScore', v)}
              placeholder="e.g. 14"
            />
          </Field>
          <Field label="mMRC Dyspnea" className="sm:col-span-2 lg:col-span-3">
            <TextSelect
              value={value.mmrc}
              onChange={(v) => set('mmrc', v)}
              options={MMRC_OPTIONS}
            />
          </Field>
          <Field label="Chronic Cough">
            <TextSelect
              value={value.cough}
              onChange={(v) => set('cough', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Sputum Production">
            <TextSelect
              value={value.sputum}
              onChange={(v) => set('sputum', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="COPD Exacerbations (Last Year)">
            <TextInput
              type="number"
              min={0}
              value={value.copdExacerbationsLastYear}
              onChange={(v) => set('copdExacerbationsLastYear', v)}
            />
          </Field>
          <Field label="Hospitalizations (Last Year)">
            <TextInput
              type="number"
              min={0}
              value={value.hospitalizationsLastYear}
              onChange={(v) => set('hospitalizationsLastYear', v)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Diagnosis & Plan" accent="primary">
        <Field label="Primary Diagnosis">
          <IcdSearchField
            value={value.primaryDiagnosisDisplay}
            code={value.primaryDiagnosisCode}
            onSelect={(item) =>
              setMany({
                primaryDiagnosisCode: item.code || '',
                primaryDiagnosisDescription: item.description || '',
                primaryDiagnosisDisplay: item.display || '',
              })
            }
          />
        </Field>
        <Field label="Clinical Impression">
          <TextTextarea
            value={value.clinicalImpression}
            onChange={(v) => set('clinicalImpression', v)}
            rows={3}
            placeholder="Assessment summary…"
          />
        </Field>
        <Field label="Management Plan">
          <TextTextarea
            value={value.managementPlan}
            onChange={(v) => set('managementPlan', v)}
            rows={3}
            placeholder="Medications, education, referrals, follow-up…"
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
        <Field label="Provider Notes">
          <TextTextarea
            value={value.providerNotes}
            onChange={(v) => set('providerNotes', v)}
            rows={2}
            placeholder="Additional notes…"
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard
          title="Longitudinal Asthma / COPD"
          description="Recent control and staging across visits."
          accent="warning"
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Focus</th>
                  <th className="px-3 py-2 font-medium">Control / GOLD</th>
                  <th className="px-3 py-2 font-medium">ACT / CAT</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.at}-${idx}`} className={idx % 2 === 1 ? 'bg-muted/20' : undefined}>
                    <td className="px-3 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-3 py-2">{row.diseaseFocus || '—'}</td>
                    <td className="px-3 py-2">
                      {row.asthmaControl || row.goldStage || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {[row.actScore && `ACT ${row.actScore}`, row.catScore && `CAT ${row.catScore}`]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
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
