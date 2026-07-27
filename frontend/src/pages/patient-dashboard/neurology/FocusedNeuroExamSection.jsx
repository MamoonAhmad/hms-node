import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  COORDINATION_OPTIONS,
  CRANIAL_NERVE_OPTIONS,
  GAIT_OPTIONS,
  MENTAL_STATUS_OPTIONS,
  MOTOR_REGIONS,
  MOTOR_STRENGTH_GRADES,
  REFLEX_GRADES,
  REFLEX_SITES,
  SENSORY_OPTIONS,
  YES_NO_OPTIONS,
} from './neurologyConstants';
import { toggleListValue } from './neurologyUtils';

export function FocusedNeuroExamSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  const setMotor = (region, grade) => {
    set('motor', { ...value.motor, [region]: grade });
  };

  const setReflex = (site, side, grade) => {
    set('reflexes', {
      ...value.reflexes,
      [site]: {
        ...(value.reflexes?.[site] || { right: '', left: '' }),
        [side]: grade,
      },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document a focused neurological examination — mentation, cranial nerves, motor, sensory,
        reflexes, coordination, and gait.
      </p>

      <SectionCard title="A. Mental status" accent="info">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mental status">
            <TextSelect
              value={value.mentalStatus}
              onChange={(v) => set('mentalStatus', v)}
              options={MENTAL_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Exam date">
            <TextInput
              type="date"
              value={value.examDate}
              onChange={(v) => set('examDate', v)}
            />
          </Field>
        </div>
        <Field label="Notes">
          <TextTextarea
            value={value.mentalStatusNotes}
            onChange={(v) => set('mentalStatusNotes', v)}
            rows={2}
            placeholder="Orientation details, attention, language…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="B. Cranial nerves">
        <MultiSelectChips
          idPrefix="neuro-cn"
          options={CRANIAL_NERVE_OPTIONS}
          values={value.cranialNerves}
          onToggle={(opt) => toggle('cranialNerves', opt)}
        />
        <Field label="CN notes" className="mt-3">
          <TextTextarea
            value={value.cranialNerveNotes}
            onChange={(v) => set('cranialNerveNotes', v)}
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Motor strength (MRC)" description="Grade 0–5 by region." accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOTOR_REGIONS.map((region) => (
            <Field key={region} label={region}>
              <TextSelect
                value={value.motor?.[region]}
                onChange={(v) => setMotor(region, v)}
                options={MOTOR_STRENGTH_GRADES}
                placeholder="Grade"
              />
            </Field>
          ))}
        </div>
        <Field label="Motor notes" className="mt-3">
          <TextTextarea
            value={value.motorNotes}
            onChange={(v) => set('motorNotes', v)}
            rows={2}
            placeholder="Drift, tone, bulk, fasciculations…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="D. Sensory">
        <MultiSelectChips
          idPrefix="neuro-sensory"
          options={SENSORY_OPTIONS}
          values={value.sensory}
          onToggle={(opt) => toggle('sensory', opt)}
        />
        <Field label="Sensory notes" className="mt-3">
          <TextTextarea
            value={value.sensoryNotes}
            onChange={(v) => set('sensoryNotes', v)}
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="E. Reflexes" description="Right / left by site.">
        <div className="space-y-3">
          {REFLEX_SITES.map((site) => (
            <div
              key={site}
              className="grid items-end gap-3 rounded-lg border border-border/60 bg-card p-3 sm:grid-cols-[8rem_1fr_1fr]"
            >
              <p className="text-sm font-medium text-foreground">{site}</p>
              <Field label="Right">
                <TextSelect
                  value={value.reflexes?.[site]?.right}
                  onChange={(v) => setReflex(site, 'right', v)}
                  options={REFLEX_GRADES}
                  placeholder="—"
                />
              </Field>
              <Field label="Left">
                <TextSelect
                  value={value.reflexes?.[site]?.left}
                  onChange={(v) => setReflex(site, 'left', v)}
                  options={REFLEX_GRADES}
                  placeholder="—"
                />
              </Field>
            </div>
          ))}
        </div>
        <Field label="Plantars" className="mt-3 max-w-xs">
          <TextSelect
            value={value.plantars}
            onChange={(v) => set('plantars', v)}
            options={['Downgoing bilateral', 'Upgoing R', 'Upgoing L', 'Upgoing bilateral', 'Mute']}
          />
        </Field>
      </SectionCard>

      <SectionCard title="F. Coordination & gait" accent="info">
        <Field label="Coordination">
          <MultiSelectChips
            idPrefix="neuro-coord"
            options={COORDINATION_OPTIONS}
            values={value.coordination}
            onToggle={(opt) => toggle('coordination', opt)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Gait">
            <TextSelect
              value={value.gait}
              onChange={(v) => set('gait', v)}
              options={GAIT_OPTIONS}
            />
          </Field>
          <Field label="Romberg">
            <TextSelect
              value={value.romberg}
              onChange={(v) => set('romberg', v)}
              options={[...YES_NO_OPTIONS, 'Not tested', 'Positive (sway/fall)']}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="G. Exam summary" accent="primary">
        <Field label="Focused neuro exam impression">
          <TextTextarea
            value={value.examSummary}
            onChange={(v) => set('examSummary', v)}
            rows={3}
            placeholder="Key findings and clinical impression…"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
