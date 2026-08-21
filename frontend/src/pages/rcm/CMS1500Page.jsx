import { useCallback, useEffect, useMemo, useRef, useState, Component } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, Printer, ChevronDown, MoreVertical, AlertTriangle } from 'lucide-react';
import { RowActionsMenu, RowActionsMenuItem } from '@/components/ui/row-actions-menu';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { rcmApi, patientApi, rcmEncounterApi } from '@/services/api';
import { CHARGE_ROUTING_OPTIONS, ICD_POINTERS } from '@/lib/claimConstants';
import {
  FREQUENCY_OPTIONS,
  createEmptyCms1500Form,
  formFromApi,
  formFromEncounter,
  formToPayload,
  applySetAllCharges,
  applyPatientInsurance,
  validateCms1500Form,
  emptyChargeLine,
} from '@/lib/cms1500FormModel';
import {
  searchPatients,
  searchProviders,
  searchBillingProviders,
  searchFacilities,
  searchPayers,
} from '@/lib/claimLookups';
import { SearchableSelect, InsuranceDetailsBlock } from '@/pages/rcm/claimInsuranceShared';
import { EntityLookupField } from '@/components/rcm/EntityLookupField';
import { ClaimSplitDialog } from '@/components/rcm/ClaimSplitDialog';
import { ClaimChargeHistoryDialog } from '@/components/rcm/ClaimChargeHistoryDialog';
import { ClaimElectronicPreviewDialog } from '@/components/rcm/ClaimElectronicPreviewDialog';
import { CodeLookupField } from '@/components/rcm/CodeLookupField';
import { PlaceOfServiceSelect } from '@/components/rcm/PlaceOfServiceSelect';

