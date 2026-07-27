import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  COMPLIANCE_OPTIONS,
  DIAGNOSTIC_ORDER_OPTIONS,
  EYE_SIDE_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  GLAUCOMA_STAGE_OPTIONS,
  MED_FREQUENCY_OPTIONS,
  OCULAR_MED_EXAMPLES,
  PATIENT_EDUCATION_OPTIONS,
  PROCEDURE_OPTIONS,
  REFERRAL_OPTIONS,
  SURGERY_TYPE_OPTIONS,
  TONOMETRY_METHODS,
  YES_NO_OPTIONS,
} from './ophthalmologyConstants';
import {
  createEmptyEyeDropAdmin,
  createEmptyOcularMedication,
  toggleListValue,
} from './ophthalmologyUtils';

export function IopTreatmentPlanSection({
  value,
  onChange,
  history = [],
  onOpenOrders,
  onOpenMedications,
  onOpenReferrals,
  onOpenResults,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  const updateMed = (id, patch) => {
    set(
      'ocularMedications',
      (value.ocularMedications || []).map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const updateDrop = (id, patch) => {
    set(
      'eyeDropsToday',
      (value.eyeDropsToday || []).map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents glaucoma screening, intraocular pressure, ocular medications, procedures, and
        treatment planning.
      </p>

      <SectionCard title="A. Intraocular Pressure" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tonometry Method">
            <TextSelect value={value.tonometryMethod} onChange={(v) => set('tonometryMethod', v)} options={TONOMETRY_METHODS} />
          </Field>
          <Field label="OD IOP (mmHg)">
            <TextInput type="number" min={0} step={0.1} value={value.iopOd} onChange={(v) => set('iopOd', v)} />
          </Field>
          <Field label="OS IOP (mmHg)">
            <TextInput type="number" min={0} step={0.1} value={value.iopOs} onChange={(v) => set('iopOs', v)} />
          </Field>
          <Field label="Time Measured">
            <TextInput type="time" value={value.timeMeasured} onChange={(v) => set('timeMeasured', v)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Glaucoma Assessment">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Glaucoma Suspected">
            <TextSelect value={value.glaucomaSuspected} onChange={(v) => set('glaucomaSuspected', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Glaucoma Diagnosis">
            <TextInput value={value.glaucomaDiagnosis} onChange={(v) => set('glaucomaDiagnosis', v)} placeholder="Diagnosis…" />
          </Field>
          <Field label="Stage">
            <TextSelect value={value.glaucomaStage} onChange={(v) => set('glaucomaStage', v)} options={GLAUCOMA_STAGE_OPTIONS} />
          </Field>
          <Field label="Target IOP">
            <TextInput value={value.targetIop} onChange={(v) => set('targetIop', v)} placeholder="mmHg" />
          </Field>
          <Field label="Visual Field Progression">
            <TextSelect value={value.visualFieldProgression} onChange={(v) => set('visualFieldProgression', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="OCT Performed">
            <TextSelect value={value.octPerformed} onChange={(v) => set('octPerformed', v)} options={YES_NO_OPTIONS} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Ocular Medications"
        description="Link prescriptions with the Medications module when ready."
        accent="primary"
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onOpenMedications}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Medications
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => set('ocularMedications', [...(value.ocularMedications || []), createEmptyOcularMedication()])}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        }
      >
        {(value.ocularMedications || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ocular medications documented. Examples: {OCULAR_MED_EXAMPLES.slice(0, 4).join(', ')}…
          </p>
        ) : (
          <div className="space-y-3">
            {value.ocularMedications.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove medication"
                    onClick={() =>
                      set(
                        'ocularMedications',
                        value.ocularMedications.filter((r) => r.id !== row.id),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Medication Name">
                    <TextSelect
                      value={row.medicationName}
                      onChange={(v) => updateMed(row.id, { medicationName: v })}
                      options={OCULAR_MED_EXAMPLES}
                      placeholder="Select or type via Other…"
                    />
                  </Field>
                  <Field label="Eye">
                    <TextSelect value={row.eye} onChange={(v) => updateMed(row.id, { eye: v })} options={EYE_SIDE_OPTIONS} />
                  </Field>
                  <Field label="Dose">
                    <TextInput value={row.dose} onChange={(v) => updateMed(row.id, { dose: v })} />
                  </Field>
                  <Field label="Frequency">
                    <TextSelect value={row.frequency} onChange={(v) => updateMed(row.id, { frequency: v })} options={MED_FREQUENCY_OPTIONS} />
                  </Field>
                  <Field label="Start Date">
                    <TextInput type="date" value={row.startDate} onChange={(v) => updateMed(row.id, { startDate: v })} />
                  </Field>
                  <Field label="Compliance">
                    <TextSelect value={row.compliance} onChange={(v) => updateMed(row.id, { compliance: v })} options={COMPLIANCE_OPTIONS} />
                  </Field>
                  <Field label="Side Effects" className="sm:col-span-2 lg:col-span-3">
                    <TextInput value={row.sideEffects} onChange={(v) => updateMed(row.id, { sideEffects: v })} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="D. Eye Drops Administered Today"
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => set('eyeDropsToday', [...(value.eyeDropsToday || []), createEmptyEyeDropAdmin()])}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        }
      >
        {(value.eyeDropsToday || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No eye drops administered today.</p>
        ) : (
          <div className="space-y-3">
            {value.eyeDropsToday.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Medication">
                  <TextInput value={row.medication} onChange={(v) => updateDrop(row.id, { medication: v })} />
                </Field>
                <Field label="Eye">
                  <TextSelect value={row.eye} onChange={(v) => updateDrop(row.id, { eye: v })} options={EYE_SIDE_OPTIONS} />
                </Field>
                <Field label="Dose">
                  <TextInput value={row.dose} onChange={(v) => updateDrop(row.id, { dose: v })} />
                </Field>
                <Field label="Time">
                  <TextInput type="time" value={row.time} onChange={(v) => updateDrop(row.id, { time: v })} />
                </Field>
                <div className="flex items-end gap-2">
                  <Field label="Administered By" className="flex-1">
                    <TextInput value={row.administeredBy} onChange={(v) => updateDrop(row.id, { administeredBy: v })} />
                  </Field>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove drop"
                    onClick={() =>
                      set(
                        'eyeDropsToday',
                        value.eyeDropsToday.filter((r) => r.id !== row.id),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="E. Procedures">
        <MultiSelectChips idPrefix="oph-proc" options={PROCEDURE_OPTIONS} values={value.procedures} onToggle={(opt) => toggle('procedures', opt)} />
      </SectionCard>

      <SectionCard
        title="F. Diagnostic Orders"
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Orders
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onOpenResults}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Results
            </Button>
          </div>
        }
      >
        <MultiSelectChips
          idPrefix="oph-dx"
          options={DIAGNOSTIC_ORDER_OPTIONS}
          values={value.diagnosticOrders}
          onToggle={(opt) => toggle('diagnosticOrders', opt)}
        />
      </SectionCard>

      <SectionCard
        title="G. Referrals"
        actions={
          <Button type="button" size="sm" variant="outline" onClick={onOpenReferrals}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Referrals
          </Button>
        }
      >
        <MultiSelectChips idPrefix="oph-ref" options={REFERRAL_OPTIONS} values={value.referrals} onToggle={(opt) => toggle('referrals', opt)} />
      </SectionCard>

      <SectionCard title="H. Follow-up">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Follow-up Interval">
            <TextSelect value={value.followUpInterval} onChange={(v) => set('followUpInterval', v)} options={FOLLOW_UP_INTERVAL_OPTIONS} />
          </Field>
          <Field label="Repeat IOP">
            <TextSelect value={value.repeatIop} onChange={(v) => set('repeatIop', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Repeat OCT">
            <TextSelect value={value.repeatOct} onChange={(v) => set('repeatOct', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Repeat Visual Field">
            <TextSelect value={value.repeatVisualField} onChange={(v) => set('repeatVisualField', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Next Dilated Exam">
            <TextInput type="date" value={value.nextDilatedExam} onChange={(v) => set('nextDilatedExam', v)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="I. Patient Education">
        <MultiSelectChips
          idPrefix="oph-edu"
          options={PATIENT_EDUCATION_OPTIONS}
          values={value.patientEducation}
          onToggle={(opt) => toggle('patientEducation', opt)}
        />
      </SectionCard>

      <SectionCard title="J. Provider Assessment & Plan" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary Ophthalmic Diagnosis">
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
          <TextTextarea value={value.clinicalImpression} onChange={(v) => set('clinicalImpression', v)} rows={3} />
        </Field>
        <Field label="Treatment Plan">
          <TextTextarea value={value.treatmentPlan} onChange={(v) => set('treatmentPlan', v)} rows={3} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Surgical Recommendation">
            <TextSelect value={value.surgicalRecommendation} onChange={(v) => set('surgicalRecommendation', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Surgery Type">
            <TextSelect value={value.surgeryType} onChange={(v) => set('surgeryType', v)} options={SURGERY_TYPE_OPTIONS} />
          </Field>
        </div>
        <Field label="Return Precautions">
          <TextTextarea value={value.returnPrecautions} onChange={(v) => set('returnPrecautions', v)} rows={2} />
        </Field>
        <Field label="Encounter Summary">
          <TextTextarea value={value.encounterSummary} onChange={(v) => set('encounterSummary', v)} rows={3} />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard title="Longitudinal IOP & C/D" description="Trends across recent eye visits.">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">IOP OD</th>
                  <th className="px-3 py-2 font-medium">IOP OS</th>
                  <th className="px-3 py-2 font-medium">C/D OD</th>
                  <th className="px-3 py-2 font-medium">C/D OS</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.at}-iop-${idx}`} className={idx % 2 === 1 ? 'bg-muted/20' : undefined}>
                    <td className="px-3 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-3 py-2">{row.iopOd || '—'}</td>
                    <td className="px-3 py-2">{row.iopOs || '—'}</td>
                    <td className="px-3 py-2">{row.cupToDiscOd || '—'}</td>
                    <td className="px-3 py-2">{row.cupToDiscOs || '—'}</td>
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
