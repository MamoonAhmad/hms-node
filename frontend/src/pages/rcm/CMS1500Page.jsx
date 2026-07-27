import { useCallback, useEffect, useMemo, useState, Component } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { EntityLookupField } from '@/components/rcm/EntityLookupField';
import { claimApi } from '@/services/api/claim.api';
import { patientApi } from '@/services/api/patient.api';
import { providerApi } from '@/services/api/provider.api';
import { insuranceProviderApi } from '@/services/api/insuranceProvider.api';
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { patientProblemApi } from '@/services/api/patientProblem.api';
import {
  emptyInsuranceDetails,
  formatPatientDisplayName,
  formatProviderDisplayName,
  icdCodesFromProblems,
  mapInsuranceDetails,
  mapPatientInsurances,
  padIcdCodes,
} from './cms1500FormUtils';

/** Title-case words for dropdown display (e.g. "john doe" → "John Doe"). Preserves numbers, punctuation-only tokens, and short ALL-CAPS tokens (e.g. CMS). */
function formatDropdownLabel(text) {
  if (text == null || text === '') return '';
  return String(text)
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (!/[a-zA-Z]/.test(word)) return word;
      if (/^[A-Z]{2,6}$/.test(word)) return word;
      if (/\d/.test(word) && /[()]/.test(word)) return word;
      return word.split('/').map((part) => {
        if (!part.length) return part;
        if (!/[a-zA-Z]/.test(part)) return part;
        if (/^[A-Z]{2,6}$/.test(part)) return part;
        if (/^\d/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('/');
    })
    .join(' ');
}

function normalizeSelectOption(o) {
  const value = typeof o === 'string' ? o : String(o.value ?? o);
  const rawLabel = typeof o === 'string' ? o : String(o.label ?? o.value ?? '');
  return { value, label: rawLabel, displayLabel: formatDropdownLabel(rawLabel) };
}

function sortOptionsAZWithOtherLast(options) {
  const normalized = (options || []).map(normalizeSelectOption);

  const isOther = (o) => {
    const t = String(o.label).trim().toLowerCase();
    return t === 'other' || t === 'others';
  };

  const others = normalized.filter((o) => isOther(o));
  const rest = normalized.filter((o) => !isOther(o));

  rest.sort((a, b) =>
    String(a.displayLabel).localeCompare(String(b.displayLabel), undefined, { sensitivity: 'base' })
  );
  return [...rest, ...others];
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  disabled = false,
  className,
  triggerClassName,
}) {
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo(
    () => sortOptionsAZWithOtherLast(options || []),
    [options]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((o) => {
      const hay = `${o.label} ${o.displayLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [normalizedOptions, query]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', triggerClassName, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-8"
            onKeyDown={(e) => e.stopPropagation()}
            disabled={disabled}
          />
        </div>
        {filtered.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">No matches</div>
        ) : (
          filtered.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.displayLabel}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

const FREQUENCY_OPTIONS = [
  { value: '1', label: '1 - Original Claim' },
  { value: '7', label: '7 - Replacement' },
  { value: '8', label: '8 - Void/Cancel' },
];

const CHARGE_STATUS_OPTIONS = [
  'No change',
  'balance due patient',
  'deleted',
  'incomplete',
  'on hold',
  'paid',
  'pending patient',
  'Rejected clearing house',
  'waiting for review',
];
const SET_ALL_CHARGES_OPTIONS = [...CHARGE_STATUS_OPTIONS];
const ACCEPT_ASSIGNMENT_OPTIONS = [{ value: 'Default', label: 'Default' }, { value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }];
const POLICY_TYPE_OPTIONS = [
  'auto insurance policy',
  'group policy',
  'individual policy',
  'long term policy',
  'ligitation',
  'medicare primary',
  'self payment',
  'supplimental policy',
  'Others',
];
const REFERRAL_TYPE_OPTIONS = [
  { value: 'Prior Auth Number', label: 'Prior Auth Number' },
  { value: 'Referral Number', label: 'Referral Number' },
  { value: 'None', label: 'None' },
];
const TRANSPORT_REASON_OPTIONS = ['none'];
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
  'physically handicapped children\'s program',
  'second opinion / surgery',
  'special federal funding',
];

const PATIENT_SIGNATURE_ON_FILE_OPTIONS = [
  'Yes',
  'informed consent',
];

const INSURED_SIGNATURE_ON_FILE_OPTIONS = [
  'no',
  'patient refuses',
  'yes',
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
  'allergy / sensitivities document',
  'ambulance certification',
  'autopsy report',
  'baseline',
  'benchmark testing result',
  'blanket test results',
  'certification',
  'certified test report',
  'chemical analysis',
  'chiropractic justification',
  'consent form(s)',
  'death notification',
  'dental models',
  'Diagnostic report',
  'discharge monitoring report',
  'discharge summary',
  'drug profile',
  'functional goal',
  'health certificate',
  'health clinic record',
  'justification for admission',
  'Lab results',
  'models',
  'nursing notes',
  'operative notes',
  'orders and treatment document',
  'oxygen content averaging report',
  'oxygen therapy certification',
  'paramedical results',
  'patient medical history',
  'photographs',
  'physical therapy certification',
  'physician order',
  'physician report',
  'progress report',
  'prosthetic or orthotic certification',
  'prescription',
  'radiology films',
  'radiology report',
  'recovery plan',
  'referral form',
  'state school immunization records',
  'support data for claim',
  'symptoms document',
  'treatment diagnosis',
  'Others',
];

const SERVICE_AUTH_EXCEPTION_OPTIONS = [
  'client as temporary medicaid',
  'emergency care',
  'Immidiate/Urgent care',
  'request for override pending',
  'request from county for second opinion to recipient can work',
  'service rendered in a ratroactive period',
  'special handling',
];

const ADDITIONAL_INFO_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'cms1500', label: 'CMS 1500 (02-12) Box Numbers (For Printed Claims)' },
];

const ICD_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

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

function InsuranceDetailsBlock({ title, details, onUpdate, onCopyAuth }) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm">Member ID</Label>
          <Input value={details.memberId} onChange={(e) => onUpdate('memberId', e.target.value)} placeholder="e.g. 1234321" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Policy Type</Label>
          <SearchableSelect
            value={details.policyType || undefined}
            onValueChange={(v) => onUpdate('policyType', v)}
            options={POLICY_TYPE_OPTIONS}
            placeholder="Select"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Copay Due</Label>
          <Input type="number" step="0.01" value={details.copayDue} onChange={(e) => onUpdate('copayDue', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Group Number</Label>
          <Input value={details.groupNumber} onChange={(e) => onUpdate('groupNumber', e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm">Claim Control / Original Ref. #</Label>
          <Input value={details.claimControlRef} onChange={(e) => onUpdate('claimControlRef', e.target.value)} />
        </div>
        <div className="space-y-2 flex flex-col sm:col-span-2 lg:col-span-3">
          <Label className="text-sm">Authorization #</Label>
          <div className="flex gap-2 items-center">
            <Input value={details.authorizationNumber} onChange={(e) => onUpdate('authorizationNumber', e.target.value)} className="flex-1 max-w-xs" />
            <button
              type="button"
              className="text-sm text-primary hover:underline whitespace-nowrap"
              onClick={onCopyAuth}
            >
              Copy Auth from Patient
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Referral Type</Label>
          <SearchableSelect
            value={details.referralType || 'None'}
            onValueChange={(v) => onUpdate('referralType', v)}
            options={REFERRAL_TYPE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

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
  const [searchParams] = useSearchParams();
  const claimIdParam = searchParams.get('claimId') || '';

  const [activeTab, setActiveTab] = useState('claim');
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [claimNumber, setClaimNumber] = useState('New');
  const [claimIncomplete, setClaimIncomplete] = useState(true);
  const [claimRef, setClaimRef] = useState('');
  const [frequency, setFrequency] = useState('1');
  const [patientId, setPatientId] = useState(null);
  const [patient, setPatient] = useState('');
  const [renderingProvider, setRenderingProvider] = useState('');
  const [billingProvider, setBillingProvider] = useState('');
  const [supervisingProvider, setSupervisingProvider] = useState('');
  const [orderingProvider, setOrderingProvider] = useState('');
  const [referringProvider, setReferringProvider] = useState('');
  const [facility, setFacility] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [primaryInsurance, setPrimaryInsurance] = useState('');
  const [secondaryInsurance, setSecondaryInsurance] = useState('');
  const [tertiaryInsurance, setTertiaryInsurance] = useState('');

  const [primaryDetails, setPrimaryDetails] = useState(emptyInsuranceDetails);
  const [secondaryDetails, setSecondaryDetails] = useState(emptyInsuranceDetails);
  const [tertiaryDetails, setTertiaryDetails] = useState(emptyInsuranceDetails);
  const [patientAuthByTier, setPatientAuthByTier] = useState({
    primary: '',
    secondary: '',
    tertiary: '',
  });
  const [hasSecondaryInsurance, setHasSecondaryInsurance] = useState(false);
  const [hasTertiaryInsurance, setHasTertiaryInsurance] = useState(false);
  const updateInsuranceDetails = (setter, field, value) =>
    setter((prev) => ({ ...prev, [field]: value }));

  const [icdCodes, setIcdCodes] = useState(ICD_LABELS.map(() => ''));
  const [updatePatientDefaults, setUpdatePatientDefaults] = useState(false);
  const [setAllChargesTo, setSetAllChargesTo] = useState('No change');
  const [charges, setCharges] = useState([
    { from: '', to: '', procedure: '', inventory: '', chiro: false, pos: '', tos: '', mod1: '', mod2: '', mod3: '', mod4: '', unitPrice: '0.00', dxPointers: '', units: '1.00', amount: '0.00', status: 'balance due patient', delete: false },
  ]);

  const applyInsuranceTier = useCallback((tiers) => {
    const primary = tiers.primary;
    const secondary = tiers.secondary;
    const tertiary = tiers.tertiary;
    setPrimaryInsurance(primary?.payerName || '');
    setSecondaryInsurance(secondary?.payerName || '');
    setTertiaryInsurance(tertiary?.payerName || '');
    setHasSecondaryInsurance(!!secondary);
    setHasTertiaryInsurance(!!tertiary);
    setPrimaryDetails(mapInsuranceDetails(primary));
    setSecondaryDetails(mapInsuranceDetails(secondary));
    setTertiaryDetails(mapInsuranceDetails(tertiary));
    setPatientAuthByTier({
      primary: primary?.authorizationNumber || '',
      secondary: secondary?.authorizationNumber || '',
      tertiary: tertiary?.authorizationNumber || '',
    });
  }, []);

  const applyPatientRelatedData = useCallback(async (nextPatientId) => {
    if (!nextPatientId) return;
    const [patientRes, problemsRes] = await Promise.all([
      patientApi.getById(nextPatientId),
      patientProblemApi.getAll(nextPatientId, { status: 'Active' }),
    ]);
    const p = patientRes?.data || patientRes;
    setPatientId(p?.id || nextPatientId);
    setPatient(formatPatientDisplayName(p));
    const tiers = mapPatientInsurances(p?.insuranceList || p?.insurances || []);
    applyInsuranceTier(tiers);
    const problems = problemsRes?.data || problemsRes || [];
    setIcdCodes(padIcdCodes(icdCodesFromProblems(problems)));
  }, [applyInsuranceTier]);

  const applyFormPayload = useCallback((form) => {
    if (!form) return;
    setClaimNumber(form.claimNumber || 'New');
    setClaimIncomplete(String(form.status || '').toLowerCase() === 'draft');
    setPatientId(form.patientId || form.patient?.id || null);
    setPatient(form.patient?.displayName || formatPatientDisplayName(form.patient) || '');
    setRenderingProvider(form.renderingProvider?.name || '');
    setBillingProvider(form.billingProvider?.name || form.renderingProvider?.name || '');
    setSupervisingProvider(form.supervisingProvider?.name || form.renderingProvider?.name || '');
    setFacility(form.facility || 'Main Facility');
    applyInsuranceTier(form.insurance || {});
    setIcdCodes(padIcdCodes(form.icdCodes || []));
  }, [applyInsuranceTier]);

  useEffect(() => {
    if (!claimIdParam) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingClaim(true);
      setLoadError('');
      try {
        const res = await claimApi.getClaim(claimIdParam);
        if (cancelled) return;
        const data = res?.data || res;
        if (data?.form) {
          applyFormPayload(data.form);
        } else {
          setClaimNumber(data?.claimNumber || claimIdParam);
          setPatient(
            formatPatientDisplayName({
              firstName: data?.patientFirstName,
              lastName: data?.patientLastName,
            }),
          );
          setRenderingProvider(data?.renderingProviderName || '');
          setBillingProvider(data?.billingProviderName || data?.renderingProviderName || '');
          setSupervisingProvider(data?.renderingProviderName || '');
          if (data?.patientId) await applyPatientRelatedData(data.patientId);
          if (data?.diagnoses?.length) {
            setIcdCodes(padIcdCodes(data.diagnoses.map((d) => d.icd10Code)));
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || 'Failed to load claim');
      } finally {
        if (!cancelled) setLoadingClaim(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [claimIdParam, applyFormPayload, applyPatientRelatedData]);

  const loadPatientOptions = useCallback(async (query) => {
    const res = await patientApi.getAll({ search: query || undefined, limit: 50, page: 1 });
    const rows = res?.data || [];
    return rows.map((p) => ({
      value: p.id,
      label: formatPatientDisplayName(p),
      subLabel: p.mrn ? `MRN ${p.mrn}` : undefined,
      raw: p,
    }));
  }, []);

  const loadProviderOptions = useCallback(async (query) => {
    const res = await providerApi.getAll({ search: query || undefined, limit: 50, page: 1, isActive: true });
    const rows = res?.data || [];
    return rows.map((p) => ({
      value: p.id,
      label: formatProviderDisplayName(p),
      subLabel: p.npi ? `NPI ${p.npi}` : undefined,
      raw: p,
    }));
  }, []);

  const loadInsuranceOptions = useCallback(async (query) => {
    const res = await insuranceProviderApi.getAll({
      search: query || undefined,
      limit: 50,
      page: 1,
      isActive: true,
    });
    const rows = res?.data || [];
    return rows.map((ins) => ({
      value: ins.id,
      label: ins.name || '',
      subLabel: ins.code ? `Payer ID ${ins.code}` : undefined,
      raw: ins,
    }));
  }, []);

  const loadDiagnosisOptions = useCallback(async (query) => {
    const res = await diagnosisCodeApi.getAll({ search: query || undefined, limit: 50, page: 1 });
    const rows = res?.data || [];
    return rows.map((d) => ({
      value: d.id || d.code,
      label: d.code,
      subLabel: d.description || undefined,
      raw: d,
    }));
  }, []);

  const handlePatientSelect = useCallback(async (opt) => {
    const id = opt?.raw?.id || opt?.value;
    if (!id) return;
    try {
      await applyPatientRelatedData(id);
    } catch (err) {
      setLoadError(err?.message || 'Failed to load patient');
    }
  }, [applyPatientRelatedData]);

  const handleRenderingSelect = useCallback((opt) => {
    const name = opt?.label || formatProviderDisplayName(opt?.raw) || '';
    setRenderingProvider((prevRendering) => {
      setSupervisingProvider((prev) => (!prev || prev === prevRendering ? name : prev));
      setBillingProvider((prev) => (!prev || prev === prevRendering ? name : prev));
      return name;
    });
  }, []);

  const [employmentRelated, setEmploymentRelated] = useState('No');
  const [autoAccident, setAutoAccident] = useState('No');
  const [otherAccident, setOtherAccident] = useState('No');
  const [accidentDate, setAccidentDate] = useState('');
  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState('');
  const [initialTreatmentDate, setInitialTreatmentDate] = useState('');
  const [dateLastSeen, setDateLastSeen] = useState('');
  const [unableToWorkFrom, setUnableToWorkFrom] = useState('');
  const [unableToWorkTo, setUnableToWorkTo] = useState('');
  const [patientHomebound, setPatientHomebound] = useState('No');
  const [showBoxNumbers, setShowBoxNumbers] = useState('none');
  const [autoAccidentState, setAutoAccidentState] = useState('');
  const [claimCodes, setClaimCodes] = useState('');
  const [otherClaimId, setOtherClaimId] = useState('');
  const [additionalClaimInfo, setAdditionalClaimInfo] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [resubmitReasonCode, setResubmitReasonCode] = useState('');
  const [delayReasonCode, setDelayReasonCode] = useState('none');
  const [hospitalizedFrom, setHospitalizedFrom] = useState('');
  const [hospitalizedTo, setHospitalizedTo] = useState('');
  const [labCharges, setLabCharges] = useState('0.00');
  const [specialProgramCode, setSpecialProgramCode] = useState('');

  const [patientSignatureOnFile, setPatientSignatureOnFile] = useState('Yes');
  const [insuredSignatureOnFile, setInsuredSignatureOnFile] = useState('yes');
  const [providerAcceptAssignment, setProviderAcceptAssignment] = useState('Default');
  const [documentationMethod, setDocumentationMethod] = useState('No documentation');
  const [documentationType, setDocumentationType] = useState('');
  const [documentationTypeOther, setDocumentationTypeOther] = useState('');
  const [patientHeight, setPatientHeight] = useState('0');
  const [patientWeight, setPatientWeight] = useState('0');
  const [serviceAuthException, setServiceAuthException] = useState('');
  const [demonstrationProject, setDemonstrationProject] = useState('');
  const [mammographyCert, setMammographyCert] = useState('');
  const [investigationalDevice, setInvestigationalDevice] = useState('');
  const [ambulatoryPatientGroup, setAmbulatoryPatientGroup] = useState('');

  const [ambulanceClaim, setAmbulanceClaim] = useState('No');
  const [transportReason, setTransportReason] = useState('');
  const [transportMiles, setTransportMiles] = useState('0.00');
  const [ambulancePatientWeight, setAmbulancePatientWeight] = useState('0');
  const [roundTripReason, setRoundTripReason] = useState('');
  const [stretcherReason, setStretcherReason] = useState('');
  const [pickupAddress, setPickupAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '', international: false });
  const [dropoffAddress, setDropoffAddress] = useState({ name: '', line1: '', line2: '', city: '', state: '', zip: '' });
  const [certificationFields, setCertificationFields] = useState({});

  const updateIcd = (i, value) => setIcdCodes((prev) => prev.map((c, idx) => (idx === i ? value : c)));
  const addCharge = () => setCharges((c) => [...c, { from: '', to: '', procedure: '', inventory: '', chiro: false, pos: '', tos: '', mod1: '', mod2: '', mod3: '', mod4: '', unitPrice: '0.00', dxPointers: '', units: '1.00', amount: '0.00', status: 'balance due patient', delete: false }]);
  const updateCharge = (i, field, value) => setCharges((c) => c.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  const toggleCertification = (key) => setCertificationFields((p) => ({ ...p, [key]: !p[key] }));
  const certificationCount = Object.values(certificationFields).filter(Boolean).length;
  const ambulanceAddressDisabled = ambulanceClaim === 'No';

  return (
    <div className="space-y-4 w-full py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Claim</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700">
            <Check className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button type="button" variant="destructive" size="sm">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1 icon-action-print" /> Print <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button type="button" variant="outline" size="sm">
            Review <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button type="button" variant="outline" size="sm">
            <MoreVertical className="h-4 w-4 mr-1" /> More <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {loadingClaim ? (
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Loading claim data…
        </div>
      ) : null}
      {loadError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-11">
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
                    <Input value={claimNumber} readOnly className="w-48 bg-muted font-mono text-xs" />
                    <Input placeholder="Reference #" value={claimRef} onChange={(e) => setClaimRef(e.target.value)} className="w-48" />
                    {claimIncomplete && <span className="flex items-center gap-1 text-amber-600 text-sm"><AlertTriangle className="h-4 w-4" /> Claim is incomplete</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <SearchableSelect
                    value={frequency}
                    onValueChange={setFrequency}
                    options={FREQUENCY_OPTIONS}
                    className="w-[200px]"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative pl-2 border-l-2 border-destructive">
                  <EntityLookupField
                    label="Patient *"
                    value={patient}
                    onChange={setPatient}
                    onSelect={handlePatientSelect}
                    loadOptions={loadPatientOptions}
                    icon={User}
                    placeholder="Search patients…"
                  />
                </div>
                <div className="relative pl-2 border-l-2 border-destructive">
                  <EntityLookupField
                    label="Rendering Provider *"
                    value={renderingProvider}
                    onChange={setRenderingProvider}
                    onSelect={handleRenderingSelect}
                    loadOptions={loadProviderOptions}
                    icon={User}
                    placeholder="Search providers…"
                  />
                </div>
                <div className="relative pl-2 border-l-2 border-destructive">
                  <EntityLookupField
                    label="Billing Provider *"
                    value={billingProvider}
                    onChange={setBillingProvider}
                    onSelect={(opt) => setBillingProvider(opt.label)}
                    loadOptions={loadProviderOptions}
                    icon={User}
                    placeholder="Search providers…"
                  />
                </div>
                <div>
                  <EntityLookupField
                    label="Supervising Provider"
                    value={supervisingProvider}
                    onChange={setSupervisingProvider}
                    onSelect={(opt) => setSupervisingProvider(opt.label)}
                    loadOptions={loadProviderOptions}
                    icon={User}
                    placeholder="Search providers…"
                  />
                </div>
                <div>
                  <EntityLookupField
                    label="Ordering Provider"
                    value={orderingProvider}
                    onChange={setOrderingProvider}
                    onSelect={(opt) => setOrderingProvider(opt.label)}
                    loadOptions={loadProviderOptions}
                    icon={Building2}
                    placeholder="Search providers…"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <EntityLookupField
                      label="Referring/PCP Provider"
                      value={referringProvider}
                      onChange={setReferringProvider}
                      onSelect={(opt) => setReferringProvider(opt.label)}
                      loadOptions={loadProviderOptions}
                      icon={Building2}
                      placeholder="Search providers…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Ref</Label>
                    <SearchableSelect
                      value="1"
                      onValueChange={() => {}}
                      options={[{ value: '1', label: '1' }]}
                      className="w-16"
                      placeholder="Ref"
                    />
                  </div>
                </div>
                <div>
                  <EntityLookupField
                    label="Facility"
                    value={facility}
                    onChange={setFacility}
                    icon={Building2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Office Location</Label>
                  <SearchableSelect
                    value={officeLocation || 'none'}
                    onValueChange={(v) => setOfficeLocation(v === 'none' ? '' : v)}
                    options={[
                      { value: 'none', label: 'Select' },
                      { value: 'main', label: 'Main Office' },
                    ]}
                    placeholder="Select"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <EntityLookupField
                  label="Primary Insurance"
                  value={primaryInsurance}
                  onChange={setPrimaryInsurance}
                  onSelect={(opt) => setPrimaryInsurance(opt.label)}
                  loadOptions={loadInsuranceOptions}
                  icon={DollarSign}
                  placeholder="Search insurance plans…"
                />
                <InsuranceDetailsBlock
                  title="Primary – Insurance & Authorization"
                  details={primaryDetails}
                  onUpdate={(field, value) => updateInsuranceDetails(setPrimaryDetails, field, value)}
                  onCopyAuth={() =>
                    updateInsuranceDetails(
                      setPrimaryDetails,
                      'authorizationNumber',
                      patientAuthByTier.primary || primaryDetails.authorizationNumber,
                    )
                  }
                />
              </div>
              <div className="space-y-4 pt-4 border-t">
                <EntityLookupField
                  label="Secondary Insurance"
                  value={secondaryInsurance}
                  onChange={(v) => {
                    setSecondaryInsurance(v);
                    if (v) setHasSecondaryInsurance(true);
                  }}
                  onSelect={(opt) => {
                    setSecondaryInsurance(opt.label);
                    setHasSecondaryInsurance(true);
                  }}
                  loadOptions={loadInsuranceOptions}
                  icon={DollarSign}
                  placeholder="Search insurance plans…"
                />
                {(hasSecondaryInsurance || secondaryInsurance) ? (
                  <InsuranceDetailsBlock
                    title="Secondary – Insurance & Authorization"
                    details={secondaryDetails}
                    onUpdate={(field, value) => updateInsuranceDetails(setSecondaryDetails, field, value)}
                    onCopyAuth={() =>
                      updateInsuranceDetails(
                        setSecondaryDetails,
                        'authorizationNumber',
                        patientAuthByTier.secondary || secondaryDetails.authorizationNumber,
                      )
                    }
                  />
                ) : null}
              </div>
              <div className="space-y-4 pt-4 border-t">
                <EntityLookupField
                  label="Tertiary Insurance"
                  value={tertiaryInsurance}
                  onChange={(v) => {
                    setTertiaryInsurance(v);
                    if (v) setHasTertiaryInsurance(true);
                  }}
                  onSelect={(opt) => {
                    setTertiaryInsurance(opt.label);
                    setHasTertiaryInsurance(true);
                  }}
                  loadOptions={loadInsuranceOptions}
                  icon={DollarSign}
                  placeholder="Search insurance plans…"
                />
                {(hasTertiaryInsurance || tertiaryInsurance) ? (
                  <InsuranceDetailsBlock
                    title="Tertiary – Insurance & Authorization"
                    details={tertiaryDetails}
                    onUpdate={(field, value) => updateInsuranceDetails(setTertiaryDetails, field, value)}
                    onCopyAuth={() =>
                      updateInsuranceDetails(
                        setTertiaryDetails,
                        'authorizationNumber',
                        patientAuthByTier.tertiary || tertiaryDetails.authorizationNumber,
                      )
                    }
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="mt-6 space-y-6">
          <div className="flex gap-6 items-start">
            <Card className="flex-1 min-w-0 w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Diagnosis Code (ICD)</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ICD_LABELS.map((lbl, i) => (
                    <div key={lbl} className="space-y-1">
                      <Label className="text-xs">ICD {lbl}</Label>
                      <EntityLookupField
                        value={icdCodes[i]}
                        onChange={(v) => updateIcd(i, v)}
                        onSelect={(opt) => updateIcd(i, opt.label || opt.raw?.code || '')}
                        loadOptions={loadDiagnosisOptions}
                        placeholder="Search ICD-10…"
                        className={i === 0 ? '[&_input]:border-destructive' : undefined}
                      />
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
                  <Checkbox id="updateDefaults" checked={updatePatientDefaults} onCheckedChange={(c) => setUpdatePatientDefaults(!!c)} />
                  <Label htmlFor="updateDefaults" className="text-sm font-normal">Update patient ICD & Procedure Code defaults</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Set all charges to</Label>
                  <SearchableSelect
                    value={setAllChargesTo}
                    onValueChange={setSetAllChargesTo}
                    options={SET_ALL_CHARGES_OPTIONS}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Charges</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Inventory <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </TableHead>
                    <TableHead>Chiro</TableHead>
                    <TableHead>POS</TableHead>
                    <TableHead>TOS</TableHead>
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
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell><Input type="date" value={row.from} onChange={(e) => updateCharge(i, 'from', e.target.value)} className="h-8 w-28" /></TableCell>
                      <TableCell><Input type="date" value={row.to} onChange={(e) => updateCharge(i, 'to', e.target.value)} className="h-8 w-28" /></TableCell>
                      <TableCell><div className="flex gap-1"><Input value={row.procedure} onChange={(e) => updateCharge(i, 'procedure', e.target.value)} className="h-8 w-24" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Input value={row.inventory} onChange={(e) => updateCharge(i, 'inventory', e.target.value)} className="h-8 w-28" />
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Search inventory">
                            <Search className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Checkbox checked={!!row.chiro} onCheckedChange={(c) => updateCharge(i, 'chiro', !!c)} />
                      </TableCell>
                      <TableCell><div className="flex gap-1"><Input value={row.pos} onChange={(e) => updateCharge(i, 'pos', e.target.value)} className="h-8 w-16" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                      <TableCell><div className="flex gap-1"><Input value={row.tos} onChange={(e) => updateCharge(i, 'tos', e.target.value)} className="h-8 w-16" /><Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button></div></TableCell>
                      <TableCell><Input value={row.mod1} onChange={(e) => updateCharge(i, 'mod1', e.target.value)} className="h-8 w-14" /></TableCell>
                      <TableCell><Input value={row.mod2} onChange={(e) => updateCharge(i, 'mod2', e.target.value)} className="h-8 w-14" /></TableCell>
                      <TableCell><Input value={row.mod3} onChange={(e) => updateCharge(i, 'mod3', e.target.value)} className="h-8 w-14" /></TableCell>
                      <TableCell><Input value={row.mod4} onChange={(e) => updateCharge(i, 'mod4', e.target.value)} className="h-8 w-14" /></TableCell>
                      <TableCell><Input value={row.unitPrice} onChange={(e) => updateCharge(i, 'unitPrice', e.target.value)} className="h-8 w-20" /></TableCell>
                      <TableCell><Input value={row.dxPointers} onChange={(e) => updateCharge(i, 'dxPointers', e.target.value)} className="h-8 w-20" /></TableCell>
                      <TableCell><Input value={row.units} onChange={(e) => updateCharge(i, 'units', e.target.value)} className="h-8 w-16" /></TableCell>
                      <TableCell><Input value={row.amount} onChange={(e) => updateCharge(i, 'amount', e.target.value)} className="h-8 w-20" /></TableCell>
                      <TableCell>
                        <SearchableSelect
                          value={row.status}
                          onValueChange={(v) => updateCharge(i, 'status', v)}
                          options={CHARGE_STATUS_OPTIONS}
                          triggerClassName="h-8 min-w-[160px]"
                        />
                      </TableCell>
                      <TableCell><Button type="button" variant="ghost" size="sm">Other</Button></TableCell>
                      <TableCell><Checkbox checked={row.delete} onCheckedChange={(c) => updateCharge(i, 'delete', !!c)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-2 border-t text-sm text-muted-foreground">{charges.length} Charges</div>
            </CardContent>
          </Card>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addCharge}>Add charge line</Button>
        </TabsContent>

        <TabsContent value="additional" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Show Additional Information about each field</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchableSelect
                value={showBoxNumbers}
                onValueChange={setShowBoxNumbers}
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
                    <Label className="font-normal">Employment {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs ml-1">Box 10a</span>}</Label>
                    <label className="flex items-center gap-1"><input type="radio" name="emp" checked={employmentRelated === 'Yes'} onChange={() => setEmploymentRelated('Yes')} className="rounded-full" /> Yes</label>
                    <label className="flex items-center gap-1"><input type="radio" name="emp" checked={employmentRelated === 'No'} onChange={() => setEmploymentRelated('No')} className="rounded-full" /> No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-normal">Auto Accident {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs ml-1">Box 10b</span>}</Label>
                    <label className="flex items-center gap-1"><input type="radio" name="auto" checked={autoAccident === 'Yes'} onChange={() => setAutoAccident('Yes')} className="rounded-full" /> Yes</label>
                    <label className="flex items-center gap-1"><input type="radio" name="auto" checked={autoAccident === 'No'} onChange={() => setAutoAccident('No')} className="rounded-full" /> No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-normal">Other Accident {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs ml-1">Box 10c</span>}</Label>
                    <label className="flex items-center gap-1"><input type="radio" name="other" checked={otherAccident === 'Yes'} onChange={() => setOtherAccident('Yes')} className="rounded-full" /> Yes</label>
                    <label className="flex items-center gap-1"><input type="radio" name="other" checked={otherAccident === 'No'} onChange={() => setOtherAccident('No')} className="rounded-full" /> No</label>
                  </div>
                </div>
                {autoAccident === 'Yes' && (
                  <div className="mt-3 max-w-xs space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      State {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">(Box 10b)</span>}
                    </Label>
                    <Input value={autoAccidentState} onChange={(e) => setAutoAccidentState(e.target.value)} placeholder="e.g. CA" maxLength={2} className="uppercase" />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Accident/Illness Date', value: accidentDate, set: setAccidentDate, box: 'Box 14/15*' },
                  { label: 'Last Menstrual Period', value: lastMenstrualPeriod, set: setLastMenstrualPeriod, box: 'Box 14' },
                  { label: 'Initial Treatment Date', value: initialTreatmentDate, set: setInitialTreatmentDate, box: 'Box 15' },
                  { label: 'Date Last Seen', value: dateLastSeen, set: setDateLastSeen, box: 'Box 15' },
                  { label: 'Unable to Work From Date', value: unableToWorkFrom, set: setUnableToWorkFrom, box: 'Box 16' },
                  { label: 'Unable to Work To Date', value: unableToWorkTo, set: setUnableToWorkTo, box: 'Box 16' },
                ].map(({ label, value, set, box }) => (
                  <div key={label} className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      {label}
                      {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">{box}</span>}
                    </Label>
                    <Input type="date" value={value} onChange={(e) => set(e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Label className="font-normal">Patient is homebound?</Label>
                <label className="flex items-center gap-1"><input type="radio" name="homebound" checked={patientHomebound === 'Yes'} onChange={() => setPatientHomebound('Yes')} className="rounded-full" /> Yes</label>
                <label className="flex items-center gap-1"><input type="radio" name="homebound" checked={patientHomebound === 'No'} onChange={() => setPatientHomebound('No')} className="rounded-full" /> No</label>
                <label className="flex items-center gap-1"><input type="radio" name="homebound" checked={patientHomebound === 'N/A'} onChange={() => setPatientHomebound('N/A')} className="rounded-full" /> N/A</label>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Claim Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Claim Codes {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 10d</span>}</Label>
                  <Input value={claimCodes} onChange={(e) => setClaimCodes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Other Claim ID {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 11b</span>}</Label>
                  <Input value={otherClaimId} onChange={(e) => setOtherClaimId(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">Additional Claim Information {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 19</span>}</Label>
                <Input value={additionalClaimInfo} onChange={(e) => setAdditionalClaimInfo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">Claim Note {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                <Input value={claimNote} onChange={(e) => setClaimNote(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Resubmit Reason Code {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 22</span>}</Label>
                  <Input value={resubmitReasonCode} onChange={(e) => setResubmitReasonCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Delay Reason Code {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 24C (Shaded)*</span>}</Label>
                  <SearchableSelect
                    value={delayReasonCode}
                    onValueChange={setDelayReasonCode}
                    options={DELAY_REASON_CODE_OPTIONS}
                    placeholder="Select"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Hospitalized From Date {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 18</span>}</Label>
                  <Input type="date" value={hospitalizedFrom} onChange={(e) => setHospitalizedFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Hospitalized To Date {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 18</span>}</Label>
                  <Input type="date" value={hospitalizedTo} onChange={(e) => setHospitalizedTo(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Lab Charges {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 20</span>}</Label>
                  <Input type="number" step="0.01" value={labCharges} onChange={(e) => setLabCharges(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Special Program Code</Label>
                  <SearchableSelect
                    value={specialProgramCode || 'none'}
                    onValueChange={(v) => setSpecialProgramCode(v === 'none' ? '' : v)}
                    options={[{ value: 'none', label: 'none' }, ...SPECIAL_PROGRAM_CODE_OPTIONS]}
                    placeholder="Select"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Assignment of Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Patient's Signature on File {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 12</span>}</Label>
                  <SearchableSelect
                    value={patientSignatureOnFile}
                    onValueChange={setPatientSignatureOnFile}
                    options={PATIENT_SIGNATURE_ON_FILE_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Insured's Signature on File {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 13</span>}</Label>
                  <SearchableSelect
                    value={insuredSignatureOnFile}
                    onValueChange={setInsuredSignatureOnFile}
                    options={INSURED_SIGNATURE_ON_FILE_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Provider Accept Assignment {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 27</span>}</Label>
                  <SearchableSelect
                    value={providerAcceptAssignment}
                    onValueChange={setProviderAcceptAssignment}
                    options={ACCEPT_ASSIGNMENT_OPTIONS}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 bg-primary/10">
              <CardTitle className="text-base">Other Reference Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Documentation Method {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <SearchableSelect
                    value={documentationMethod}
                    onValueChange={setDocumentationMethod}
                    options={DOCUMENTATION_METHOD_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Documentation Type {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <div className="space-y-2">
                    <SearchableSelect
                      value={documentationType || 'none'}
                      onValueChange={(v) => setDocumentationType(v === 'none' ? '' : v)}
                      options={[{ value: 'none', label: 'none' }, ...DOCUMENTATION_TYPE_OPTIONS]}
                      placeholder="Select"
                    />
                    {documentationType === 'Others' && (
                      <Input
                        value={documentationTypeOther}
                        onChange={(e) => setDocumentationTypeOther(e.target.value)}
                        placeholder="Enter other documentation type"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Patient Height (in.) {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <Input type="number" value={patientHeight} onChange={(e) => setPatientHeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Patient Weight (lbs.) {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <Input type="number" value={patientWeight} onChange={(e) => setPatientWeight(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Service Authorization Exception {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <SearchableSelect
                    value={serviceAuthException || 'none'}
                    onValueChange={(v) => setServiceAuthException(v === 'none' ? '' : v)}
                    options={[{ value: 'none', label: 'none' }, ...SERVICE_AUTH_EXCEPTION_OPTIONS]}
                    placeholder="Select"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Demonstration Project {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <Input value={demonstrationProject} onChange={(e) => setDemonstrationProject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Mammography Certification {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">Box 32a</span>}</Label>
                  <Input value={mammographyCert} onChange={(e) => setMammographyCert(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Investigational Device Exemption {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <Input value={investigationalDevice} onChange={(e) => setInvestigationalDevice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">Ambulatory Patient Group {showBoxNumbers === 'cms1500' && <span className="text-muted-foreground font-normal text-xs">N/A</span>}</Label>
                  <Input value={ambulatoryPatientGroup} onChange={(e) => setAmbulatoryPatientGroup(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambulance" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Label className="font-medium">Ambulance claim</Label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amb" checked={ambulanceClaim === 'Yes'} onChange={() => setAmbulanceClaim('Yes')} /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="amb" checked={ambulanceClaim === 'No'} onChange={() => setAmbulanceClaim('No')} /> No</label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Transport Reason</Label>
                  <SearchableSelect
                    value={transportReason || 'none'}
                    onValueChange={(v) => setTransportReason(v === 'none' ? '' : v)}
                    options={TRANSPORT_REASON_OPTIONS}
                    placeholder="Select"
                  />
                </div>
                <div className="space-y-2"><Label className="text-sm">Transport Miles</Label><Input type="number" step="0.01" value={transportMiles} onChange={(e) => setTransportMiles(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm">Patient Weight</Label><Input type="number" value={ambulancePatientWeight} onChange={(e) => setAmbulancePatientWeight(e.target.value)} /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Round Trip Reason</Label><Input value={roundTripReason} onChange={(e) => setRoundTripReason(e.target.value)} /></div>
                <div className="space-y-2 sm:col-span-2"><Label className="text-sm">Stretcher Reason</Label><Input value={stretcherReason} onChange={(e) => setStretcherReason(e.target.value)} /></div>
              </div>
              <div className="rounded-lg border">
                <div className="bg-muted/50 px-4 py-2 font-medium text-sm">Pickup Address</div>
                <div className={cn("p-4 space-y-4", ambulanceAddressDisabled && "opacity-60 pointer-events-none")}>
                  <div className="space-y-2"><Label className="text-sm">Address</Label><Textarea value={pickupAddress.line1} onChange={(e) => setPickupAddress((p) => ({ ...p, line1: e.target.value }))} rows={2} disabled={ambulanceAddressDisabled} /></div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 sm:col-span-2"><Label className="text-sm">City</Label><Input value={pickupAddress.city} onChange={(e) => setPickupAddress((p) => ({ ...p, city: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">State</Label><Input value={pickupAddress.state} onChange={(e) => setPickupAddress((p) => ({ ...p, state: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">ZIP Code</Label><Input value={pickupAddress.zip} onChange={(e) => setPickupAddress((p) => ({ ...p, zip: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="pickupIntl" checked={pickupAddress.international} onCheckedChange={(c) => setPickupAddress((p) => ({ ...p, international: !!c }))} disabled={ambulanceAddressDisabled} />
                    <Label htmlFor="pickupIntl" className="font-normal text-sm">International Address</Label>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border">
                <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                  <span className="font-medium text-sm">Dropoff Address</span>
                  <Button type="button" variant="outline" size="sm" disabled={ambulanceAddressDisabled}>Copy from Facility</Button>
                </div>
                <div className={cn("p-4 space-y-4", ambulanceAddressDisabled && "opacity-60 pointer-events-none")}>
                  <div className="space-y-2"><Label className="text-sm">Name</Label><Input value={dropoffAddress.name} onChange={(e) => setDropoffAddress((p) => ({ ...p, name: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                  <div className="space-y-2"><Label className="text-sm">Address</Label><Textarea value={dropoffAddress.line1} onChange={(e) => setDropoffAddress((p) => ({ ...p, line1: e.target.value }))} rows={2} disabled={ambulanceAddressDisabled} /></div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 sm:col-span-2"><Label className="text-sm">City</Label><Input value={dropoffAddress.city} onChange={(e) => setDropoffAddress((p) => ({ ...p, city: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">State</Label><Input value={dropoffAddress.state} onChange={(e) => setDropoffAddress((p) => ({ ...p, state: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                    <div className="space-y-2"><Label className="text-sm">ZIP Code</Label><Input value={dropoffAddress.zip} onChange={(e) => setDropoffAddress((p) => ({ ...p, zip: e.target.value }))} disabled={ambulanceAddressDisabled} /></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border">
                <div className="bg-muted/50 px-4 py-2 flex items-center justify-between"><span className="font-medium text-sm">Certification Fields</span><span className="text-xs text-muted-foreground">Select up to 5</span></div>
                <div className="p-4 grid gap-2 sm:grid-cols-2">
                  {CERTIFICATION_OPTIONS.map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <Checkbox id={opt} checked={!!certificationFields[opt]} onCheckedChange={() => certificationCount < 5 || certificationFields[opt] ? toggleCertification(opt) : null} disabled={certificationCount >= 5 && !certificationFields[opt]} />
                      <Label htmlFor={opt} className="font-normal text-sm cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
