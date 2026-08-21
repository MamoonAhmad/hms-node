import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  CreditCard,
  FileText,
  Pencil,
  Printer,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { patientApi, insuranceProviderApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { calcAge, formatDob } from '@/lib/patientDemographics';
import {
  CHART_STATUS_OPTIONS,
  CHART_TABS,
  CLAIM_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  alertTone,
  billingTypeLabel,
  displayName,
  formatDate,
  formatDateTime,
  formatMoney,
  statusTone,
} from '@/pages/patients/patientChartConstants';

function InfoItem({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

export function PatientChartPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chart, setChart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [guarantorOpen, setGuarantorOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [payers, setPayers] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'card',
    transactionType: 'payment',
    description: '',
    autoAllocate: true,
  });
  const [chargeForm, setChargeForm] = useState({ amount: '', description: '' });
  const [guarantorForm, setGuarantorForm] = useState({
    firstName: '',
    lastName: '',
    relationship: 'self',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [insuranceForm, setInsuranceForm] = useState({
    insuranceType: 'primary',
    insuranceProviderId: '',
    memberId: '',
    groupNumber: '',
    coverageStartDate: '',
    coverageEndDate: '',
    copay: '',
    deductible: '',
  });
  const [mergeForm, setMergeForm] = useState({ sourcePatientId: '', notes: '' });
  const [statementForm, setStatementForm] = useState({ periodFrom: '', periodTo: '', notes: '' });
  const [statusForm, setStatusForm] = useState({ chartStatus: 'active', financialClass: '', deceasedAt: '' });
  const [claimForm, setClaimForm] = useState({
    appointmentId: '',
    billedAmount: '',
    claimStatus: 'draft',
    notes: '',
  });
  const [collectionForm, setCollectionForm] = useState({
    collectionStatus: 'none',
    collectionNotes: '',
  });

  const loadChart = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await patientApi.getChart(id);
      setChart(res?.data || null);
    } catch (err) {
      setError(err?.message || 'Failed to load patient chart');
      setChart(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  useEffect(() => {
    insuranceProviderApi
      .getAll({ limit: 300 })
      .then((res) => setPayers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPayers([]));
  }, []);

  const patient = chart?.patient;
  const ledger = chart?.ledger;
  const aging = chart?.aging;
  const eligibility = chart?.eligibility?.latest;
  const name = useMemo(() => displayName(patient), [patient]);

  useEffect(() => {
    if (!patient) return;
    setCollectionForm({
      collectionStatus: patient.collectionStatus || 'none',
      collectionNotes: patient.collectionNotes || '',
    });
    const g = chart?.guarantor;
    if (g) {
      setGuarantorForm({
        firstName: g.firstName || '',
        lastName: g.lastName || '',
        relationship: g.relationship || 'self',
        phone: g.phone || '',
        email: g.email || '',
        address: g.address || '',
        city: g.city || '',
        state: g.state || '',
        zip: g.zip || '',
      });
    } else if (patient.guarantorName) {
      const parts = String(patient.guarantorName).trim().split(/\s+/);
      setGuarantorForm((prev) => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || parts[0] || '',
        relationship: patient.guarantorRelationship || 'self',
        phone: patient.guarantorPhone || '',
        email: patient.guarantorEmail || '',
        address: patient.guarantorAddress || '',
        city: patient.guarantorCity || '',
        state: patient.guarantorState || '',
        zip: patient.guarantorZip || '',
      }));
    }
  }, [patient, chart?.guarantor]);

  const runAction = async (fn, successMessage) => {
    setBusy(true);
    setBanner(null);
    try {
      await fn();
      await loadChart();
      if (successMessage) setBanner({ type: 'success', text: successMessage });
    } catch (err) {
      setBanner({ type: 'error', text: err?.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = () =>
    runAction(() => patientApi.verifyEligibility(id), 'Eligibility verification completed.');

  const handleAssign = () =>
    runAction(() => patientApi.assignToMe(id), 'Patient assigned to you.');

  const handlePayment = async () => {
    if (!paymentForm.amount) return;
    await runAction(
      () =>
        patientApi.postPayment(id, {
          amount: Number(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          transactionType: paymentForm.transactionType,
          description: paymentForm.description || undefined,
          autoAllocate: paymentForm.autoAllocate !== false,
        }),
      'Payment posted to the patient ledger.',
    );
    setPaymentOpen(false);
    setPaymentForm({
      amount: '',
      paymentMethod: 'card',
      transactionType: 'payment',
      description: '',
      autoAllocate: true,
    });
  };

  const handleCharge = async () => {
    if (!chargeForm.amount) return;
    await runAction(
      () =>
        patientApi.postCharge(id, {
          amount: Number(chargeForm.amount),
          description: chargeForm.description || 'Patient charge',
        }),
      'Charge posted.',
    );
    setChargeOpen(false);
    setChargeForm({ amount: '', description: '' });
  };

  const handleInsuranceSave = async () => {
    if (!insuranceForm.insuranceProviderId || !insuranceForm.memberId) return;
    await runAction(
      () =>
        patientApi.createInsurance(id, {
          ...insuranceForm,
          copay: insuranceForm.copay ? Number(insuranceForm.copay) : undefined,
          deductible: insuranceForm.deductible ? Number(insuranceForm.deductible) : undefined,
          coverageStartDate: insuranceForm.coverageStartDate || undefined,
          coverageEndDate: insuranceForm.coverageEndDate || undefined,
        }),
      'Insurance coverage saved.',
    );
    setInsuranceOpen(false);
  };

  const handleGuarantorSave = async () => {
    await runAction(
      () => patientApi.upsertGuarantor(id, guarantorForm),
      'Guarantor saved.',
    );
    setGuarantorOpen(false);
  };

  const handleMerge = async () => {
    if (!mergeForm.sourcePatientId) return;
    await runAction(
      () =>
        patientApi.mergePatient(id, {
          sourcePatientId: mergeForm.sourcePatientId,
          notes: mergeForm.notes || undefined,
        }),
      'Patients merged into this chart.',
    );
    setMergeOpen(false);
    setMergeForm({ sourcePatientId: '', notes: '' });
  };

  const handleCollectionSave = () =>
    runAction(
      () => patientApi.updateCollectionStatus(id, collectionForm),
      'Collection status updated.',
    );

  const handleStatement = async () => {
    await runAction(
      () =>
        patientApi.createStatement(id, {
          periodFrom: statementForm.periodFrom || undefined,
          periodTo: statementForm.periodTo || undefined,
          notes: statementForm.notes || undefined,
        }),
      'Patient statement generated.',
    );
    setStatementOpen(false);
  };

  const handleStatus = async () => {
    await runAction(
      () =>
        patientApi.updateChartStatus(id, {
          chartStatus: statusForm.chartStatus,
          financialClass: statusForm.financialClass || null,
          deceasedAt: statusForm.deceasedAt || null,
        }),
      'Chart status updated.',
    );
    setStatusOpen(false);
  };

  const handleCreateClaim = async () => {
    await runAction(
      () =>
        patientApi.createClaim(id, {
          appointmentId: claimForm.appointmentId || undefined,
          billedAmount: claimForm.billedAmount ? Number(claimForm.billedAmount) : undefined,
          claimStatus: claimForm.claimStatus,
          notes: claimForm.notes || undefined,
        }),
      'Claim created from this chart.',
    );
    setClaimOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to patients
        </Button>
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || 'Patient not found'}
        </div>
      </div>
    );
  }

  const age = calcAge(patient.dateOfBirth);
  const completedVisits = chart.visits?.appointments?.filter((v) => v.status === 'Completed') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Patients
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={loadChart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate(`/patients/edit/${id}`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit registration
          </Button>
          <Button variant="outline" onClick={() => navigate('/appointments', { state: { patientId: id } })}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book appointment
          </Button>
          <Button variant="outline" disabled={busy} onClick={handleVerify}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verify eligibility
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setPaymentOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Collect payment
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setStatementOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Statement
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setChargeOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Post charge
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setMergeOpen(true)}>
            Merge into this patient
          </Button>
          <Button variant="outline" disabled={busy} onClick={handleAssign}>
            <UserCheck className="mr-2 h-4 w-4" />
            Assign to me
          </Button>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            banner.type === 'error'
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {banner.text}
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                {patient.profilePhoto ? (
                  <img src={patient.profilePhoto} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg font-semibold text-muted-foreground">
                    {(patient.firstName?.[0] || '') + (patient.lastName?.[0] || '')}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                  {patient.preferredName && (
                    <span className="text-sm text-muted-foreground">“{patient.preferredName}”</span>
                  )}
                  <Badge className={statusTone(patient.chartStatus || 'active')} variant="outline">
                    {(patient.chartStatus || 'active').replace(/^\w/, (c) => c.toUpperCase())}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  MRN {patient.mrn} · {formatDob(patient.dateOfBirth)}
                  {age != null ? ` (${age} yrs)` : ''} · {patient.gender || '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {patient.cellPhone || patient.contactNumber || 'No phone'} · {patient.email || 'No email'}
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setStatusForm({
                      chartStatus: patient.chartStatus || 'active',
                      financialClass: patient.financialClass || '',
                      deceasedAt: patient.deceasedAt ? String(patient.deceasedAt).split('T')[0] : '',
                    });
                    setStatusOpen(true);
                  }}
                >
                  Change chart status / financial class
                </button>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
              <InfoItem label="Billing type" value={billingTypeLabel(patient.billingType)} />
              <InfoItem label="Account balance" value={formatMoney(ledger?.balance)} />
              <InfoItem
                label="Eligibility"
                value={eligibility?.coverageStatus || eligibility?.status || 'Not verified'}
              />
              <InfoItem label="PCP" value={patient.primaryCarePhysician} />
              <InfoItem label="Last visit" value={formatDate(chart.visits?.lastVisit?.encounterDate || chart.visits?.lastVisit?.appointmentDate)} />
              <InfoItem label="Next visit" value={formatDate(chart.visits?.upcomingVisit?.appointmentDate)} />
              <InfoItem label="Assigned to" value={patient.assignedToName || patient.assignedTo?.name} />
              <InfoItem label="Financial class" value={patient.financialClass} />
              <InfoItem label="Collection status" value={patient.collectionStatus || 'none'} />
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>Update collections</Label>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={collectionForm.collectionStatus}
                    onValueChange={(value) =>
                      setCollectionForm((prev) => ({ ...prev, collectionStatus: value }))
                    }
                  >
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['none', 'active', 'dunning', 'agency', 'closed'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="max-w-xs"
                    placeholder="Collection notes"
                    value={collectionForm.collectionNotes}
                    onChange={(e) =>
                      setCollectionForm((prev) => ({ ...prev, collectionNotes: e.target.value }))
                    }
                  />
                  <Button type="button" size="sm" disabled={busy} onClick={handleCollectionSave}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {chart.alerts?.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {chart.alerts.map((alert) => (
            <div key={alert.code} className={`rounded-lg border px-4 py-3 text-sm ${alertTone(alert.severity)}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {CHART_TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(chart.coverage || []).length === 0 ? (
                  <p className="text-muted-foreground">No insurance on file.</p>
                ) : (
                  chart.coverage.map((row) => (
                    <div key={row.id || row.insuranceType} className="rounded-md border px-3 py-2">
                      <p className="font-medium capitalize">{row.insuranceType} · {row.payerName || '—'}</p>
                      <p className="text-muted-foreground">Member {row.memberId || row.policyNumber || '—'}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoItem label="Balance" value={formatMoney(ledger?.balance)} />
                <InfoItem label="Posted entries" value={ledger?.entries?.length || 0} />
                <InfoItem label="Last statement" value={formatDate(patient.lastStatementAt)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clinical flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoItem label="NKDA" value={patient.noKnownDrugAllergies ? 'Yes' : 'No'} />
                <InfoItem label="Allergies" value={chart.summary?.allergies?.items?.length || 0} />
                <InfoItem label="Open problems" value={chart.summary?.problems?.length || 0} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Demographics & contacts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Address" value={[patient.address, patient.city, patient.state, patient.zip].filter(Boolean).join(', ')} />
              <InfoItem label="County" value={patient.county} />
              <InfoItem label="Preferred contact" value={patient.preferredContactMethod} />
              <InfoItem label="Emergency contact" value={patient.emergencyContactName} />
              <InfoItem label="Emergency phone" value={patient.emergencyContactNumber} />
              <InfoItem label="Guarantor" value={patient.guarantorName} />
              <InfoItem label="Guarantor phone" value={patient.guarantorPhone} />
              <InfoItem label="Legal guardian" value={patient.legalGuardianName} />
              <InfoItem label="HIPAA ROI" value={patient.hipaaRoiName} />
              <InfoItem label="Pharmacy" value={patient.preferredPharmacyName} />
              <InfoItem label="Medicare MBI" value={patient.medicareBeneficiaryId} />
              <InfoItem label="Medicaid ID" value={patient.medicaidId} />
              <InfoItem label="Advance directive" value={patient.advanceDirectiveOnFile ? patient.advanceDirectiveType || 'On file' : 'No'} />
              <InfoItem label="SMS opt-in" value={patient.smsOptIn ? 'Yes' : 'No'} />
              <InfoItem label="Email opt-in" value={patient.emailOptIn ? 'Yes' : 'No'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setInsuranceOpen(true)}>
              Add coverage
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Insurance policies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Copay</TableHead>
                    <TableHead>Deductible</TableHead>
                    <TableHead>Auth #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.coverage || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        No coverage on file
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.coverage.map((row) => (
                      <TableRow key={row.id || row.insuranceType}>
                        <TableCell className="capitalize">{row.insuranceType}</TableCell>
                        <TableCell>{row.payerName || '—'}</TableCell>
                        <TableCell>{row.memberId || row.policyNumber || '—'}</TableCell>
                        <TableCell>{row.groupNumber || '—'}</TableCell>
                        <TableCell>{row.copay != null ? formatMoney(row.copay) : '—'}</TableCell>
                        <TableCell>{row.deductible != null ? formatMoney(row.deductible) : '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between gap-2">
                            <span>{row.authorizationNumber || '—'}</span>
                            {row.id && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={() =>
                                  runAction(
                                    () => patientApi.deactivateInsurance(id, row.id),
                                    'Coverage deactivated.',
                                  )
                                }
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Eligibility history</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Verified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Copay</TableHead>
                    <TableHead>Deductible remaining</TableHead>
                    <TableHead>Auth required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.eligibility?.history || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        No eligibility checks yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.eligibility.history.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDateTime(row.verifiedAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusTone(row.coverageStatus || row.status)}>
                            {row.coverageStatus || row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.payerName || '—'}</TableCell>
                        <TableCell>{row.memberId || '—'}</TableCell>
                        <TableCell>{row.copay != null ? formatMoney(row.copay) : '—'}</TableCell>
                        <TableCell>{row.deductibleRemaining != null ? formatMoney(row.deductibleRemaining) : '—'}</TableCell>
                        <TableCell>{row.priorAuthRequired ? 'Yes' : 'No'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guarantor" className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setGuarantorOpen(true)}>
              Edit guarantor
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Responsible party</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                label="Name"
                value={
                  chart.guarantor
                    ? `${chart.guarantor.firstName} ${chart.guarantor.lastName}`
                    : patient.guarantorName
                }
              />
              <InfoItem
                label="Relationship"
                value={chart.guarantor?.relationship || patient.guarantorRelationship}
              />
              <InfoItem label="Phone" value={chart.guarantor?.phone || patient.guarantorPhone} />
              <InfoItem label="Email" value={chart.guarantor?.email || patient.guarantorEmail} />
              <InfoItem label="Address" value={chart.guarantor?.address || patient.guarantorAddress} />
              <InfoItem
                label="City / State / ZIP"
                value={[
                  chart.guarantor?.city || patient.guarantorCity,
                  chart.guarantor?.state || patient.guarantorState,
                  chart.guarantor?.zip || patient.guarantorZip,
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setChargeOpen(true)}>Post charge</Button>
            <Button variant="outline" onClick={() => setPaymentOpen(true)}>Post payment</Button>
            <Button variant="outline" onClick={() => setStatementOpen(true)}>Generate statement</Button>
          </div>
          {aging && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Current (0-30)', aging.buckets?.current],
                ['31-60', aging.buckets?.days30],
                ['61-90', aging.buckets?.days60],
                ['91-120', aging.buckets?.days90],
                ['120+', aging.buckets?.days120Plus],
              ].map(([label, value]) => (
                <Card key={label}>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold">{formatMoney(value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>
                Ledger · Balance {formatMoney(ledger?.balance)}
                {patient.accountBalance != null ? ` · Synced ${formatMoney(patient.accountBalance)}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posted</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Running</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ledger?.entries || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        No ledger activity
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.entries.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDateTime(row.postedAt)}</TableCell>
                        <TableCell className="capitalize">{String(row.transactionType).replace(/_/g, ' ')}</TableCell>
                        <TableCell>{row.description || '—'}</TableCell>
                        <TableCell>{row.paymentMethod || '—'}</TableCell>
                        <TableCell className="text-right">
                          {row.direction === 'credit' ? '−' : ''}
                          {formatMoney(row.amount)}
                        </TableCell>
                        <TableCell className="text-right">{formatMoney(row.runningBalance)}</TableCell>
                        <TableCell className="text-right">
                          {row.status === 'posted' && !String(row.transactionType).startsWith('reversal_') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                runAction(
                                  () => patientApi.reverseLedgerEntry(id, row.id, { reason: 'Reversed from patient chart' }),
                                  'Ledger entry reversed.',
                                )
                              }
                            >
                              Reverse
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Statements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.statements || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                        No statements generated
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.statements.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-sm">{row.statementNumber}</TableCell>
                        <TableCell>{formatDateTime(row.generatedAt)}</TableCell>
                        <TableCell>{formatMoney(row.balance)}</TableCell>
                        <TableCell className="capitalize">{row.status}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runAction(() => patientApi.markStatement(id, row.id, 'printed'), 'Marked printed.')}
                          >
                            Printed
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runAction(() => patientApi.markStatement(id, row.id, 'sent'), 'Marked sent.')}
                          >
                            Sent
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>
                Visits · {chart.visits?.totals?.total || 0} total · {chart.visits?.totals?.upcoming || 0} upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Encounter</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RCM</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.visits?.appointments || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        No visits
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.visits.appointments.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {formatDate(row.appointmentDate)} {row.appointmentTime || ''}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.encounterNumber}</TableCell>
                        <TableCell>{row.visitType || '—'}</TableCell>
                        <TableCell>{row.providerName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusTone(row.status)}>{row.status}</Badge>
                        </TableCell>
                        <TableCell>{row.rcmStatus || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/rcm/encounters/${row.id}`)}>
                            Encounter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setClaimForm({
                  appointmentId: completedVisits[0]?.id || '',
                  billedAmount: '',
                  claimStatus: 'draft',
                  notes: '',
                });
                setClaimOpen(true);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create claim
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Billed</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Patient resp.</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.claims || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        No claims created from this chart yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.claims.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-sm">{row.claimNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusTone(row.claimStatus)}>{row.claimStatus}</Badge>
                        </TableCell>
                        <TableCell>{row.payerName || '—'}</TableCell>
                        <TableCell>{row.billedAmount != null ? formatMoney(row.billedAmount) : '—'}</TableCell>
                        <TableCell>{row.paidAmount != null ? formatMoney(row.paidAmount) : '—'}</TableCell>
                        <TableCell>{row.patientResponsibility != null ? formatMoney(row.patientResponsibility) : '—'}</TableCell>
                        <TableCell>{formatDate(row.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.documents || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                        No documents
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.documentName || doc.fileName || '—'}</TableCell>
                        <TableCell>{doc.documentType || doc.documentCategory || '—'}</TableCell>
                        <TableCell>{doc.fileName || '—'}</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(chart.missingConsents || []).length > 0 && (
                <p className="text-sm text-amber-800">
                  Missing mandatory: {chart.missingConsents.map((c) => c.title).join(', ')}
                </p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Signed at</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(chart.consents || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                        No signed consents
                      </TableCell>
                    </TableRow>
                  ) : (
                    chart.consents.map((row) => (
                      <TableRow key={row.id || row.consentFormId}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{formatDateTime(row.signedAt)}</TableCell>
                        <TableCell>{row.signatureType || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={paymentForm.transactionType}
                  onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, transactionType: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={paymentForm.description}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={paymentForm.autoAllocate !== false}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, autoAllocate: e.target.checked }))
                }
              />
              Auto-allocate to oldest open charges
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button disabled={busy || !paymentForm.amount} onClick={handlePayment}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate statement</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Period from</Label>
              <Input
                type="date"
                value={statementForm.periodFrom}
                onChange={(e) => setStatementForm((prev) => ({ ...prev, periodFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Period to</Label>
              <Input
                type="date"
                value={statementForm.periodTo}
                onChange={(e) => setStatementForm((prev) => ({ ...prev, periodTo: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={statementForm.notes}
              onChange={(e) => setStatementForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Current balance {formatMoney(ledger?.balance)} will be stored on the statement.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatementOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={handleStatement}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chart status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusForm.chartStatus}
                onValueChange={(value) => setStatusForm((prev) => ({ ...prev, chartStatus: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHART_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Financial class</Label>
              <Input
                value={statusForm.financialClass}
                onChange={(e) => setStatusForm((prev) => ({ ...prev, financialClass: e.target.value }))}
                placeholder="Commercial, Medicare, Self-pay, Sliding scale"
              />
            </div>
            {statusForm.chartStatus === 'deceased' && (
              <div className="space-y-2">
                <Label>Date of death</Label>
                <Input
                  type="date"
                  value={statusForm.deceasedAt}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, deceasedAt: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={handleStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create claim</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Encounter</Label>
              <Select
                value={claimForm.appointmentId || 'none'}
                onValueChange={(value) =>
                  setClaimForm((prev) => ({ ...prev, appointmentId: value === 'none' ? '' : value }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Select encounter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No encounter</SelectItem>
                  {(chart.visits?.appointments || []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.encounterNumber} · {formatDate(row.appointmentDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Billed amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={claimForm.billedAmount}
                  onChange={(e) => setClaimForm((prev) => ({ ...prev, billedAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={claimForm.claimStatus}
                  onValueChange={(value) => setClaimForm((prev) => ({ ...prev, claimStatus: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLAIM_STATUSES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={claimForm.notes}
                onChange={(e) => setClaimForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={handleCreateClaim}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={chargeForm.amount}
                onChange={(e) => setChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={chargeForm.description}
                onChange={(e) => setChargeForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeOpen(false)}>Cancel</Button>
            <Button disabled={busy || !chargeForm.amount} onClick={handleCharge}>Post charge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={insuranceOpen} onOpenChange={setInsuranceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add insurance coverage</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rank</Label>
              <Select
                value={insuranceForm.insuranceType}
                onValueChange={(value) =>
                  setInsuranceForm((prev) => ({ ...prev, insuranceType: value }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="tertiary">Tertiary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payer</Label>
              <Select
                value={insuranceForm.insuranceProviderId || undefined}
                onValueChange={(value) =>
                  setInsuranceForm((prev) => ({ ...prev, insuranceProviderId: value }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Select payer" /></SelectTrigger>
                <SelectContent>
                  {payers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member ID</Label>
              <Input
                value={insuranceForm.memberId}
                onChange={(e) => setInsuranceForm((prev) => ({ ...prev, memberId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Group #</Label>
              <Input
                value={insuranceForm.groupNumber}
                onChange={(e) => setInsuranceForm((prev) => ({ ...prev, groupNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Effective</Label>
              <Input
                type="date"
                value={insuranceForm.coverageStartDate}
                onChange={(e) =>
                  setInsuranceForm((prev) => ({ ...prev, coverageStartDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Termination</Label>
              <Input
                type="date"
                value={insuranceForm.coverageEndDate}
                onChange={(e) =>
                  setInsuranceForm((prev) => ({ ...prev, coverageEndDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Copay</Label>
              <Input
                type="number"
                value={insuranceForm.copay}
                onChange={(e) => setInsuranceForm((prev) => ({ ...prev, copay: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Deductible</Label>
              <Input
                type="number"
                value={insuranceForm.deductible}
                onChange={(e) => setInsuranceForm((prev) => ({ ...prev, deductible: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsuranceOpen(false)}>Cancel</Button>
            <Button
              disabled={busy || !insuranceForm.insuranceProviderId || !insuranceForm.memberId}
              onClick={handleInsuranceSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={guarantorOpen} onOpenChange={setGuarantorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guarantor / responsible party</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['relationship', 'Relationship'],
              ['phone', 'Phone'],
              ['email', 'Email'],
              ['address', 'Address'],
              ['city', 'City'],
              ['state', 'State'],
              ['zip', 'ZIP'],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={guarantorForm[key] || ''}
                  onChange={(e) => setGuarantorForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuarantorOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={handleGuarantorSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge another patient into this chart</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The source patient will be inactivated and its appointments, ledger, documents, and
            coverage moved into this patient when types do not conflict.
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Source patient ID (UUID)</Label>
              <Input
                value={mergeForm.sourcePatientId}
                onChange={(e) => setMergeForm((prev) => ({ ...prev, sourcePatientId: e.target.value }))}
                placeholder="Paste source patient UUID"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={mergeForm.notes}
                onChange={(e) => setMergeForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
            <Button disabled={busy || !mergeForm.sourcePatientId} onClick={handleMerge}>
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
