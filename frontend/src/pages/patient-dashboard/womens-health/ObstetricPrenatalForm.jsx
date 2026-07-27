import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { SectionCard } from '../components/chart-ui';
import { intakeApi } from '@/services/api/intake.api';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  CheckboxField,
  MultiSelectChips,
} from './WomensHealthFields';
import {
  DATING_METHOD_OPTIONS,
  FETAL_MOVEMENT_OPTIONS,
  FETAL_PRESENTATION_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  OEDEMA_OPTIONS,
  PREGNANCY_COMPLICATIONS,
  PREGNANCY_CONFIRMED_BY_OPTIONS,
  PREGNANCY_MEDICATION_FLAGS,
  PREGNANCY_RISK_FACTORS,
  PREGNANCY_STATUS_OPTIONS,
  PREGNANCY_SYMPTOMS,
  YES_NO_OPTIONS,
} from './womensHealthConstants';
import {
  calculateGestationalAge,
  calculateTrimester,
  estimateEddFromLmp,
  extractVitalsFromIntakeBundle,
  toggleListValue,
} from './womensHealthUtils';

export function ObstetricPrenatalForm({
  value,
  onChange,
  patientId,
  appointmentId,
  onOpenMedications,
}) {
  const [vitalsHint, setVitalsHint] = useState('');
  const [pullingVitals, setPullingVitals] = useState(false);

  const set = (key, next) => onChange({ ...value, [key]: next });

  const setMany = (patch) => onChange({ ...value, ...patch });

  useEffect(() => {
    if (!value.lmp) return;
    const computedEdd = estimateEddFromLmp(value.lmp);
    const ga = calculateGestationalAge(value.lmp);
    const trimester = calculateTrimester(value.lmp);
    const nextEdd =
      value.datingMethod === 'IVF' && value.edd ? value.edd : computedEdd;
    if (
      nextEdd !== value.edd ||
      ga !== value.gestationalAge ||
      trimester !== value.pregnancyTrimester
    ) {
      setMany({
        edd: nextEdd,
        gestationalAge: ga,
        pregnancyTrimester: trimester,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync derived dating fields from LMP
  }, [value.lmp, value.datingMethod]);

  const pullVitalsFromIntake = async () => {
    if (!patientId) return;
    setPullingVitals(true);
    setVitalsHint('');
    try {
      const bundle = await intakeApi.getBundle(patientId, {
        encounterId: appointmentId || undefined,
        sectionType: 'vitals',
      });
      const vitals = extractVitalsFromIntakeBundle(bundle);
      if (!vitals || !Object.values(vitals).some(Boolean)) {
        setVitalsHint('No intake vitals found for this encounter. Enter values manually.');
        return;
      }
      setMany(vitals);
      setVitalsHint('Maternal vitals pulled from Intake.');
    } catch {
      setVitalsHint('Could not load Intake vitals. Enter values manually.');
    } finally {
      setPullingVitals(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="A. Pregnancy Information"
        description="Document pregnancy status and obstetric history (GPA)."
        accent="info"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Pregnancy Status" required>
            <TextSelect
              value={value.pregnancyStatus}
              onChange={(v) => set('pregnancyStatus', v)}
              options={PREGNANCY_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Gravida (G)" required>
            <TextInput type="number" min={0} value={value.gravida} onChange={(v) => set('gravida', v)} />
          </Field>
          <Field label="Para (P)" required>
            <TextInput type="number" min={0} value={value.para} onChange={(v) => set('para', v)} />
          </Field>
          <Field label="Term Births">
            <TextInput type="number" min={0} value={value.termBirths} onChange={(v) => set('termBirths', v)} />
          </Field>
          <Field label="Preterm Births">
            <TextInput type="number" min={0} value={value.pretermBirths} onChange={(v) => set('pretermBirths', v)} />
          </Field>
          <Field label="Abortions">
            <TextInput type="number" min={0} value={value.abortions} onChange={(v) => set('abortions', v)} />
          </Field>
          <Field label="Living Children">
            <TextInput type="number" min={0} value={value.livingChildren} onChange={(v) => set('livingChildren', v)} />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckboxField
            id="ob-multiple"
            label="Multiple Pregnancy (twins / triplets, etc.)"
            checked={value.multiplePregnancy}
            onCheckedChange={(v) => set('multiplePregnancy', v)}
          />
          <CheckboxField
            id="ob-high-risk"
            label="High Risk Pregnancy"
            checked={value.highRiskPregnancy}
            onCheckedChange={(v) => set('highRiskPregnancy', v)}
          />
        </div>
        <Field label="Pregnancy Risk Factors">
          <MultiSelectChips
            idPrefix="ob-risk"
            options={PREGNANCY_RISK_FACTORS}
            values={value.pregnancyRiskFactors}
            onToggle={(opt) =>
              set('pregnancyRiskFactors', toggleListValue(value.pregnancyRiskFactors, opt))
            }
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Pregnancy Dating"
        description="LMP-based dating with auto EDD, gestational age, and trimester."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Last Menstrual Period (LMP)">
            <TextInput type="date" value={value.lmp} onChange={(v) => set('lmp', v)} />
          </Field>
          <Field label="Estimated Due Date (EDD)" hint="Auto from LMP; editable if needed">
            <TextInput type="date" value={value.edd} onChange={(v) => set('edd', v)} />
          </Field>
          <Field label="Gestational Age" hint="Auto-calculated">
            <TextInput value={value.gestationalAge} readOnly onChange={() => {}} placeholder="e.g. 28w 3d" />
          </Field>
          <Field label="Dating Method">
            <TextSelect
              value={value.datingMethod}
              onChange={(v) => set('datingMethod', v)}
              options={DATING_METHOD_OPTIONS}
            />
          </Field>
          <Field label="Pregnancy Trimester" hint="Auto-calculated">
            <TextInput value={value.pregnancyTrimester} readOnly onChange={() => {}} placeholder="First / Second / Third" />
          </Field>
          <Field label="First Prenatal Visit">
            <TextInput
              type="date"
              value={value.firstPrenatalVisit}
              onChange={(v) => set('firstPrenatalVisit', v)}
            />
          </Field>
          <Field label="Planned Pregnancy">
            <TextSelect
              value={value.plannedPregnancy}
              onChange={(v) => set('plannedPregnancy', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Pregnancy Confirmed By">
            <TextSelect
              value={value.pregnancyConfirmedBy}
              onChange={(v) => set('pregnancyConfirmedBy', v)}
              options={PREGNANCY_CONFIRMED_BY_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Maternal Vital Signs"
        description="Most values can auto-populate from Intake vitals for this encounter."
        accent="info"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pullingVitals}
            onClick={pullVitalsFromIntake}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${pullingVitals ? 'animate-spin' : ''}`} />
            Pull from Intake
          </Button>
        }
      >
        {vitalsHint && (
          <p className="text-xs text-muted-foreground">{vitalsHint}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Blood Pressure">
            <TextInput value={value.bloodPressure} onChange={(v) => set('bloodPressure', v)} placeholder="120/80" />
          </Field>
          <Field label="Pulse">
            <TextInput value={value.pulse} onChange={(v) => set('pulse', v)} placeholder="bpm" />
          </Field>
          <Field label="Temperature">
            <TextInput value={value.temperature} onChange={(v) => set('temperature', v)} />
          </Field>
          <Field label="Respiratory Rate">
            <TextInput value={value.respiratoryRate} onChange={(v) => set('respiratoryRate', v)} />
          </Field>
          <Field label="Weight">
            <TextInput value={value.weight} onChange={(v) => set('weight', v)} />
          </Field>
          <Field label="BMI">
            <TextInput value={value.bmi} onChange={(v) => set('bmi', v)} />
          </Field>
          <Field label="Weight Gain Since Pregnancy">
            <TextInput
              value={value.weightGainSincePregnancy}
              onChange={(v) => set('weightGainSincePregnancy', v)}
              placeholder="lb or kg"
            />
          </Field>
          <Field label="Urine Protein">
            <TextInput value={value.urineProtein} onChange={(v) => set('urineProtein', v)} placeholder="Neg / Trace / 1+…" />
          </Field>
          <Field label="Urine Glucose">
            <TextInput value={value.urineGlucose} onChange={(v) => set('urineGlucose', v)} placeholder="Neg / Trace / 1+…" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="D. Fetal Assessment"
        description="Document fetal status for this prenatal visit."
        accent="warning"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Fetal Heart Tones (FHT)">
            <TextInput type="number" value={value.fht} onChange={(v) => set('fht', v)} placeholder="bpm" />
          </Field>
          <Field label="Fetal Movement">
            <TextSelect
              value={value.fetalMovement}
              onChange={(v) => set('fetalMovement', v)}
              options={FETAL_MOVEMENT_OPTIONS}
            />
          </Field>
          <Field label="Fundal Height (cm)">
            <TextInput type="number" value={value.fundalHeight} onChange={(v) => set('fundalHeight', v)} />
          </Field>
          <Field label="Fetal Presentation">
            <TextSelect
              value={value.fetalPresentation}
              onChange={(v) => set('fetalPresentation', v)}
              options={FETAL_PRESENTATION_OPTIONS}
            />
          </Field>
          <Field label="Number of Fetuses">
            <TextInput type="number" min={1} value={value.numberOfFetuses} onChange={(v) => set('numberOfFetuses', v)} />
          </Field>
          <Field label="Contractions">
            <TextSelect value={value.contractions} onChange={(v) => set('contractions', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Vaginal Bleeding">
            <TextSelect value={value.vaginalBleeding} onChange={(v) => set('vaginalBleeding', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Leakage of Fluid">
            <TextSelect value={value.leakageOfFluid} onChange={(v) => set('leakageOfFluid', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Oedema">
            <TextSelect value={value.oedema} onChange={(v) => set('oedema', v)} options={OEDEMA_OPTIONS} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Pregnancy Symptoms" description="Select all that apply for this visit.">
        <MultiSelectChips
          idPrefix="ob-sx"
          options={PREGNANCY_SYMPTOMS}
          values={value.pregnancySymptoms}
          onToggle={(opt) => set('pregnancySymptoms', toggleListValue(value.pregnancySymptoms, opt))}
        />
      </SectionCard>

      <SectionCard title="F. Pregnancy Complications" description="Known or active pregnancy complications." accent="danger">
        <MultiSelectChips
          idPrefix="ob-cx"
          options={PREGNANCY_COMPLICATIONS}
          values={value.pregnancyComplications}
          onToggle={(opt) =>
            set('pregnancyComplications', toggleListValue(value.pregnancyComplications, opt))
          }
        />
      </SectionCard>

      <SectionCard
        title="G. Medications"
        description="Pregnancy-related medications. Link to the Medications tab for full orders."
        actions={
          onOpenMedications ? (
            <Button type="button" variant="outline" size="sm" onClick={onOpenMedications}>
              Open Medications
            </Button>
          ) : null
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PREGNANCY_MEDICATION_FLAGS.map((med) => (
            <CheckboxField
              key={med.key}
              id={`ob-med-${med.key}`}
              label={med.label}
              checked={value[med.key]}
              onCheckedChange={(v) => set(med.key, v)}
            />
          ))}
        </div>
        <Field label="Other Pregnancy Medications" className="sm:col-span-2">
          <TextTextarea
            value={value.otherPregnancyMedications}
            onChange={(v) => set('otherPregnancyMedications', v)}
            placeholder="Other meds related to this pregnancy…"
          />
        </Field>
        <Badge variant="secondary" className="font-normal">
          Auto-linked from Medication module (checklist + notes for this visit)
        </Badge>
      </SectionCard>

      <SectionCard title="H. Assessment" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pregnancy Progress">
            <TextTextarea value={value.pregnancyProgress} onChange={(v) => set('pregnancyProgress', v)} />
          </Field>
          <Field label="High Risk Assessment">
            <TextTextarea value={value.highRiskAssessment} onChange={(v) => set('highRiskAssessment', v)} />
          </Field>
          <Field label="Provider Impression" className="sm:col-span-2">
            <TextTextarea value={value.providerImpression} onChange={(v) => set('providerImpression', v)} />
          </Field>
          <Field label="Assessment Notes" className="sm:col-span-2">
            <TextTextarea value={value.assessmentNotes} onChange={(v) => set('assessmentNotes', v)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="I. Plan" accent="success">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <CheckboxField
            id="ob-continue-pn"
            label="Continue Prenatal Care"
            checked={value.continuePrenatalCare}
            onCheckedChange={(v) => set('continuePrenatalCare', v)}
          />
          <CheckboxField
            id="ob-us-ordered"
            label="Ultrasound Ordered"
            checked={value.ultrasoundOrdered}
            onCheckedChange={(v) => set('ultrasoundOrdered', v)}
          />
          <CheckboxField
            id="ob-labs-ordered"
            label="Prenatal Labs Ordered"
            checked={value.prenatalLabsOrdered}
            onCheckedChange={(v) => set('prenatalLabsOrdered', v)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
          <Field label="Referral">
            <TextInput value={value.referral} onChange={(v) => set('referral', v)} placeholder="MFM, genetics…" />
          </Field>
          <Field label="Delivery Planning Notes" className="sm:col-span-2">
            <TextTextarea
              value={value.deliveryPlanningNotes}
              onChange={(v) => set('deliveryPlanningNotes', v)}
            />
          </Field>
          <Field label="Patient Education" className="sm:col-span-2">
            <TextTextarea value={value.patientEducation} onChange={(v) => set('patientEducation', v)} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