const ADDITIONAL_INFO_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'cms1500', label: 'CMS 1500 (02-12) Box Numbers (For Printed Claims)' },
];
const TRANSPORT_REASON_OPTIONS = ['none', 'emergency', 'non-emergency', 'transfer'];
const DELAY_REASON_CODE_OPTIONS = [
  'none',
  'administration delay in the prior approval process',
  'authorization delays',
  'delay in certifying providers',
  'delay in delivery of custom-made-appliances',
  'delay in eligibility determination',
  'delay in supplying billing form',
  'litigation',
  'original claim rejected or denied due to a reason unrealated to the billing limitation rules',
  'other',
  'proof of eligibility unknown or unavailable',
  'third party processing delays',
];
const SPECIAL_PROGRAM_CODE_OPTIONS = [
  'disability',
  "family planning",
  "physically handicapped children's program",
  'second opinion / surgery',
  'special federal funding',
];
const PATIENT_SIGNATURE_ON_FILE_OPTIONS = ['Yes', 'informed consent'];
const INSURED_SIGNATURE_ON_FILE_OPTIONS = ['no', 'patient refuses', 'yes'];
const ACCEPT_ASSIGNMENT_OPTIONS = [
  { value: 'Default', label: 'Default' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];
const DOCUMENTATION_METHOD_OPTIONS = [
  'No documentation',
  'Available on the request at provider site',
  'By mail',
  'electronically',
  'Email',
  'Fax',
];
const DOCUMENTATION_TYPE_OPTIONS = [
  'admission summary',
  'ambulance certification',
  'Diagnostic report',
  'Lab results',
  'physician order',
  'progress report',
  'Others',
];
const SERVICE_AUTH_EXCEPTION_OPTIONS = [
  'client as temporary medicaid',
  'emergency care',
  'Immidiate/Urgent care',
  'request for override pending',
  'special handling',
];
const CERTIFICATION_OPTIONS = [
  'Patient was admitted to a hospital',
  'Patient was unconscious or in shock',
  'Patient had to be physically restrained',
  'Ambulance service was medically necessary',
  'Patient was moved by stretcher',
  'Patient was transported in an emergency situation',
  'Patient had visible hemorrhaging',
  'Patient was confined to a bed or chair',
];

class CMS1500ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error('CMS1500Page error:', err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-lg border border-destructive bg-destructive/10">
          <h2 className="text-lg font-semibold text-destructive">Form failed to load</h2>
          <p className="text-sm mt-2">Refresh the page or check the console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CMS1500PageContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const claimId = searchParams.get('claimId');
  const encounterId = searchParams.get('encounterId');

  const [activeTab, setActiveTab] = useState('claim');
  const [form, setForm] = useState(createEmptyCms1500Form);
  const [baseline, setBaseline] = useState(() => JSON.stringify(createEmptyCms1500Form()));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(!!(claimId || encounterId));
  const [saving, setSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const pendingLeave = useRef(null);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);
  const incomplete = !form.patientId || !form.renderingProviderId || !form.billingProviderId;

  const patch = useCallback((partial) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const loadClaim = useCallback(async (id) => {
    setLoading(true);
    setSubmitError('');
    try {
      const res = await rcmApi.getClaim(id);
      const next = formFromApi(res.data || res);
      setForm(next);
      setBaseline(JSON.stringify(next));
      setErrors({});
    } catch (err) {
      setSubmitError(err.message || 'Unable to load claim');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromEncounter = useCallback(async (id) => {
    setLoading(true);
    setSubmitError('');
    try {
      const encounterRes = await rcmEncounterApi.getById(id);
      const encounter = encounterRes.data || encounterRes;
      const existingClaimId = encounter?.claim?.claimDbId;
      if (existingClaimId) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('encounterId', id);
          next.set('claimId', existingClaimId);
          return next;
        }, { replace: true });
        return;
      }

      const next = formFromEncounter(encounter);
      setForm(next);
      setBaseline(JSON.stringify(next));
      setErrors({});
    } catch (err) {
      setSubmitError(err.message || 'Unable to load encounter for claim');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (claimId) {
      loadClaim(claimId);
      return;
    }
    if (encounterId) {
      loadFromEncounter(encounterId);
    }
  }, [claimId, encounterId, loadClaim, loadFromEncounter]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const requestLeave = (action) => {
    if (!dirty) {
      action();
      return;
    }
    pendingLeave.current = action;
    setLeaveOpen(true);
  };

  const handleSave = async () => {
    const nextErrors = validateCms1500Form(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSubmitError('Claim validation failed. Review the highlighted fields.');
      setActiveTab('claim');
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      const payload = formToPayload(form);
      const res = form.id
        ? await rcmApi.updateClaim(form.id, payload)
        : await rcmApi.createClaim(payload);
      const saved = formFromApi(res.data || res);
      setForm(saved);
      setBaseline(JSON.stringify(saved));
      setErrors({});
      if (!claimId && saved.id) {
        const next = { claimId: saved.id };
        if (encounterId) next.encounterId = encounterId;
        setSearchParams(next);
      }
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setSubmitError(err.message || 'Unable to save claim');
    } finally {
      setSaving(false);
    }
  };

  const handlePatientSelect = async (item) => {
    try {
      const res = await patientApi.getById(item.id);
      setForm((prev) => applyPatientInsurance({
        ...prev,
        patientId: item.id,
        patientLabel: item.label,
      }, res.data || item.raw));
    } catch {
      setForm((prev) => applyPatientInsurance({
        ...prev,
        patientId: item.id,
        patientLabel: item.label,
      }, item.raw));
    }
  };

  const handleSetAllCharges = (value) => {
    setForm((prev) => applySetAllCharges({ ...prev, setAllChargesTo: value }, value));
  };

  const updateCharge = (index, field, value) => {
    setForm((prev) => {
      const charges = prev.charges.map((row, idx) => {
        if (idx !== index) return row;
        const next = { ...row, [field]: value };
        if (field === 'units' || field === 'unitPrice') {
          const units = Number(field === 'units' ? value : next.units) || 0;
          const price = Number(field === 'unitPrice' ? value : next.unitPrice) || 0;
          next.amount = (units * price).toFixed(2);
        }
        return next;
      });
      return { ...prev, charges };
    });
  };

  const openPrint = () => {
    if (!form.id) {
      setSubmitError('Save the claim before printing.');
      return;
    }
    window.open(`/rcm/claims/${form.id}/print`, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    if (!form.id) {
      setSubmitError('Save the claim before copying.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await rcmApi.copyClaim(form.id);
      const copied = formFromApi(res.data || res);
      navigate(`/rcm/cms-1500?claimId=${copied.id}`);
    } catch (err) {
      setSubmitError(err.message || 'Unable to copy claim');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSplit = async (chargeIds) => {
    setActionLoading(true);
    try {
      const res = await rcmApi.splitClaim(form.id, { chargeIds });
      const created = res.data?.created || res.created;
      setSplitOpen(false);
      if (created?.id) navigate(`/rcm/cms-1500?claimId=${created.id}`);
    } catch (err) {
      setSubmitError(err.message || 'Unable to split claim');
    } finally {
      setActionLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!form.id) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await rcmApi.chargeHistory(form.id);
      setHistoryRows(res.data || res || []);
    } catch (err) {
      setHistoryError(err.message || 'Unable to load charge history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPreview = async () => {
    if (!form.id) return;
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await rcmApi.electronicPreview(form.id);
      setPreview(res.data || res);
    } catch (err) {
      setPreviewError(err.message || 'Unable to load electronic preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const certificationCount = Object.values(form.certificationFields || {}).filter(Boolean).length;
  const ambulanceAddressDisabled = form.ambulanceClaim === 'No';

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading claim…</div>;
  }

  return (
    <div className="space-y-4 w-full py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Claim</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Check className="h-4 w-4 mr-1" /> {form.id ? 'Save Changes' : 'Save'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => requestLeave(() => navigate('/rcm/claims'))}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openPrint}>
            <Printer className="h-4 w-4 mr-1 icon-action-print" /> Print
          </Button>
          <RowActionsMenu
            trigger={
              <Button type="button" variant="outline" size="sm">
                <MoreVertical className="h-4 w-4 mr-1" /> More <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            }
          >
            <RowActionsMenuItem onClick={handleCopy} disabled={actionLoading}>
              Copy Claim
            </RowActionsMenuItem>
            <RowActionsMenuItem onClick={() => setSplitOpen(true)}>Split Claim</RowActionsMenuItem>
            <RowActionsMenuItem
              onClick={() => {
                setHistoryOpen(true);
                loadHistory();
              }}
            >
              View Charge History
            </RowActionsMenuItem>
            <RowActionsMenuItem
              onClick={() => {
                setPreviewOpen(true);
                loadPreview();
              }}
            >
              Preview Electronic Claim
            </RowActionsMenuItem>
          </RowActionsMenu>
        </div>
      </div>

      {submitError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="claim" className={cn(activeTab === 'claim' && 'border-b-2 border-destructive')}>Claim</TabsTrigger>
          <TabsTrigger value="charges" className={cn(activeTab === 'charges' && 'border-b-2 border-green-600')}>Charges</TabsTrigger>
          <TabsTrigger value="additional" className={cn(activeTab === 'additional' && 'border-b-2 border-green-600')}>Additional Info</TabsTrigger>
          <TabsTrigger value="ambulance" className={cn(activeTab === 'ambulance' && 'border-b-2 border-green-600')}>Ambulance Info</TabsTrigger>
        </TabsList>

        <TabsContent value="claim" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Claim #</Label>
                  <div className="flex items-center gap-2">
                    <Input value={form.claimNumber || 'New'} readOnly className="w-40 bg-muted" />
                    <Input placeholder="Reference #" value={form.claimRef} onChange={(e) => patch({ claimRef: e.target.value })} className="w-48" />
                    {incomplete && <span className="flex items-center gap-1 text-amber-600 text-sm"><AlertTriangle className="h-4 w-4" /> Claim is incomplete</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <SearchableSelect
                    value={form.frequencyCode}
                    onValueChange={(v) => patch({ frequencyCode: v })}
                    options={FREQUENCY_OPTIONS}
                    className="w-[200px]"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative pl-2 border-l-2 border-destructive">
                  <EntityLookupField
                    label="Patient"
                    required
                    value={form.patientId}
                    displayValue={form.patientLabel}
                    searcher={searchPatients}
                    onSelect={handlePatientSelect}
                    onClear={() => patch({ patientId: '', patientLabel: '' })}
                    error={errors.patientId}
                    placeholder="Search name, MRN, phone, or ID"
                  />
                </div>
                <div className="relative pl-2 border-l-2 border-destructive">
                  <EntityLookupField
                    label="Rendering Provider"
                    required
                    value={form.renderingProviderId}
                    displayValue={form.renderingProviderLabel}
                    searcher={searchProviders}
                    onSelect={(item) => patch({ renderingProviderId: item.id, renderingProviderLabel: item.label })}
                    onClear={() => patch({ renderingProviderId: '', renderingProviderLabel: '' })}
                    error={errors.renderingProviderId}
                    placeholder="Search provider name or NPI"
                  />
                </div>
                <div className="relative pl-2 border-l-2 border-destructive">
                  <EntityLookupField
                    label="Billing Provider"
                    required
                    value={form.billingProviderId}
                    displayValue={form.billingProviderLabel}
                    searcher={searchBillingProviders}
                    onSelect={(item) => patch({ billingProviderId: item.id, billingProviderLabel: item.label })}
                    onClear={() => patch({ billingProviderId: '', billingProviderLabel: '' })}
                    error={errors.billingProviderId}
                    placeholder="Search billing provider name or NPI"
                  />
                </div>
                <EntityLookupField
                  label="Supervising Provider"
                  value={form.supervisingProviderId}
                  displayValue={form.supervisingProviderLabel}
                  searcher={searchProviders}
                  onSelect={(item) => patch({ supervisingProviderId: item.id, supervisingProviderLabel: item.label })}
                  onClear={() => patch({ supervisingProviderId: '', supervisingProviderLabel: '' })}
                  error={errors.supervisingProviderId}
                />
                <EntityLookupField
                  label="Ordering Provider"
                  value={form.orderingProviderId}
                  displayValue={form.orderingProviderLabel}
                  searcher={searchProviders}
                  onSelect={(item) => patch({ orderingProviderId: item.id, orderingProviderLabel: item.label })}
                  onClear={() => patch({ orderingProviderId: '', orderingProviderLabel: '' })}
                  error={errors.orderingProviderId}
                />
                <EntityLookupField
                  label="Referring/PCP Provider"
                  value={form.referringProviderId}
                  displayValue={form.referringProviderLabel}
                  searcher={searchProviders}
                  onSelect={(item) => patch({ referringProviderId: item.id, referringProviderLabel: item.label })}
                  onClear={() => patch({ referringProviderId: '', referringProviderLabel: '' })}
                  error={errors.referringProviderId}
                />
                <EntityLookupField
                  label="Facility"
                  value={form.facilityId}
                  displayValue={form.facilityLabel}
                  searcher={searchFacilities}
                  onSelect={(item) => patch({ facilityId: item.id, facilityLabel: item.label })}
                  onClear={() => patch({ facilityId: '', facilityLabel: '' })}
                  error={errors.facilityId}
                />
                <div className="space-y-2">
                  <Label>Office Location</Label>
                  <Input value={form.officeLocation} onChange={(e) => patch({ officeLocation: e.target.value })} />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <EntityLookupField
                  label="Primary Insurance"
                  value={form.primaryPayerId}
                  displayValue={form.primaryPayerLabel}
                  searcher={searchPayers}
                  onSelect={(item) => patch({ primaryPayerId: item.id, primaryPayerLabel: item.label })}
                  onClear={() => patch({ primaryPayerId: '', primaryPayerLabel: '' })}
                  error={errors.primaryPayerId}
                />
                <InsuranceDetailsBlock
                  title="Primary – Insurance & Authorization"
                  details={form.primaryDetails}
                  onUpdate={(field, value) => patch({ primaryDetails: { ...form.primaryDetails, [field]: value } })}
                />
              </div>
              <div className="space-y-4 pt-4 border-t">
                <EntityLookupField
                  label="Secondary Insurance"
                  value={form.secondaryPayerId}
                  displayValue={form.secondaryPayerLabel}
                  searcher={searchPayers}
                  onSelect={(item) => patch({ secondaryPayerId: item.id, secondaryPayerLabel: item.label })}
                  onClear={() => patch({ secondaryPayerId: '', secondaryPayerLabel: '' })}
                />
                {form.secondaryPayerId && (
                  <InsuranceDetailsBlock
                    title="Secondary – Insurance & Authorization"
                    details={form.secondaryDetails}
                    onUpdate={(field, value) => patch({ secondaryDetails: { ...form.secondaryDetails, [field]: value } })}
                  />
                )}
              </div>
              <div className="space-y-4 pt-4 border-t">
                <EntityLookupField
                  label="Tertiary Insurance"
                  value={form.tertiaryPayerId}
                  displayValue={form.tertiaryPayerLabel}
                  searcher={searchPayers}
                  onSelect={(item) => patch({ tertiaryPayerId: item.id, tertiaryPayerLabel: item.label })}
                  onClear={() => patch({ tertiaryPayerId: '', tertiaryPayerLabel: '' })}
                />
                {form.tertiaryPayerId && (
                  <InsuranceDetailsBlock
                    title="Tertiary – Insurance & Authorization"
                    details={form.tertiaryDetails}
                    onUpdate={(field, value) => patch({ tertiaryDetails: { ...form.tertiaryDetails, [field]: value } })}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="mt-6 space-y-6">
          <div className="flex gap-6 items-start">
            <Card className="flex-1 min-w-0 w-full overflow-visible">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Diagnosis Code (ICD)</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ICD_POINTERS.map((lbl, i) => (
                    <div key={lbl} className="space-y-1">
                      <Label className="text-xs">ICD {lbl}</Label>
                      <CodeLookupField
                        catalog="diagnosis"
                        value={form.icdCodes[i]?.code || ''}
                        onChange={(code) => {
                          const icdCodes = form.icdCodes.map((dx, idx) => (idx === i ? { ...dx, code } : dx));
                          patch({ icdCodes });
                        }}
                        onSelect={(item) => {
                          const icdCodes = form.icdCodes.map((dx, idx) => (
                            idx === i
                              ? { diagnosisCodeId: item.id, code: item.code, description: item.description }
                              : dx
                          ));
                          patch({ icdCodes });
                        }}
                        placeholder="Search ICD"
                        inputClassName={i === 0 ? 'border-destructive' : ''}
                      />
                      {errors[`diagnoses.${i}.code`] && (
                        <p className="text-xs text-destructive">{errors[`diagnoses.${i}.code`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="w-72 shrink-0 h-fit">
              <CardHeader className="py-3 bg-muted/50">
                <CardTitle className="text-sm">Charge Options</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="updateDefaults" checked={form.updatePatientDefaults} onCheckedChange={(c) => patch({ updatePatientDefaults: !!c })} />
                  <Label htmlFor="updateDefaults" className="text-sm font-normal">Update patient ICD & Procedure Code defaults</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Set all charges to</Label>
                  <SearchableSelect
                    value={form.setAllChargesTo}
                    onValueChange={handleSetAllCharges}
                    options={CHARGE_ROUTING_OPTIONS}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="w-full overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Charges</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead>POS</TableHead>
                    <TableHead>Mod 1</TableHead>
                    <TableHead>Mod 2</TableHead>
                    <TableHead>Mod 3</TableHead>
                    <TableHead>Mod 4</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>DX Pointers</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.charges.map((row, i) => (
                    <TableRow key={row.id || i}>
                      <TableCell><Input type="date" value={row.from} onChange={(e) => updateCharge(i, 'from', e.target.value)} className="h-8 w-28" placeholder="From date" title="Service from date" /></TableCell>
                      <TableCell><Input type="date" value={row.to} onChange={(e) => updateCharge(i, 'to', e.target.value)} className="h-8 w-28" placeholder="To date" title="Service to date" /></TableCell>
                      <TableCell className="min-w-[10rem]">
                        <CodeLookupField
                          catalog="charge"
                          value={row.procedure}
                          onChange={(code) => updateCharge(i, 'procedure', code)}
                          onSelect={(item) => {
                            updateCharge(i, 'procedure', item.code);
                            if (item.raw?.unitCharge != null) updateCharge(i, 'unitPrice', Number(item.raw.unitCharge).toFixed(2));
                            if (item.raw?.placeOfService) updateCharge(i, 'pos', item.raw.placeOfService);
                          }}
                          placeholder="Search code or description"
                        />
                        {errors[`charges.${i}.procedure_code`] && <p className="text-xs text-destructive">{errors[`charges.${i}.procedure_code`]}</p>}
                      </TableCell>
                      <TableCell>
                        <PlaceOfServiceSelect
                          value={row.pos}
                          onValueChange={(v) => updateCharge(i, 'pos', v)}
                          triggerClassName="h-8 min-w-[4.5rem]"
                          placeholder="POS"
                        />
                      </TableCell>
                      <TableCell><Input value={row.mod1} onChange={(e) => updateCharge(i, 'mod1', e.target.value)} className="h-8 w-14" placeholder="Mod 1" /></TableCell>
                      <TableCell><Input value={row.mod2} onChange={(e) => updateCharge(i, 'mod2', e.target.value)} className="h-8 w-14" placeholder="Mod 2" /></TableCell>
                      <TableCell><Input value={row.mod3} onChange={(e) => updateCharge(i, 'mod3', e.target.value)} className="h-8 w-14" placeholder="Mod 3" /></TableCell>
                      <TableCell><Input value={row.mod4} onChange={(e) => updateCharge(i, 'mod4', e.target.value)} className="h-8 w-14" placeholder="Mod 4" /></TableCell>
                      <TableCell><Input value={row.unitPrice} onChange={(e) => updateCharge(i, 'unitPrice', e.target.value)} className="h-8 w-20" placeholder="0.00" /></TableCell>
                      <TableCell><Input value={row.dxPointers} onChange={(e) => updateCharge(i, 'dxPointers', e.target.value)} className="h-8 w-20" placeholder="A,B,C" /></TableCell>
                      <TableCell><Input value={row.units} onChange={(e) => updateCharge(i, 'units', e.target.value)} className="h-8 w-16" placeholder="1" /></TableCell>
                      <TableCell><Input value={row.amount} onChange={(e) => updateCharge(i, 'amount', e.target.value)} className="h-8 w-20" placeholder="0.00" /></TableCell>
                      <TableCell>
                        <SearchableSelect
                          value={row.status}
                          onValueChange={(v) => updateCharge(i, 'status', v)}
                          options={CHARGE_ROUTING_OPTIONS}
                          triggerClassName="h-8 min-w-[160px]"
                          placeholder="Select status"
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="sm" onClick={() => patch({ charges: form.charges.filter((_, idx) => idx !== i) })}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="p-2 border-t text-sm text-muted-foreground">{form.charges.length} Charges</div>
            </CardContent>
          </Card>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => patch({ charges: [...form.charges, emptyChargeLine()] })}>
            Add charge line
          </Button>
        </TabsContent>

        <TabsContent value="additional" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Show Additional Information about each field</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchableSelect
                value={form.showBoxNumbers}
                onValueChange={(v) => patch({ showBoxNumbers: v })}
                options={ADDITIONAL_INFO_OPTIONS}
                className="w-full max-w-md"
                placeholder="None"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Patient Condition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Is Patient Condition Related to:</Label>
                <div className="flex flex-wrap gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-normal">Employment</Label>
                    <label className="flex items-center gap-1"><input type="radio" name="emp" checked={form.employmentRelated === 'Yes'} onChange={() => patch({ employmentRelated: 'Yes' })} /> Yes</label>
                    <label className="flex items-center gap-1"><input type="radio" name="emp" checked={form.employmentRelated === 'No'} onChange={() => patch({ employmentRelated: 'No' })} /> No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-normal">Auto Accident</Label>
                    <label className="flex items-center gap-1"><input type="radio" name="auto" checked={form.autoAccident === 'Yes'} onChange={() => patch({ autoAccident: 'Yes' })} /> Yes</label>
                    <label className="flex items-center gap-1"><input type="radio" name="auto" checked={form.autoAccident === 'No'} onChange={() => patch({ autoAccident: 'No' })} /> No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-normal">Other Accident</Label>
                    <label className="flex items-center gap-1"><input type="radio" name="other" checked={form.otherAccident === 'Yes'} onChange={() => patch({ otherAccident: 'Yes' })} /> Yes</label>
                    <label className="flex items-center gap-1"><input type="radio" name="other" checked={form.otherAccident === 'No'} onChange={() => patch({ otherAccident: 'No' })} /> No</label>
                  </div>
                </div>
                {form.autoAccident === 'Yes' && (
                  <div className="mt-3 max-w-xs space-y-2">
                    <Label className="text-sm">State</Label>
                    <Input value={form.autoAccidentState} onChange={(e) => patch({ autoAccidentState: e.target.value })} placeholder="e.g. CA" maxLength={2} className="uppercase" />
                    {errors['additionalInfo.accidentState'] && <p className="text-xs text-destructive">{errors['additionalInfo.accidentState']}</p>}
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['Accident/Illness Date', 'accidentDate'],
                  ['Last Menstrual Period', 'lastMenstrualPeriod'],
                  ['Initial Treatment Date', 'initialTreatmentDate'],
                  ['Date Last Seen', 'dateLastSeen'],
                  ['Unable to Work From Date', 'unableToWorkFrom'],
                  ['Unable to Work To Date', 'unableToWorkTo'],
                ].map(([label, key]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm">{label}</Label>
                    <Input type="date" value={form[key]} onChange={(e) => patch({ [key]: e.target.value })} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Claim Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label className="text-sm">Claim Codes</Label><Input value={form.claimCodes} onChange={(e) => patch({ claimCodes: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-sm">Other Claim ID</Label><Input value={form.otherClaimId} onChange={(e) => patch({ otherClaimId: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Additional Claim Information</Label><Input value={form.additionalClaimInfo} onChange={(e) => patch({ additionalClaimInfo: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Claim Note</Label><Input value={form.claimNote} onChange={(e) => patch({ claimNote: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-sm">Resubmit Reason Code</Label><Input value={form.resubmitReasonCode} onChange={(e) => patch({ resubmitReasonCode: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label className="text-sm">Delay Reason Code</Label>
                  <SearchableSelect value={form.delayReasonCode} onValueChange={(v) => patch({ delayReasonCode: v })} options={DELAY_REASON_CODE_OPTIONS} />
                </div>
                <div className="space-y-2"><Label className="text-sm">Hospitalized From Date</Label><Input type="date" value={form.hospitalizedFrom} onChange={(e) => patch({ hospitalizedFrom: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-sm">Hospitalized To Date</Label><Input type="date" value={form.hospitalizedTo} onChange={(e) => patch({ hospitalizedTo: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-sm">Lab Charges</Label><Input type="number" step="0.01" value={form.labCharges} onChange={(e) => patch({ labCharges: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label className="text-sm">Special Program Code</Label>
                  <SearchableSelect
                    value={form.specialProgramCode || 'none'}
                    onValueChange={(v) => patch({ specialProgramCode: v === 'none' ? '' : v })}
                    options={[{ value: 'none', label: 'none' }, ...SPECIAL_PROGRAM_CODE_OPTIONS]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Assignment of Benefits</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm">Patient's Signature on File</Label>
                <SearchableSelect value={form.patientSignatureOnFile} onValueChange={(v) => patch({ patientSignatureOnFile: v })} options={PATIENT_SIGNATURE_ON_FILE_OPTIONS} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Insured's Signature on File</Label>
                <SearchableSelect value={form.insuredSignatureOnFile} onValueChange={(v) => patch({ insuredSignatureOnFile: v })} options={INSURED_SIGNATURE_ON_FILE_OPTIONS} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Provider Accept Assignment</Label>
                <SearchableSelect value={form.providerAcceptAssignment} onValueChange={(v) => patch({ providerAcceptAssignment: v })} options={ACCEPT_ASSIGNMENT_OPTIONS} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Other Reference Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Documentation Method</Label>
                <SearchableSelect value={form.documentationMethod} onValueChange={(v) => patch({ documentationMethod: v })} options={DOCUMENTATION_METHOD_OPTIONS} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Documentation Type</Label>
                <SearchableSelect
                  value={form.documentationType || 'none'}
                  onValueChange={(v) => patch({ documentationType: v === 'none' ? '' : v })}
                  options={[{ value: 'none', label: 'none' }, ...DOCUMENTATION_TYPE_OPTIONS]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambulance" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Label className="font-medium">Ambulance claim</Label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amb" checked={form.ambulanceClaim === 'Yes'} onChange={() => patch({ ambulanceClaim: 'Yes' })} /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amb" checked={form.ambulanceClaim === 'No'} onChange={() => patch({ ambulanceClaim: 'No' })} /> No</label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Transport Reason</Label>
                  <SearchableSelect
                    value={form.transportReason || 'none'}
                    onValueChange={(v) => patch({ transportReason: v === 'none' ? '' : v })}
                    options={TRANSPORT_REASON_OPTIONS}
                  />
                </div>
                <div className="space-y-2"><Label className="text-sm">Transport Miles</Label><Input type="number" step="0.01" value={form.transportMiles} onChange={(e) => patch({ transportMiles: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-sm">Patient Weight</Label><Input type="number" value={form.ambulancePatientWeight} onChange={(e) => patch({ ambulancePatientWeight: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Round Trip Reason</Label><Input value={form.roundTripReason} onChange={(e) => patch({ roundTripReason: e.target.value })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Stretcher Reason</Label><Input value={form.stretcherReason} onChange={(e) => patch({ stretcherReason: e.target.value })} /></div>
              </div>
              <div className="rounded-lg border">
                <div className="bg-muted/50 px-4 py-2 font-medium text-sm">Pickup Address</div>
                <div className={cn('p-4 space-y-4', ambulanceAddressDisabled && 'opacity-60 pointer-events-none')}>
                  <div className="space-y-2"><Label className="text-sm">Address</Label><Textarea value={form.pickupAddress.line1} onChange={(e) => patch({ pickupAddress: { ...form.pickupAddress, line1: e.target.value } })} rows={2} disabled={ambulanceAddressDisabled} /></div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 sm:col-span-2"><Label className="text-sm">City</Label><Input value={form.pickupAddress.city} onChange={(e) => patch({ pickupAddress: { ...form.pickupAddress, city: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">State</Label><Input value={form.pickupAddress.state} onChange={(e) => patch({ pickupAddress: { ...form.pickupAddress, state: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">ZIP Code</Label><Input value={form.pickupAddress.zip} onChange={(e) => patch({ pickupAddress: { ...form.pickupAddress, zip: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                  </div>
                  {errors['ambulanceInfo.pickupAddress'] && <p className="text-xs text-destructive">{errors['ambulanceInfo.pickupAddress']}</p>}
                </div>
              </div>
              <div className="rounded-lg border">
                <div className="bg-muted/50 px-4 py-2 font-medium text-sm">Dropoff Address</div>
                <div className={cn('p-4 space-y-4', ambulanceAddressDisabled && 'opacity-60 pointer-events-none')}>
                  <div className="space-y-2"><Label className="text-sm">Name</Label><Input value={form.dropoffAddress.name} onChange={(e) => patch({ dropoffAddress: { ...form.dropoffAddress, name: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                  <div className="space-y-2"><Label className="text-sm">Address</Label><Textarea value={form.dropoffAddress.line1} onChange={(e) => patch({ dropoffAddress: { ...form.dropoffAddress, line1: e.target.value } })} rows={2} disabled={ambulanceAddressDisabled} /></div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 sm:col-span-2"><Label className="text-sm">City</Label><Input value={form.dropoffAddress.city} onChange={(e) => patch({ dropoffAddress: { ...form.dropoffAddress, city: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">State</Label><Input value={form.dropoffAddress.state} onChange={(e) => patch({ dropoffAddress: { ...form.dropoffAddress, state: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">ZIP Code</Label><Input value={form.dropoffAddress.zip} onChange={(e) => patch({ dropoffAddress: { ...form.dropoffAddress, zip: e.target.value } })} disabled={ambulanceAddressDisabled} /></div>
                  </div>
                  {errors['ambulanceInfo.dropoffAddress'] && <p className="text-xs text-destructive">{errors['ambulanceInfo.dropoffAddress']}</p>}
                </div>
              </div>
              <div className="rounded-lg border">
                <div className="bg-muted/50 px-4 py-2 flex items-center justify-between"><span className="font-medium text-sm">Certification Fields</span><span className="text-xs text-muted-foreground">Select up to 5</span></div>
                <div className="p-4 grid gap-2 sm:grid-cols-2">
                  {CERTIFICATION_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <Checkbox
                        id={opt}
                        checked={!!form.certificationFields[opt]}
                        onCheckedChange={() => {
                          if (certificationCount >= 5 && !form.certificationFields[opt]) return;
                          patch({ certificationFields: { ...form.certificationFields, [opt]: !form.certificationFields[opt] } });
                        }}
                        disabled={certificationCount >= 5 && !form.certificationFields[opt]}
                      />
                      <Label htmlFor={opt} className="font-normal text-sm cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={leaveOpen} onOpenChange={(open) => { if (!open) { setLeaveOpen(false); pendingLeave.current = null; } }}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm">You have unsaved changes. Are you sure you want to leave?</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setLeaveOpen(false); pendingLeave.current = null; }}>Stay</Button>
            <Button variant="destructive" size="sm" onClick={() => { const action = pendingLeave.current; setLeaveOpen(false); pendingLeave.current = null; action?.(); }}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClaimSplitDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        charges={form.charges}
        onSplit={handleSplit}
        loading={actionLoading}
      />
      <ClaimChargeHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        rows={historyRows}
        loading={historyLoading}
        error={historyError}
        onRetry={loadHistory}
      />
      <ClaimElectronicPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        loading={previewLoading}
        error={previewError}
        onRetry={loadPreview}
      />
    </div>
  );
}

export function CMS1500Page() {
  return (
    <CMS1500ErrorBoundary>
      <CMS1500PageContent />
    </CMS1500ErrorBoundary>
  );
}
