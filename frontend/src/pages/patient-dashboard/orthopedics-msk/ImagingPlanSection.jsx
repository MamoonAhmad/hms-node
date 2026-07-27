import { ExternalLink } from 'lucide-react';
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
  ACTIVITY_RESTRICTION_OPTIONS,
  BODY_REGION_OPTIONS,
  DEVICE_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  IMAGING_PRIORITY_OPTIONS,
  IMAGING_STATUS_OPTIONS,
  IMAGING_TYPE_OPTIONS,
  INJURY_SIDE_OPTIONS,
  THERAPY_DURATION_OPTIONS,
  THERAPY_FREQUENCY_OPTIONS,
  TREATMENT_PLAN_OPTIONS,
  WEIGHT_BEARING_OPTIONS,
  YES_NO_OPTIONS,
} from './orthopedicsMskConstants';
import { toggleListValue } from './orthopedicsMskUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ImagingPlanSection({
  value,
  onChange,
  onOpenOrders,
  onOpenReferrals,
  onOpenResults,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });

  const handleImagingRequired = (v) => {
    const patch = { imagingRequired: v };
    if (v === 'Yes' && !value.orderedDate) {
      patch.orderedDate = todayInputValue();
    }
    if (v === 'Yes' && !value.imagingStatus) {
      patch.imagingStatus = 'Ordered';
    }
    setMany(patch);
  };

  const handlePtReferral = (v) => {
    set('ptReferral', v);
  };

  const handleTreatmentToggle = (opt) => {
    const next = toggleListValue(value.treatmentPlan, opt);
    const patch = { treatmentPlan: next };
    if (opt === 'Physical Therapy' && next.includes(opt) && value.ptReferral !== 'Yes') {
      patch.ptReferral = 'Yes';
    }
    setMany(patch);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents diagnostic imaging, orthotic devices, rehabilitation plans, and follow-up
        management for this encounter.
      </p>

      <SectionCard
        title="A. Imaging"
        description="Link imaging orders to the Orders module; completed results appear under Results."
        accent="info"
        actions={
          <div className="flex flex-wrap gap-2">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Imaging Required">
            <TextSelect
              value={value.imagingRequired}
              onChange={handleImagingRequired}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Body Part">
            <TextSelect
              value={value.imagingBodyPart}
              onChange={(v) => set('imagingBodyPart', v)}
              options={BODY_REGION_OPTIONS}
            />
          </Field>
          <Field label="Laterality">
            <TextSelect
              value={value.imagingLaterality}
              onChange={(v) => set('imagingLaterality', v)}
              options={INJURY_SIDE_OPTIONS}
            />
          </Field>
          <Field label="Priority">
            <TextSelect
              value={value.imagingPriority}
              onChange={(v) => set('imagingPriority', v)}
              options={IMAGING_PRIORITY_OPTIONS}
            />
          </Field>
          <Field label="Ordered Date" hint="Auto-filled when imaging is required">
            <TextInput
              type="date"
              value={value.orderedDate}
              onChange={(v) => set('orderedDate', v)}
            />
          </Field>
          <Field label="Status">
            <TextSelect
              value={value.imagingStatus}
              onChange={(v) => set('imagingStatus', v)}
              options={IMAGING_STATUS_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Imaging Type">
          <MultiSelectChips
            idPrefix="ortho-img"
            options={IMAGING_TYPE_OPTIONS}
            values={value.imagingType}
            onToggle={(opt) => set('imagingType', toggleListValue(value.imagingType, opt))}
          />
        </Field>
        <Field label="Clinical Indication">
          <TextInput
            value={value.clinicalIndication}
            onChange={(v) => set('clinicalIndication', v)}
            placeholder="Clinical reason for imaging…"
          />
        </Field>
        <Field label="Result Summary">
          <TextTextarea
            value={value.resultSummary}
            onChange={(v) => set('resultSummary', v)}
            rows={2}
            placeholder="Key findings from completed imaging…"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Brace / Splint / Orthotics"
        description="Prescribed devices can be linked to a DME order when applicable."
        actions={
          <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            DME / Orders
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Device Prescribed">
            <TextSelect
              value={value.devicePrescribed}
              onChange={(v) => set('devicePrescribed', v)}
              options={DEVICE_OPTIONS}
            />
          </Field>
          <Field label="Body Part">
            <TextSelect
              value={value.deviceBodyPart}
              onChange={(v) => set('deviceBodyPart', v)}
              options={BODY_REGION_OPTIONS}
            />
          </Field>
          <Field label="Laterality">
            <TextSelect
              value={value.deviceLaterality}
              onChange={(v) => set('deviceLaterality', v)}
              options={INJURY_SIDE_OPTIONS}
            />
          </Field>
          <Field label="Wear Schedule">
            <TextInput
              value={value.wearSchedule}
              onChange={(v) => set('wearSchedule', v)}
              placeholder="e.g. During activity, at night"
            />
          </Field>
          <Field label="Duration">
            <TextInput
              value={value.deviceDuration}
              onChange={(v) => set('deviceDuration', v)}
              placeholder="e.g. 4 weeks"
            />
          </Field>
          <Field label="Fitted Today">
            <TextSelect
              value={value.fittedToday}
              onChange={(v) => set('fittedToday', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Patient Education Provided">
            <TextSelect
              value={value.patientEducationProvided}
              onChange={(v) => set('patientEducationProvided', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Physical Therapy Plan"
        description="Selecting PT can generate a referral in the Referrals module."
        accent="primary"
        actions={
          <Button type="button" size="sm" variant="outline" onClick={onOpenReferrals}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Referrals
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="PT Referral">
            <TextSelect
              value={value.ptReferral}
              onChange={handlePtReferral}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Therapy Frequency">
            <TextSelect
              value={value.therapyFrequency}
              onChange={(v) => set('therapyFrequency', v)}
              options={THERAPY_FREQUENCY_OPTIONS}
            />
          </Field>
          <Field label="Therapy Duration">
            <TextSelect
              value={value.therapyDuration}
              onChange={(v) => set('therapyDuration', v)}
              options={THERAPY_DURATION_OPTIONS}
            />
          </Field>
          <Field label="Home Exercise Programme">
            <TextSelect
              value={value.homeExerciseProgramme}
              onChange={(v) => set('homeExerciseProgramme', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Weight Bearing Status">
            <TextSelect
              value={value.weightBearingStatus}
              onChange={(v) => set('weightBearingStatus', v)}
              options={WEIGHT_BEARING_OPTIONS}
            />
          </Field>
          <Field label="Return to Work Date">
            <TextInput
              type="date"
              value={value.returnToWorkDate}
              onChange={(v) => set('returnToWorkDate', v)}
            />
          </Field>
          <Field label="Return to Sports Date">
            <TextInput
              type="date"
              value={value.returnToSportsDate}
              onChange={(v) => set('returnToSportsDate', v)}
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
        <Field label="Activity Restrictions">
          <MultiSelectChips
            idPrefix="ortho-act"
            options={ACTIVITY_RESTRICTION_OPTIONS}
            values={value.activityRestrictions}
            onToggle={(opt) =>
              set('activityRestrictions', toggleListValue(value.activityRestrictions, opt))
            }
          />
        </Field>
        <Field label="Patient Education">
          <TextTextarea
            value={value.patientEducation}
            onChange={(v) => set('patientEducation', v)}
            rows={3}
            placeholder="Education provided regarding injury, precautions, and rehab…"
          />
        </Field>
        {value.ptReferral === 'Yes' && (
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            PT referral selected — open Referrals to complete and send the referral details.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="D. Treatment Plan"
        description="Structured plan items for this visit."
        accent="warning"
      >
        <MultiSelectChips
          idPrefix="ortho-plan"
          options={TREATMENT_PLAN_OPTIONS}
          values={value.treatmentPlan}
          onToggle={handleTreatmentToggle}
        />
      </SectionCard>
    </div>
  );
}
