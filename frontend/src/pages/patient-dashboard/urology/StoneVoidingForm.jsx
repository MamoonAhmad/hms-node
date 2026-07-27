import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  FOLLOW_UP_INTERVAL_OPTIONS,
  STONE_DIET_OPTIONS,
  STONE_IMAGING_OPTIONS,
  STONE_LOCATION_OPTIONS,
  STONE_MANAGEMENT_OPTIONS,
  STONE_PAIN_OPTIONS,
  STONE_SIDE_OPTIONS,
  STONE_VISIT_TYPE_OPTIONS,
  VOIDING_SYMPTOM_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './urologyConstants';
import { toggleListValue } from './urologyUtils';

export function StoneVoidingForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document stone disease presentation, voiding symptoms, imaging, and management.
      </p>

      <SectionCard
        title="A. Visit & stone history"
        description="Episode context and prior stone burden."
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
              options={STONE_VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Stone History" className="sm:col-span-2">
            <TextInput
              value={value.stoneHistory}
              onChange={(v) => set('stoneHistory', v)}
              placeholder="First stone, recurrent, composition if known…"
            />
          </Field>
          <Field label="Prior Stone Count">
            <TextInput
              value={value.priorStoneCount}
              onChange={(v) => set('priorStoneCount', v)}
              placeholder="e.g. 2"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Current stone" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Side">
            <TextSelect
              value={value.side}
              onChange={(v) => set('side', v)}
              options={STONE_SIDE_OPTIONS}
            />
          </Field>
          <Field label="Location">
            <TextSelect
              value={value.location}
              onChange={(v) => set('location', v)}
              options={STONE_LOCATION_OPTIONS}
            />
          </Field>
          <Field label="Size (mm)">
            <TextInput
              value={value.stoneSizeMm}
              onChange={(v) => set('stoneSizeMm', v)}
              placeholder="e.g. 6"
            />
          </Field>
          <Field label="Pain">
            <TextSelect
              value={value.painSeverity}
              onChange={(v) => set('painSeverity', v)}
              options={STONE_PAIN_OPTIONS}
            />
          </Field>
          <Field label="Onset Date">
            <TextInput
              type="date"
              value={value.onsetDate}
              onChange={(v) => set('onsetDate', v)}
            />
          </Field>
          <Field label="Nausea / Vomiting">
            <TextSelect
              value={value.nauseaVomiting}
              onChange={(v) => set('nauseaVomiting', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Fever">
            <TextSelect
              value={value.fever}
              onChange={(v) => set('fever', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Hematuria with Episode">
            <TextSelect
              value={value.hematuriaWithEpisode}
              onChange={(v) => set('hematuriaWithEpisode', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="C. Voiding symptoms">
        <Field label="Symptoms During / Around Episode">
          <MultiSelectChips
            values={value.voidingSymptoms || []}
            options={VOIDING_SYMPTOM_OPTIONS}
            onToggle={(opt) =>
              set('voidingSymptoms', toggleListValue(value.voidingSymptoms, opt))
            }
            idPrefix="uro-stone-void"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="D. Imaging & labs"
        description="Confirm stone location, obstruction, and renal function."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Imaging Modality">
            <TextSelect
              value={value.imagingModality}
              onChange={(v) => set('imagingModality', v)}
              options={STONE_IMAGING_OPTIONS}
            />
          </Field>
          <Field label="Imaging Date">
            <TextInput
              type="date"
              value={value.imagingDate}
              onChange={(v) => set('imagingDate', v)}
            />
          </Field>
          <Field label="Hydronephrosis">
            <TextSelect
              value={value.hydronephrosis}
              onChange={(v) => set('hydronephrosis', v)}
              options={['None', 'Mild', 'Moderate', 'Severe', 'Unknown']}
            />
          </Field>
          <Field label="Creatinine">
            <TextInput
              value={value.creatinine}
              onChange={(v) => set('creatinine', v)}
              placeholder="mg/dL"
            />
          </Field>
          <Field label="UA Findings" className="sm:col-span-2">
            <TextInput
              value={value.uaFindings}
              onChange={(v) => set('uaFindings', v)}
              placeholder="Blood, nitrites, crystals…"
            />
          </Field>
        </div>
        <Field label="Imaging Findings">
          <TextTextarea
            value={value.imagingFindings}
            onChange={(v) => set('imagingFindings', v)}
            placeholder="Stone number, HU, obstruction, other findings…"
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="E. Management & prevention" accent="success">
        <Field label="Management">
          <MultiSelectChips
            values={value.management || []}
            options={STONE_MANAGEMENT_OPTIONS}
            onToggle={(opt) => set('management', toggleListValue(value.management, opt))}
            idPrefix="uro-stone-mgmt"
          />
        </Field>
        <Field label="Diet / Lifestyle Counseling">
          <MultiSelectChips
            values={value.dietCounseling || []}
            options={STONE_DIET_OPTIONS}
            onToggle={(opt) =>
              set('dietCounseling', toggleListValue(value.dietCounseling, opt))
            }
            idPrefix="uro-stone-diet"
          />
        </Field>
        <Field label="Metabolic Workup">
          <TextInput
            value={value.metabolicWorkup}
            onChange={(v) => set('metabolicWorkup', v)}
            placeholder="24-hr urine, stone analysis, pending…"
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
            placeholder="Additional stone / voiding documentation…"
            rows={3}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
