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
  AFFECTED_EAR_OPTIONS,
  EAR_CANAL_OPTIONS,
  EAR_SYMPTOM_OPTIONS,
  EAR_VISIT_TYPE_OPTIONS,
  HEARING_LOSS_TYPE_OPTIONS,
  HEARING_SEVERITY_OPTIONS,
  MASTOID_OPTIONS,
  MIDDLE_EAR_OPTIONS,
  MOBILITY_OPTIONS,
  PASS_FAIL_OPTIONS,
  PINNA_OPTIONS,
  RINNE_OPTIONS,
  TYMPANIC_MEMBRANE_OPTIONS,
  TYMPANOMETRY_OPTIONS,
  WEBER_OPTIONS,
  YES_NO_OPTIONS,
} from './entConstants';
import { toggleListValue } from './entUtils';

function EarSideCard({ sideLabel, sideKey, value, onChange }) {
  const side = value[sideKey] || {};
  const setSide = (key, next) =>
    onChange({
      ...value,
      [sideKey]: { ...side, [key]: next },
    });
  const toggleSide = (key, opt) => setSide(key, toggleListValue(side[key], opt));

  return (
    <SectionCard
      title={`${sideLabel} otoscopy`}
      description={sideKey === 'rightEar' ? 'Right ear (AD)' : 'Left ear (AS)'}
      accent="info"
    >
      <Field label="Tympanic Membrane">
        <MultiSelectChips
          idPrefix={`ent-tm-${sideKey}`}
          options={TYMPANIC_MEMBRANE_OPTIONS}
          values={side.tympanicMembrane}
          onToggle={(opt) => toggleSide('tympanicMembrane', opt)}
        />
      </Field>
      <Field label="Middle Ear">
        <MultiSelectChips
          idPrefix={`ent-me-${sideKey}`}
          options={MIDDLE_EAR_OPTIONS}
          values={side.middleEar}
          onToggle={(opt) => toggleSide('middleEar', opt)}
        />
      </Field>
      <Field label="Mobility">
        <TextSelect
          value={side.mobility}
          onChange={(v) => setSide('mobility', v)}
          options={MOBILITY_OPTIONS}
        />
      </Field>
    </SectionCard>
  );
}

