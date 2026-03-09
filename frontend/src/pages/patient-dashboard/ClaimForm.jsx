import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const PLACE_OF_SERVICE = [
  { value: '11', label: '11 - Office' },
  { value: '21', label: '21 - Inpatient Hospital' },
  { value: '22', label: '22 - Outpatient Hospital' },
  { value: '23', label: '23 - Emergency Room' },
  { value: '31', label: '31 - Skilled Nursing Facility' },
  { value: '32', label: '32 - Nursing Facility' },
  { value: '81', label: '81 - Independent Laboratory' },
  { value: '99', label: '99 - Other' },
];

const RELATIONSHIP = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
];

export function ClaimForm() {
  const [claimInfo, setClaimInfo] = useState({
    dateOfService: new Date().toISOString().slice(0, 10),
    placeOfService: '11',
    referringProviderNpi: '',
    referringProviderName: '',
    renderingProviderNpi: '',
    renderingProviderName: '',
  });

  const [patient, setPatient] = useState({
    lastName: 'Doe',
    firstName: 'John',
    dob: '1980-05-15',
    gender: 'M',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    phone: '555-123-4567',
  });

  const [insured, setInsured] = useState({
    lastName: 'Doe',
    firstName: 'John',
    memberId: 'XYZ-123456',
    groupNumber: 'GRP-789',
    relationship: 'self',
    payerName: 'Blue Cross Blue Shield',
  });

  const [diagnoses, setDiagnoses] = useState([
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { code: 'I10', description: 'Essential (primary) hypertension' },
  ]);

  const [serviceLines, setServiceLines] = useState([
    { date: '', cpt: '', mod1: '', mod2: '', mod3: '', mod4: '', dxPointer: '1', units: 1, charge: '' },
  ]);

  const updateClaimInfo = (field, value) => setClaimInfo((p) => ({ ...p, [field]: value }));
  const updatePatient = (field, value) => setPatient((p) => ({ ...p, [field]: value }));
  const updateInsured = (field, value) => setInsured((p) => ({ ...p, [field]: value }));

  const addDiagnosis = () => setDiagnoses((p) => [...p, { code: '', description: '' }]);
  const removeDiagnosis = (i) => setDiagnoses((p) => p.filter((_, idx) => idx !== i));
  const updateDiagnosis = (i, field, value) =>
    setDiagnoses((p) => p.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));

  const addServiceLine = () =>
    setServiceLines((p) => [
      ...p,
      { date: claimInfo.dateOfService, cpt: '', mod1: '', mod2: '', mod3: '', mod4: '', dxPointer: '1', units: 1, charge: '' },
    ]);
  const removeServiceLine = (i) => setServiceLines((p) => p.filter((_, idx) => idx !== i));
  const updateServiceLine = (i, field, value) =>
    setServiceLines((p) => p.map((line, idx) => (idx === i ? { ...line, [field]: value } : line)));

  const totalCharge = serviceLines.reduce(
    (sum, line) => sum + (parseFloat(line.charge) || 0) * (parseInt(line.units, 10) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: API submit
    console.log('Claim submit', { claimInfo, patient, insured, diagnoses, serviceLines });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Insurance Claim Form</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline">Save draft</Button>
          <Button type="submit">Submit claim</Button>
        </div>
      </div>

      {/* Claim / Encounter info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Claim / Encounter information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Date of service</Label>
            <Input
              type="date"
              value={claimInfo.dateOfService}
              onChange={(e) => updateClaimInfo('dateOfService', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Place of service</Label>
            <Select value={claimInfo.placeOfService} onValueChange={(v) => updateClaimInfo('placeOfService', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {PLACE_OF_SERVICE.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1" />
          <div className="space-y-2">
            <Label>Referring provider NPI</Label>
            <Input
              value={claimInfo.referringProviderNpi}
              onChange={(e) => updateClaimInfo('referringProviderNpi', e.target.value)}
              placeholder="10-digit NPI"
            />
          </div>
          <div className="space-y-2">
            <Label>Referring provider name</Label>
            <Input
              value={claimInfo.referringProviderName}
              onChange={(e) => updateClaimInfo('referringProviderName', e.target.value)}
              placeholder="Last, First"
            />
          </div>
          <div className="space-y-2">
            <Label>Rendering provider NPI</Label>
            <Input
              value={claimInfo.renderingProviderNpi}
              onChange={(e) => updateClaimInfo('renderingProviderNpi', e.target.value)}
              placeholder="10-digit NPI"
            />
          </div>
          <div className="space-y-2">
            <Label>Rendering provider name</Label>
            <Input
              value={claimInfo.renderingProviderName}
              onChange={(e) => updateClaimInfo('renderingProviderName', e.target.value)}
              placeholder="Last, First"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Patient information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={patient.lastName} onChange={(e) => updatePatient('lastName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={patient.firstName} onChange={(e) => updatePatient('firstName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input type="date" value={patient.dob} onChange={(e) => updatePatient('dob', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={patient.gender} onValueChange={(v) => updatePatient('gender', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="X">Other/Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input value={patient.address} onChange={(e) => updatePatient('address', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={patient.city} onChange={(e) => updatePatient('city', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={patient.state} onChange={(e) => updatePatient('state', e.target.value)} placeholder="e.g. CA" />
          </div>
          <div className="space-y-2">
            <Label>ZIP</Label>
            <Input value={patient.zip} onChange={(e) => updatePatient('zip', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={patient.phone} onChange={(e) => updatePatient('phone', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Insured / Subscriber */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Insured (subscriber) information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={insured.lastName} onChange={(e) => updateInsured('lastName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={insured.firstName} onChange={(e) => updateInsured('firstName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Member ID</Label>
            <Input value={insured.memberId} onChange={(e) => updateInsured('memberId', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Group number</Label>
            <Input value={insured.groupNumber} onChange={(e) => updateInsured('groupNumber', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Relationship to patient</Label>
            <Select value={insured.relationship} onValueChange={(v) => updateInsured('relationship', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Payer name</Label>
            <Input value={insured.payerName} onChange={(e) => updateInsured('payerName', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis codes (ICD-10) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Diagnosis codes (ICD-10)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addDiagnosis}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diagnoses.map((d, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input
                  className="w-28"
                  placeholder="Code"
                  value={d.code}
                  onChange={(e) => updateDiagnosis(i, 'code', e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Description"
                  value={d.description}
                  onChange={(e) => updateDiagnosis(i, 'description', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDiagnosis(i)}
                  disabled={diagnoses.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service lines (CPT/HCPCS) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Service lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Date</th>
                  <th className="text-left p-2 font-medium">CPT/HCPCS</th>
                  <th className="text-left p-2 font-medium">Modifiers</th>
                  <th className="text-left p-2 font-medium">Dx</th>
                  <th className="text-left p-2 font-medium">Units</th>
                  <th className="text-left p-2 font-medium">Charge ($)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {serviceLines.map((line, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">
                      <Input
                        type="date"
                        className="h-8 w-32"
                        value={line.date}
                        onChange={(e) => updateServiceLine(i, 'date', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        className="h-8 w-28"
                        placeholder="e.g. 99213"
                        value={line.cpt}
                        onChange={(e) => updateServiceLine(i, 'cpt', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {['mod1', 'mod2', 'mod3', 'mod4'].map((m) => (
                          <Input
                            key={m}
                            className="h-8 w-14"
                            placeholder="-"
                            maxLength={2}
                            value={line[m]}
                            onChange={(e) => updateServiceLine(i, m, e.target.value)}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      <Select
                        value={line.dxPointer}
                        onValueChange={(v) => updateServiceLine(i, 'dxPointer', v)}
                      >
                        <SelectTrigger className="h-8 w-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {diagnoses.map((_, idx) => (
                            <SelectItem key={idx} value={String(idx + 1)}>{idx + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-16"
                        value={line.units}
                        onChange={(e) => updateServiceLine(i, 'units', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        className="h-8 w-24"
                        placeholder="0.00"
                        value={line.charge}
                        onChange={(e) => updateServiceLine(i, 'charge', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeServiceLine(i)}
                        disabled={serviceLines.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Totals</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div>
            <Label className="text-muted-foreground text-sm">Total charge</Label>
            <p className="text-xl font-semibold">${totalCharge.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Amount paid (if any)</Label>
            <Input type="number" step="0.01" min={0} className="w-32" placeholder="0.00" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Save draft</Button>
        <Button type="submit">Submit claim</Button>
      </div>
    </form>
  );
}
