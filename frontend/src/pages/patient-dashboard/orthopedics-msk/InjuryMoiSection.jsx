import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '../components/chart-ui';
import { intakeApi } from '@/services/api/intake.api';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  AGGRAVATING_FACTORS,
  BODY_REGION_OPTIONS,
  INJURY_SIDE_OPTIONS,
  INJURY_STATUS_OPTIONS,
  INJURY_TYPE_OPTIONS,
  INITIAL_TREATMENT_OPTIONS,
  MECHANISM_OPTIONS,
  MOI_FLAG_FIELDS,
  PAIN_PATTERN_OPTIONS,
  PAIN_QUALITY_OPTIONS,
  RELIEVING_FACTORS,
  SPECIFIC_BODY_PART_OPTIONS,
  SYMPTOM_OPTIONS,
  VISIT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from './orthopedicsMskConstants';
import { extractPainFromIntakeBundle, toggleListValue } from './orthopedicsMskUtils';

export function InjuryMoiSection({ value, onChange, patientId, appointmentId }) {
  const [pullingPain, setPullingPain] = useState(false);
  const [painHint, setPainHint] = useState('');
  const autoPulledRef = useRef('');

  const set = (key, next) => onChange({ ...value, [key]: next });
  const setMany = (patch) => onChange({ ...value, ...patch });

  const pullPainFromIntake = async ({ silent = false } = {}) => {
    if (!patientId) return;
    setPullingPain(true);
    if (!silent) setPainHint('');
    try {
      const bundle = await intakeApi.getBundle(patientId, {
        encounterId: appointmentId || undefined,
        sectionType: 'vitals',
      });
      const pain = extractPainFromIntakeBundle(bundle);
      if (!pain) {
        if (!silent) setPainHint('No pain score found in Intake vitals for this encounter.');
        return;
      }
      if (pain.painScore) {
        setMany({ painScore: pain.painScore, painPulledFromIntake: true });
        setPainHint(`Pulled pain score ${pain.painScore}/10 from Intake vitals.`);
      } else if (!silent) {
        setPainHint('Intake indicates pain was not assessed.');
      }
    } catch {
      if (!silent) setPainHint('Unable to load pain score from Intake.');
    } finally {
      setPullingPain(false);
    }
  };

  // Auto-populate pain score from Intake when empty for this encounter
  useEffect(() => {
    const key = `${patientId || ''}::${appointmentId || ''}`;
    if (!patientId || value.painScore || autoPulledRef.current === key) return;
    autoPulledRef.current = key;
    pullPainFromIntake({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time pull per encounter when score empty
  }, [patientId, appointmentId, value.painScore]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents how the injury occurred, when it occurred, the affected body region, associated
        symptoms, and any immediate treatment — supporting diagnosis, imaging, referrals, and claims.
      </p>

      <SectionCard
        title="A. Injury Information"
        description="Core injury identifiers for this encounter."
        accent="info"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Injury Type" required>
            <TextSelect
              value={value.injuryType}
              onChange={(v) => set('injuryType', v)}
              options={INJURY_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Date of Injury" required>
            <TextInput
              type="date"
              value={value.dateOfInjury}
              onChange={(v) => set('dateOfInjury', v)}
            />
          </Field>
          <Field label="Time of Injury">
            <TextInput
              type="time"
              value={value.timeOfInjury}
              onChange={(v) => set('timeOfInjury', v)}
            />
          </Field>
          <Field label="Injury Side" required>
            <TextSelect
              value={value.injurySide}
              onChange={(v) => set('injurySide', v)}
              options={INJURY_SIDE_OPTIONS}
            />
          </Field>
          <Field label="Injury Status" required>
            <TextSelect
              value={value.injuryStatus}
              onChange={(v) => set('injuryStatus', v)}
              options={INJURY_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Visit Type" required>
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={VISIT_TYPE_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Body Region" required>
          <MultiSelectChips
            idPrefix="ortho-region"
            options={BODY_REGION_OPTIONS}
            values={value.bodyRegion}
            onToggle={(opt) => {
              const nextRegions = toggleListValue(value.bodyRegion, opt);
              const locations = Array.isArray(value.injuryLocations) ? value.injuryLocations : [];
              const nextLocations = nextRegions.includes(opt)
                ? locations.includes(opt)
                  ? locations
                  : [...locations, opt]
                : locations.filter((x) => x !== opt);
              setMany({ bodyRegion: nextRegions, injuryLocations: nextLocations });
            }}
          />
        </Field>

        <Field label="Specific Body Part" required>
          <MultiSelectChips
            idPrefix="ortho-part"
            options={SPECIFIC_BODY_PART_OPTIONS}
            values={value.specificBodyPart}
            onToggle={(opt) => set('specificBodyPart', toggleListValue(value.specificBodyPart, opt))}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Mechanism of Injury"
        description="How the injury occurred and contributing mechanics."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mechanism of Injury">
            <TextSelect
              value={value.mechanismOfInjury}
              onChange={(v) => set('mechanismOfInjury', v)}
              options={MECHANISM_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Detailed Description">
          <TextTextarea
            value={value.detailedDescription}
            onChange={(v) => set('detailedDescription', v)}
            placeholder="Describe the mechanism in the patient's words…"
            rows={3}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOI_FLAG_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <TextSelect
                value={value[f.key]}
                onChange={(v) => set(f.key, v)}
                options={YES_NO_OPTIONS}
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="C. Injury Location"
        description="Allow multiple body areas."
        accent="primary"
      >
        <MultiSelectChips
          idPrefix="ortho-loc"
          options={BODY_REGION_OPTIONS}
          values={value.injuryLocations}
          onToggle={(opt) => set('injuryLocations', toggleListValue(value.injuryLocations, opt))}
        />
      </SectionCard>

      <SectionCard title="D. Symptoms" description="Associated presenting symptoms.">
        <MultiSelectChips
          idPrefix="ortho-sx"
          options={SYMPTOM_OPTIONS}
          values={value.symptoms}
          onToggle={(opt) => set('symptoms', toggleListValue(value.symptoms, opt))}
        />
      </SectionCard>

      <SectionCard
        title="E. Pain Assessment"
        description="Characterise pain for this encounter."
        accent="warning"
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!patientId || pullingPain}
            onClick={pullPainFromIntake}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${pullingPain ? 'animate-spin' : ''}`} />
            From Intake
          </Button>
        }
      >
        {(painHint || value.painPulledFromIntake) && (
          <div className="flex flex-wrap items-center gap-2">
            {value.painPulledFromIntake && (
              <Badge variant="secondary" className="text-[10px]">
                Synced from Intake
              </Badge>
            )}
            {painHint && <p className="text-xs text-muted-foreground">{painHint}</p>}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Pain Score (0–10)">
            <TextInput
              type="number"
              min={0}
              max={10}
              step={1}
              value={value.painScore}
              onChange={(v) => setMany({ painScore: v, painPulledFromIntake: false })}
            />
          </Field>
          <Field label="Pain Location">
            <TextInput
              value={value.painLocation}
              onChange={(v) => set('painLocation', v)}
              placeholder="e.g. Anterior knee"
            />
          </Field>
          <Field label="Pain Duration">
            <TextInput
              value={value.painDuration}
              onChange={(v) => set('painDuration', v)}
              placeholder="e.g. 3 days, 2 weeks"
            />
          </Field>
          <Field label="Constant or Intermittent">
            <TextSelect
              value={value.painPattern}
              onChange={(v) => set('painPattern', v)}
              options={PAIN_PATTERN_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Pain Quality">
          <MultiSelectChips
            idPrefix="ortho-pq"
            options={PAIN_QUALITY_OPTIONS}
            values={value.painQuality}
            onToggle={(opt) => set('painQuality', toggleListValue(value.painQuality, opt))}
          />
        </Field>
        <Field label="Aggravating Factors">
          <MultiSelectChips
            idPrefix="ortho-agg"
            options={AGGRAVATING_FACTORS}
            values={value.aggravatingFactors}
            onToggle={(opt) =>
              set('aggravatingFactors', toggleListValue(value.aggravatingFactors, opt))
            }
          />
        </Field>
        <Field label="Relieving Factors">
          <MultiSelectChips
            idPrefix="ortho-rel"
            options={RELIEVING_FACTORS}
            values={value.relievingFactors}
            onToggle={(opt) =>
              set('relievingFactors', toggleListValue(value.relievingFactors, opt))
            }
          />
        </Field>
      </SectionCard>

      <SectionCard title="F. Initial Treatment" description="Care provided before or at this visit.">
        <MultiSelectChips
          idPrefix="ortho-tx"
          options={INITIAL_TREATMENT_OPTIONS}
          values={value.initialTreatment}
          onToggle={(opt) => set('initialTreatment', toggleListValue(value.initialTreatment, opt))}
        />
      </SectionCard>
    </div>
  );
}
