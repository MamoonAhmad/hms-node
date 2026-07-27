import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  formatRangeHint,
  getVitalRanges,
  isOutOfNormal,
} from '@/pages/patient-dashboard/intake/vitalsReferenceRanges';

export function calculateBmi({ weight, heightFeet, heightInches }) {
  const lbs = parseFloat(weight);
  const feet = parseFloat(heightFeet) || 0;
  const inches = parseFloat(heightInches) || 0;
  const totalInches = feet * 12 + inches;
  if (!lbs || lbs <= 0 || totalInches <= 0) return '';
  const bmi = (lbs / (totalInches * totalInches)) * 703;
  if (!Number.isFinite(bmi) || bmi <= 0) return '';
  return bmi.toFixed(1);
}

const defaultVitalsData = () => ({
  bpSys: '',
  bpDia: '',
  pulse: '',
  respiratoryRate: '',
  glucose: '',
  temperature: '',
  weight: '',
  heightFeet: '',
  heightInches: '',
  bmi: '',
  bloodGroup: '',
  bloodGroupRh: '',
  o2: '',
  sepsisProtocol: 'no',
  painAssessed: 'no',
  painLevel: '',
  customTime: false,
  timestampDate: '',
  timestampTime: '',
  vitalNotes: '',
});

export function getDefaultVitalsData() {
  return defaultVitalsData();
}

const CONTROL = 'h-9';

function FieldHint({ range, value, warnOutsideNormal = true }) {
  if (!range) return null;
  const outside = warnOutsideNormal && isOutOfNormal(value, range);
  return (
    <p className={cn('text-[11px] leading-snug', outside ? 'text-amber-700' : 'text-muted-foreground')}>
      {formatRangeHint(range)}
      {outside ? ' · Outside typical range' : ''}
    </p>
  );
}

function ReqMark({ required }) {
  if (!required) return null;
  return <span className="text-destructive" aria-hidden> *</span>;
}

function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={htmlFor} className="block text-sm font-medium leading-none">
        {label}
      </Label>
      {children}
      {hint}
    </div>
  );
}

