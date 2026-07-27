import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  GAIT_OPTIONS,
  getRomMovementsForRegions,
  getSpecialTestsForRegions,
  INSPECTION_OPTIONS,
  JOINT_STABILITY_OPTIONS,
  MRC_GRADES,
  NEURO_OPTIONS,
  PALPATION_OPTIONS,
  SPECIAL_TEST_RESULT_OPTIONS,
  STRENGTH_GROUPS,
  VASCULAR_OPTIONS,
} from './orthopedicsMskConstants';
import { toggleListValue } from './orthopedicsMskUtils';

export function MskExaminationSection({ value, onChange, bodyRegions = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const romMovements = getRomMovementsForRegions(bodyRegions);
  const specialTests = getSpecialTestsForRegions(bodyRegions);

  const setRom = (movement, field, next) => {
    set('rom', {
      ...value.rom,
      [movement]: {
        ...(value.rom?.[movement] || { active: '', passive: '', pain: '', normal: '' }),
        [field]: next,
      },
    });
  };

  const setStrength = (group, grade) => {
    set('strength', { ...value.strength, [group]: grade });
  };

  const setSpecialTest = (name, result) => {
    set('specialTests', { ...value.specialTests, [name]: result });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents the provider&apos;s musculoskeletal examination — ROM, strength, stability,
        neurovascular status, and orthopaedic special tests.
        {bodyRegions?.length > 0 && (
          <span className="ml-1 text-foreground">
            Template filtered for: {bodyRegions.join(', ')}.
          </span>
        )}
      </p>

      <SectionCard title="A. Inspection" description="Visual findings." accent="info">
        <Field label="Inspection" className="max-w-md">
          <TextSelect
            value={value.inspection}
            onChange={(v) => set('inspection', v)}
            options={INSPECTION_OPTIONS}
          />
        </Field>
        <Field label="Notes">
          <TextTextarea
            value={value.inspectionNotes}
            onChange={(v) => set('inspectionNotes', v)}
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="B. Palpation">
        <MultiSelectChips
          idPrefix="ortho-palp"
          options={PALPATION_OPTIONS}
          values={value.palpation}
          onToggle={(opt) => set('palpation', toggleListValue(value.palpation, opt))}
        />
      </SectionCard>

      <SectionCard
        title="C. Range of Motion (ROM)"
        description="Enter degrees or Normal / Limited."
        accent="primary"
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Movement</th>
                <th className="px-3 py-2 font-medium">Active</th>
                <th className="px-3 py-2 font-medium">Passive</th>
                <th className="px-3 py-2 font-medium">Pain</th>
                <th className="px-3 py-2 font-medium">Normal</th>
              </tr>
            </thead>
            <tbody>
              {romMovements.map((movement, idx) => {
                const row = value.rom?.[movement] || {};
                return (
                  <tr
                    key={movement}
                    className={idx % 2 === 1 ? 'bg-muted/20' : undefined}
                  >
                    <td className="px-3 py-2 font-medium text-foreground">{movement}</td>
                    {['active', 'passive', 'pain', 'normal'].map((field) => (
                      <td key={field} className="px-2 py-1.5">
                        <TextInput
                          value={row[field] || ''}
                          onChange={(v) => setRom(movement, field, v)}
                          placeholder={field === 'pain' ? 'Y/N' : '° / Normal'}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="D. Muscle Strength"
        description="Medical Research Council (MRC) grading scale 0–5."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STRENGTH_GROUPS.map((group) => (
            <Field key={group} label={group}>
              <TextSelect
                value={value.strength?.[group] || ''}
                onChange={(v) => setStrength(group, v)}
                options={MRC_GRADES}
                placeholder="Grade…"
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="E. Joint Stability">
        <MultiSelectChips
          idPrefix="ortho-stab"
          options={JOINT_STABILITY_OPTIONS}
          values={value.jointStability}
          onToggle={(opt) => set('jointStability', toggleListValue(value.jointStability, opt))}
        />
      </SectionCard>

      <SectionCard title="F. Neurovascular Examination" accent="warning">
        <Field label="Neurological">
          <MultiSelectChips
            idPrefix="ortho-neuro"
            options={NEURO_OPTIONS}
            values={value.neurological}
            onToggle={(opt) => set('neurological', toggleListValue(value.neurological, opt))}
          />
        </Field>
        <Field label="Vascular">
          <MultiSelectChips
            idPrefix="ortho-vasc"
            options={VASCULAR_OPTIONS}
            values={value.vascular}
            onToggle={(opt) => set('vascular', toggleListValue(value.vascular, opt))}
          />
        </Field>
      </SectionCard>

      <SectionCard title="G. Gait">
        <Field label="Gait" className="max-w-md">
          <TextSelect value={value.gait} onChange={(v) => set('gait', v)} options={GAIT_OPTIONS} />
        </Field>
      </SectionCard>

      <SectionCard
        title="H. Special Orthopaedic Tests"
        description="Mark each test Positive, Negative, or Not Performed."
        accent="info"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {specialTests.map((name) => (
            <Field key={name} label={name}>
              <TextSelect
                value={value.specialTests?.[name] || 'Not Performed'}
                onChange={(v) => setSpecialTest(name, v)}
                options={SPECIAL_TEST_RESULT_OPTIONS}
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Additional Exam Notes">
        <TextTextarea
          value={value.examNotes}
          onChange={(v) => set('examNotes', v)}
          rows={3}
          placeholder="Other musculoskeletal findings…"
        />
      </SectionCard>
    </div>
  );
}
