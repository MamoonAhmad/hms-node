import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ALLERGY_ASSESSMENT_OPTIONS,
  EXTERNAL_NOSE_OPTIONS,
  NASAL_DISCHARGE_OPTIONS,
  NASAL_MUCOSA_OPTIONS,
  NASAL_POLYP_OPTIONS,
  NASAL_SEPTUM_OPTIONS,
  NOSE_DIAGNOSIS_OPTIONS,
  NOSE_DIAGNOSTIC_OPTIONS,
  NOSE_SYMPTOM_OPTIONS,
  SINUS_TENDERNESS_OPTIONS,
  TURBINATE_OPTIONS,
} from './entConstants';
import { toggleListValue } from './entUtils';

export function NoseSinusAssessmentSection({
  value,
  onChange,
  history = [],
  onOpenOrders,
  onOpenResults,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document nasal examination findings, sinus evaluation, obstruction, allergies, and
        associated symptoms.
      </p>

      <SectionCard title="A. Presenting Symptoms" accent="info">
        <MultiSelectChips
          idPrefix="ent-nose-sx"
          options={NOSE_SYMPTOM_OPTIONS}
          values={value.symptoms}
          onToggle={(opt) => toggle('symptoms', opt)}
        />
      </SectionCard>

      <SectionCard title="B. Nasal Examination">
        <Field label="External Nose">
          <MultiSelectChips
            idPrefix="ent-ext-nose"
            options={EXTERNAL_NOSE_OPTIONS}
            values={value.externalNose}
            onToggle={(opt) => toggle('externalNose', opt)}
          />
        </Field>
        <Field label="Nasal Septum">
          <MultiSelectChips
            idPrefix="ent-septum"
            options={NASAL_SEPTUM_OPTIONS}
            values={value.nasalSeptum}
            onToggle={(opt) => toggle('nasalSeptum', opt)}
          />
        </Field>
        <Field label="Turbinates">
          <MultiSelectChips
            idPrefix="ent-turbinates"
            options={TURBINATE_OPTIONS}
            values={value.turbinates}
            onToggle={(opt) => toggle('turbinates', opt)}
          />
        </Field>
        <Field label="Nasal Mucosa">
          <MultiSelectChips
            idPrefix="ent-mucosa"
            options={NASAL_MUCOSA_OPTIONS}
            values={value.nasalMucosa}
            onToggle={(opt) => toggle('nasalMucosa', opt)}
          />
        </Field>
        <Field label="Nasal Discharge">
          <MultiSelectChips
            idPrefix="ent-discharge"
            options={NASAL_DISCHARGE_OPTIONS}
            values={value.nasalDischarge}
            onToggle={(opt) => toggle('nasalDischarge', opt)}
          />
        </Field>
        <Field label="Nasal Polyps">
          <TextSelect
            value={value.nasalPolyps}
            onChange={(v) => set('nasalPolyps', v)}
            options={NASAL_POLYP_OPTIONS}
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Sinus Examination" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Frontal Sinus Tenderness">
            <TextSelect
              value={value.frontalSinusTenderness}
              onChange={(v) => set('frontalSinusTenderness', v)}
              options={SINUS_TENDERNESS_OPTIONS}
            />
          </Field>
          <Field label="Maxillary Sinus Tenderness">
            <TextSelect
              value={value.maxillarySinusTenderness}
              onChange={(v) => set('maxillarySinusTenderness', v)}
              options={SINUS_TENDERNESS_OPTIONS}
            />
          </Field>
          <Field label="Ethmoid Tenderness">
            <TextSelect
              value={value.ethmoidTenderness}
              onChange={(v) => set('ethmoidTenderness', v)}
              options={SINUS_TENDERNESS_OPTIONS}
            />
          </Field>
          <Field label="Sphenoid Tenderness">
            <TextSelect
              value={value.sphenoidTenderness}
              onChange={(v) => set('sphenoidTenderness', v)}
              options={SINUS_TENDERNESS_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Allergy Assessment">
        <MultiSelectChips
          idPrefix="ent-allergy"
          options={ALLERGY_ASSESSMENT_OPTIONS}
          values={value.allergies}
          onToggle={(opt) => toggle('allergies', opt)}
        />
      </SectionCard>

      <SectionCard
        title="E. Diagnostic Testing"
        description="Link CT sinus, endoscopy, and cultures with Orders and Results."
        actions={
          <div className="flex flex-wrap gap-2">
            {onOpenOrders && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Orders
              </Button>
            )}
            {onOpenResults && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenResults}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Results
              </Button>
            )}
          </div>
        }
      >
        <MultiSelectChips
          idPrefix="ent-nose-dx-test"
          options={NOSE_DIAGNOSTIC_OPTIONS}
          values={value.diagnostics}
          onToggle={(opt) => toggle('diagnostics', opt)}
        />
      </SectionCard>

      <SectionCard title="F. Assessment" accent="primary">
        <MultiSelectChips
          idPrefix="ent-nose-dx"
          options={NOSE_DIAGNOSIS_OPTIONS}
          values={value.diagnoses}
          onToggle={(opt) => toggle('diagnoses', opt)}
        />
        {(value.diagnoses || []).includes('Other Diagnosis') && (
          <Field label="Other Diagnosis">
            <TextInput
              value={value.otherDiagnosis}
              onChange={(v) => set('otherDiagnosis', v)}
              placeholder="Specify other diagnosis…"
            />
          </Field>
        )}
        <Field label="Provider Notes">
          <TextTextarea
            value={value.providerNotes}
            onChange={(v) => set('providerNotes', v)}
            rows={3}
            placeholder="Assessment notes…"
          />
        </Field>
      </SectionCard>

      {history.some((h) => (h.noseDiagnoses || []).length) && (
        <SectionCard title="Chronic sinus / nasal history">
          <ul className="space-y-2">
            {history
              .filter((h) => (h.noseDiagnoses || []).length)
              .slice(0, 6)
              .map((h) => (
                <li
                  key={`${h.at}-nose`}
                  className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {h.examinationDate || new Date(h.at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(h.noseDiagnoses || []).join(', ')}
                  </p>
                </li>
              ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
