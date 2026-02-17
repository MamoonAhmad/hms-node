import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function VitalsSection() {
  const [painAssessed, setPainAssessed] = useState('no');
  const [customTime, setCustomTime] = useState(false);
  const [sepsisProtocol, setSepsisProtocol] = useState('no');
  const [vitalNotes, setVitalNotes] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Patient Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        <Input id="vitals-timestamp" className="hidden" disabled />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bp-sys">Blood Pressure *</Label>
            <div className="flex items-center gap-0">
              <Input id="bp-sys" placeholder="Sys" className="rounded-r-none border-r-0" />
              <Input id="bp-dia" placeholder="Dia" className="rounded-l-none rounded-r-none border-r-0" />
              <Input id="bp-unit" value="mmHg" readOnly className="bg-muted w-16 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pulse">Pulse *</Label>
            <div className="flex items-center gap-0">
              <Input id="pulse" placeholder="Pulse rate" className="rounded-r-none" />
              <Input id="pulse-unit" value="BPM" readOnly className="bg-muted w-16 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="respiratory-rate">Respiratory Rate *</Label>
            <div className="flex items-center gap-0">
              <Input id="respiratory-rate" placeholder="Respiratory rate" className="rounded-r-none" />
              <Input id="respiratory-rate-unit" value="breaths/min" readOnly className="bg-muted w-24 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="glucose">Glucose</Label>
            <div className="flex items-center gap-0">
              <Input id="glucose" placeholder="Glucose mg/dL" className="rounded-r-none" />
              <Input id="glucose-unit" value="mg/dL" readOnly className="bg-muted w-16 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature *</Label>
            <div className="flex items-center gap-0">
              <Input id="temperature" placeholder="Temperature in °F" className="rounded-r-none" />
              <Input id="temperature-unit" value="°F" readOnly className="bg-muted w-12 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <div className="flex items-center gap-0">
              <Input id="weight" placeholder="Weight in lbs" className="rounded-r-none" />
              <Input id="weight-unit" value="lbs" readOnly className="bg-muted w-12 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <div className="flex items-center gap-0">
              <Input id="height-feet" placeholder="Feet" className="rounded-r-none border-r-0" />
              <Input id="height-inches" placeholder="Inches" className="rounded-l-none rounded-r-none border-r-0" />
              <Input id="height-unit" value="ft" readOnly className="bg-muted w-12 px-2 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bmi">BMI</Label>
            <Input id="bmi" placeholder="BMI" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blood-group">Blood Group</Label>
            <div className="flex items-center gap-2">
              <Select>
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
              <Select>
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
            <Label htmlFor="o2">O2 Saturation *</Label>
            <Input id="o2" placeholder="O2 saturation" />
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
                  checked={sepsisProtocol === 'yes'}
                  onChange={() => setSepsisProtocol('yes')}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="sepsis-protocol"
                  value="no"
                  className="h-4 w-4"
                  checked={sepsisProtocol === 'no'}
                  onChange={() => setSepsisProtocol('no')}
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
                  checked={painAssessed === 'yes'}
                  onChange={() => setPainAssessed('yes')}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="pain-assessed"
                  value="no"
                  className="h-4 w-4"
                  checked={painAssessed === 'no'}
                  onChange={() => setPainAssessed('no')}
                />
                No
              </label>
              {painAssessed === 'yes' && (
                <Select>
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

          <div className="space-y-2 md:col-span-3">
            <Label>Timestamp</Label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="vital-time"
                  value="current"
                  className="h-4 w-4"
                  checked={!customTime}
                  onChange={() => setCustomTime(false)}
                />
                Current time (MM/DD/YYYY)
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="vital-time"
                  value="custom"
                  className="h-4 w-4"
                  checked={customTime}
                  onChange={() => setCustomTime(true)}
                />
                Custom time
              </label>
              {customTime && (
                <div className="flex flex-wrap gap-2">
                  <Input type="date" />
                  <Input type="time" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="vital-notes">Vital Notes</Label>
            <Textarea
              id="vital-notes"
              placeholder="Add notes about vitals..."
              value={vitalNotes}
              onChange={(e) => setVitalNotes(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


