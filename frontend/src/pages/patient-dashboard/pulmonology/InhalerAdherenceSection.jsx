import { Plus, Trash2 } from 'lucide-react';
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
  ADHERENCE_BARRIER_OPTIONS,
  ADHERENCE_OPTIONS,
  EDUCATION_OPTIONS,
  INHALER_DEVICE_OPTIONS,
  INHALER_TYPE_OPTIONS,
  TECHNIQUE_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './pulmonologyConstants';
import { createEmptyInhalerRow, toggleListValue } from './pulmonologyUtils';

export function InhalerAdherenceSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  const inhalers = Array.isArray(value.inhalers) ? value.inhalers : [];

  const updateRow = (id, patch) => {
    set(
      'inhalers',
      inhalers.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => set('inhalers', [...inhalers, createEmptyInhalerRow()]);

  const removeRow = (id) => set(
    'inhalers',
    inhalers.filter((row) => row.id !== id),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review current inhalers, observe technique, document adherence, and capture patient
        education.
      </p>

      <SectionCard
        title="A. Current Inhalers"
        description="List controller and rescue therapies used at home."
        accent="info"
        actions={
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add inhaler
          </Button>
        }
      >
        {inhalers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No inhalers documented for this visit.</p>
            <Button type="button" size="sm" className="mt-3" onClick={addRow}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add first inhaler
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {inhalers.map((row, idx) => (
              <div
                key={row.id}
                className="space-y-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Inhaler {idx + 1}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove inhaler ${idx + 1}`}
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Medication Name" className="sm:col-span-2 lg:col-span-1">
                    <TextInput
                      value={row.medicationName}
                      onChange={(v) => updateRow(row.id, { medicationName: v })}
                      placeholder="e.g. Albuterol, Symbicort"
                    />
                  </Field>
                  <Field label="Type">
                    <TextSelect
                      value={row.inhalerType}
                      onChange={(v) => updateRow(row.id, { inhalerType: v })}
                      options={INHALER_TYPE_OPTIONS}
                    />
                  </Field>
                  <Field label="Device">
                    <TextSelect
                      value={row.device}
                      onChange={(v) => updateRow(row.id, { device: v })}
                      options={INHALER_DEVICE_OPTIONS}
                    />
                  </Field>
                  <Field label="Dose">
                    <TextInput
                      value={row.dose}
                      onChange={(v) => updateRow(row.id, { dose: v })}
                      placeholder="e.g. 2 puffs"
                    />
                  </Field>
                  <Field label="Frequency">
                    <TextInput
                      value={row.frequency}
                      onChange={(v) => updateRow(row.id, { frequency: v })}
                      placeholder="e.g. BID, PRN"
                    />
                  </Field>
                  <Field label="Technique">
                    <TextSelect
                      value={row.technique}
                      onChange={(v) => updateRow(row.id, { technique: v })}
                      options={TECHNIQUE_OPTIONS}
                    />
                  </Field>
                  <Field label="Adherence">
                    <TextSelect
                      value={row.adherence}
                      onChange={(v) => updateRow(row.id, { adherence: v })}
                      options={ADHERENCE_OPTIONS}
                    />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <TextInput
                      value={row.notes}
                      onChange={(v) => updateRow(row.id, { notes: v })}
                      placeholder="Technique tips, side effects…"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="B. Overall Adherence & Technique" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Overall Adherence">
            <TextSelect
              value={value.overallAdherence}
              onChange={(v) => set('overallAdherence', v)}
              options={ADHERENCE_OPTIONS}
            />
          </Field>
          <Field label="Technique Observed Today">
            <TextSelect
              value={value.techniqueObserved}
              onChange={(v) => set('techniqueObserved', v)}
              options={TECHNIQUE_OPTIONS}
            />
          </Field>
          <Field label="Uses Spacer / Chamber">
            <TextSelect
              value={value.spacerUsed}
              onChange={(v) => set('spacerUsed', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Missed Doses (Last Week)">
            <TextInput
              type="number"
              min={0}
              value={value.missedDosesLastWeek}
              onChange={(v) => set('missedDosesLastWeek', v)}
            />
          </Field>
          <Field label="Pharmacy / Refill Concern">
            <TextSelect
              value={value.pharmacyRefillConcern}
              onChange={(v) => set('pharmacyRefillConcern', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Action Plan Reviewed">
            <TextSelect
              value={value.actionPlanReviewed}
              onChange={(v) => set('actionPlanReviewed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="C. Barriers & Education" accent="warning">
        <Field label="Adherence Barriers">
          <MultiSelectChips
            idPrefix="pulm-barrier"
            options={ADHERENCE_BARRIER_OPTIONS}
            values={value.barriers}
            onToggle={(opt) => toggle('barriers', opt)}
          />
        </Field>
        <Field label="Education Provided">
          <MultiSelectChips
            idPrefix="pulm-edu"
            options={EDUCATION_OPTIONS}
            values={value.educationProvided}
            onToggle={(opt) => toggle('educationProvided', opt)}
          />
        </Field>
        <Field label="Counseling Notes">
          <TextTextarea
            value={value.counselingNotes}
            onChange={(v) => set('counselingNotes', v)}
            rows={3}
            placeholder="Teach-back findings, corrections, patient concerns…"
          />
        </Field>
        <Field label="Follow-up Plan">
          <TextTextarea
            value={value.followUpPlan}
            onChange={(v) => set('followUpPlan', v)}
            rows={2}
            placeholder="e.g. Re-check technique next visit; pharmacy outreach…"
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard
          title="Longitudinal Adherence"
          description="Overall adherence trend across recent visits."
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Overall Adherence</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.at}-${idx}`} className={idx % 2 === 1 ? 'bg-muted/20' : undefined}>
                    <td className="px-3 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-3 py-2">{row.overallAdherence || '—'}</td>
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
