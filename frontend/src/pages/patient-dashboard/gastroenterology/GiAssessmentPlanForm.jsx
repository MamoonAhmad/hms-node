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
import { IcdSearchField } from '../dermatology/IcdSearchField';
import {
  FOLLOW_UP_INTERVAL_OPTIONS,
  GI_REFERRAL_OPTIONS,
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

export function GiAssessmentPlanForm({
  value,
  onChange,
  linkedMedications = [],
  medicationsLoading = false,
  onRefreshMedications,
  onOpenMedications,
  onOpenOrders,
  onOpenReferrals,
  onPullFromSections,
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Consolidate diagnoses, clinical impression, treatment plan, referrals, and patient education
        for this gastroenterology encounter.
      </p>

      <SectionCard
        title="Diagnoses"
        accent="info"
        actions={
          onPullFromSections ? (
            <Button type="button" size="sm" variant="outline" onClick={onPullFromSections}>
              Pull from GI sections
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
        {(value.icd10Codes || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.icd10Codes.map((c) => (
              <Badge key={c.code} variant="outline" className="font-mono text-xs">
                {c.code}
                {c.description ? ` — ${c.description}` : ''}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Clinical Impression & Plan" accent="primary">
        <div className="space-y-4">
          <Field label="Clinical Impression">
            <TextTextarea
              value={value.clinicalImpression}
              onChange={(v) => set('clinicalImpression', v)}
              rows={3}
              placeholder="Overall clinical impression…"
            />
          </Field>
          <Field label="Treatment Plan">
            <TextTextarea
              value={value.treatmentPlan}
              onChange={(v) => set('treatmentPlan', v)}
              rows={3}
              placeholder="Medications, procedures, diet, monitoring…"
            />
          </Field>
          <Field label="Lifestyle Counseling">
            <TextTextarea
              value={value.lifestyleCounseling}
              onChange={(v) => set('lifestyleCounseling', v)}
              rows={2}
            />
          </Field>
          <Field label="Patient Education">
            <TextTextarea
              value={value.patientEducation}
              onChange={(v) => set('patientEducation', v)}
              rows={2}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Follow-up Interval">
              <TextSelect
                value={value.followUpInterval}
                onChange={(v) => set('followUpInterval', v)}
                options={FOLLOW_UP_INTERVAL_OPTIONS}
              />
            </Field>
            <Field label="Referral">
              <MultiSelectChips
                values={value.referrals || []}
                options={GI_REFERRAL_OPTIONS}
                onToggle={(opt) => set('referrals', toggleListValue(value.referrals, opt))}
                idPrefix="gi-ap-ref"
              />
            </Field>
          </div>
          <Field label="Provider Notes">
            <TextTextarea
              value={value.providerNotes}
              onChange={(v) => set('providerNotes', v)}
              rows={2}
            />
          </Field>
          <Field label="Encounter Summary">
            <TextTextarea
              value={value.encounterSummary}
              onChange={(v) => set('encounterSummary', v)}
              rows={2}
              placeholder="Brief summary for the chart / note…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Linked medications"
        description="Current orders from the Medication Orders module."
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
          <p className="text-sm text-muted-foreground">No linked medication orders for this visit.</p>
        ) : (
          <ul className="space-y-1">
            {linkedMedications.map((order) => (
              <li key={order.id || medicationLabel(order)} className="text-sm text-foreground">
                {medicationLabel(order)}
                {order.status ? (
                  <span className="ml-2 text-xs text-muted-foreground">{order.status}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="flex flex-wrap gap-2">
        {onOpenOrders && (
          <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open Orders
          </Button>
        )}
        {onOpenReferrals && (
          <Button type="button" size="sm" variant="outline" onClick={onOpenReferrals}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open Referrals
          </Button>
        )}
      </div>
    </div>
  );
}
