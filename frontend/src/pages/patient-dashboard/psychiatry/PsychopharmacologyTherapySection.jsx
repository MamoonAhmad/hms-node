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
  ADHERENCE_OPTIONS,
  COORDINATION_ACTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  MEDICATION_CLASS_OPTIONS,
  SIDE_EFFECT_OPTIONS,
  THERAPY_MODALITY_OPTIONS,
  THERAPY_STATUS_OPTIONS,
  VISIT_TYPE_OPTIONS,
} from './psychiatryConstants';
import { createEmptyMedicationRow, toggleListValue } from './psychiatryUtils';

export function PsychopharmacologyTherapySection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));
  const medications = Array.isArray(value.medications) ? value.medications : [];

  const updateMed = (id, patch) => {
    set(
      'medications',
      medications.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };

  const toggleMedList = (id, key, opt) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    updateMed(id, { [key]: toggleListValue(med[key], opt) });
  };

  const addMed = () => set('medications', [...medications, createEmptyMedicationRow()]);
  const removeMed = (id) => set('medications', medications.filter((m) => m.id !== id));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document psychotropic regimen, side effects, adherence, and therapy / care-coordination for
        this encounter.
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
          <Field label="Primary Psychiatric Focus" className="sm:col-span-2 lg:col-span-3">
            <TextInput
              value={value.primaryDiagnosis}
              onChange={(v) => set('primaryDiagnosis', v)}
              placeholder="e.g. Major depressive disorder, Generalized anxiety"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Psychopharmacology"
        description="Current psychotropics, adherence, and side-effect burden."
        accent="primary"
        actions={
          <Button type="button" size="sm" variant="outline" onClick={addMed}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add medication
          </Button>
        }
      >
        {medications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No psychotropic medications documented.</p>
            <Button type="button" size="sm" className="mt-3" onClick={addMed}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add medication
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med, index) => (
              <div
                key={med.id}
                className="space-y-3 rounded-lg border border-border/70 bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Medication {index + 1}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Remove medication ${index + 1}`}
                    onClick={() => removeMed(med.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Medication Name" required>
                    <TextInput
                      value={med.medicationName}
                      onChange={(v) => updateMed(med.id, { medicationName: v })}
                      placeholder="e.g. Sertraline"
                    />
                  </Field>
                  <Field label="Class">
                    <TextSelect
                      value={med.medicationClass}
                      onChange={(v) => updateMed(med.id, { medicationClass: v })}
                      options={MEDICATION_CLASS_OPTIONS}
                    />
                  </Field>
                  <Field label="Dose">
                    <TextInput
                      value={med.dose}
                      onChange={(v) => updateMed(med.id, { dose: v })}
                      placeholder="e.g. 50 mg"
                    />
                  </Field>
                  <Field label="Frequency">
                    <TextInput
                      value={med.frequency}
                      onChange={(v) => updateMed(med.id, { frequency: v })}
                      placeholder="e.g. Daily"
                    />
                  </Field>
                  <Field label="Indication">
                    <TextInput
                      value={med.indication}
                      onChange={(v) => updateMed(med.id, { indication: v })}
                      placeholder="e.g. Depression"
                    />
                  </Field>
                  <Field label="Adherence">
                    <TextSelect
                      value={med.adherence}
                      onChange={(v) => updateMed(med.id, { adherence: v })}
                      options={ADHERENCE_OPTIONS}
                    />
                  </Field>
                </div>
                <Field label="Side Effects">
                  <MultiSelectChips
                    idPrefix={`psych-med-se-${med.id}`}
                    options={SIDE_EFFECT_OPTIONS}
                    values={med.sideEffects || []}
                    onToggle={(opt) => toggleMedList(med.id, 'sideEffects', opt)}
                  />
                </Field>
                <Field label="Notes">
                  <TextInput
                    value={med.notes}
                    onChange={(v) => updateMed(med.id, { notes: v })}
                    placeholder="Titration, response, concerns…"
                  />
                </Field>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Overall Adherence">
            <TextSelect
              value={value.overallAdherence}
              onChange={(v) => set('overallAdherence', v)}
              options={ADHERENCE_OPTIONS}
            />
          </Field>
          <Field label="Side-Effect Burden">
            <TextSelect
              value={value.sideEffectBurden}
              onChange={(v) => set('sideEffectBurden', v)}
              options={['None', 'Mild', 'Moderate', 'Severe', 'Unknown']}
            />
          </Field>
          <Field label="Monitoring Labs Due">
            <TextInput
              value={value.monitoringLabsDue}
              onChange={(v) => set('monitoringLabsDue', v)}
              placeholder="e.g. Lithium level, metabolic panel"
            />
          </Field>
        </div>
        <Field label="Medication Changes This Visit" className="mt-3">
          <TextTextarea
            value={value.medChangesThisVisit}
            onChange={(v) => set('medChangesThisVisit', v)}
            rows={2}
            placeholder="Starts, stops, dose changes, counseling provided…"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="C. Therapy coordination"
        description="Modality, engagement, and therapist collaboration."
        accent="info"
      >
        <Field label="Therapy Modalities">
          <MultiSelectChips
            idPrefix="psych-therapy-mod"
            options={THERAPY_MODALITY_OPTIONS}
            values={value.therapyModality}
            onToggle={(opt) => toggle('therapyModality', opt)}
          />
        </Field>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Therapy Status">
            <TextSelect
              value={value.therapyStatus}
              onChange={(v) => set('therapyStatus', v)}
              options={THERAPY_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Therapist / Clinician">
            <TextInput
              value={value.therapistName}
              onChange={(v) => set('therapistName', v)}
              placeholder="Name / agency"
            />
          </Field>
          <Field label="Therapist Contact">
            <TextInput
              value={value.therapistContact}
              onChange={(v) => set('therapistContact', v)}
              placeholder="Phone or secure message"
            />
          </Field>
          <Field label="Therapy Frequency">
            <TextInput
              value={value.therapyFrequency}
              onChange={(v) => set('therapyFrequency', v)}
              placeholder="e.g. Weekly"
            />
          </Field>
          <Field label="Last Therapy Session">
            <TextInput
              type="date"
              value={value.lastTherapySession}
              onChange={(v) => set('lastTherapySession', v)}
            />
          </Field>
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Coordination Actions This Visit" className="mt-3">
          <MultiSelectChips
            idPrefix="psych-coord"
            options={COORDINATION_ACTIONS}
            values={value.coordinationActions}
            onToggle={(opt) => toggle('coordinationActions', opt)}
          />
        </Field>
        <Field label="Social Supports" className="mt-3">
          <TextTextarea
            value={value.socialSupports}
            onChange={(v) => set('socialSupports', v)}
            rows={2}
            placeholder="Family, peers, community resources…"
          />
        </Field>
        <Field label="Barriers to Care" className="mt-3">
          <TextTextarea
            value={value.barriersToCare}
            onChange={(v) => set('barriersToCare', v)}
            rows={2}
            placeholder="Transportation, cost, stigma, childcare…"
          />
        </Field>
        <Field label="Shared Treatment Goals" className="mt-3">
          <TextTextarea
            value={value.sharedGoals}
            onChange={(v) => set('sharedGoals', v)}
            rows={2}
            placeholder="Goals aligned with therapy and medication plan…"
          />
        </Field>
        <Field label="Care Plan Notes" className="mt-3">
          <TextTextarea
            value={value.carePlanNotes}
            onChange={(v) => set('carePlanNotes', v)}
            rows={2}
            placeholder="Next steps, referrals, crisis resources reviewed…"
          />
        </Field>
        <Field label="Provider Notes" className="mt-3">
          <TextTextarea
            value={value.providerNotes}
            onChange={(v) => set('providerNotes', v)}
            rows={2}
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard title="D. Longitudinal psych / therapy history" accent="default">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Meds</th>
                  <th className="px-2 py-2 font-medium">Adherence</th>
                  <th className="px-2 py-2 font-medium">Therapy status</th>
                  <th className="px-2 py-2 font-medium">Risk (SI-HI)</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row) => (
                  <tr key={`${row.at}-${row.appointmentId}-rx`} className="border-b border-border/60">
                    <td className="px-2 py-2 text-muted-foreground">
                      {row.at ? new Date(row.at).toLocaleString() : '—'}
                    </td>
                    <td className="px-2 py-2">{row.medCount ?? '—'}</td>
                    <td className="px-2 py-2">{row.overallAdherence || '—'}</td>
                    <td className="px-2 py-2">{row.therapyStatus || '—'}</td>
                    <td className="px-2 py-2 font-medium">{row.riskLabel || '—'}</td>
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
