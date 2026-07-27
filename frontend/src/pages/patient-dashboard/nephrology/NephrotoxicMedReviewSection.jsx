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
  FOLLOW_UP_INTERVAL_OPTIONS,
  MED_ACTION_OPTIONS,
  NEPHROTOXIC_MED_CATEGORIES,
  NEPHROTOXIC_PLAN_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './nephrologyConstants';
import { createEmptyNephrotoxicMedRow, toggleListValue } from './nephrologyUtils';

export function NephrotoxicMedReviewSection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const setChecklist = (id, answer) => {
    set('checklist', { ...(value.checklist || {}), [id]: answer });
  };

  const medications = Array.isArray(value.medications) ? value.medications : [];

  const updateMed = (id, patch) => {
    set(
      'medications',
      medications.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addMed = () => {
    set('medications', [...medications, createEmptyNephrotoxicMedRow()]);
  };

  const removeMed = (id) => {
    set(
      'medications',
      medications.filter((row) => row.id !== id),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Screen for nephrotoxic and high-risk kidney medications, document actions, and capture
        sick-day / monitoring plan.
      </p>

      <SectionCard title="A. Review metadata" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Examination date" required>
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
          <Field label="Reviewed with patient">
            <TextSelect
              value={value.reviewedWithPatient}
              onChange={(v) => set('reviewedWithPatient', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Pharmacy reconciled">
            <TextSelect
              value={value.pharmacyReconciled}
              onChange={(v) => set('pharmacyReconciled', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. High-risk category screen"
        description="Mark Yes when the patient is exposed to each class."
        accent="warning"
      >
        <div className="space-y-3">
          {NEPHROTOXIC_MED_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-medium text-foreground">{cat.label}</p>
              <div className="flex gap-2">
                {['yes', 'no'].map((ans) => {
                  const active = (value.checklist?.[cat.id] || 'no') === ans;
                  return (
                    <Button
                      key={ans}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      className="min-w-[4.5rem] capitalize"
                      onClick={() => setChecklist(cat.id, ans)}
                    >
                      {ans}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="C. Medication detail rows" accent="primary">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Add specific agents for action tracking (hold, adjust, monitor).
          </p>
          <Button type="button" size="sm" variant="outline" onClick={addMed}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add medication
          </Button>
        </div>

        {medications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No medication rows yet. Use Add medication to document specific agents.
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((row, index) => (
              <div
                key={row.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Medication {index + 1}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove medication ${index + 1}`}
                    onClick={() => removeMed(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Category">
                    <TextSelect
                      value={row.categoryId}
                      onChange={(v) => updateMed(row.id, { categoryId: v })}
                      options={NEPHROTOXIC_MED_CATEGORIES.map((c) => c.label)}
                      placeholder="Select class"
                    />
                  </Field>
                  <Field label="Medication name">
                    <TextInput
                      value={row.medicationName}
                      onChange={(v) => updateMed(row.id, { medicationName: v })}
                      placeholder="e.g. Ibuprofen"
                    />
                  </Field>
                  <Field label="Dose">
                    <TextInput
                      value={row.dose}
                      onChange={(v) => updateMed(row.id, { dose: v })}
                      placeholder="e.g. 400 mg"
                    />
                  </Field>
                  <Field label="Frequency">
                    <TextInput
                      value={row.frequency}
                      onChange={(v) => updateMed(row.id, { frequency: v })}
                      placeholder="e.g. BID PRN"
                    />
                  </Field>
                  <Field label="Currently taking">
                    <TextSelect
                      value={row.currentlyTaking}
                      onChange={(v) => updateMed(row.id, { currentlyTaking: v })}
                      options={YES_NO_UNKNOWN_OPTIONS}
                    />
                  </Field>
                  <Field label="Action">
                    <TextSelect
                      value={row.action}
                      onChange={(v) => updateMed(row.id, { action: v })}
                      options={MED_ACTION_OPTIONS}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Indication">
                    <TextInput
                      value={row.indication}
                      onChange={(v) => updateMed(row.id, { indication: v })}
                      placeholder="Why prescribed"
                    />
                  </Field>
                  <Field label="Notes">
                    <TextInput
                      value={row.notes}
                      onChange={(v) => updateMed(row.id, { notes: v })}
                      placeholder="Monitoring, alternatives…"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="D. Contrast & AKI risk">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Recent iodinated contrast">
            <TextSelect
              value={value.contrastRecent}
              onChange={(v) => set('contrastRecent', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Contrast date">
            <TextInput
              type="date"
              value={value.contrastDate}
              onChange={(v) => set('contrastDate', v)}
            />
          </Field>
          <Field label="Contrast type / study">
            <TextInput
              value={value.contrastType}
              onChange={(v) => set('contrastType', v)}
              placeholder="e.g. CT abdomen with contrast"
            />
          </Field>
          <Field label="AKI risk discussed">
            <TextSelect
              value={value.akiRiskDiscussed}
              onChange={(v) => set('akiRiskDiscussed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Follow-up interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Plan">
        <Field label="Plan items">
          <MultiSelectChips
            idPrefix="nephro-med-plan"
            options={NEPHROTOXIC_PLAN_OPTIONS}
            values={value.planItems || []}
            onToggle={(opt) => set('planItems', toggleListValue(value.planItems, opt))}
          />
        </Field>
        <Field label="Clinical notes" className="mt-3">
          <TextTextarea
            value={value.clinicalNotes}
            onChange={(v) => set('clinicalNotes', v)}
            rows={3}
            placeholder="Summary of med review, education, and monitoring plan…"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
