import { Badge } from '@/components/ui/badge';
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
  CYCLE_PHASE_OPTIONS,
  DISEASE_CATEGORY_OPTIONS,
  ECOG_OPTIONS,
  PRIMARY_SITE_OPTIONS,
  STAGE_GROUP_OPTIONS,
  TNM_M_OPTIONS,
  TNM_N_OPTIONS,
  TNM_T_OPTIONS,
  TREATMENT_INTENT_OPTIONS,
  TREATMENT_MODALITY_OPTIONS,
  VISIT_TYPE_OPTIONS,
} from './oncologyHematologyConstants';
import { toggleListValue } from './oncologyHematologyUtils';

export function StagingCycleDaySection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  const cycleSummary =
    value.cycleNumber || value.dayOfCycle
      ? `Cycle ${value.cycleNumber || '—'} Day ${value.dayOfCycle || '—'}`
      : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document cancer / hematologic staging, treatment regimen, and current cycle day for this
        encounter.
      </p>

      {(cycleSummary || value.stageGroup) && (
        <div className="flex flex-wrap items-center gap-2">
          {value.stageGroup && (
            <Badge variant="secondary" className="status-soft-info font-medium">
              Stage {value.stageGroup}
            </Badge>
          )}
          {cycleSummary && (
            <Badge variant="secondary" className="status-soft-warning font-medium">
              {cycleSummary}
            </Badge>
          )}
          {value.treatmentIntent && (
            <Badge variant="secondary" className="status-soft-muted font-medium">
              {value.treatmentIntent}
            </Badge>
          )}
        </div>
      )}

      <SectionCard title="A. Visit & Disease Context" accent="info">
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
          <Field label="Disease Category" required>
            <TextSelect
              value={value.diseaseCategory}
              onChange={(v) => set('diseaseCategory', v)}
              options={DISEASE_CATEGORY_OPTIONS}
            />
          </Field>
          <Field label="Primary Site / Lineage" required>
            <TextSelect
              value={value.primarySite}
              onChange={(v) => set('primarySite', v)}
              options={PRIMARY_SITE_OPTIONS}
            />
          </Field>
          <Field label="Diagnosis Date">
            <TextInput
              type="date"
              value={value.diagnosisDate}
              onChange={(v) => set('diagnosisDate', v)}
            />
          </Field>
        </div>
        <Field label="Histology / Subtype">
          <TextInput
            value={value.histology}
            onChange={(v) => set('histology', v)}
            placeholder="e.g. Invasive ductal carcinoma, DLBCL"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Staging"
        description="TNM components and overall stage group for this disease."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="T">
            <TextSelect
              value={value.tStage}
              onChange={(v) => set('tStage', v)}
              options={TNM_T_OPTIONS}
            />
          </Field>
          <Field label="N">
            <TextSelect
              value={value.nStage}
              onChange={(v) => set('nStage', v)}
              options={TNM_N_OPTIONS}
            />
          </Field>
          <Field label="M">
            <TextSelect
              value={value.mStage}
              onChange={(v) => set('mStage', v)}
              options={TNM_M_OPTIONS}
            />
          </Field>
          <Field label="Stage Group" required>
            <TextSelect
              value={value.stageGroup}
              onChange={(v) => set('stageGroup', v)}
              options={STAGE_GROUP_OPTIONS}
            />
          </Field>
          <Field label="Staging System" className="sm:col-span-2">
            <TextInput
              value={value.stagingSystem}
              onChange={(v) => set('stagingSystem', v)}
              placeholder="e.g. AJCC 8th, Ann Arbor, ISS / R-ISS"
            />
          </Field>
        </div>
        <Field label="Primary Oncology Diagnosis (ICD-10)">
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
            placeholder="Search oncology ICD-10…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Treatment & Cycle Day" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Treatment Intent" required>
            <TextSelect
              value={value.treatmentIntent}
              onChange={(v) => set('treatmentIntent', v)}
              options={TREATMENT_INTENT_OPTIONS}
            />
          </Field>
          <Field label="Cycle Phase">
            <TextSelect
              value={value.cyclePhase}
              onChange={(v) => set('cyclePhase', v)}
              options={CYCLE_PHASE_OPTIONS}
            />
          </Field>
          <Field label="ECOG Performance Status">
            <TextSelect
              value={value.ecog}
              onChange={(v) => set('ecog', v)}
              options={ECOG_OPTIONS}
            />
          </Field>
          <Field label="Regimen / Protocol" required>
            <TextInput
              value={value.regimenName}
              onChange={(v) => set('regimenName', v)}
              placeholder="e.g. R-CHOP, AC-T, FOLFOX"
            />
          </Field>
          <Field label="Cycle Number">
            <TextInput
              type="number"
              min={0}
              value={value.cycleNumber}
              onChange={(v) => set('cycleNumber', v)}
              placeholder="e.g. 3"
            />
          </Field>
          <Field label="Day of Cycle" hint="Day within current cycle">
            <TextInput
              type="number"
              min={0}
              value={value.dayOfCycle}
              onChange={(v) => set('dayOfCycle', v)}
              placeholder="e.g. 1, 8, 15"
            />
          </Field>
          <Field label="Total Planned Cycles">
            <TextInput
              type="number"
              min={0}
              value={value.totalPlannedCycles}
              onChange={(v) => set('totalPlannedCycles', v)}
              placeholder="e.g. 6"
            />
          </Field>
          <Field label="Last Treatment Date">
            <TextInput
              type="date"
              value={value.lastTreatmentDate}
              onChange={(v) => set('lastTreatmentDate', v)}
            />
          </Field>
          <Field label="Next Treatment Date">
            <TextInput
              type="date"
              value={value.nextTreatmentDate}
              onChange={(v) => set('nextTreatmentDate', v)}
            />
          </Field>
          <Field label="Weight (kg)">
            <TextInput
              type="number"
              min={0}
              step="0.1"
              value={value.weightKg}
              onChange={(v) => set('weightKg', v)}
            />
          </Field>
          <Field label="BSA (m²)">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={value.bsa}
              onChange={(v) => set('bsa', v)}
              placeholder="e.g. 1.85"
            />
          </Field>
        </div>
        <Field label="Treatment Modalities">
          <MultiSelectChips
            idPrefix="onc-modality"
            options={TREATMENT_MODALITY_OPTIONS}
            values={value.modalities}
            onToggle={(opt) => toggle('modalities', opt)}
          />
        </Field>
        <Field label="Protocol / Dose Notes">
          <TextTextarea
            value={value.protocolNotes}
            onChange={(v) => set('protocolNotes', v)}
            rows={2}
            placeholder="Dose reductions, holds, growth-factor days…"
          />
        </Field>
        <Field label="Clinical Notes">
          <TextTextarea
            value={value.clinicalNotes}
            onChange={(v) => set('clinicalNotes', v)}
            rows={3}
            placeholder="Staging updates, response assessment, plan…"
          />
        </Field>
      </SectionCard>

      {history.length > 0 && (
        <SectionCard title="Prior encounter snapshots">
          <ul className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <li
                key={`${h.appointmentId || 'none'}-${h.at}`}
                className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">
                  {h.examinationDate || new Date(h.at).toLocaleDateString()}
                </span>
                {' — '}
                {[h.primarySite, h.stageGroup && `Stage ${h.stageGroup}`, h.regimenName]
                  .filter(Boolean)
                  .join(' · ') || 'No staging summary'}
                {(h.cycleNumber || h.dayOfCycle) && (
                  <span>
                    {' '}
                    · C{h.cycleNumber || '—'}D{h.dayOfCycle || '—'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
