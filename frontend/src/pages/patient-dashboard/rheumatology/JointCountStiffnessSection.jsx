import { Badge } from '@/components/ui/badge';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../womens-health/WomensHealthFields';
import {
  JOINT_28_SET,
  JOINT_COUNT_METHODS,
  MORNING_STIFFNESS_DURATION,
  VAS_OPTIONS,
} from './rheumatologyConstants';
import { interpretJointActivity, resolveJointCounts } from './rheumatologyUtils';

const VARIANT_CLASS = {
  success: 'status-soft-success',
  warning: 'status-soft-warning',
  danger: 'status-soft-danger',
  info: 'status-soft-info',
  muted: 'status-soft-muted',
};

export function JointCountStiffnessSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const joints = value.joints || {};
  const counts = resolveJointCounts(value);
  const activity = interpretJointActivity(counts.tender, counts.swollen);

  const toggleJoint = (id, key) => {
    const current = joints[id] || { tender: false, swollen: false };
    set('joints', {
      ...joints,
      [id]: { ...current, [key]: !current[key] },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document tender / swollen joint counts and morning stiffness for disease activity
        tracking across visits.
      </p>

      <SectionCard
        title="A. Joint activity summary"
        description="Counts update from the 28-joint map, or enter overrides for 66/68 exams."
        accent="info"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={VARIANT_CLASS[activity.variant] || VARIANT_CLASS.info}>
            {activity.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            TJC {counts.tender} · SJC {counts.swollen} · {activity.interpretation}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Assessment date">
            <TextInput
              type="date"
              value={value.assessedAt}
              onChange={(v) => set('assessedAt', v)}
            />
          </Field>
          <Field label="Count method">
            <TextSelect
              value={value.method}
              onChange={(v) => set('method', v)}
              options={JOINT_COUNT_METHODS}
            />
          </Field>
          <Field label="Tender override (optional)">
            <TextInput
              type="number"
              min={0}
              max={68}
              value={value.tenderOverride}
              onChange={(v) => set('tenderOverride', v)}
              placeholder={`Map: ${counts.fromMapTender}`}
            />
          </Field>
          <Field label="Swollen override (optional)">
            <TextInput
              type="number"
              min={0}
              max={66}
              value={value.swollenOverride}
              onChange={(v) => set('swollenOverride', v)}
              placeholder={`Map: ${counts.fromMapSwollen}`}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. 28-joint map"
        description="Toggle tender (T) and swollen (S) for each joint."
        accent="primary"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {JOINT_28_SET.map((joint) => {
            const state = joints[joint.id] || { tender: false, swollen: false };
            return (
              <div
                key={joint.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground">{joint.label}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={Boolean(state.tender)}
                      onChange={() => toggleJoint(joint.id, 'tender')}
                      aria-label={`${joint.label} tender`}
                    />
                    T
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={Boolean(state.swollen)}
                      onChange={() => toggleJoint(joint.id, 'swollen')}
                      aria-label={`${joint.label} swollen`}
                    />
                    S
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="C. Morning stiffness & globals" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Morning stiffness duration">
            <TextSelect
              value={value.morningStiffness}
              onChange={(v) => set('morningStiffness', v)}
              options={MORNING_STIFFNESS_DURATION}
            />
          </Field>
          <Field label="Stiffness minutes (optional)">
            <TextInput
              type="number"
              min={0}
              max={1440}
              value={value.morningStiffnessMinutes}
              onChange={(v) => set('morningStiffnessMinutes', v)}
              placeholder="e.g. 90"
            />
          </Field>
          <Field label="Pain VAS (0–10)">
            <TextSelect
              value={value.painVas}
              onChange={(v) => set('painVas', v)}
              options={VAS_OPTIONS}
              placeholder="—"
            />
          </Field>
          <Field label="Patient global VAS (0–10)">
            <TextSelect
              value={value.patientGlobalVas}
              onChange={(v) => set('patientGlobalVas', v)}
              options={VAS_OPTIONS}
              placeholder="—"
            />
          </Field>
          <Field label="Physician global VAS (0–10)">
            <TextSelect
              value={value.physicianGlobalVas}
              onChange={(v) => set('physicianGlobalVas', v)}
              options={VAS_OPTIONS}
              placeholder="—"
            />
          </Field>
        </div>
        <Field label="Notes" className="mt-3">
          <TextTextarea
            value={value.notes}
            onChange={(v) => set('notes', v)}
            rows={3}
            placeholder="Distribution pattern, asymmetry, deformity, prior counts…"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
