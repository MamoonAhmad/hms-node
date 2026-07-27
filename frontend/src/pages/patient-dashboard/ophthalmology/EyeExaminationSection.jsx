import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ANTERIOR_CHAMBER_OPTIONS,
  CONJUNCTIVA_OPTIONS,
  CORNEA_OPTIONS,
  EOM_OPTIONS,
  EXTERNAL_EXAM_OPTIONS,
  EYELID_OPTIONS,
  IRIS_OPTIONS,
  LENS_OPTIONS,
  MACULA_OPTIONS,
  NEURO_EYE_OPTIONS,
  OPTIC_DISC_OPTIONS,
  PERIPHERAL_RETINA_OPTIONS,
  RETINA_OPTIONS,
  RETINAL_VESSEL_OPTIONS,
  YES_NO_OPTIONS,
} from './ophthalmologyConstants';
import { toggleListValue } from './ophthalmologyUtils';

export function EyeExaminationSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents the complete ophthalmic examination from external structures through fundus and
        neurological findings.
      </p>

      <SectionCard title="A. External Examination" accent="info">
        <MultiSelectChips
          idPrefix="oph-ext"
          options={EXTERNAL_EXAM_OPTIONS}
          values={value.externalExam}
          onToggle={(opt) => toggle('externalExam', opt)}
        />
        <Field label="Provider Notes">
          <TextTextarea value={value.externalNotes} onChange={(v) => set('externalNotes', v)} rows={2} />
        </Field>
      </SectionCard>

      <SectionCard title="B. Eyelids">
        <MultiSelectChips idPrefix="oph-lid" options={EYELID_OPTIONS} values={value.eyelids} onToggle={(opt) => toggle('eyelids', opt)} />
      </SectionCard>

      <SectionCard title="C. Conjunctiva">
        <MultiSelectChips idPrefix="oph-conj" options={CONJUNCTIVA_OPTIONS} values={value.conjunctiva} onToggle={(opt) => toggle('conjunctiva', opt)} />
      </SectionCard>

      <SectionCard title="D. Cornea">
        <MultiSelectChips idPrefix="oph-cor" options={CORNEA_OPTIONS} values={value.cornea} onToggle={(opt) => toggle('cornea', opt)} />
      </SectionCard>

      <SectionCard title="E. Anterior Chamber">
        <MultiSelectChips idPrefix="oph-ac" options={ANTERIOR_CHAMBER_OPTIONS} values={value.anteriorChamber} onToggle={(opt) => toggle('anteriorChamber', opt)} />
      </SectionCard>

      <SectionCard title="F. Iris">
        <MultiSelectChips idPrefix="oph-iris" options={IRIS_OPTIONS} values={value.iris} onToggle={(opt) => toggle('iris', opt)} />
      </SectionCard>

      <SectionCard title="G. Lens">
        <MultiSelectChips idPrefix="oph-lens" options={LENS_OPTIONS} values={value.lens} onToggle={(opt) => toggle('lens', opt)} />
      </SectionCard>

      <SectionCard title="H. Pupils" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="PERRLA">
            <TextSelect value={value.perrla} onChange={(v) => set('perrla', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Equal">
            <TextSelect value={value.pupilsEqual} onChange={(v) => set('pupilsEqual', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Reactive">
            <TextSelect value={value.pupilsReactive} onChange={(v) => set('pupilsReactive', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="RAPD Present">
            <TextSelect value={value.rapdPresent} onChange={(v) => set('rapdPresent', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Pupil Size OD">
            <TextInput value={value.pupilSizeOd} onChange={(v) => set('pupilSizeOd', v)} placeholder="mm" />
          </Field>
          <Field label="Pupil Size OS">
            <TextInput value={value.pupilSizeOs} onChange={(v) => set('pupilSizeOs', v)} placeholder="mm" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="I. Extraocular Movements">
        <MultiSelectChips idPrefix="oph-eom" options={EOM_OPTIONS} values={value.eom} onToggle={(opt) => toggle('eom', opt)} />
      </SectionCard>

      <SectionCard title="J. Fundus Examination" description="Optic disc, retina, macula, vessels, and periphery." accent="warning">
        <Field label="Optic Disc">
          <MultiSelectChips idPrefix="oph-disc" options={OPTIC_DISC_OPTIONS} values={value.opticDisc} onToggle={(opt) => toggle('opticDisc', opt)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cup-to-Disc Ratio OD">
            <TextInput value={value.cupToDiscOd} onChange={(v) => set('cupToDiscOd', v)} placeholder="e.g. 0.3" />
          </Field>
          <Field label="Cup-to-Disc Ratio OS">
            <TextInput value={value.cupToDiscOs} onChange={(v) => set('cupToDiscOs', v)} placeholder="e.g. 0.3" />
          </Field>
        </div>
        <Field label="Retina">
          <MultiSelectChips idPrefix="oph-ret" options={RETINA_OPTIONS} values={value.retina} onToggle={(opt) => toggle('retina', opt)} />
        </Field>
        <Field label="Macula">
          <MultiSelectChips idPrefix="oph-mac" options={MACULA_OPTIONS} values={value.macula} onToggle={(opt) => toggle('macula', opt)} />
        </Field>
        <Field label="Retinal Vessels">
          <MultiSelectChips idPrefix="oph-ves" options={RETINAL_VESSEL_OPTIONS} values={value.retinalVessels} onToggle={(opt) => toggle('retinalVessels', opt)} />
        </Field>
        <Field label="Peripheral Retina">
          <MultiSelectChips idPrefix="oph-per" options={PERIPHERAL_RETINA_OPTIONS} values={value.peripheralRetina} onToggle={(opt) => toggle('peripheralRetina', opt)} />
        </Field>
      </SectionCard>

      <SectionCard title="K. Neurological Eye Findings">
        <MultiSelectChips idPrefix="oph-neuro" options={NEURO_EYE_OPTIONS} values={value.neurological} onToggle={(opt) => toggle('neurological', opt)} />
      </SectionCard>

      <SectionCard title="L. Assessment Notes">
        <TextTextarea
          value={value.assessmentNotes}
          onChange={(v) => set('assessmentNotes', v)}
          rows={3}
          placeholder="Comprehensive eye examination assessment…"
        />
      </SectionCard>
    </div>
  );
}
