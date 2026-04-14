import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, User, Building2, DollarSign, Check, X, Printer, ChevronDown, MoreVertical, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHARGE_STATUS_OPTIONS = ['BALANCE DUE PATIENT', 'PAID', 'PENDING', 'DENIED', 'ADJUSTED'];
const SET_ALL_CHARGES_OPTIONS = ['NO CHANGE', 'PAID', 'PENDING', 'DENIED', 'ADJUSTED'];
const USE_DESC_FROM_OPTIONS = ['HCPCS', 'CPT', 'Custom'];
const YES_NO_OPTIONS = [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }];
const ACCEPT_ASSIGNMENT_OPTIONS = [{ value: 'Default', label: 'Default' }, { value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }];
const DOCUMENTATION_OPTIONS = [{ value: 'No Documentation', label: 'No Documentation' }, { value: 'Attachment', label: 'Attachment' }, { value: 'Other', label: 'Other' }];

const HOUR_OPTIONS = [{ value: 'none', label: '—' }, ...Array.from({ length: 24 }, (_, i) => ({ value: String(i).padStart(2, '0'), label: `${String(i).padStart(2, '0')}:00` }))];
const ADMISSION_TYPE_OPTIONS = [{ value: 'none', label: '<None>' }, { value: '1', label: '1 - Emergency' }, { value: '2', label: '2 - Urgent' }, { value: '3', label: '3 - Elective' }, { value: '4', label: '4 - Newborn' }, { value: '5', label: '5 - Trauma' }];
const ADMISSION_SOURCE_OPTIONS = [{ value: 'none', label: '<None>' }, { value: '1', label: '1 - Physician Referral' }, { value: '7', label: '7 - Emergency' }, { value: '8', label: '8 - Court/Law Enforcement' }];
const PATIENT_STATUS_OPTIONS = [{ value: 'none', label: '<None>' }, { value: '01', label: '01 - Discharged to home' }, { value: '02', label: '02 - Discharged/transferred' }, { value: '20', label: '20 - Expired' }];

function FieldWithSearch({ label, value, onChange, required, icon: Icon, highlighted }) {
  return (
    <div className={cn('space-y-2', highlighted && 'relative')}>
      {required && <span className="absolute left-0 w-1 h-8 bg-destructive rounded-l" aria-hidden />}
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className={cn('flex-1', highlighted && 'ring-2 ring-primary')} />
        <Button type="button" variant="outline" size="icon" title="Search"><Search className="h-4 w-4" /></Button>
        {Icon && <Button type="button" variant="outline" size="icon" title="Select"><Icon className="h-4 w-4" /></Button>}
      </div>
    </div>
  );
}