export function EarAssessmentSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document ear symptoms, otoscopic findings, hearing assessment, audiogram results, and
        clinical impression.
      </p>

      <SectionCard title="A. Visit Information" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Examination Date" required>
            <TextInput
              type="date"
              value={value.examinationDate}
              onChange={(v) => set('examinationDate', v)}
              readOnly
            />
          </Field>
          <Field label="Provider" required>
            <TextInput value={value.provider} onChange={(v) => set('provider', v)} readOnly />
          </Field>
          <Field label="Visit Type" required>
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={EAR_VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Chief Ear Complaint" required className="sm:col-span-2">
            <TextInput
              value={value.chiefEarComplaint}
              onChange={(v) => set('chiefEarComplaint', v)}
              placeholder="Primary ear complaint…"
            />
          </Field>
          <Field label="Duration of Symptoms">
            <TextInput
              value={value.durationOfSymptoms}
              onChange={(v) => set('durationOfSymptoms', v)}
              placeholder="e.g. 3 days"
            />
          </Field>
          <Field label="Affected Ear" required>
            <TextSelect
              value={value.affectedEar}
              onChange={(v) => set('affectedEar', v)}
              options={AFFECTED_EAR_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Ear Symptoms">
        <MultiSelectChips
          idPrefix="ent-ear-sx"
          options={EAR_SYMPTOM_OPTIONS}
          values={value.symptoms}
          onToggle={(opt) => toggle('symptoms', opt)}
        />
      </SectionCard>

      <SectionCard title="C. External Ear Examination" accent="info">
        <Field label="Pinna">
          <MultiSelectChips
            idPrefix="ent-pinna"
            options={PINNA_OPTIONS}
            values={value.pinna}
            onToggle={(opt) => toggle('pinna', opt)}
          />
        </Field>
        <Field label="Ear Canal">
          <MultiSelectChips
            idPrefix="ent-canal"
            options={EAR_CANAL_OPTIONS}
            values={value.earCanal}
            onToggle={(opt) => toggle('earCanal', opt)}
          />
        </Field>
        <Field label="Mastoid">
          <MultiSelectChips
            idPrefix="ent-mastoid"
            options={MASTOID_OPTIONS}
            values={value.mastoid}
            onToggle={(opt) => toggle('mastoid', opt)}
          />
        </Field>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <EarSideCard
          sideLabel="D. Right Ear (AD)"
          sideKey="rightEar"
          value={value}
          onChange={onChange}
        />
        <EarSideCard
          sideLabel="D. Left Ear (AS)"
          sideKey="leftEar"
          value={value}
          onChange={onChange}
        />
      </div>

      <SectionCard title="E. Hearing Assessment">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Whisper Test">
            <TextSelect
              value={value.whisperTest}
              onChange={(v) => set('whisperTest', v)}
              options={PASS_FAIL_OPTIONS}
            />
          </Field>
          <Field label="Finger Rub Test">
            <TextSelect
              value={value.fingerRubTest}
              onChange={(v) => set('fingerRubTest', v)}
              options={PASS_FAIL_OPTIONS}
            />
          </Field>
          <Field label="Weber Test">
            <TextSelect
              value={value.weberTest}
              onChange={(v) => set('weberTest', v)}
              options={WEBER_OPTIONS}
            />
          </Field>
          <Field label="Rinne Test Right">
            <TextSelect
              value={value.rinneRight}
              onChange={(v) => set('rinneRight', v)}
              options={RINNE_OPTIONS}
            />
          </Field>
          <Field label="Rinne Test Left">
            <TextSelect
              value={value.rinneLeft}
              onChange={(v) => set('rinneLeft', v)}
              options={RINNE_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="F. Audiogram"
        description="Integrate with Orders / Results when audiogram or tympanometry is performed."
        accent="warning"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Audiogram Performed">
            <TextSelect
              value={value.audiogramPerformed}
              onChange={(v) => set('audiogramPerformed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Audiogram Date">
            <TextInput
              type="date"
              value={value.audiogramDate}
              onChange={(v) => set('audiogramDate', v)}
            />
          </Field>
          <Field label="Hearing Loss Type">
            <TextSelect
              value={value.hearingLossType}
              onChange={(v) => set('hearingLossType', v)}
              options={HEARING_LOSS_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Severity">
            <TextSelect
              value={value.severity}
              onChange={(v) => set('severity', v)}
              options={HEARING_SEVERITY_OPTIONS}
            />
          </Field>
          <Field label="Speech Discrimination (%)">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={value.speechDiscrimination}
              onChange={(v) => set('speechDiscrimination', v)}
              placeholder="0–100"
            />
          </Field>
          <Field label="Tympanometry">
            <TextSelect
              value={value.tympanometry}
              onChange={(v) => set('tympanometry', v)}
              options={TYMPANOMETRY_OPTIONS}
            />
          </Field>
          <Field label="Audiogram Uploaded">
            <TextSelect
              value={value.audiogramUploaded}
              onChange={(v) => set('audiogramUploaded', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="G. Assessment" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary Diagnosis (ICD-10)">
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
          <Field label="Secondary Diagnosis">
            <IcdSearchField
              value={value.secondaryDiagnosisDisplay}
              code={value.secondaryDiagnosisCode}
              onSelect={(item) =>
                setMany({
                  secondaryDiagnosisCode: item.code || '',
                  secondaryDiagnosisDescription: item.description || '',
                  secondaryDiagnosisDisplay: item.display || '',
                })
              }
            />
          </Field>
        </div>
        <Field label="Clinical Impression">
          <TextTextarea
            value={value.clinicalImpression}
            onChange={(v) => set('clinicalImpression', v)}
            rows={3}
            placeholder="Clinical impression…"
          />
        </Field>
        <Field label="Provider Notes">
          <TextTextarea
            value={value.providerNotes}
            onChange={(v) => set('providerNotes', v)}
            rows={3}
            placeholder="Additional notes…"
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard title="Hearing assessment history" description="Longitudinal hearing findings.">
          <ul className="space-y-2">
            {history.slice(0, 6).map((h) => (
              <li
                key={`${h.at}-${h.appointmentId || 'none'}`}
                className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm"
              >
                <p className="font-medium text-foreground">
                  {h.examinationDate || new Date(h.at).toLocaleDateString()}
                  {h.hearingLossType ? ` · ${h.hearingLossType}` : ''}
                  {h.severity ? ` (${h.severity})` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[h.affectedEar && `Ear: ${h.affectedEar}`, h.primaryEarDx]
                    .filter(Boolean)
                    .join(' · ') || 'No diagnosis recorded'}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
