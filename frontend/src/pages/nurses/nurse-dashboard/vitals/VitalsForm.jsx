import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

export function VitalsForm({ data, onChange, showTimestamp = true }) {
  const update = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="bp-sys">Blood Pressure</Label>
        <div className="flex items-center gap-0">
          <Input
            id="bp-sys"
            placeholder="Sys"
            className="rounded-r-none border-r-0"
            value={data.bpSys}
            onChange={(e) => update('bpSys', e.target.value)}
          />
          <Input
            id="bp-dia"
            placeholder="Dia"
            className="rounded-l-none rounded-r-none border-r-0"
            value={data.bpDia}
            onChange={(e) => update('bpDia', e.target.value)}
          />
          <Input value="mmHg" readOnly className="bg-muted w-16 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pulse">Pulse</Label>
        <div className="flex items-center gap-0">
          <Input
            id="pulse"
            placeholder="Pulse rate"
            className="rounded-r-none"
            value={data.pulse}
            onChange={(e) => update('pulse', e.target.value)}
          />
          <Input value="BPM" readOnly className="bg-muted w-16 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="respiratory-rate">Respiratory Rate</Label>
        <div className="flex items-center gap-0">
          <Input
            id="respiratory-rate"
            placeholder="Respiratory rate"
            className="rounded-r-none"
            value={data.respiratoryRate}
            onChange={(e) => update('respiratoryRate', e.target.value)}
          />
          <Input value="breaths/min" readOnly className="bg-muted w-24 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="glucose">Glucose</Label>
        <div className="flex items-center gap-0">
          <Input
            id="glucose"
            placeholder="Glucose mg/dL"
            className="rounded-r-none"
            value={data.glucose}
            onChange={(e) => update('glucose', e.target.value)}
          />
          <Input value="mg/dL" readOnly className="bg-muted w-16 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature</Label>
        <div className="flex items-center gap-0">
          <Input
            id="temperature"
            placeholder="Temperature in °F"
            className="rounded-r-none"
            value={data.temperature}
            onChange={(e) => update('temperature', e.target.value)}
          />
          <Input value="°F" readOnly className="bg-muted w-12 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">Weight</Label>
        <div className="flex items-center gap-0">
          <Input
            id="weight"
            placeholder="Weight in lbs"
            className="rounded-r-none"
            value={data.weight}
            onChange={(e) => update('weight', e.target.value)}
          />
          <Input value="lbs" readOnly className="bg-muted w-12 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="height">Height</Label>
        <div className="flex items-center gap-0">
          <Input
            id="height-feet"
            placeholder="Feet"
            className="rounded-r-none border-r-0"
            value={data.heightFeet}
            onChange={(e) => update('heightFeet', e.target.value)}
          />
          <Input
            id="height-inches"
            placeholder="Inches"
            className="rounded-l-none rounded-r-none border-r-0"
            value={data.heightInches}
            onChange={(e) => update('heightInches', e.target.value)}
          />
          <Input value="ft" readOnly className="bg-muted w-12 px-2 rounded-l-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bmi">BMI</Label>
        <Input
          id="bmi"
          placeholder="BMI"
          value={data.bmi}
          onChange={(e) => update('bmi', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blood-group">Blood Group</Label>
        <div className="flex items-center gap-2">
          <Select value={data.bloodGroup || ''} onValueChange={(v) => update('bloodGroup', v)}>
            <SelectTrigger id="blood-group" className="w-full">
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
            <SelectTrigger id="blood-group-rh" className="w-full">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="o2">O2 Saturation</Label>
        <Input
          id="o2"
          placeholder="O2 saturation"
          value={data.o2}
          onChange={(e) => update('o2', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Sepsis Protocol</Label>
        <div className="flex items-center gap-4">
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
      </div>

      <div className="space-y-2">
        <Label>Pain assessed</Label>
        <div className="flex flex-wrap items-center gap-4">
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
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Pain 1-10" />
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
      </div>

      {showTimestamp && (
        <div className="space-y-2 md:col-span-3">
          <Label>Timestamp</Label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="vital-time"
                value="current"
                className="h-4 w-4"
                checked={!data.customTime}
                onChange={() => update('customTime', false)}
              />
              Current time (MM/DD/YYYY)
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
                  value={data.timestampDate}
                  onChange={(e) => update('timestampDate', e.target.value)}
                />
                <Input
                  type="time"
                  value={data.timestampTime}
                  onChange={(e) => update('timestampTime', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 md:col-span-3">
        <Label htmlFor="vital-notes">Vital Notes</Label>
        <Textarea
          id="vital-notes"
          placeholder="Add notes about vitals..."
          value={data.vitalNotes}
          onChange={(e) => update('vitalNotes', e.target.value)}
        />
      </div>
    </div>
  );
}