export function ClaimUB04Page() {
  const [activeTab, setActiveTab] = useState('claim');
  const [claimIncomplete, setClaimIncomplete] = useState(true);
  const [claimRef, setClaimRef] = useState('');
  const [typeOfBill, setTypeOfBill] = useState('111');
  const [patient, setPatient] = useState('');
  const [attendingProvider, setAttendingProvider] = useState('');
  const [billingProvider, setBillingProvider] = useState('');
  const [operatingProvider, setOperatingProvider] = useState('');
  const [otherProvider, setOtherProvider] = useState('');
  const [otherProviderRole, setOtherProviderRole] = useState('Operating');
  const [referringProvider, setReferringProvider] = useState('');
  const [facility, setFacility] = useState('');
  const [officeLocation, setOfficeLocation] = useState('none');
  const [primaryInsurance, setPrimaryInsurance] = useState('');
  const [secondaryInsurance, setSecondaryInsurance] = useState('');
  const [tertiaryInsurance, setTertiaryInsurance] = useState('');

  const [updateProcedureDefaults, setUpdateProcedureDefaults] = useState(false);
  const [useDescriptionFrom, setUseDescriptionFrom] = useState('HCPCS');
  const [setAllChargesTo, setSetAllChargesTo] = useState('NO CHANGE');
  const [charges, setCharges] = useState([
    { serviceDate: '', description: '', hcpcs: '', mod1: '', mod2: '', mod3: '', mod4: '', revCode: '', unitPrice: '0.00', units: '1.00', amount: '0.00', status: 'BALANCE DUE PATIENT', delete: false },
  ]);

  const [showBoxNumbers, setShowBoxNumbers] = useState('none');
  const [statementFrom, setStatementFrom] = useState('');
  const [statementTo, setStatementTo] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [admissionHour, setAdmissionHour] = useState('none');
  const [admissionType, setAdmissionType] = useState('none');
  const [admissionSource, setAdmissionSource] = useState('none');
  const [dischargeHour, setDischargeHour] = useState('none');
  const [patientStatus, setPatientStatus] = useState('none');
  const [delayReasonCode, setDelayReasonCode] = useState('None');
  const [patientEstAmountDue, setPatientEstAmountDue] = useState('0.00');
  const [remarks1, setRemarks1] = useState('');
  const [remarks2, setRemarks2] = useState('');
  const [remarks3, setRemarks3] = useState('');

  const [employmentRelated, setEmploymentRelated] = useState('No');
  const [autoAccident, setAutoAccident] = useState('No');
  const [otherAccident, setOtherAccident] = useState('No');

  const [releaseOfInfo, setReleaseOfInfo] = useState('Yes');
  const [assignmentOfBenefits, setAssignmentOfBenefits] = useState('Yes');
  const [providerAcceptAssignment, setProviderAcceptAssignment] = useState('Default');
  const [epsdtOptions, setEpsdtOptions] = useState({});
  const [documentationMethod, setDocumentationMethod] = useState('No Documentation');
  const [documentationType, setDocumentationType] = useState('none');
  const [demonstrationProject, setDemonstrationProject] = useState('');

  const [principalDx, setPrincipalDx] = useState('');
  const [principalDxPoa, setPrincipalDxPoa] = useState('none');
  const [admittingDx, setAdmittingDx] = useState('');
  const [externalCause, setExternalCause] = useState([{ code: '', description: '' }, { code: '', description: '' }]);
  const [reasonForVisit, setReasonForVisit] = useState([{ code: '', description: '' }, { code: '', description: '' }]);
  const [otherDx, setOtherDx] = useState([{ code: '', description: '', poa: 'none' }, { code: '', description: '', poa: 'none' }]);
  const [principalProcedure, setPrincipalProcedure] = useState({ code: '', date: '' });
  const [otherProcedure, setOtherProcedure] = useState([{ code: '', date: '', description: '' }, { code: '', date: '', description: '' }]);
  const [occurrenceSpan, setOccurrenceSpan] = useState([{ code: '', from: '', to: '', description: '' }, { code: '', from: '', to: '', description: '' }]);
  const [occurrence, setOccurrence] = useState([{ code: '', date: '', description: '' }, { code: '', date: '', description: '' }]);
  const [valueCodes, setValueCodes] = useState([{ code: '', amount: '0.00', description: '' }, { code: '', amount: '0.00', description: '' }]);
  const [conditionCodes, setConditionCodes] = useState([{ code: '', description: '' }, { code: '', description: '' }]);

  const addCharge = () => setCharges((c) => [...c, { serviceDate: '', description: '', hcpcs: '', mod1: '', mod2: '', mod3: '', mod4: '', revCode: '', unitPrice: '0.00', units: '1.00', amount: '0.00', status: 'BALANCE DUE PATIENT', delete: false }]);
  const updateCharge = (i, field, value) => setCharges((c) => c.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  const epsdtLabels = ['No referral given', 'Patient is currently under treatment', 'Patient refused referral', 'Patient is referred to another provider'];
  const epsdtCount = Object.values(epsdtOptions).filter(Boolean).length;
  const toggleEpsdt = (key) => setEpsdtOptions((p) => (epsdtCount < 3 || p[key] ? { ...p, [key]: !p[key] } : p));

  return (
    <div className="space-y-4 max-w-5xl w-full py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Claim</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm">
            <Check className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button type="button" variant="destructive" size="sm">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1 icon-action-print" /> Print <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button type="button" variant="outline" size="sm">Review <ChevronDown className="h-4 w-4 ml-1" /></Button>
          <Button type="button" variant="outline" size="sm"><MoreVertical className="h-4 w-4 mr-1" /> More <ChevronDown className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="claim" className={cn(activeTab === 'claim' && 'border-b-2 border-destructive')}>Claim</TabsTrigger>
          <TabsTrigger value="charges" className={cn(activeTab === 'charges' && 'border-b-2 border-green-600')}>Charges</TabsTrigger>
          <TabsTrigger value="additional" className={cn(activeTab === 'additional' && 'border-b-2 border-green-600')}>Additional Info</TabsTrigger>
          <TabsTrigger value="info-codes" className={cn(activeTab === 'info-codes' && 'border-b-2 border-green-600')}>Information Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="claim" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Claim #</Label>
                  <div className="flex items-center gap-2">
                    <Input value="New" readOnly className="w-20 bg-muted" />
                    <Input placeholder="Reference #" value={claimRef} onChange={(e) => setClaimRef(e.target.value)} className="w-48" />
                    {claimIncomplete && <span className="flex items-center gap-1 text-amber-600 text-sm"><AlertTriangle className="h-4 w-4" /> Claim is incomplete</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type of Bill</Label>
                  <div className="flex gap-1">
                    <Input value={typeOfBill} onChange={(e) => setTypeOfBill(e.target.value)} className="w-24" />
                    <Button type="button" variant="outline" size="icon" title="Clear"><X className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" title="Search"><Search className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={cn('relative pl-2', patient && 'border-l-2 border-primary')}>
                  <FieldWithSearch label="Patient" value={patient} onChange={setPatient} highlighted icon={User} />
                </div>
                <div className="relative pl-2 border-l-2 border-destructive"><FieldWithSearch label="Attending Provider *" value={attendingProvider} onChange={setAttendingProvider} required icon={User} /></div>
                <div className="relative pl-2 border-l-2 border-destructive"><FieldWithSearch label="Billing Provider *" value={billingProvider} onChange={setBillingProvider} required icon={User} /></div>
                <div><FieldWithSearch label="Operating Provider" value={operatingProvider} onChange={setOperatingProvider} icon={User} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><FieldWithSearch label="Other Provider" value={otherProvider} onChange={setOtherProvider} icon={User} /></div>
                  <div className="space-y-2">
                    <Label className="text-sm">Operating</Label>
                    <Select value={otherProviderRole} onValueChange={setOtherProviderRole}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Operating">Operating</SelectItem><SelectItem value="Ref">Ref</SelectItem></SelectContent></Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1"><FieldWithSearch label="Referring/PCP Provider" value={referringProvider} onChange={setReferringProvider} icon={User} /></div>
                  <div className="space-y-2">
                    <Label className="text-sm">Ref</Label>
                    <Select defaultValue="1"><SelectTrigger className="w-16"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem></SelectContent></Select>
                  </div>
                </div>
                <div><FieldWithSearch label="Facility" value={facility} onChange={setFacility} icon={Building2} /></div>
                <div className="space-y-2">
                  <Label>Office Location</Label>
                  <Select value={officeLocation} onValueChange={setOfficeLocation}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">Select</SelectItem><SelectItem value="main">Main Office</SelectItem></SelectContent></Select>
                </div>
                <div><FieldWithSearch label="Primary Insurance" value={primaryInsurance} onChange={setPrimaryInsurance} icon={DollarSign} /></div>
                <div><FieldWithSearch label="Secondary Insurance" value={secondaryInsurance} onChange={setSecondaryInsurance} icon={DollarSign} /></div>
                <div><FieldWithSearch label="Tertiary Insurance" value={tertiaryInsurance} onChange={setTertiaryInsurance} icon={DollarSign} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="mt-6 space-y-6">
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Charges</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>HCPCS</TableHead>
                        <TableHead>Mod 1</TableHead>
                        <TableHead>Mod 2</TableHead>
                        <TableHead>Mod 3</TableHead>
                        <TableHead>Mod 4</TableHead>
                        <TableHead>Rev Code</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Other</TableHead>
                        <TableHead>Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charges.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell><Input type="date" value={row.serviceDate} onChange={(e) => updateCharge(i, 'serviceDate', e.target.value)} className="h-8 w-28" /></TableCell>
                          <TableCell><Input value={row.description} onChange={(e) => updateCharge(i, 'description', e.target.value)} className="h-8 min-w-[120px]" /></TableCell>
                          <TableCell><div className="flex gap-1"><Input value={row.hcpcs} onChange={(e) => updateCharge(i, 'hcpcs', e.target.value)} className="h-8 w-20" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                          <TableCell><div className="flex gap-1"><Input value={row.mod1} onChange={(e) => updateCharge(i, 'mod1', e.target.value)} className="h-8 w-14" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                          <TableCell><div className="flex gap-1"><Input value={row.mod2} onChange={(e) => updateCharge(i, 'mod2', e.target.value)} className="h-8 w-14" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                          <TableCell><div className="flex gap-1"><Input value={row.mod3} onChange={(e) => updateCharge(i, 'mod3', e.target.value)} className="h-8 w-14" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                          <TableCell><div className="flex gap-1"><Input value={row.mod4} onChange={(e) => updateCharge(i, 'mod4', e.target.value)} className="h-8 w-14" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                          <TableCell><div className="flex gap-1"><Input value={row.revCode} onChange={(e) => updateCharge(i, 'revCode', e.target.value)} className="h-8 w-16" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                          <TableCell><Input value={row.unitPrice} onChange={(e) => updateCharge(i, 'unitPrice', e.target.value)} className="h-8 w-20" /></TableCell>
                          <TableCell><Input value={row.units} onChange={(e) => updateCharge(i, 'units', e.target.value)} className="h-8 w-16" /></TableCell>
                          <TableCell><Input value={row.amount} onChange={(e) => updateCharge(i, 'amount', e.target.value)} className="h-8 w-20" /></TableCell>
                          <TableCell>
                            <Select value={row.status} onValueChange={(v) => updateCharge(i, 'status', v)}><SelectTrigger className="h-8 min-w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{CHARGE_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                          </TableCell>
                          <TableCell><Button type="button" variant="ghost" size="sm">Other <ChevronDown className="h-3 w-3 inline ml-0.5" /></Button></TableCell>
                          <TableCell><Checkbox checked={row.delete} onCheckedChange={(c) => updateCharge(i, 'delete', !!c)} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-2 border-t text-sm text-muted-foreground">{charges.length} Charges</div>
                </CardContent>
              </Card>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addCharge}>Add charge line</Button>
            </div>
            <Card className="w-72 shrink-0 h-fit">
              <CardHeader className="py-3 bg-sky-100 dark:bg-sky-950/50">
                <CardTitle className="text-sm">Charge Options</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="updateProc" checked={updateProcedureDefaults} onCheckedChange={(c) => setUpdateProcedureDefaults(!!c)} />
                  <Label htmlFor="updateProc" className="text-sm font-normal">Update patient Procedure Code defaults</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Use Description From</Label>
                  <Select value={useDescriptionFrom} onValueChange={setUseDescriptionFrom}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{USE_DESC_FROM_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Set all charges to</Label>
                  <Select value={setAllChargesTo} onValueChange={setSetAllChargesTo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SET_ALL_CHARGES_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="additional" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Show Additional Information about each field</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ub04Box" checked={showBoxNumbers === 'none'} onChange={() => setShowBoxNumbers('none')} className="rounded-full" /><span className="text-sm">None</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ub04Box" checked={showBoxNumbers === 'ansi'} onChange={() => setShowBoxNumbers('ansi')} className="rounded-full" /><span className="text-sm">ANSI Location (For Electronic Claims)</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="ub04Box" checked={showBoxNumbers === 'ub04'} onChange={() => setShowBoxNumbers('ub04')} className="rounded-full" /><span className="text-sm">CMS 1450 (UB-04) Box Numbers (For Printed Claims)</span></label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Claim Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative pl-2 border-l-2 border-destructive space-y-2"><Label className="text-sm">Statement Covers From Date *</Label><Input type="date" value={statementFrom} onChange={(e) => setStatementFrom(e.target.value)} /></div>
                <div className="relative pl-2 border-l-2 border-destructive space-y-2"><Label className="text-sm">Statement Covers To Date *</Label><Input type="date" value={statementTo} onChange={(e) => setStatementTo(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm">Admission Date</Label><Input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm">Admission Hour</Label><Select value={admissionHour} onValueChange={setAdmissionHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{HOUR_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="relative pl-2 border-l-2 border-destructive space-y-2"><Label className="text-sm">Admission Type *</Label><Select value={admissionType} onValueChange={setAdmissionType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ADMISSION_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">Admission Source</Label><Select value={admissionSource} onValueChange={setAdmissionSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ADMISSION_SOURCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">Discharge Hour</Label><Select value={dischargeHour} onValueChange={setDischargeHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{HOUR_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="relative pl-2 border-l-2 border-destructive space-y-2"><Label className="text-sm">Patient Status *</Label><Select value={patientStatus} onValueChange={setPatientStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PATIENT_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">Delay Reason Code</Label><Select value={delayReasonCode} onValueChange={setDelayReasonCode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="None">None</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">PPS (Diagnosis Related Group)</Label><Button type="button" variant="outline" size="sm" className="w-full justify-start text-muted-foreground">—</Button></div>
                <div className="space-y-2"><Label className="text-sm">Patient Estimated Amount Due</Label><Input type="number" step="0.01" value={patientEstAmountDue} onChange={(e) => setPatientEstAmountDue(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label className="text-sm">Remarks</Label><Textarea value={remarks1} onChange={(e) => setRemarks1(e.target.value)} rows={2} placeholder="Remarks 1" /><Textarea value={remarks2} onChange={(e) => setRemarks2(e.target.value)} rows={2} placeholder="Remarks 2" /><Textarea value={remarks3} onChange={(e) => setRemarks3(e.target.value)} rows={2} placeholder="Remarks 3" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Patient Condition</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2">Is Patient Condition Related to:</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2"><Label className="font-normal">Employment</Label><label className="flex items-center gap-1"><input type="radio" name="emp" checked={employmentRelated === 'Yes'} onChange={() => setEmploymentRelated('Yes')} /> Yes</label><label className="flex items-center gap-1"><input type="radio" name="emp" checked={employmentRelated === 'No'} onChange={() => setEmploymentRelated('No')} /> No</label></div>
                <div className="flex items-center gap-2"><Label className="font-normal">Auto Accident</Label><label className="flex items-center gap-1"><input type="radio" name="auto" checked={autoAccident === 'Yes'} onChange={() => setAutoAccident('Yes')} /> Yes</label><label className="flex items-center gap-1"><input type="radio" name="auto" checked={autoAccident === 'No'} onChange={() => setAutoAccident('No')} /> No</label></div>
                <div className="flex items-center gap-2"><Label className="font-normal">Other Accident</Label><label className="flex items-center gap-1"><input type="radio" name="other" checked={otherAccident === 'Yes'} onChange={() => setOtherAccident('Yes')} /> Yes</label><label className="flex items-center gap-1"><input type="radio" name="other" checked={otherAccident === 'No'} onChange={() => setOtherAccident('No')} /> No</label></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Assignment of Benefits</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label className="text-sm">Release of Info</Label><Select value={releaseOfInfo} onValueChange={setReleaseOfInfo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{YES_NO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">Assignment of Benefits</Label><Select value={assignmentOfBenefits} onValueChange={setAssignmentOfBenefits}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{YES_NO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">Provider Accept Assignment</Label><Select value={providerAcceptAssignment} onValueChange={setProviderAcceptAssignment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCEPT_ASSIGNMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30 flex flex-row items-center justify-between">
              <CardTitle className="text-base">EPSDT Certification</CardTitle>
              <span className="text-xs text-muted-foreground">Select up to 3 if applicable</span>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {epsdtLabels.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <Checkbox id={opt} checked={!!epsdtOptions[opt]} onCheckedChange={() => toggleEpsdt(opt)} disabled={epsdtCount >= 3 && !epsdtOptions[opt]} />
                    <Label htmlFor={opt} className="font-normal text-sm cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Other Reference Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label className="text-sm">Documentation Method</Label><Select value={documentationMethod} onValueChange={setDocumentationMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DOCUMENTATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm">Documentation Type</Label><Select value={documentationType || 'none'} onValueChange={setDocumentationType}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem></SelectContent></Select></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Demonstration Project</Label><Input value={demonstrationProject} onChange={(e) => setDemonstrationProject(e.target.value)} placeholder="Demonstration Project" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label className="text-sm">Principal Diagnosis</Label><div className="flex gap-1"><Input value={principalDx} onChange={(e) => setPrincipalDx(e.target.value)} /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button><Select value={principalDxPoa} onValueChange={setPrincipalDxPoa}><SelectTrigger className="w-24"><SelectValue placeholder="POA" /></SelectTrigger><SelectContent><SelectItem value="none">POA</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent></Select></div></div>
                <div className="space-y-2"><Label className="text-sm">Admitting Diagnosis</Label><div className="flex gap-1"><Input value={admittingDx} onChange={(e) => setAdmittingDx(e.target.value)} /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div></div>
              </div>
              <div className="space-y-2"><Label className="text-sm">External Cause of Injury</Label>{[0, 1].map((i) => <div key={i} className="flex gap-2 mt-2"><Input value={externalCause[i]?.code} onChange={(e) => setExternalCause((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-24" /><Input value={externalCause[i]?.description} onChange={(e) => setExternalCause((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}</div>
              <div className="space-y-2"><Label className="text-sm">Patient's Reason for Visit</Label>{[0, 1].map((i) => <div key={i} className="flex gap-2 mt-2"><Input value={reasonForVisit[i]?.code} onChange={(e) => setReasonForVisit((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-24" /><Input value={reasonForVisit[i]?.description} onChange={(e) => setReasonForVisit((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}</div>
              <div className="space-y-2"><Label className="text-sm">Other Diagnosis</Label>{[0, 1].map((i) => <div key={i} className="flex gap-2 mt-2"><Input value={otherDx[i]?.code} onChange={(e) => setOtherDx((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-24" /><Input value={otherDx[i]?.description} onChange={(e) => setOtherDx((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1" /><Select value={otherDx[i]?.poa} onValueChange={(v) => setOtherDx((p) => p.map((r, j) => j === i ? { ...r, poa: v } : r))}><SelectTrigger className="w-20"><SelectValue placeholder="POA" /></SelectTrigger><SelectContent><SelectItem value="none">POA</SelectItem><SelectItem value="Y">Y</SelectItem><SelectItem value="N">N</SelectItem></SelectContent></Select><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Procedure</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2"><Label className="text-sm">Principal Procedure</Label><div className="flex gap-2"><Input value={principalProcedure.code} onChange={(e) => setPrincipalProcedure((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="w-24" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button><Input type="date" value={principalProcedure.date} onChange={(e) => setPrincipalProcedure((p) => ({ ...p, date: e.target.value }))} className="w-36" /></div></div>
              <div className="space-y-2"><Label className="text-sm">Other Procedure</Label>{[0, 1].map((i) => <div key={i} className="flex gap-2 mt-2"><Input value={otherProcedure[i]?.code} onChange={(e) => setOtherProcedure((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-24" /><Input type="date" value={otherProcedure[i]?.date} onChange={(e) => setOtherProcedure((p) => p.map((r, j) => j === i ? { ...r, date: e.target.value } : r))} className="w-32" /><Input value={otherProcedure[i]?.description} onChange={(e) => setOtherProcedure((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Occurrence Span</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[0, 1].map((i) => <div key={i} className="flex gap-2 flex-wrap"><Input value={occurrenceSpan[i]?.code} onChange={(e) => setOccurrenceSpan((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-20" /><Input type="date" value={occurrenceSpan[i]?.from} onChange={(e) => setOccurrenceSpan((p) => p.map((r, j) => j === i ? { ...r, from: e.target.value } : r))} placeholder="From" className="w-32" /><Input type="date" value={occurrenceSpan[i]?.to} onChange={(e) => setOccurrenceSpan((p) => p.map((r, j) => j === i ? { ...r, to: e.target.value } : r))} placeholder="To" className="w-32" /><Input value={occurrenceSpan[i]?.description} onChange={(e) => setOccurrenceSpan((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1 min-w-[100px]" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Occurrence</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[0, 1].map((i) => <div key={i} className="flex gap-2 flex-wrap"><Input value={occurrence[i]?.code} onChange={(e) => setOccurrence((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-20" /><Input type="date" value={occurrence[i]?.date} onChange={(e) => setOccurrence((p) => p.map((r, j) => j === i ? { ...r, date: e.target.value } : r))} className="w-32" /><Input value={occurrence[i]?.description} onChange={(e) => setOccurrence((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1 min-w-[100px]" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Value</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[0, 1].map((i) => <div key={i} className="flex gap-2 flex-wrap"><Input value={valueCodes[i]?.code} onChange={(e) => setValueCodes((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-20" /><Input type="number" step="0.01" value={valueCodes[i]?.amount} onChange={(e) => setValueCodes((p) => p.map((r, j) => j === i ? { ...r, amount: e.target.value } : r))} placeholder="Amount" className="w-24" /><Input value={valueCodes[i]?.description} onChange={(e) => setValueCodes((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1 min-w-[100px]" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 bg-sky-100/50 dark:bg-sky-950/30">
              <CardTitle className="text-base">Condition</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[0, 1].map((i) => <div key={i} className="flex gap-2 flex-wrap"><Input value={conditionCodes[i]?.code} onChange={(e) => setConditionCodes((p) => p.map((r, j) => j === i ? { ...r, code: e.target.value } : r))} placeholder="Code" className="w-20" /><Input value={conditionCodes[i]?.description} onChange={(e) => setConditionCodes((p) => p.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} placeholder="Description" className="flex-1 min-w-[100px]" /><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></div>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info-codes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Information codes and related data for this UB-04 claim. Content under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
