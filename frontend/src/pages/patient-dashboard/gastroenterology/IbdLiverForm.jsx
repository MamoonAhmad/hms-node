import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DISEASE_STATUS_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  GI_COMMON_MEDICATIONS,
  GI_REFERRAL_OPTIONS,
  IBD_ASSESSMENT_OPTIONS,
  IBD_LIVER_DIAGNOSIS_OPTIONS,
  IMAGING_PROCEDURE_OPTIONS,
  LIVER_ASSESSMENT_OPTIONS,
  SYMPTOM_SEVERITY_OPTIONS,
  VACCINATION_OPTIONS,
  YES_NO_OPTIONS,
} from './gastroenterologyConstants';
import { toggleListValue } from './gastroenterologyUtils';

function medicationLabel(order) {
  return (
    order?.medicationName ||
    order?.drugName ||
    order?.name ||
    order?.displayName ||
    'Medication'
  );
}

export function IbdLiverForm({
  value,
  onChange,
  linkedMedications = [],
  medicationsLoading = false,
  onRefreshMedications,
  onOpenMedications,
  onOpenOrders,
  onOpenResults,
  onOpenReferrals,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Support ongoing management of inflammatory bowel disease and chronic liver disease during
        outpatient follow-up visits.
      </p>

      <SectionCard title="A. Diagnosis" accent="info">
        <MultiSelectChips
          values={value.diagnoses || []}
          options={IBD_LIVER_DIAGNOSIS_OPTIONS}
          onToggle={(opt) => toggle('diagnoses', opt)}
          idPrefix="gi-ibd-dx"
        />
      </SectionCard>

      <SectionCard title="B. Disease Activity">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Disease Status">
            <TextSelect
              value={value.diseaseStatus}
              onChange={(v) => set('diseaseStatus', v)}
              options={DISEASE_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Current Flare">
            <TextSelect
              value={value.currentFlare}
              onChange={(v) => set('currentFlare', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Symptom Severity">
            <TextSelect
              value={value.symptomSeverity}
              onChange={(v) => set('symptomSeverity', v)}
              options={SYMPTOM_SEVERITY_OPTIONS}
            />
          </Field>
          <Field label="Hospitalization Since Last Visit">
            <TextSelect
              value={value.hospitalizationSinceLastVisit}
              onChange={(v) => set('hospitalizationSinceLastVisit', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="C. IBD Assessment">
        <MultiSelectChips
          values={value.ibdAssessment || []}
          options={IBD_ASSESSMENT_OPTIONS}
          onToggle={(opt) => toggle('ibdAssessment', opt)}
          idPrefix="gi-ibd-assess"
        />
      </SectionCard>

      <SectionCard title="D. Liver Disease Assessment">
        <MultiSelectChips
          values={value.liverAssessment || []}
          options={LIVER_ASSESSMENT_OPTIONS}
          onToggle={(opt) => toggle('liverAssessment', opt)}
          idPrefix="gi-liver-assess"
        />
      </SectionCard>

      <SectionCard
        title="E. Laboratory Monitoring"
        description="Review key IBD and liver function labs. Values may be imported from Results when available."
        actions={
          onOpenResults ? (
            <Button type="button" size="sm" variant="outline" onClick={onOpenResults}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Results
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CBC Reviewed">
            <TextSelect
              value={value.cbcReviewed}
              onChange={(v) => set('cbcReviewed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="CRP Reviewed">
            <TextSelect
              value={value.crpReviewed}
              onChange={(v) => set('crpReviewed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="ESR Reviewed">
            <TextSelect
              value={value.esrReviewed}
              onChange={(v) => set('esrReviewed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Fecal Calprotectin">
            <TextInput
              type="number"
              min={0}
              value={value.fecalCalprotectin}
              onChange={(v) => set('fecalCalprotectin', v)}
            />
          </Field>
          <Field label="AST">
            <TextInput type="number" min={0} value={value.ast} onChange={(v) => set('ast', v)} />
          </Field>
          <Field label="ALT">
            <TextInput type="number" min={0} value={value.alt} onChange={(v) => set('alt', v)} />
          </Field>
          <Field label="Bilirubin">
            <TextInput
              type="number"
              min={0}
              step={0.1}
              value={value.bilirubin}
              onChange={(v) => set('bilirubin', v)}
            />
          </Field>
          <Field label="Albumin">
            <TextInput
              type="number"
              min={0}
              step={0.1}
              value={value.albumin}
              onChange={(v) => set('albumin', v)}
            />
          </Field>
          <Field label="INR">
            <TextInput
              type="number"
              min={0}
              step={0.1}
              value={value.inr}
              onChange={(v) => set('inr', v)}
            />
          </Field>
          <Field label="Creatinine">
            <TextInput
              type="number"
              min={0}
              step={0.01}
              value={value.creatinine}
              onChange={(v) => set('creatinine', v)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="F. Imaging & Procedures"
        actions={
          onOpenOrders ? (
            <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Orders
            </Button>
          ) : null
        }
      >
        <MultiSelectChips
          values={value.imagingProcedures || []}
          options={IMAGING_PROCEDURE_OPTIONS}
          onToggle={(opt) => toggle('imagingProcedures', opt)}
          idPrefix="gi-imaging"
        />
      </SectionCard>

      <SectionCard
        title="G. Medications"
        description="Auto-linked from the Medication Orders module. Common GI therapies are listed for reference."
        accent="primary"
        actions={
          <div className="flex gap-2">
            {onRefreshMedications && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRefreshMedications}
                disabled={medicationsLoading}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            )}
            {onOpenMedications && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenMedications}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Medications
              </Button>
            )}
          </div>
        }
      >
        {medicationsLoading ? (
          <p className="text-sm text-muted-foreground">Loading medications…</p>
        ) : linkedMedications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active medication orders linked for this encounter. Common therapies:{' '}
            {GI_COMMON_MEDICATIONS.slice(0, 6).join(', ')}…
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedMedications.map((order) => (
              <li
                key={order.id || medicationLabel(order)}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{medicationLabel(order)}</span>
                {order.dose || order.strength ? (
                  <span className="text-muted-foreground">
                    {[order.dose || order.strength, order.frequency || order.sig]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                ) : null}
                {order.status ? (
                  <Badge variant="outline" className="status-soft-info">
                    {order.status}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Reference list: {GI_COMMON_MEDICATIONS.join(', ')}
        </p>
      </SectionCard>

      <SectionCard title="H. Vaccination Review">
        <MultiSelectChips
          values={value.vaccinations || []}
          options={VACCINATION_OPTIONS}
          onToggle={(opt) => toggle('vaccinations', opt)}
          idPrefix="gi-vax"
        />
      </SectionCard>

      <SectionCard title="I. Monitoring & Follow-up" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Colon Cancer Surveillance Due">
            <TextSelect
              value={value.colonCancerSurveillanceDue}
              onChange={(v) => set('colonCancerSurveillanceDue', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="HCC Surveillance Due">
            <TextSelect
              value={value.hccSurveillanceDue}
              onChange={(v) => set('hccSurveillanceDue', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
          <Field label="Next Colonoscopy Due">
            <TextInput
              type="date"
              value={value.nextColonoscopyDue}
              onChange={(v) => set('nextColonoscopyDue', v)}
            />
          </Field>
          <Field label="Next Liver Ultrasound Due">
            <TextInput
              type="date"
              value={value.nextLiverUltrasoundDue}
              onChange={(v) => set('nextLiverUltrasoundDue', v)}
            />
          </Field>
          <Field label="Next Laboratory Review">
            <TextInput
              type="date"
              value={value.nextLaboratoryReview}
              onChange={(v) => set('nextLaboratoryReview', v)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="J. Provider Assessment & Plan"
        accent="primary"
        actions={
          onOpenReferrals ? (
            <Button type="button" size="sm" variant="outline" onClick={onOpenReferrals}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Referrals
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary Diagnosis">
            <IcdSearchField
              value={
                value.primaryDiagnosisCode
                  ? `${value.primaryDiagnosisCode}${
                      value.primaryDiagnosis ? ` — ${value.primaryDiagnosis}` : ''
                    }`
                  : value.primaryDiagnosis || ''
              }
              code={value.primaryDiagnosisCode}
              onSelect={(item) =>
                onChange({
                  ...value,
                  primaryDiagnosisId: item.id,
                  primaryDiagnosisCode: item.code,
                  primaryDiagnosis: item.description || item.display,
                })
              }
            />
          </Field>
          <Field label="Secondary Diagnosis">
            <IcdSearchField
              value={
                value.secondaryDiagnosisCode
                  ? `${value.secondaryDiagnosisCode}${
                      value.secondaryDiagnosis ? ` — ${value.secondaryDiagnosis}` : ''
                    }`
                  : value.secondaryDiagnosis || ''
              }
              code={value.secondaryDiagnosisCode}
              onSelect={(item) =>
                onChange({
                  ...value,
                  secondaryDiagnosisId: item.id,
                  secondaryDiagnosisCode: item.code,
                  secondaryDiagnosis: item.description || item.display,
                })
              }
            />
          </Field>
          <Field label="Clinical Impression" className="sm:col-span-2">
            <TextTextarea
              value={value.clinicalImpression}
              onChange={(v) => set('clinicalImpression', v)}
              rows={3}
            />
          </Field>
          <Field label="Treatment Plan" className="sm:col-span-2">
            <TextTextarea
              value={value.treatmentPlan}
              onChange={(v) => set('treatmentPlan', v)}
              rows={3}
            />
          </Field>
          <Field label="Lifestyle Counseling" className="sm:col-span-2">
            <TextTextarea
              value={value.lifestyleCounseling}
              onChange={(v) => set('lifestyleCounseling', v)}
              rows={2}
            />
          </Field>
          <Field label="Referral" className="sm:col-span-2">
            <MultiSelectChips
              values={value.referrals || []}
              options={GI_REFERRAL_OPTIONS}
              onToggle={(opt) => toggle('referrals', opt)}
              idPrefix="gi-ibd-ref"
            />
          </Field>
          <Field label="Patient Education" className="sm:col-span-2">
            <TextTextarea
              value={value.patientEducation}
              onChange={(v) => set('patientEducation', v)}
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
