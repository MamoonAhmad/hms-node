import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import { IcdSearchField } from './IcdSearchField';
import {
  FOLLOW_UP_INTERVAL_OPTIONS,
  MEDICATION_CATEGORY_HINTS,
  OFFICE_PROCEDURE_OPTIONS,
  OUTCOME_OPTIONS,
  PATIENT_EDUCATION_OPTIONS,
  REFERRAL_OPTIONS,
  SKIN_CARE_OPTIONS,
  YES_NO_OPTIONS,
} from './dermatologyConstants';
import { toggleListValue } from './dermatologyUtils';

export function DermatologyTreatmentPlanForm({
  value,
  onChange,
  linkedMedications = [],
  medicationsLoading = false,
  onRefreshMedications,
  onOpenMedications,
  onOpenOrders,
  onOpenReferrals,
  onPullDiagnosesFromExam,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const withIcdCode = (base, item) => {
    if (!item?.code) return base;
    const existing = base.icd10Codes || [];
    if (existing.some((c) => c.code === item.code)) return base;
    return {
      ...base,
      icd10Codes: [
        ...existing,
        { code: item.code, description: item.description, id: item.id },
      ],
    };
  };

  const removeIcd = (code) => {
    set(
      'icd10Codes',
      (value.icd10Codes || []).filter((c) => c.code !== code),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents the treatment plan following dermatologic evaluation — diagnoses, medications,
        office procedures, wound care, education, and follow-up.
      </p>

      <SectionCard
        title="A. Diagnosis"
        accent="info"
        actions={
          onPullDiagnosesFromExam ? (
            <Button type="button" size="sm" variant="outline" onClick={onPullDiagnosesFromExam}>
              Pull from exam / problems
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
              onSelect={(item) => {
                onChange(
                  withIcdCode(
                    {
                      ...value,
                      primaryDiagnosisId: item.id,
                      primaryDiagnosisCode: item.code,
                      primaryDiagnosis: item.description || item.display,
                    },
                    item,
                  ),
                );
              }}
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
              onSelect={(item) => {
                onChange(
                  withIcdCode(
                    {
                      ...value,
                      secondaryDiagnosisId: item.id,
                      secondaryDiagnosisCode: item.code,
                      secondaryDiagnosis: item.description || item.display,
                    },
                    item,
                  ),
                );
              }}
            />
          </Field>
        </div>
        <Field label="ICD-10 Codes" hint="Additional codes for this encounter">
          <IcdSearchField
            placeholder="Add ICD-10 code…"
            onSelect={(item) => onChange(withIcdCode(value, item))}
          />
          {(value.icd10Codes || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {value.icd10Codes.map((c) => (
                <Badge
                  key={c.code}
                  variant="outline"
                  className="cursor-pointer gap-1 font-mono"
                  onClick={() => removeIcd(c.code)}
                  title="Click to remove"
                >
                  {c.code}
                  {c.description ? ` — ${c.description}` : ''}
                </Badge>
              ))}
            </div>
          )}
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Medications"
        description="Auto-linked from Orders / Medications for this encounter."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={medicationsLoading}
              onClick={onRefreshMedications}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onOpenMedications}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Medications
            </Button>
          </div>
        }
      >
        {linkedMedications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No medication orders linked yet. Place dermatology meds in the Medications tab — they
            will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedMedications.map((med) => (
              <li
                key={med.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {med.medicationName || med.name || 'Medication'}
                  {med.dose ? ` — ${med.dose}` : ''}
                  {med.frequency ? ` ${med.frequency}` : ''}
                </span>
                <Badge variant="outline" className="status-soft-info">
                  {med.status || 'Ordered'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Common categories: {MEDICATION_CATEGORY_HINTS.join(' · ')}
        </p>
        <Field label="Medication notes">
          <TextTextarea
            value={value.medicationNotes}
            onChange={(v) => set('medicationNotes', v)}
            rows={2}
            placeholder="Topical steroid strength, duration, biologic considerations…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Office Procedures">
        <MultiSelectChips
          idPrefix="derm-office"
          options={OFFICE_PROCEDURE_OPTIONS}
          values={value.officeProcedures}
          onToggle={(opt) => set('officeProcedures', toggleListValue(value.officeProcedures, opt))}
        />
        {value.officeProcedures?.includes('Biopsy') && onOpenOrders && (
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onOpenOrders}>
            Link procedure / pathology order
          </Button>
        )}
      </SectionCard>

      <SectionCard title="D. Wound Care">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dressing Instructions">
            <TextTextarea
              value={value.dressingInstructions}
              onChange={(v) => set('dressingInstructions', v)}
              rows={2}
            />
          </Field>
          <Field label="Cleansing Instructions">
            <TextTextarea
              value={value.cleansingInstructions}
              onChange={(v) => set('cleansingInstructions', v)}
              rows={2}
            />
          </Field>
          <Field label="Activity Restrictions">
            <TextTextarea
              value={value.activityRestrictions}
              onChange={(v) => set('activityRestrictions', v)}
              rows={2}
            />
          </Field>
          <Field label="Return Precautions">
            <TextTextarea
              value={value.returnPrecautions}
              onChange={(v) => set('returnPrecautions', v)}
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Skin Care Recommendations">
        <MultiSelectChips
          idPrefix="derm-skincare"
          options={SKIN_CARE_OPTIONS}
          values={value.skinCareRecommendations}
          onToggle={(opt) =>
            set('skinCareRecommendations', toggleListValue(value.skinCareRecommendations, opt))
          }
        />
      </SectionCard>

      <SectionCard title="F. Patient Education">
        <MultiSelectChips
          idPrefix="derm-edu"
          options={PATIENT_EDUCATION_OPTIONS}
          values={value.patientEducation}
          onToggle={(opt) => set('patientEducation', toggleListValue(value.patientEducation, opt))}
        />
      </SectionCard>

      <SectionCard title="G. Follow-up" accent="warning">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
          <Field label="Re-biopsy Required">
            <TextSelect
              value={value.reBiopsyRequired}
              onChange={(v) => set('reBiopsyRequired', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Repeat Examination">
            <TextSelect
              value={value.repeatExamination}
              onChange={(v) => set('repeatExamination', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Dermatopathology Review">
            <TextSelect
              value={value.dermatopathologyReview}
              onChange={(v) => set('dermatopathologyReview', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="H. Referral"
        actions={
          onOpenReferrals ? (
            <Button type="button" size="sm" variant="outline" onClick={onOpenReferrals}>
              Referrals tab
            </Button>
          ) : null
        }
      >
        <MultiSelectChips
          idPrefix="derm-ref"
          options={REFERRAL_OPTIONS}
          values={value.referrals}
          onToggle={(opt) => set('referrals', toggleListValue(value.referrals, opt))}
        />
      </SectionCard>

      <SectionCard title="I. Outcome">
        <Field label="Outcome" className="max-w-xs">
          <TextSelect
            value={value.outcome}
            onChange={(v) => set('outcome', v)}
            options={OUTCOME_OPTIONS}
          />
        </Field>
      </SectionCard>

      <SectionCard title="J. Provider Assessment & Plan" accent="primary">
        <div className="grid gap-4">
          <Field label="Clinical Impression">
            <TextTextarea
              value={value.clinicalImpression}
              onChange={(v) => set('clinicalImpression', v)}
              rows={2}
            />
          </Field>
          <Field label="Treatment Response">
            <TextTextarea
              value={value.treatmentResponse}
              onChange={(v) => set('treatmentResponse', v)}
              rows={2}
            />
          </Field>
          <Field label="Long-Term Management Plan">
            <TextTextarea
              value={value.longTermManagementPlan}
              onChange={(v) => set('longTermManagementPlan', v)}
              rows={3}
            />
          </Field>
          <Field label="Additional Recommendations">
            <TextTextarea
              value={value.additionalRecommendations}
              onChange={(v) => set('additionalRecommendations', v)}
              rows={2}
            />
          </Field>
          <Field label="Encounter Summary">
            <TextTextarea
              value={value.encounterSummary}
              onChange={(v) => set('encounterSummary', v)}
              rows={3}
              placeholder="Summary included in the encounter note…"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