export function VitalsForm({ data, onChange, showTimestamp = true, dateOfBirth = null }) {
  const update = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));
  const ranges = getVitalRanges(dateOfBirth);
  const computedBmi = calculateBmi(data);

  useEffect(() => {
    if (computedBmi && computedBmi !== data.bmi) {
      onChange((prev) => ({ ...prev, bmi: computedBmi }));
    } else if (!computedBmi && data.bmi) {
      onChange((prev) => ({ ...prev, bmi: '' }));
    }
  }, [computedBmi]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {dateOfBirth && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Reference ranges: <span className="font-medium text-foreground">{ranges.band.label}</span>
          {ranges.band.ageYears != null && ranges.band.ageYears < 10 && (
            <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 font-medium text-sky-800">
              Pediatric
            </span>
          )}
        </div>
      )}

      {/* Row 1: BP, Pulse, Respiratory Rate, Glucose */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field
          label={<>Blood Pressure<ReqMark required={ranges.bpSys.required} /></>}
          htmlFor="bp-sys"
          hint={(
            <>
              <FieldHint range={ranges.bpSys} value={data.bpSys} />
              <FieldHint range={ranges.bpDia} value={data.bpDia} />
            </>
          )}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="bp-sys"
              type="number"
              inputMode="numeric"
              placeholder="Sys"
              min={ranges.bpSys.min}
              max={ranges.bpSys.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none border-r-0')}
              value={data.bpSys}
              onChange={(e) => update('bpSys', e.target.value)}
              aria-required={ranges.bpSys.required}
            />
            <Input
              id="bp-dia"
              type="number"
              inputMode="numeric"
              placeholder="Dia"
              min={ranges.bpDia.min}
              max={ranges.bpDia.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-none border-r-0')}
              value={data.bpDia}
              onChange={(e) => update('bpDia', e.target.value)}
              aria-required={ranges.bpDia.required}
            />
            <Input value="mmHg" readOnly className={cn(CONTROL, 'w-16 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field
          label={<>Pulse<ReqMark required={ranges.pulse.required} /></>}
          htmlFor="pulse"
          hint={<FieldHint range={ranges.pulse} value={data.pulse} />}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="pulse"
              type="number"
              inputMode="numeric"
              placeholder="Pulse rate"
              min={ranges.pulse.min}
              max={ranges.pulse.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none')}
              value={data.pulse}
              onChange={(e) => update('pulse', e.target.value)}
              aria-required={ranges.pulse.required}
            />
            <Input value="BPM" readOnly className={cn(CONTROL, 'w-16 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field
          label={<>Respiratory Rate<ReqMark required={ranges.respiratoryRate.required} /></>}
          htmlFor="respiratory-rate"
          hint={<FieldHint range={ranges.respiratoryRate} value={data.respiratoryRate} />}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="respiratory-rate"
              type="number"
              inputMode="numeric"
              placeholder="Respiratory rate"
              min={ranges.respiratoryRate.min}
              max={ranges.respiratoryRate.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none')}
              value={data.respiratoryRate}
              onChange={(e) => update('respiratoryRate', e.target.value)}
              aria-required={ranges.respiratoryRate.required}
            />
            <Input value="/min" readOnly className={cn(CONTROL, 'w-14 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field
          label="Glucose"
          htmlFor="glucose"
          hint={<FieldHint range={ranges.glucose} value={data.glucose} />}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="glucose"
              type="number"
              inputMode="numeric"
              placeholder="Glucose mg/dL"
              min={ranges.glucose.min}
              max={ranges.glucose.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none')}
              value={data.glucose}
              onChange={(e) => update('glucose', e.target.value)}
            />
            <Input value="mg/dL" readOnly className={cn(CONTROL, 'w-16 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>
      </div>

      {/* Row 2: Temperature, Weight, Height, BMI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field
          label={<>Temperature<ReqMark required={ranges.temperature.required} /></>}
          htmlFor="temperature"
          hint={(
            <>
              <FieldHint range={ranges.temperature} value={data.temperature} />
              {Number(data.temperature) >= ranges.temperature.feverAt && (
                <p className="text-[11px] font-medium text-amber-700">
                  Fever threshold (≥ {ranges.temperature.feverAt}°F)
                </p>
              )}
            </>
          )}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="temperature"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="Temperature in °F"
              min={ranges.temperature.min}
              max={ranges.temperature.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none')}
              value={data.temperature}
              onChange={(e) => update('temperature', e.target.value)}
              aria-required={ranges.temperature.required}
            />
            <Input value="°F" readOnly className={cn(CONTROL, 'w-12 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field
          label={<>Weight<ReqMark required={ranges.weight.required} /></>}
          htmlFor="weight"
          hint={<FieldHint range={ranges.weight} value={data.weight} />}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="Weight in lbs"
              min={ranges.weight.min}
              max={ranges.weight.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none')}
              value={data.weight}
              onChange={(e) => update('weight', e.target.value)}
              aria-required={ranges.weight.required}
            />
            <Input value="lbs" readOnly className={cn(CONTROL, 'w-12 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field
          label={<>Height<ReqMark required={ranges.heightFeet.required} /></>}
          htmlFor="height-feet"
          hint={<p className="text-[11px] text-muted-foreground">Inches 0–11.9</p>}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="height-feet"
              type="number"
              inputMode="numeric"
              placeholder="Feet"
              min={ranges.heightFeet.min}
              max={ranges.heightFeet.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none border-r-0')}
              value={data.heightFeet}
              onChange={(e) => update('heightFeet', e.target.value)}
              aria-required={ranges.heightFeet.required}
            />
            <Input
              id="height-inches"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="In"
              min={0}
              max={11.9}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-none border-r-0')}
              value={data.heightInches}
              onChange={(e) => update('heightInches', e.target.value)}
            />
            <Input value="ft" readOnly className={cn(CONTROL, 'w-12 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field label="BMI" htmlFor="bmi">
          <Input
            id="bmi"
            placeholder="Auto-calculated"
            value={data.bmi || ''}
            readOnly
            className={cn(CONTROL, 'w-full bg-muted')}
            title="Calculated from height and weight"
          />
        </Field>
      </div>

      {/* Row 3: Blood Group, O2 Sat, Sepsis Protocol, Pain Assessed */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Blood Group" htmlFor="blood-group">
          <div className="flex h-9 items-stretch gap-2">
            <Select value={data.bloodGroup || ''} onValueChange={(v) => update('bloodGroup', v)}>
              <SelectTrigger id="blood-group" className={cn(CONTROL, 'min-w-0 flex-1')}>
                <SelectValue placeholder="A, B, AB, O" />
              </SelectTrigger>
              <SelectContent>
                {['A', 'B', 'AB', 'O'].map((group) => (
                  <SelectItem key={group} value={group.toLowerCase()}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.bloodGroupRh || ''} onValueChange={(v) => update('bloodGroupRh', v)}>
              <SelectTrigger id="blood-group-rh" className={cn(CONTROL, 'w-[5.5rem] shrink-0')}>
                <SelectValue placeholder="+ve" />
              </SelectTrigger>
              <SelectContent>
                {['+ve', '-ve'].map((rh) => (
                  <SelectItem key={rh} value={rh}>
                    {rh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>

        <Field
          label={<>O2 Saturation<ReqMark required={ranges.o2.required} /></>}
          htmlFor="o2"
          hint={<FieldHint range={ranges.o2} value={data.o2} />}
        >
          <div className="flex h-9 items-stretch">
            <Input
              id="o2"
              type="number"
              inputMode="numeric"
              placeholder="O2 saturation"
              min={ranges.o2.min}
              max={ranges.o2.max}
              className={cn(CONTROL, 'min-w-0 flex-1 rounded-r-none')}
              value={data.o2}
              onChange={(e) => update('o2', e.target.value)}
              aria-required={ranges.o2.required}
            />
            <Input value="%" readOnly className={cn(CONTROL, 'w-12 shrink-0 rounded-l-none bg-muted px-2')} />
          </div>
        </Field>

        <Field label="Sepsis Protocol">
          <div className={cn(CONTROL, 'flex items-center gap-4 rounded-md border border-input bg-background px-3')}>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="sepsis-protocol"
                value="yes"
                className="h-4 w-4"
                checked={data.sepsisProtocol === 'yes'}
                onChange={() => update('sepsisProtocol', 'yes')}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="sepsis-protocol"
                value="no"
                className="h-4 w-4"
                checked={data.sepsisProtocol === 'no'}
                onChange={() => update('sepsisProtocol', 'no')}
              />
              No
            </label>
          </div>
        </Field>

        <Field label="Pain Assessed">
          <div className={cn(CONTROL, 'flex items-center gap-3 rounded-md border border-input bg-background px-3')}>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="pain-assessed"
                value="yes"
                className="h-4 w-4"
                checked={data.painAssessed === 'yes'}
                onChange={() => update('painAssessed', 'yes')}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="pain-assessed"
                value="no"
                className="h-4 w-4"
                checked={data.painAssessed === 'no'}
                onChange={() => update('painAssessed', 'no')}
              />
              No
            </label>
            {data.painAssessed === 'yes' && (
              <Select value={data.painLevel || ''} onValueChange={(v) => update('painLevel', v)}>
                <SelectTrigger className="h-7 w-24 border-0 shadow-none">
                  <SelectValue placeholder="1-10" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={`${n}`}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </Field>
      </div>

      {/* Row 4: Vital Notes */}
      <Field label="Vital Notes" htmlFor="vital-notes">
        <Textarea
          id="vital-notes"
          placeholder="Add notes about vitals..."
          rows={3}
          className="min-h-[5.5rem] w-full resize-y"
          value={data.vitalNotes}
          onChange={(e) => update('vitalNotes', e.target.value)}
        />
      </Field>

      {/* Row 5: Timestamp / Custom time */}
      {showTimestamp && (
        <Field label="Timestamp">
          <div className="flex flex-wrap items-center gap-4 rounded-md border border-input bg-background px-3 py-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="vital-time"
                value="current"
                className="h-4 w-4"
                checked={!data.customTime}
                onChange={() => update('customTime', false)}
              />
              Current time
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="vital-time"
                value="custom"
                className="h-4 w-4"
                checked={data.customTime}
                onChange={() => update('customTime', true)}
              />
              Custom time
            </label>
            {data.customTime && (
              <div className="flex flex-wrap gap-2">
                <Input
                  type="date"
                  className={CONTROL}
                  value={data.timestampDate}
                  onChange={(e) => update('timestampDate', e.target.value)}
                />
                <Input
                  type="time"
                  className={CONTROL}
                  value={data.timestampTime}
                  onChange={(e) => update('timestampTime', e.target.value)}
                />
              </div>
            )}
          </div>
        </Field>
      )}
    </div>
  );
}
