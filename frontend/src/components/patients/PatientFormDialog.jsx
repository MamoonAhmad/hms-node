import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Edit, Trash2, Plus, Upload, FileText } from 'lucide-react';
import { insuranceProviderApi, providerApi, appointmentStatusApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  APPOINTMENT_TIME_SLOT_OPTIONS,
  buildAppointmentSubmitPayloadFromRegistration,
  formatAppointmentTimeSlot,
  formatDepartmentForReview,
  formatReferredByForReview,
  validateRegistrationAppointmentFields,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import {
  BILLING_TYPE_SELECT_VALUE,
  INSURANCE_BILLING_TYPE_OPTIONS,
  PAYMENT_METHOD_SELECT_VALUE,
  SELF_PAY_PAYMENT_METHOD_OPTIONS,
} from '@/components/patients/patientRegistrationInsuranceConstants';
import {
  getDefaultAppointmentStatusName,
  getAppointmentStatusesFallback,
} from '@/lib/appointmentStatuses';
import {
  buildAppointmentReviewItems,
  buildContactsReviewItems,
  buildDemographicsReviewItems,
  buildInsuranceReviewItems,
  formatAppointmentVisitType,
} from '@/components/patients/patientRegistrationReview';
import { PatientRegistrationAppointmentFields } from '@/components/patients/PatientRegistrationAppointmentFields';
import { PatientRegistrationContactsFields } from '@/components/patients/PatientRegistrationContactsFields';
import { PatientRegistrationDocumentsTab } from '@/components/patients/PatientRegistrationDocumentsTab';
import {
  DOCUMENT_CHECKLIST_ITEMS,
  emptyNewDocument,
  formatDocumentDetailColumn,
  getMissingRequiredDocuments,
  isChecklistItemUploaded,
  serializeDocumentsForSubmit,
  validatePatientDocuments,
} from '@/components/patients/patientDocumentsConstants';
import { PatientPhotoUpload } from '@/components/patients/PatientPhotoUpload';
import {
  formatContactRelationship,
  PHONE_REGEX,
  shouldShowLegalGuardianSection,
} from '@/components/patients/patientContactsConstants';
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  DISABILITY_STATUS_OPTIONS,
  GENDER_IDENTITY_OPTIONS,
  GOVERNMENT_ID_MIN_LENGTH,
  GOVERNMENT_ID_TYPE_OPTIONS,
  PREFERRED_CONTACT_METHOD_OPTIONS,
  PRONOUN_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
  formatDemographicsLabel,
  formatProviderDisplayName,
  maskGovernmentIdNumber,
  resolveContactNumber,
} from '@/components/patients/patientDemographicsConstants';
import { RegistrationChannelField } from '@/components/patients/RegistrationChannelField';
import { PatientQuickRegistrationDemographics } from '@/components/patients/PatientQuickRegistrationDemographics';
import { getPatientQueueDraftById } from '@/components/patients/patientRegistrationQueue';
import { validatePhoneNumber } from '@/lib/phoneNumberUtils';

function RequiredFieldLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive ml-0.5" aria-hidden="true">
        *
      </span>
    </Label>
  );
}

const initialFormData = {
  registrationChannel: 'appointment',
  // Patient Info
  mrn: '',
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',
  preferredName: '',
  previousName: '',
  gender: '',
  genderIdentity: '',
  pronouns: '',
  pronounsOther: '',
  dateOfBirth: '',
  email: '',
  address: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  country: DEFAULT_COUNTRY,
  preferredContactMethod: 'cell',
  homePhone: '',
  workPhone: '',
  cellPhone: '',
  governmentIdType: '',
  governmentIdNumber: '',
  primaryCarePhysician: '',
  birthPlace: '',
  veteranStatus: '',
  disabilityStatus: '',
  tribalAffiliation: '',
  referredBy: '',
  referringPhysicianFirstName: '',
  referringPhysicianLastName: '',
  referringPhysicianNpi: '',
  referringPhysicianPhone: '',
  referringPhysicianFax: '',
  referringPhysicianAddress: '',
  referringPhysicianCity: '',
  referringPhysicianState: '',
  referringPhysicianZip: '',
  generalNotes: '',
  profilePhoto: '',
  profilePhotoFileName: '',
  ethnicity: '',
  language: '',
  race: '',
  sexualOrientation: '',
  interpreterRequired: false,
  interpreterLanguageRequired: '',
  // Contacts tab
  emergencyContactName: '',
  emergencyContactNumber: '',
  emergencyContactRelationship: '',
  emergencyContactEmail: '',
  emergencyContactAddress: '',
  emergencyContactCity: '',
  emergencyContactState: '',
  emergencyContactZip: '',
  secondaryEmergencyContactName: '',
  secondaryEmergencyContactRelationship: '',
  secondaryEmergencyContactNumber: '',
  secondaryEmergencyContactEmail: '',
  guarantorName: '',
  guarantorPhone: '',
  guarantorContactName: '',
  guarantorContactNumber: '',
  guarantorRelationship: '',
  guarantorEmail: '',
  guarantorAddress: '',
  guarantorCity: '',
  guarantorState: '',
  guarantorZip: '',
  guarantorDateOfBirth: '',
  authorizedRepresentativeName: '',
  authorizedRepresentativeRelationship: '',
  authorizedRepresentativePhone: '',
  authorizedRepresentativeEmail: '',
  legalGuardianName: '',
  legalGuardianRelationship: '',
  legalGuardianPhone: '',
  legalGuardianEmail: '',
  patientIsMinor: false,
  primaryNextOfKinName: '',
  primaryNextOfKinRelationship: '',
  primaryNextOfKinPhone: '',
  secondaryNextOfKinName: '',
  secondaryNextOfKinRelationship: '',
  secondaryNextOfKinPhone: '',
  maritalStatus: '',
  employmentStatus: '',
  employerName: '',
  occupation: '',
  employerPhoneNumber: '',
  employerStreetAddress: '',
  employerCity: '',
  employerState: '',
  employerZip: '',
  otherInfo: '',
  // Insurance Info
  insuranceBillingType: '',
  insuranceType: '',
  insuranceCompany: '',
  policyType: '',
  planName: '',
  policyNumber: '',
  groupNumber: '',
  subscriberFirstName: '',
  subscriberLastName: '',
  subscriberName: '',
  subscriberRelationship: '',
  subscriberGender: '',
  subscriberDateOfBirth: '',
  subscriberAddress: '',
  subscriberCity: '',
  subscriberState: '',
  subscriberZip: '',
  subscriberPhone: '',
  subscriberSsnLast4: '',
  subscriberEmployer: '',
  subscriberEmail: '',
  coverageStartDate: '',
  coverageEndDate: '',
  copay: '',
  deductible: '',
  coinsurancePercentage: '',
  authorizationRequired: '',
  authorizationNumber: '',
  // Billing Info
  billingType: '',
  paymentMethod: '',
  billingNotes: '',
  accountBalance: '',

  // Appointment (Outpatient)
  appointmentDate: '',
  appointmentTime: '',
  appointmentStartTime: '',
  appointmentEndTime: '',
  appointmentVisitType: '',
  appointmentDepartment: '',
  appointmentProvider: '',
  appointmentReason: '',
  appointmentNotes: '',
  status: getDefaultAppointmentStatusName(),
};

const INSURANCE_RANK_ORDER = ['primary', 'secondary', 'tertiary'];

const INSURANCE_TYPE_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
};

const INSURANCE_ENTRY_FIELD_KEYS = [
  'insuranceType',
  'insuranceCompany',
  'policyType',
  'planName',
  'policyNumber',
  'groupNumber',
  'subscriberFirstName',
  'subscriberLastName',
  'subscriberRelationship',
  'subscriberName',
  'subscriberGender',
  'subscriberDateOfBirth',
  'subscriberPhone',
  'subscriberEmail',
  'subscriberSsnLast4',
  'subscriberEmployer',
  'subscriberAddress',
  'subscriberCity',
  'subscriberState',
  'subscriberZip',
  'coverageStartDate',
  'coverageEndDate',
  'copay',
  'deductible',
  'coinsurancePercentage',
  'authorizationRequired',
  'authorizationNumber',
];

const consentForms = [
  {
    id: 'consent-general-treatment',
    title: 'Consent for Treatment (Outpatient)',
    category: 'General',
    version: '1.0',
    body: [
      {
        heading: 'Purpose',
        text:
          'I authorize the outpatient clinic to provide evaluation and treatment that is considered necessary for my care, including routine examinations, diagnostic procedures, and standard therapeutic services.',
      },
      {
        heading: 'Risks and Alternatives',
        text:
          'I understand that no guarantees have been made about the results of treatment. I have the right to ask questions and to refuse any part of the treatment plan.',
      },
      {
        heading: 'Coordination of Care',
        text:
          'I authorize clinic staff to coordinate my care, including referrals and follow-up services, when clinically appropriate.',
      },
    ],
  },
  {
    id: 'consent-hipaa-privacy',
    title: 'Notice of Privacy Practices Acknowledgement (HIPAA)',
    category: 'Privacy',
    version: '1.0',
    body: [
      {
        heading: 'Acknowledgement',
        text:
          'I acknowledge that I have been offered access to the clinic’s Notice of Privacy Practices and understand how my health information may be used and disclosed.',
      },
      {
        heading: 'Patient Rights',
        text:
          'I understand I may request restrictions, access my records, request amendments, and obtain an accounting of disclosures as permitted by law.',
      },
    ],
  },
  {
    id: 'consent-financial-responsibility',
    title: 'Financial Responsibility Agreement',
    category: 'Billing',
    version: '1.0',
    body: [
      {
        heading: 'Payment Responsibility',
        text:
          'I agree to be financially responsible for charges not covered by my insurance, including copays, deductibles, coinsurance, and non-covered services.',
      },
      {
        heading: 'Insurance Information',
        text:
          'I certify that the insurance information provided is accurate and authorize the clinic to bill my insurance and receive payment on my behalf.',
      },
      {
        heading: 'Collections and Statements',
        text:
          'I understand statements may be sent to the address on file and that unpaid balances may be subject to collection processes as allowed by law.',
      },
    ],
  },
  {
    id: 'consent-telehealth',
    title: 'Telehealth Consent',
    category: 'Telehealth',
    version: '1.0',
    body: [
      {
        heading: 'Nature of Telehealth',
        text:
          'I consent to receive healthcare services via telehealth, which may include audio, video, or other electronic communications.',
      },
      {
        heading: 'Limitations',
        text:
          'I understand telehealth has limitations and may not be appropriate for all conditions. An in-person visit may be recommended when needed.',
      },
      {
        heading: 'Privacy and Security',
        text:
          'I understand reasonable efforts will be made to protect my privacy; however, there is a small risk of technical failure or unauthorized access.',
      },
    ],
  },
  {
    id: 'consent-release-of-information',
    title: 'Authorization to Release Medical Information',
    category: 'Records',
    version: '1.0',
    body: [
      {
        heading: 'Authorization',
        text:
          'I authorize the clinic to release my medical information as needed for treatment, payment, and healthcare operations, and to designated entities involved in my care.',
      },
      {
        heading: 'Expiration',
        text:
          'This authorization remains effective unless revoked in writing, except to the extent action has already been taken based on this authorization.',
      },
    ],
  },
];

export function PatientFormContent({
  patient,
  onSubmit,
  isLoading,
  onCancel,
  queueDraftId = null,
  isOpen = true,
  registrationMode = 'full',
}) {
  const isQuickRegistration = registrationMode === 'quick';
  const isNewRegistration = !patient;
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [careProviders, setCareProviders] = useState([]);
  const [loadingCareProviders, setLoadingCareProviders] = useState(false);
  const [activeTab, setActiveTab] = useState('patient');
  const [documents, setDocuments] = useState([]);
  const [insuranceList, setInsuranceList] = useState([]);
  const [newDocument, setNewDocument] = useState(emptyNewDocument);
  const [documentFormErrors, setDocumentFormErrors] = useState({});

  const documentWarnings = useMemo(
    () => validatePatientDocuments(documents, { strictMode: false }).warnings,
    [documents],
  );

  const loggedInUserName = useMemo(() => {
    if (!user) return 'User';
    if (typeof user === 'string') return user;
    const direct =
      user.name ||
      user.fullName ||
      user.username ||
      user.displayName ||
      user.email ||
      user.userName;
    if (direct) return String(direct);
    const first = user.firstName || user.givenName;
    const last = user.lastName || user.surname;
    const combined = [first, last].filter(Boolean).join(' ').trim();
    return combined || 'User';
  }, [user]);

  const [statusOptions, setStatusOptions] = useState(() => getAppointmentStatusesFallback());

  const [consentSignatures, setConsentSignatures] = useState({});
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [activeConsentFormId, setActiveConsentFormId] = useState(null);
  const [signatureMode, setSignatureMode] = useState('draw'); // draw | type
  const [typedSignature, setTypedSignature] = useState('');
  const [drawHasInk, setDrawHasInk] = useState(false);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const activeConsentForm = useMemo(
    () => consentForms.find((f) => f.id === activeConsentFormId) || null,
    [activeConsentFormId],
  );

  const formatSignedAt = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? String(isoString) : d.toLocaleString();
  };

  const openConsentDialog = (formId) => {
    setActiveConsentFormId(formId);
    setSignatureMode('draw');
    setTypedSignature('');
    setDrawHasInk(false);
    setConsentDialogOpen(true);
  };

  const closeConsentDialog = () => {
    setConsentDialogOpen(false);
    setActiveConsentFormId(null);
    setSignatureMode('draw');
    setTypedSignature('');
    setDrawHasInk(false);
  };

  useEffect(() => {
    if (!consentDialogOpen) return;
    // When opening a new consent form, ensure the draw pad starts clean.
    clearCanvas();
  }, [consentDialogOpen, activeConsentFormId]);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    return ctx;
  };

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? 0) - rect.left;
    const y = (e.clientY ?? 0) - rect.top;
    return { x, y };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawHasInk(false);
  };

  const handleCanvasPointerDown = (e) => {
    if (signatureMode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const p = getCanvasPoint(e);
    lastPointRef.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const handleCanvasPointerMove = (e) => {
    if (signatureMode !== 'draw') return;
    if (!drawingRef.current) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const p = getCanvasPoint(e);
    const last = lastPointRef.current;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    if (!drawHasInk && (Math.abs(p.x - last.x) > 1 || Math.abs(p.y - last.y) > 1)) {
      setDrawHasInk(true);
    }
  };

  const handleCanvasPointerUp = () => {
    drawingRef.current = false;
  };

  const handleSignConsent = () => {
    if (!activeConsentFormId) return;

    const signedAt = new Date().toISOString();
    if (signatureMode === 'type') {
      const value = typedSignature.trim();
      if (!value) return;
      setConsentSignatures((prev) => ({
        ...prev,
        [activeConsentFormId]: {
          mode: 'type',
          value,
          signedBy: loggedInUserName,
          signedAt,
        },
      }));
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !drawHasInk) return;
    const dataUrl = canvas.toDataURL('image/png');
    setConsentSignatures((prev) => ({
      ...prev,
      [activeConsentFormId]: {
        mode: 'draw',
        value: dataUrl,
        signedBy: loggedInUserName,
        signedAt,
      },
    }));
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value.trim() ? value : 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const formatDateValue = (value) => {
    const v = formatValue(value);
    if (v === 'N/A') return v;
    // value is usually yyyy-mm-dd in this form
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
  };

  const getPayerName = (payerIdOrValue) => {
    const v = formatValue(payerIdOrValue);
    if (v === 'N/A') return v;
    const match = insuranceProviders.find((p) => String(p.id) === String(payerIdOrValue));
    return match ? match.name : String(payerIdOrValue);
  };

  const resolvedPronouns = () => {
    if (formData.pronouns === 'other') return formData.pronounsOther?.trim() || '';
    return formData.pronouns?.trim() || '';
  };

  const ReviewGrid = ({ items }) => (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-start justify-between gap-3">
          <span className="text-sm text-muted-foreground shrink-0">{label}</span>
          <span className="text-sm font-medium text-right break-words">{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );

  const statusSelectOptions = useMemo(() => {
    const options = [...statusOptions];
    const current = formData.status;
    if (current && !options.some((s) => s.name === current)) {
      options.unshift({ id: 'legacy-status', name: current, color: '#6b7280' });
    }
    return options;
  }, [statusOptions, formData.status]);

  const reviewHelpers = useMemo(
    () => ({
      formatValue,
      formatDateValue,
      formatDemographicsLabel,
      maskGovernmentIdNumber,
      formatContactRelationship,
      getPayerName,
      formatDepartmentForReview,
      formatReferredByForReview,
      formatAppointmentVisitType,
      formatAppointmentTimeSlot,
      resolvedPronouns,
    }),
    [insuranceProviders, formData.pronouns, formData.pronounsOther],
  );

  const demographicsReviewItems = useMemo(
    () => buildDemographicsReviewItems(formData, reviewHelpers),
    [formData, reviewHelpers],
  );
  const contactsReviewItems = useMemo(
    () => buildContactsReviewItems(formData, reviewHelpers),
    [formData, reviewHelpers],
  );
  const appointmentReviewItems = useMemo(
    () => buildAppointmentReviewItems(formData, reviewHelpers),
    [formData, reviewHelpers],
  );
  const insuranceReviewItems = useMemo(
    () => buildInsuranceReviewItems(formData, reviewHelpers),
    [formData, reviewHelpers],
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    appointmentStatusApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) && res.data.length ? res.data : getAppointmentStatusesFallback();
        setStatusOptions(rows);
      })
      .catch(() => {
        if (!cancelled) setStatusOptions(getAppointmentStatusesFallback());
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Fetch insurance providers on mount / when open
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await insuranceProviderApi.getActive();
        setInsuranceProviders(response.data || []);
      } catch (err) {
        console.error('Failed to fetch insurance providers:', err);
      } finally {
        setLoadingProviders(false);
      }
    };

    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchCareProviders = async () => {
      setLoadingCareProviders(true);
      try {
        const response = await providerApi.getAll({ limit: 100, isActive: true });
        setCareProviders(response.data || []);
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      } finally {
        setLoadingCareProviders(false);
      }
    };

    if (isOpen) {
      fetchCareProviders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (patient) {
      const storedPronouns = patient.pronouns || '';
      const isPresetPronoun = PRONOUN_OPTIONS.some(
        (o) => o.value !== 'other' && o.value === storedPronouns,
      );
      setFormData({
        mrn: patient.mrn || '',
        lastName: patient.lastName || '',
        firstName: patient.firstName || '',
        middleName: patient.middleName || '',
        suffix: patient.suffix || '',
        preferredName: patient.preferredName || '',
        previousName: patient.previousName || '',
        gender: patient.gender || '',
        genderIdentity: patient.genderIdentity || '',
        pronouns: isPresetPronoun ? storedPronouns : storedPronouns ? 'other' : '',
        pronounsOther: isPresetPronoun ? '' : storedPronouns,
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        email: patient.email || '',
        address: patient.address || '',
        addressLine2: patient.addressLine2 || '',
        city: patient.city || '',
        state: patient.state || '',
        zip: patient.zip || '',
        country: patient.country || DEFAULT_COUNTRY,
        preferredContactMethod: patient.preferredContactMethod || 'cell',
        homePhone: patient.homePhone || '',
        workPhone: patient.workPhone || '',
        cellPhone: patient.cellPhone || patient.contactNumber || '',
        governmentIdType: patient.governmentIdType || '',
        governmentIdNumber: patient.governmentIdNumber || '',
        primaryCarePhysician: patient.primaryCarePhysician || '',
        birthPlace: patient.birthPlace || '',
        veteranStatus: patient.veteranStatus || '',
        disabilityStatus: patient.disabilityStatus || '',
        tribalAffiliation: patient.tribalAffiliation || '',
        referredBy: patient.referredBy || '',
        referringPhysicianFirstName: patient.referringPhysicianFirstName || '',
        referringPhysicianLastName: patient.referringPhysicianLastName || '',
        referringPhysicianNpi: patient.referringPhysicianNpi || '',
        referringPhysicianPhone: patient.referringPhysicianPhone || '',
        referringPhysicianFax: patient.referringPhysicianFax || '',
        referringPhysicianAddress: patient.referringPhysicianAddress || '',
        referringPhysicianCity: patient.referringPhysicianCity || '',
        referringPhysicianState: patient.referringPhysicianState || '',
        referringPhysicianZip: patient.referringPhysicianZip || '',
        generalNotes: patient.generalNotes || '',
        profilePhoto: patient.profilePhoto || '',
        profilePhotoFileName: patient.profilePhotoFileName || '',
        ethnicity: patient.ethnicity || '',
        language: patient.language || '',
        race: patient.race || '',
        sexualOrientation: patient.sexualOrientation || '',
        interpreterRequired: patient.interpreterRequired || false,
        interpreterLanguageRequired: patient.interpreterLanguageRequired || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactNumber: patient.emergencyContactNumber || patient.emergencyContactPhone || '',
        emergencyContactRelationship: patient.emergencyContactRelationship || '',
        emergencyContactEmail: patient.emergencyContactEmail || '',
        emergencyContactAddress: patient.emergencyContactAddress || '',
        emergencyContactCity: patient.emergencyContactCity || '',
        emergencyContactState: patient.emergencyContactState || '',
        emergencyContactZip: patient.emergencyContactZip || '',
        secondaryEmergencyContactName: patient.secondaryEmergencyContactName || '',
        secondaryEmergencyContactRelationship: patient.secondaryEmergencyContactRelationship || '',
        secondaryEmergencyContactNumber: patient.secondaryEmergencyContactNumber || '',
        secondaryEmergencyContactEmail: patient.secondaryEmergencyContactEmail || '',
        guarantorName: patient.guarantorName || patient.guarantorContactName || '',
        guarantorPhone: patient.guarantorPhone || patient.guarantorContactNumber || '',
        guarantorContactName: patient.guarantorContactName || patient.guarantorName || '',
        guarantorContactNumber: patient.guarantorContactNumber || patient.guarantorPhone || '',
        guarantorRelationship: patient.guarantorRelationship || '',
        guarantorEmail: patient.guarantorEmail || '',
        guarantorAddress: patient.guarantorAddress || '',
        guarantorCity: patient.guarantorCity || '',
        guarantorState: patient.guarantorState || '',
        guarantorZip: patient.guarantorZip || '',
        guarantorDateOfBirth: patient.guarantorDateOfBirth
          ? patient.guarantorDateOfBirth.split('T')[0]
          : '',
        authorizedRepresentativeName: patient.authorizedRepresentativeName || '',
        authorizedRepresentativeRelationship: patient.authorizedRepresentativeRelationship || '',
        authorizedRepresentativePhone: patient.authorizedRepresentativePhone || '',
        authorizedRepresentativeEmail: patient.authorizedRepresentativeEmail || '',
        legalGuardianName: patient.legalGuardianName || '',
        legalGuardianRelationship: patient.legalGuardianRelationship || '',
        legalGuardianPhone: patient.legalGuardianPhone || '',
        legalGuardianEmail: patient.legalGuardianEmail || '',
        patientIsMinor: patient.patientIsMinor || false,
        primaryNextOfKinName: patient.primaryNextOfKinName || '',
        primaryNextOfKinRelationship: patient.primaryNextOfKinRelationship || '',
        primaryNextOfKinPhone: patient.primaryNextOfKinPhone || '',
        secondaryNextOfKinName: patient.secondaryNextOfKinName || '',
        secondaryNextOfKinRelationship: patient.secondaryNextOfKinRelationship || '',
        secondaryNextOfKinPhone: patient.secondaryNextOfKinPhone || '',
        maritalStatus: patient.maritalStatus || '',
        employmentStatus: patient.employmentStatus || '',
        employerName: patient.employerName || '',
        occupation: patient.occupation || '',
        employerPhoneNumber: patient.employerPhoneNumber || '',
        employerStreetAddress: patient.employerStreetAddress || patient.employerAddress || '',
        employerCity: patient.employerCity || '',
        employerState: patient.employerState || '',
        employerZip: patient.employerZip || '',
        otherInfo: patient.otherInfo || '',
        insuranceBillingType: patient.insuranceBillingType || patient.billingType || '',
        insuranceType: patient.insuranceType || '',
        insuranceCompany: patient.insuranceProviderId || patient.insuranceCompany || '',
        policyType: patient.policyType || '',
        planName: patient.planName || '',
        policyNumber: patient.policyNumber || '',
        groupNumber: patient.groupNumber || '',
        subscriberFirstName: patient.subscriberFirstName || '',
        subscriberLastName: patient.subscriberLastName || '',
        subscriberName: patient.subscriberName || '',
        subscriberRelationship: patient.subscriberRelationship || '',
        subscriberGender: patient.subscriberGender || '',
        subscriberDateOfBirth: patient.subscriberDateOfBirth ? patient.subscriberDateOfBirth.split('T')[0] : '',
        subscriberAddress: patient.subscriberAddress || '',
        subscriberCity: patient.subscriberCity || '',
        subscriberState: patient.subscriberState || '',
        subscriberZip: patient.subscriberZip || '',
        subscriberPhone: patient.subscriberPhone || '',
        subscriberSsnLast4: patient.subscriberSsnLast4 || patient.subscriberSsn?.slice(-4) || '',
        subscriberEmployer: patient.subscriberEmployer || '',
        subscriberEmail: patient.subscriberEmail || '',
        coverageStartDate: patient.coverageStartDate ? patient.coverageStartDate.split('T')[0] : '',
        coverageEndDate: patient.coverageEndDate ? patient.coverageEndDate.split('T')[0] : '',
        copay: patient.copay || '',
        deductible: patient.deductible || '',
        coinsurancePercentage: patient.coinsurancePercentage || '',
        authorizationRequired: patient.authorizationRequired || '',
        authorizationNumber: patient.authorizationNumber || '',
        billingType: patient.billingType || '',
        paymentMethod: patient.paymentMethod || '',
        billingNotes: patient.billingNotes || '',
        accountBalance: patient.accountBalance || '',

        appointmentDate: patient.appointmentDate ? patient.appointmentDate.split('T')[0] : '',
        appointmentTime: patient.appointmentTime || '',
        appointmentStartTime: patient.appointmentStartTime || '',
        appointmentEndTime: patient.appointmentEndTime || '',
        appointmentVisitType: patient.appointmentVisitType || '',
        appointmentDepartment: patient.appointmentDepartment || patient.department || '',
        appointmentProvider: patient.appointmentProvider || '',
        appointmentReason: patient.appointmentReason || '',
        appointmentNotes: patient.appointmentNotes || '',
        status: patient.status || patient.appointmentStatus || getDefaultAppointmentStatusName(),
      });
      setDocuments(Array.isArray(patient.documents) ? patient.documents : []);
    } else if (queueDraftId) {
      const draft = getPatientQueueDraftById(queueDraftId);
      if (draft?.formData) {
        setFormData({
          ...initialFormData,
          ...draft.formData,
          registrationChannel: draft.registrationChannel || draft.formData.registrationChannel || 'appointment',
        });
        setDocuments(Array.isArray(draft.documents) ? draft.documents : []);
        setInsuranceList(Array.isArray(draft.insuranceList) ? draft.insuranceList : []);
      } else {
        setFormData(initialFormData);
        setDocuments([]);
        setInsuranceList([]);
      }
    } else {
      setFormData(
        isQuickRegistration
          ? { ...initialFormData, registrationChannel: 'appointment', preferredContactMethod: 'cell' }
          : initialFormData,
      );
      setDocuments([]);
      setInsuranceList([]);
    }
    setNewDocument(emptyNewDocument());
    setDocumentFormErrors({});
    setErrors({});
    setActiveTab('patient');
  }, [patient, isOpen, queueDraftId, isQuickRegistration]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const usedInsuranceTypeKeys = useMemo(
    () => new Set(insuranceList.map((item) => item.insuranceTypeKey)),
    [insuranceList],
  );

  const allInsuranceTypesAdded = INSURANCE_RANK_ORDER.every((key) => usedInsuranceTypeKeys.has(key));

  const nextAvailableInsuranceType = useMemo(
    () => INSURANCE_RANK_ORDER.find((key) => !usedInsuranceTypeKeys.has(key)) || '',
    [usedInsuranceTypeKeys],
  );

  const validateQuickRegistration = ({ bookAppointment = false } = {}) => {
    const newErrors = {};
    const appointmentErrorKeys = new Set([
      'appointmentDate',
      'appointmentTime',
      'appointmentVisitType',
      'appointmentStartTime',
      'appointmentEndTime',
    ]);

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.cellPhone?.trim()) {
      newErrors.cellPhone = 'Phone number is required';
    } else {
      const phoneCheck = validatePhoneNumber(formData.cellPhone);
      if (!phoneCheck.valid) {
        newErrors.cellPhone = phoneCheck.message || 'Invalid phone number format';
      }
    }
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.zip?.trim()) newErrors.zip = 'Zip is required';

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (bookAppointment) {
      validateRegistrationAppointmentFields(formData, newErrors);
      if (formData.referringPhysicianPhone && !PHONE_REGEX.test(formData.referringPhysicianPhone)) {
        newErrors.referringPhysicianPhone = 'Invalid phone number format';
      }
      if (formData.referringPhysicianFax && !PHONE_REGEX.test(formData.referringPhysicianFax)) {
        newErrors.referringPhysicianFax = 'Invalid fax number format';
      }
    }

    setErrors(newErrors);

    let errorTab = 'patient';
    if (bookAppointment && Object.keys(newErrors).some((key) => appointmentErrorKeys.has(key))) {
      errorTab = 'appointment';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errorTab,
      documentWarnings: [],
      missingRequiredDocuments: [],
    };
  };

  const validate = ({ scope = 'all' } = {}) => {
    if (isQuickRegistration) {
      return validateQuickRegistration();
    }

    const newErrors = {};
    const includePatient = scope === 'all' || scope === 'patient';
    const includeContacts = scope === 'all' || scope === 'contacts';
    const includeDocuments = scope === 'all';

    if (!includePatient && !includeContacts && !includeDocuments) {
      return { isValid: true, errorTab: 'patient', documentWarnings: [], missingRequiredDocuments: [] };
    }

    if (includePatient) {
    // Required fields only
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.zip?.trim()) newErrors.zip = 'Zip is required';
    if (!formData.preferredContactMethod) {
      newErrors.preferredContactMethod = 'Preferred contact method is required';
    }

    const method = formData.preferredContactMethod;
    if (method === 'cell' && !formData.cellPhone?.trim()) {
      newErrors.cellPhone = 'Cell phone is required when cell is the preferred contact method';
    }
    if (method === 'home' && !formData.homePhone?.trim()) {
      newErrors.homePhone = 'Home phone is required when home is the preferred contact method';
    }
    if (method === 'work' && !formData.workPhone?.trim()) {
      newErrors.workPhone = 'Work phone is required when work is the preferred contact method';
    }
    if (method === 'email' && !formData.email?.trim()) {
      newErrors.email = 'Email is required when email is the preferred contact method';
    }

    const govId = formData.governmentIdNumber?.trim();
    if (govId) {
      const idType = formData.governmentIdType || 'other';
      const minLen = GOVERNMENT_ID_MIN_LENGTH[idType] ?? GOVERNMENT_ID_MIN_LENGTH.other;
      if (govId.length < minLen) {
        newErrors.governmentIdNumber = `ID number must be at least ${minLen} characters for the selected type`;
      }
    }

    // Validate DOB is not in future
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    }

    if (includeContacts) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactEmails = [
      ['emergencyContactEmail', formData.emergencyContactEmail],
      ['secondaryEmergencyContactEmail', formData.secondaryEmergencyContactEmail],
      ['guarantorEmail', formData.guarantorEmail],
      ['authorizedRepresentativeEmail', formData.authorizedRepresentativeEmail],
      ['legalGuardianEmail', formData.legalGuardianEmail],
    ];
    contactEmails.forEach(([field, value]) => {
      if (value && !emailRegex.test(value)) {
        newErrors[field] = 'Invalid email format';
      }
    });

    // Validate phone formats (basic)
    if (formData.homePhone && !PHONE_REGEX.test(formData.homePhone)) {
      newErrors.homePhone = 'Invalid phone number format';
    }
    if (formData.workPhone && !PHONE_REGEX.test(formData.workPhone)) {
      newErrors.workPhone = 'Invalid phone number format';
    }
    if (formData.cellPhone && !PHONE_REGEX.test(formData.cellPhone)) {
      newErrors.cellPhone = 'Invalid phone number format';
    }
    const contactPhones = [
      ['emergencyContactNumber', formData.emergencyContactNumber],
      ['secondaryEmergencyContactNumber', formData.secondaryEmergencyContactNumber],
      ['guarantorPhone', formData.guarantorPhone],
      ['authorizedRepresentativePhone', formData.authorizedRepresentativePhone],
      ['legalGuardianPhone', formData.legalGuardianPhone],
      ['primaryNextOfKinPhone', formData.primaryNextOfKinPhone],
      ['secondaryNextOfKinPhone', formData.secondaryNextOfKinPhone],
    ];
    contactPhones.forEach(([field, value]) => {
      if (value && !PHONE_REGEX.test(value)) {
        newErrors[field] = 'Invalid phone number format';
      }
    });
    if (formData.employerPhoneNumber && !PHONE_REGEX.test(formData.employerPhoneNumber)) {
      newErrors.employerPhoneNumber = 'Invalid phone number format';
    }
    if (formData.referringPhysicianPhone && !PHONE_REGEX.test(formData.referringPhysicianPhone)) {
      newErrors.referringPhysicianPhone = 'Invalid phone number format';
    }
    if (formData.referringPhysicianFax && !PHONE_REGEX.test(formData.referringPhysicianFax)) {
      newErrors.referringPhysicianFax = 'Invalid fax number format';
    }
    }

    if (scope === 'all') {
    if (formData.subscriberPhone && !PHONE_REGEX.test(formData.subscriberPhone)) {
      newErrors.subscriberPhone = 'Invalid subscriber phone number format';
    }
    if (formData.subscriberEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.subscriberEmail)) {
      newErrors.subscriberEmail = 'Invalid subscriber email format';
    }
    if (formData.subscriberSsnLast4 && !/^\d{4}$/.test(formData.subscriberSsnLast4.replace(/\D/g, ''))) {
      newErrors.subscriberSsnLast4 = 'Enter exactly 4 digits for SSN last 4';
    }
    }

    let docValidation = { errors: {}, warnings: [], missingRequired: [] };
    if (includeDocuments) {
      docValidation = validatePatientDocuments(documents, { strictMode: false });
      Object.assign(newErrors, docValidation.errors);
    }

    setErrors(newErrors);

    const documentErrorKeys = new Set(['documentsPhotoId', 'documentsInsuranceFront']);
    const contactErrorKeys = new Set([
      'emergencyContactNumber',
      'emergencyContactRelationship',
      'emergencyContactEmail',
      'secondaryEmergencyContactNumber',
      'secondaryEmergencyContactEmail',
      'guarantorPhone',
      'guarantorEmail',
      'authorizedRepresentativePhone',
      'authorizedRepresentativeEmail',
      'legalGuardianName',
      'legalGuardianRelationship',
      'legalGuardianPhone',
      'legalGuardianEmail',
      'primaryNextOfKinPhone',
      'secondaryNextOfKinPhone',
    ]);
    const patientErrorKeys = new Set([
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'address',
      'city',
      'state',
      'zip',
      'preferredContactMethod',
      'cellPhone',
      'homePhone',
      'workPhone',
      'email',
      'governmentIdNumber',
    ]);
    let errorTab = 'patient';
    if (Object.keys(newErrors).some((key) => documentErrorKeys.has(key))) {
      errorTab = 'documents';
    } else if (Object.keys(newErrors).some((key) => contactErrorKeys.has(key))) {
      errorTab = 'contacts';
    } else if (Object.keys(newErrors).some((key) => patientErrorKeys.has(key))) {
      errorTab = 'patient';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errorTab,
      documentWarnings: docValidation.warnings,
      missingRequiredDocuments: docValidation.missingRequired,
    };
  };

  const clearInsuranceEntryFields = (nextType) => {
    setFormData((prev) => {
      const next = { ...prev };
      INSURANCE_ENTRY_FIELD_KEYS.forEach((key) => {
        next[key] = initialFormData[key] ?? '';
      });
      if (nextType) next.insuranceType = nextType;
      return next;
    });
  };

  const handleAddAnotherInsurance = () => {
    if (formData.insuranceBillingType !== 'insurance' || allInsuranceTypesAdded) return;

    const typeKey = formData.insuranceType || nextAvailableInsuranceType || 'primary';
    if (usedInsuranceTypeKeys.has(typeKey)) return;

    const coverageDate = formData.coverageStartDate || formData.coverageEndDate || '';
    const entry = {
      id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      insuranceTypeKey: typeKey,
      insuranceType: INSURANCE_TYPE_LABELS[typeKey] || typeKey,
      payerName: getPayerName(formData.insuranceCompany) || '—',
      policyNumber: formData.policyNumber || '',
      coverageDate: coverageDate || new Date().toISOString().slice(0, 10),
      effectiveDate: formData.coverageStartDate || coverageDate || new Date().toISOString().slice(0, 10),
    };

    const updatedList = [...insuranceList, entry];
    setInsuranceList(updatedList);

    const updatedUsed = new Set(updatedList.map((item) => item.insuranceTypeKey));
    const nextType = INSURANCE_RANK_ORDER.find((key) => !updatedUsed.has(key));
    clearInsuranceEntryFields(nextType || '');
  };

  const handleRemoveInsurance = (id) => {
    setInsuranceList((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (formData.insuranceBillingType !== 'insurance' || formData.insuranceType) return;
    const next = INSURANCE_RANK_ORDER.find((key) => !usedInsuranceTypeKeys.has(key));
    if (next) {
      setFormData((prev) => ({ ...prev, insuranceType: next }));
    }
  }, [formData.insuranceBillingType, formData.insuranceType, usedInsuranceTypeKeys]);

  const buildSubmitPayload = () => {
    const submitData = { ...formData };
    submitData.pronouns = resolvedPronouns();
    delete submitData.pronounsOther;
    if (isQuickRegistration) {
      submitData.preferredContactMethod = 'cell';
      submitData.registrationChannel = submitData.registrationChannel || 'appointment';
    }
    submitData.contactNumber = resolveContactNumber(submitData);
    if (!submitData.country) submitData.country = DEFAULT_COUNTRY;
    if (submitData.subscriberSsnLast4) {
      submitData.subscriberSsnLast4 = String(submitData.subscriberSsnLast4).replace(/\D/g, '').slice(0, 4);
    }

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === '') {
        submitData[key] = null;
      }
    });

    if (submitData.copay) submitData.copay = parseFloat(submitData.copay);
    if (submitData.deductible) submitData.deductible = parseFloat(submitData.deductible);
    if (submitData.coinsurancePercentage) {
      submitData.coinsurancePercentage = parseFloat(submitData.coinsurancePercentage);
    }
    if (submitData.accountBalance) submitData.accountBalance = parseFloat(submitData.accountBalance);

    if (submitData.insuranceCompany) {
      submitData.insuranceProviderId = submitData.insuranceCompany;
    }
    if (submitData.insuranceBillingType) {
      submitData.billingType = submitData.insuranceBillingType;
    }
    if (submitData.insuranceBillingType !== 'self-pay') {
      submitData.paymentMethod = null;
    }

    delete submitData.profilePhotoFileName;
    delete submitData.mrn;
    submitData.documents = serializeDocumentsForSubmit(documents);

    return submitData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isQuickRegistration && activeTab === 'appointment') {
      handleBookAppointment();
      return;
    }
    const validation = validate();
    if (!validation.isValid) {
      setActiveTab(validation.errorTab);
      return;
    }
    onSubmit(buildSubmitPayload());
  };

  const handleBookAppointment = () => {
    const validation = validateQuickRegistration({ bookAppointment: true });
    if (!validation.isValid) {
      setActiveTab(validation.errorTab);
      return;
    }
    onSubmit({
      ...buildSubmitPayload(),
      bookAppointment: true,
    });
  };

  const tabOrder = isQuickRegistration
    ? ['patient', 'insurance', 'appointment']
    : ['patient', 'contacts', 'appointment', 'insurance', 'documents', 'consentForms', 'review'];
  const currentTabIndex = tabOrder.indexOf(activeTab);
  const canGoPrev = currentTabIndex > 0;
  const canGoNext = currentTabIndex >= 0 && currentTabIndex < tabOrder.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    setActiveTab(tabOrder[currentTabIndex - 1]);
  };

  const goNext = () => {
    if (!canGoNext) return;
    setActiveTab(tabOrder[currentTabIndex + 1]);
  };

  const formActionButtons =
    isQuickRegistration && activeTab === 'appointment' ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0">
        <Button
          type="button"
          disabled={isLoading}
          onClick={handleBookAppointment}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={goNext}
          disabled={!canGoNext || isLoading}
          className="w-full sm:w-auto"
        >
          Save and Next
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Saving...' : 'Save and Close'}
        </Button>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="ehr-form space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {isQuickRegistration ? (
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="patient">Demographics</TabsTrigger>
                <TabsTrigger value="insurance">Insurance Info</TabsTrigger>
                <TabsTrigger value="appointment">Appointment</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="patient">Demographics</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="appointment">Appointment</TabsTrigger>
                <TabsTrigger value="insurance">Insurance Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="consentForms">Consent Forms</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
            )}

            {!isQuickRegistration && (
              <div className="flex justify-end pt-3">{formActionButtons}</div>
            )}

            {/* TAB 1: Patient Info */}
            <TabsContent value="patient" className="space-y-6 mt-4">
              {isQuickRegistration ? (
                <PatientQuickRegistrationDemographics
                  formData={formData}
                  errors={errors}
                  isLoading={isLoading}
                  onChange={handleChange}
                />
              ) : (
                <>
              {isNewRegistration && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <RegistrationChannelField
                    value={formData.registrationChannel || 'appointment'}
                    onChange={(value) => handleChange('registrationChannel', value)}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Basic Patient Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Basic Patient Information</h3>

                <PatientPhotoUpload
                  value={formData.profilePhoto}
                  fileName={formData.profilePhotoFileName}
                  error={errors.profilePhoto}
                  disabled={isLoading}
                  onChange={({ photo, fileName, error: photoError }) => {
                    handleChange('profilePhoto', photo);
                    handleChange('profilePhotoFileName', fileName);
                    setErrors((prev) => ({ ...prev, profilePhoto: photoError || null }));
                  }}
                  onClear={() => {
                    handleChange('profilePhoto', '');
                    handleChange('profilePhotoFileName', '');
                    setErrors((prev) => ({ ...prev, profilePhoto: null }));
                  }}
                />

                {/* Row 1: First Name, Middle Name, Last Name, Suffix */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="firstName">First Name</RequiredFieldLabel>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => handleChange('middleName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="lastName">Last Name</RequiredFieldLabel>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input
                      id="suffix"
                      value={formData.suffix}
                      onChange={(e) => handleChange('suffix', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredName">Preferred name</Label>
                    <Input
                      id="preferredName"
                      value={formData.preferredName}
                      onChange={(e) => handleChange('preferredName', e.target.value)}
                      placeholder="Display / greeting name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousName">Previous / maiden name</Label>
                    <Input
                      id="previousName"
                      value={formData.previousName}
                      onChange={(e) => handleChange('previousName', e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 2: Gender, DOB, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="gender">Gender</RequiredFieldLabel>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleChange('gender', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.gender ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-xs text-destructive">{errors.gender}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="dateOfBirth">Date of Birth</RequiredFieldLabel>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className={errors.dateOfBirth ? 'border-destructive' : ''}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genderIdentity">Gender identity</Label>
                    <Select
                      value={formData.genderIdentity}
                      onValueChange={(value) => handleChange('genderIdentity', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender identity" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_IDENTITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pronouns">Pronouns</Label>
                    <Select
                      value={formData.pronouns}
                      onValueChange={(value) => handleChange('pronouns', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select pronouns" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRONOUN_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.pronouns === 'other' && (
                      <Input
                        id="pronounsOther"
                        value={formData.pronounsOther}
                        onChange={(e) => handleChange('pronounsOther', e.target.value)}
                        placeholder="Enter pronouns"
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Row 3: Address (100% width) */}
                <div className="space-y-2">
                  <RequiredFieldLabel htmlFor="address">Address</RequiredFieldLabel>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address line 2</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    placeholder="Apt, suite, unit"
                  />
                </div>

                {/* Row 4: City, State, Zip (required) */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="city">City</RequiredFieldLabel>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="state">State</RequiredFieldLabel>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="zip">Zip</RequiredFieldLabel>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => handleChange('zip', e.target.value)}
                      className={errors.zip ? 'border-destructive' : ''}
                    />
                    {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country || DEFAULT_COUNTRY}
                    onValueChange={(value) => handleChange('country', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 5: Home Phone, Work Phone, Cell Phone */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homePhone">Home Phone</Label>
                    <Input
                      id="homePhone"
                      value={formData.homePhone}
                      onChange={(e) => handleChange('homePhone', e.target.value)}
                      className={errors.homePhone ? 'border-destructive' : ''}
                    />
                    {errors.homePhone && (
                      <p className="text-xs text-destructive">{errors.homePhone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workPhone">Work Phone</Label>
                    <Input
                      id="workPhone"
                      value={formData.workPhone}
                      onChange={(e) => handleChange('workPhone', e.target.value)}
                      className={errors.workPhone ? 'border-destructive' : ''}
                    />
                    {errors.workPhone && (
                      <p className="text-xs text-destructive">{errors.workPhone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cellPhone">Cell Phone</Label>
                    <Input
                      id="cellPhone"
                      value={formData.cellPhone}
                      onChange={(e) => handleChange('cellPhone', e.target.value)}
                      className={errors.cellPhone ? 'border-destructive' : ''}
                    />
                    {errors.cellPhone && (
                      <p className="text-xs text-destructive">{errors.cellPhone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <RequiredFieldLabel htmlFor="preferredContactMethod">
                    Preferred contact method
                  </RequiredFieldLabel>
                  <Select
                    value={formData.preferredContactMethod}
                    onValueChange={(value) => handleChange('preferredContactMethod', value)}
                  >
                    <SelectTrigger
                      className={`w-full ${errors.preferredContactMethod ? 'border-destructive' : ''}`}
                    >
                      <SelectValue placeholder="Select preferred contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFERRED_CONTACT_METHOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.preferredContactMethod && (
                    <p className="text-xs text-destructive">{errors.preferredContactMethod}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Identification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="governmentIdType">Government ID type</Label>
                    <Select
                      value={formData.governmentIdType}
                      onValueChange={(value) => handleChange('governmentIdType', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOVERNMENT_ID_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="governmentIdNumber">Government ID number</Label>
                    <Input
                      id="governmentIdNumber"
                      type="password"
                      autoComplete="off"
                      value={formData.governmentIdNumber}
                      onChange={(e) => handleChange('governmentIdNumber', e.target.value)}
                      placeholder="Enter ID number"
                      className={errors.governmentIdNumber ? 'border-destructive' : ''}
                    />
                    {errors.governmentIdNumber && (
                      <p className="text-xs text-destructive">{errors.governmentIdNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Care & reporting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryCarePhysician">Primary care physician</Label>
                    <Select
                      value={formData.primaryCarePhysician}
                      onValueChange={(value) => handleChange('primaryCarePhysician', value)}
                      disabled={loadingCareProviders}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingCareProviders ? 'Loading providers…' : 'Select or search provider'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {careProviders.map((provider) => (
                          <SelectItem key={provider.id} value={formatProviderDisplayName(provider)}>
                            {formatProviderDisplayName(provider)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">Place of birth</Label>
                    <Input
                      id="birthPlace"
                      value={formData.birthPlace}
                      onChange={(e) => handleChange('birthPlace', e.target.value)}
                      placeholder="City, state/country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="veteranStatus">Veteran status</Label>
                    <Select
                      value={formData.veteranStatus}
                      onValueChange={(value) => handleChange('veteranStatus', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select veteran status" />
                      </SelectTrigger>
                      <SelectContent>
                        {YES_NO_UNKNOWN_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disabilityStatus">Disability status</Label>
                    <Select
                      value={formData.disabilityStatus}
                      onValueChange={(value) => handleChange('disabilityStatus', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select disability status" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISABILITY_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="tribalAffiliation">Tribal affiliation</Label>
                    <Input
                      id="tribalAffiliation"
                      value={formData.tribalAffiliation}
                      onChange={(e) => handleChange('tribalAffiliation', e.target.value)}
                      placeholder="Optional reporting"
                    />
                  </div>
                </div>
              </div>

              {/* General notes — demographics */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">General notes</h3>
                <div className="space-y-2">
                  <Label htmlFor="generalNotes">General Notes</Label>
                  <Textarea
                    id="generalNotes"
                    value={formData.generalNotes}
                    onChange={(e) => handleChange('generalNotes', e.target.value)}
                    rows={3}
                    placeholder="Clinical or administrative notes for this registration"
                  />
                </div>
              </div>

              {/* Meaningful Use Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Meaningful Use</h3>
                {/* Row 1: Ethnicity, Sexual Orientation, Race */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ethnicity">Ethnicity</Label>
                    <Select
                      value={formData.ethnicity}
                      onValueChange={(value) => handleChange('ethnicity', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                        <SelectItem value="not-hispanic">Not Hispanic or Latino</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexualOrientation">Sexual Orientation</Label>
                    <Select
                      value={formData.sexualOrientation}
                      onValueChange={(value) => handleChange('sexualOrientation', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select sexual orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight">Straight</SelectItem>
                        <SelectItem value="gay">Gay</SelectItem>
                        <SelectItem value="lesbian">Lesbian</SelectItem>
                        <SelectItem value="bisexual">Bisexual</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="race">Race</Label>
                    <Select
                      value={formData.race}
                      onValueChange={(value) => handleChange('race', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select race" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="american-indian">American Indian or Alaska Native</SelectItem>
                        <SelectItem value="asian">Asian</SelectItem>
                        <SelectItem value="black">Black or African American</SelectItem>
                        <SelectItem value="native-hawaiian">Native Hawaiian or Other Pacific Islander</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Row 2: Language, Interpreter Required */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleChange('language', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interpreterRequired">Interpreter Required</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="interpreterRequired"
                        checked={formData.interpreterRequired}
                        onCheckedChange={(checked) => handleChange('interpreterRequired', checked)}
                      />
                      <Label htmlFor="interpreterRequired" className="text-sm font-normal cursor-pointer">
                        Interpreter Required
                      </Label>
                    </div>
                  </div>
                </div>
                {/* Conditional: Interpreter Language Fields */}
                {formData.interpreterRequired && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interpreterLanguageRequired">Interpreter Language Required</Label>
                      <Select
                        value={formData.interpreterLanguageRequired}
                        onValueChange={(value) => handleChange('interpreterLanguageRequired', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Information Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Other</h3>
                {/* Row 1: Marital Status, Employment Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) => handleChange('maritalStatus', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select
                      value={formData.employmentStatus}
                      onValueChange={(value) => handleChange('employmentStatus', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="self-employed">Self-Employed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Employment Details - Show when Employed or Retired */}
                {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'retired') && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Employment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employerName">Employer Name</Label>
                        <Input
                          id="employerName"
                          value={formData.employerName}
                          onChange={(e) => handleChange('employerName', e.target.value)}
                          placeholder="Enter employer name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => handleChange('occupation', e.target.value)}
                          placeholder="Enter occupation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employerPhoneNumber">Employer Phone Number</Label>
                        <Input
                          id="employerPhoneNumber"
                          value={formData.employerPhoneNumber}
                          onChange={(e) => handleChange('employerPhoneNumber', e.target.value)}
                          placeholder="(123) 123-1234"
                          className={errors.employerPhoneNumber ? 'border-destructive' : ''}
                        />
                        {errors.employerPhoneNumber && (
                          <p className="text-xs text-destructive">{errors.employerPhoneNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="employerStreetAddress">Address</Label>
                        <Input
                          id="employerStreetAddress"
                          value={formData.employerStreetAddress}
                          onChange={(e) => handleChange('employerStreetAddress', e.target.value)}
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employerCity">City</Label>
                        <Input
                          id="employerCity"
                          value={formData.employerCity}
                          onChange={(e) => handleChange('employerCity', e.target.value)}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employerState">State</Label>
                        <Input
                          id="employerState"
                          value={formData.employerState}
                          onChange={(e) => handleChange('employerState', e.target.value)}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employerZip">Zip</Label>
                        <Input
                          id="employerZip"
                          value={formData.employerZip}
                          onChange={(e) => handleChange('employerZip', e.target.value)}
                          placeholder="Enter zip"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otherInfo">Other Info</Label>
                  <Textarea
                    id="otherInfo"
                    value={formData.otherInfo}
                    onChange={(e) => handleChange('otherInfo', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
                </>
              )}
            </TabsContent>

            {/* TAB 2: Contacts */}
            {!isQuickRegistration && (
            <TabsContent value="contacts" className="space-y-6 mt-4">
              <PatientRegistrationContactsFields
                formData={formData}
                errors={errors}
                onChange={handleChange}
                dateOfBirth={formData.dateOfBirth}
              />

              {/* Guarantor Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Guarantor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorContactName">Guarantor Contact Name</Label>
                    <Input
                      id="guarantorContactName"
                      value={formData.guarantorContactName}
                      onChange={(e) => handleChange('guarantorContactName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guarantorContactNumber">Guarantor Contact Number</Label>
                    <Input
                      id="guarantorContactNumber"
                      value={formData.guarantorContactNumber}
                      onChange={(e) => handleChange('guarantorContactNumber', e.target.value)}
                      placeholder="(123) 123-1234"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Next of Kin */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Primary Next of Kin</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryNextOfKinName">Name of Primary Next of Kin</Label>
                    <Input
                      id="primaryNextOfKinName"
                      value={formData.primaryNextOfKinName}
                      onChange={(e) => handleChange('primaryNextOfKinName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryNextOfKinRelationship">Relationship to Patient</Label>
                    <Select
                      value={formData.primaryNextOfKinRelationship}
                      onValueChange={(value) => handleChange('primaryNextOfKinRelationship', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryNextOfKinPhone">Phone Number</Label>
                    <Input
                      id="primaryNextOfKinPhone"
                      value={formData.primaryNextOfKinPhone}
                      onChange={(e) => handleChange('primaryNextOfKinPhone', e.target.value)}
                      placeholder="(123) 123-1234"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            )}

            {/* TAB 3: Appointment (Outpatient) */}
            <TabsContent value="appointment" className="space-y-6 mt-4">
              <PatientRegistrationAppointmentFields
                idPrefix="patient-reg"
                formData={formData}
                errors={errors}
                onChange={handleChange}
                timeSlotOptions={APPOINTMENT_TIME_SLOT_OPTIONS}
                showAppointmentStatus
                statusOptions={statusSelectOptions}
                hideReferralSection
                showReferringPhysicianSection
              />
            </TabsContent>

            {/* TAB 4: Insurance Info */}
            <TabsContent value="insurance" className="space-y-6 mt-4">
              {/* Billing Type */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceBillingType">Billing Type</Label>
                  <Select
                    value={formData.insuranceBillingType || BILLING_TYPE_SELECT_VALUE}
                    onValueChange={(value) => {
                      const billingType =
                        value === BILLING_TYPE_SELECT_VALUE ? '' : value;
                      setFormData((prev) => ({
                        ...prev,
                        insuranceBillingType: billingType,
                        billingType,
                        ...(billingType !== 'self-pay' ? { paymentMethod: '' } : {}),
                      }));
                      if (errors.insuranceBillingType) {
                        setErrors((prev) => ({ ...prev, insuranceBillingType: null }));
                      }
                      if (billingType !== 'self-pay' && errors.paymentMethod) {
                        setErrors((prev) => ({ ...prev, paymentMethod: null }));
                      }
                    }}
                  >
                    <SelectTrigger id="insuranceBillingType" className="w-full max-w-xs">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSURANCE_BILLING_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.insuranceBillingType === 'self-pay' && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Mode of Payment</Label>
                    <Select
                      value={formData.paymentMethod || PAYMENT_METHOD_SELECT_VALUE}
                      onValueChange={(value) =>
                        handleChange(
                          'paymentMethod',
                          value === PAYMENT_METHOD_SELECT_VALUE ? '' : value,
                        )
                      }
                    >
                      <SelectTrigger id="paymentMethod" className="w-full max-w-xs">
                        <SelectValue placeholder="Select mode of payment" />
                      </SelectTrigger>
                      <SelectContent>
                        {SELF_PAY_PAYMENT_METHOD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Primary Insurance - Only show if Insurance is selected */}
              {formData.insuranceBillingType === 'insurance' && (
                <>
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-foreground">Primary Insurance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceType">Insurance Type</Label>
                    <Select
                      value={formData.insuranceType}
                      onValueChange={(value) => handleChange('insuranceType', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="tertiary">Tertiary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceCompany">Payer Name</Label>
                    <Select
                      value={formData.insuranceCompany || ''}
                      onValueChange={(value) => handleChange('insuranceCompany', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingProviders ? 'Loading...' : 'Select payer name'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Insurance</SelectItem>
                        {insuranceProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name} {provider.code && `(${provider.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyType">Policy Type</Label>
                    <Select
                      value={formData.policyType}
                      onValueChange={(value) => handleChange('policyType', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select policy type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">Medicare</SelectItem>
                        <SelectItem value="13">Medicare Secondary</SelectItem>
                        <SelectItem value="14">Medicaid</SelectItem>
                        <SelectItem value="15">Tricare</SelectItem>
                        <SelectItem value="16">ChampVA</SelectItem>
                        <SelectItem value="BL">Blue Cross / Blue Shield</SelectItem>
                        <SelectItem value="CI">Commercial Insurance</SelectItem>
                        <SelectItem value="HM">HMO</SelectItem>
                        <SelectItem value="MC">Managed Care</SelectItem>
                        <SelectItem value="WC">Workers&apos; Compensation</SelectItem>
                        <SelectItem value="VA">Veterans Affairs</SelectItem>
                        <SelectItem value="OF">Other Federal Program</SelectItem>
                        <SelectItem value="LI">Liability Insurance</SelectItem>
                        <SelectItem value="AU">Auto Insurance</SelectItem>
                        <SelectItem value="OT">Other</SelectItem>
                        <SelectItem value="SP">Self Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      value={formData.planName}
                      onChange={(e) => handleChange('planName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number</Label>
                    <Input
                      id="policyNumber"
                      value={formData.policyNumber}
                      onChange={(e) => handleChange('policyNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupNumber">Group Number</Label>
                    <Input
                      id="groupNumber"
                      value={formData.groupNumber}
                      onChange={(e) => handleChange('groupNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Subscriber Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Subscriber Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriberFirstName">Subscriber First Name</Label>
                    <Input
                      id="subscriberFirstName"
                      value={formData.subscriberFirstName}
                      onChange={(e) => handleChange('subscriberFirstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberLastName">Subscriber Last Name</Label>
                    <Input
                      id="subscriberLastName"
                      value={formData.subscriberLastName}
                      onChange={(e) => handleChange('subscriberLastName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberRelationship">Relationship to Patient</Label>
                    <Select
                      value={formData.subscriberRelationship}
                      onValueChange={(value) => handleChange('subscriberRelationship', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberName">Subscriber Name</Label>
                    <Input
                      id="subscriberName"
                      value={formData.subscriberName}
                      onChange={(e) => handleChange('subscriberName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberGender">Subscriber Gender</Label>
                    <Select
                      value={formData.subscriberGender}
                      onValueChange={(value) => handleChange('subscriberGender', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberDateOfBirth">Subscriber Date of Birth</Label>
                    <Input
                      id="subscriberDateOfBirth"
                      type="date"
                      value={formData.subscriberDateOfBirth}
                      onChange={(e) => handleChange('subscriberDateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriberPhone">Subscriber phone</Label>
                    <Input
                      id="subscriberPhone"
                      value={formData.subscriberPhone}
                      onChange={(e) => handleChange('subscriberPhone', e.target.value)}
                      placeholder="(123) 123-1234"
                      className={errors.subscriberPhone ? 'border-destructive' : ''}
                    />
                    {errors.subscriberPhone && (
                      <p className="text-xs text-destructive">{errors.subscriberPhone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberEmail">Subscriber email</Label>
                    <Input
                      id="subscriberEmail"
                      type="email"
                      value={formData.subscriberEmail}
                      onChange={(e) => handleChange('subscriberEmail', e.target.value)}
                      className={errors.subscriberEmail ? 'border-destructive' : ''}
                    />
                    {errors.subscriberEmail && (
                      <p className="text-xs text-destructive">{errors.subscriberEmail}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberSsnLast4">Subscriber SSN (last 4)</Label>
                    <Input
                      id="subscriberSsnLast4"
                      value={formData.subscriberSsnLast4}
                      onChange={(e) =>
                        handleChange('subscriberSsnLast4', e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="Last 4 digits"
                      inputMode="numeric"
                      maxLength={4}
                      className={errors.subscriberSsnLast4 ? 'border-destructive' : ''}
                    />
                    {errors.subscriberSsnLast4 && (
                      <p className="text-xs text-destructive">{errors.subscriberSsnLast4}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="subscriberEmployer">Subscriber employer</Label>
                  <Input
                    id="subscriberEmployer"
                    value={formData.subscriberEmployer}
                    onChange={(e) => handleChange('subscriberEmployer', e.target.value)}
                    placeholder="Employer for group / sponsored plans"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriberAddress">Subscriber street address</Label>
                  <Input
                    id="subscriberAddress"
                    value={formData.subscriberAddress}
                    onChange={(e) => handleChange('subscriberAddress', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriberCity">Subscriber city</Label>
                    <Input
                      id="subscriberCity"
                      value={formData.subscriberCity}
                      onChange={(e) => handleChange('subscriberCity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberState">Subscriber state</Label>
                    <Input
                      id="subscriberState"
                      value={formData.subscriberState}
                      onChange={(e) => handleChange('subscriberState', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriberZip">Subscriber ZIP</Label>
                    <Input
                      id="subscriberZip"
                      value={formData.subscriberZip}
                      onChange={(e) => handleChange('subscriberZip', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Coverage Details */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Coverage Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coverageStartDate">Coverage Start Date</Label>
                    <Input
                      id="coverageStartDate"
                      type="date"
                      value={formData.coverageStartDate}
                      onChange={(e) => handleChange('coverageStartDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverageEndDate">Coverage End Date</Label>
                    <Input
                      id="coverageEndDate"
                      type="date"
                      value={formData.coverageEndDate}
                      onChange={(e) => handleChange('coverageEndDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copay">Copay Amount ($)</Label>
                    <Input
                      id="copay"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.copay}
                      onChange={(e) => handleChange('copay', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deductible">Deductible ($)</Label>
                    <Input
                      id="deductible"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deductible}
                      onChange={(e) => handleChange('deductible', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coinsurancePercentage">Coinsurance Percentage (%)</Label>
                    <Input
                      id="coinsurancePercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.coinsurancePercentage}
                      onChange={(e) => handleChange('coinsurancePercentage', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorizationRequired">Authorization Required</Label>
                    <Select
                      value={formData.authorizationRequired}
                      onValueChange={(value) => handleChange('authorizationRequired', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Yes / No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorizationNumber">Authorization Number</Label>
                    <Input
                      id="authorizationNumber"
                      value={formData.authorizationNumber}
                      onChange={(e) => handleChange('authorizationNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {allInsuranceTypesAdded
                    ? 'Primary, secondary, and tertiary insurance have been added.'
                    : 'Save the current insurance entry, then add another payer if needed.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAnotherInsurance}
                  disabled={allInsuranceTypesAdded}
                  className="w-full sm:w-auto shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add another Insurance
                </Button>
              </div>

                    {/* Insurance Listing Table */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Insurance Listing</h3>
                      </div>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Insurance Type</TableHead>
                              <TableHead>Payer Name</TableHead>
                              <TableHead>Coverage Date</TableHead>
                              <TableHead>Effective Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {insuranceList.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                  No insurance records found
                                </TableCell>
                              </TableRow>
                            ) : (
                              insuranceList.map((insurance) => (
                                <TableRow key={insurance.id}>
                                  <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                                      {insurance.insuranceType}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-medium">{insurance.payerName}</TableCell>
                                  <TableCell>
                                    {new Date(insurance.coverageDate).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(insurance.effectiveDate).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveInsurance(insurance.id)}
                                        title="Remove insurance"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                </>
              )}

            </TabsContent>

            {!isQuickRegistration && (
            <>
            {/* TAB 5: Documents */}
            <TabsContent value="documents" className="space-y-6 mt-4">
              {(errors.documentsPhotoId || errors.documentsInsuranceFront) && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive space-y-1">
                  {errors.documentsPhotoId && <p>{errors.documentsPhotoId}</p>}
                  {errors.documentsInsuranceFront && <p>{errors.documentsInsuranceFront}</p>}
                </div>
              )}
              <PatientRegistrationDocumentsTab
                documents={documents}
                setDocuments={setDocuments}
                newDocument={newDocument}
                setNewDocument={setNewDocument}
                documentFormErrors={documentFormErrors}
                setDocumentFormErrors={setDocumentFormErrors}
                documentWarnings={documentWarnings}
              />
            </TabsContent>

            {/* TAB 6: Consent Forms */}
            <TabsContent value="consentForms" className="space-y-6 mt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Consent Forms</h3>
                <p className="text-sm text-muted-foreground">
                  Review and sign required outpatient clinic consent forms.
                </p>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signed By</TableHead>
                      <TableHead>Signed At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consentForms.map((form) => {
                      const sig = consentSignatures[form.id];
                      const isSigned = !!sig?.signedAt;
                      return (
                        <TableRow key={form.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-medium">{form.title}</div>
                              <div className="text-xs text-muted-foreground">Version {form.version}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                              {form.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isSigned ? (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                                Signed
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-foreground">
                                Not signed
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{sig?.signedBy || '—'}</TableCell>
                          <TableCell className="text-sm">{sig?.signedAt ? formatSignedAt(sig.signedAt) : '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" onClick={() => openConsentDialog(form.id)}>
                              Read and Sign
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Dialog
                open={consentDialogOpen}
                onOpenChange={(open) => {
                  if (!open) closeConsentDialog();
                }}
              >
                <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{activeConsentForm?.title || 'Consent Form'}</DialogTitle>
                  </DialogHeader>

                  {activeConsentForm ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            Category: <span className="text-foreground font-medium">{activeConsentForm.category}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Version: <span className="text-foreground font-medium">{activeConsentForm.version}</span>
                          </div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                          {activeConsentForm.body.map((section) => (
                            <div key={section.heading} className="space-y-1">
                              <div className="text-sm font-semibold text-foreground">{section.heading}</div>
                              <div className="text-sm text-muted-foreground">{section.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground">Signature</div>
                            <div className="text-sm text-muted-foreground">
                              Choose a signature method below, then sign.
                            </div>
                          </div>
                          <Button type="button" variant="outline" onClick={signatureMode === 'draw' ? clearCanvas : () => setTypedSignature('')}>
                            Clear
                          </Button>
                        </div>

                        <Tabs value={signatureMode} onValueChange={setSignatureMode} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="draw">Draw signature</TabsTrigger>
                            <TabsTrigger value="type">Type signature</TabsTrigger>
                          </TabsList>

                          <TabsContent value="draw" className="mt-4 space-y-3">
                            <div className="rounded-lg border p-3 bg-background">
                              <canvas
                                ref={canvasRef}
                                width={900}
                                height={240}
                                className="w-full h-[180px] bg-white rounded-md border touch-none"
                                onPointerDown={handleCanvasPointerDown}
                                onPointerMove={handleCanvasPointerMove}
                                onPointerUp={handleCanvasPointerUp}
                                onPointerCancel={handleCanvasPointerUp}
                              />
                              <div className="text-xs text-muted-foreground mt-2">
                                Use your mouse or touch to sign above.
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="type" className="mt-4 space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="typedSignature">Type your signature</Label>
                              <Input
                                id="typedSignature"
                                value={typedSignature}
                                onChange={(e) => setTypedSignature(e.target.value)}
                                placeholder="Enter full name"
                              />
                              <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="text-xs text-muted-foreground mb-1">Preview</div>
                                <div className="text-2xl" style={{ fontFamily: 'cursive' }}>
                                  {typedSignature || ' '}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {activeConsentFormId && consentSignatures[activeConsentFormId]?.signedAt ? (
                          <div className="rounded-lg border bg-primary/5 p-3 text-sm">
                            Document was signed by{' '}
                            <span className="font-semibold">{consentSignatures[activeConsentFormId].signedBy}</span> on{' '}
                            <span className="font-semibold">{formatSignedAt(consentSignatures[activeConsentFormId].signedAt)}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            When signing is complete, a signed confirmation line will appear here.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={closeConsentDialog}>
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSignConsent}
                      disabled={
                        !activeConsentFormId ||
                        (signatureMode === 'type' ? !typedSignature.trim() : !drawHasInk)
                      }
                    >
                      Sign
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* TAB 7: Review */}
            <TabsContent value="review" className="space-y-6 mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Demographics</h3>
                {formData.profilePhoto ? (
                  <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
                    <img
                      src={formData.profilePhoto}
                      alt="Patient"
                      className="h-24 w-24 shrink-0 rounded-lg border object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Patient photo</p>
                      <p className="text-xs text-muted-foreground">
                        {formData.profilePhotoFileName || 'Uploaded image'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-3">
                    No patient photo uploaded
                  </p>
                )}
                <ReviewGrid items={demographicsReviewItems} />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
                <ReviewGrid items={contactsReviewItems} />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Appointment & referral</h3>
                <ReviewGrid items={appointmentReviewItems} />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Insurance Info</h3>
                <p className="text-sm text-muted-foreground">Current insurance entry (form)</p>
                <ReviewGrid items={insuranceReviewItems} />
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-foreground">Saved insurance policies</p>
                  {insuranceList.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-3">
                      No additional policies added via &quot;Add another Insurance&quot;
                    </p>
                  ) : (
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Insurance type</TableHead>
                            <TableHead>Payer name</TableHead>
                            <TableHead>Policy number</TableHead>
                            <TableHead>Coverage date</TableHead>
                            <TableHead>Effective date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {insuranceList.map((ins) => (
                            <TableRow key={ins.id}>
                              <TableCell>{formatValue(ins.insuranceType)}</TableCell>
                              <TableCell>{formatValue(ins.payerName)}</TableCell>
                              <TableCell>{formatValue(ins.policyNumber)}</TableCell>
                              <TableCell>
                                {ins.coverageDate ? formatDateValue(ins.coverageDate) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {ins.effectiveDate ? formatDateValue(ins.effectiveDate) : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Consent forms</h3>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Form</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signed by</TableHead>
                        <TableHead>Signed at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consentForms.map((form) => {
                        const sig = consentSignatures[form.id];
                        const isSigned = !!sig?.signedAt;
                        return (
                          <TableRow key={form.id}>
                            <TableCell className="font-medium">{form.title}</TableCell>
                            <TableCell>{form.category}</TableCell>
                            <TableCell>{form.version}</TableCell>
                            <TableCell>{isSigned ? 'Signed' : 'Not signed'}</TableCell>
                            <TableCell>{formatValue(sig?.signedBy)}</TableCell>
                            <TableCell>
                              {sig?.signedAt ? formatSignedAt(sig.signedAt) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Documents</h3>
                {getMissingRequiredDocuments(documents).length > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Missing required documents</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5">
                      {getMissingRequiredDocuments(documents).map((item) => (
                        <li key={item.key}>{item.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-lg border divide-y">
                  {DOCUMENT_CHECKLIST_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                    >
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">
                        {isChecklistItemUploaded(item, documents) ? 'Uploaded' : 'Not uploaded'}
                      </span>
                    </div>
                  ))}
                </div>
                {documentWarnings.length > 0 && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                    <p className="text-sm font-medium mb-2">Warnings</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      {documentWarnings.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-3">
                    No additional documents uploaded
                  </p>
                ) : (
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>ID type / Card side</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead>File</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{formatValue(doc.documentName)}</TableCell>
                            <TableCell>{formatValue(doc.documentCategory)}</TableCell>
                            <TableCell>{formatDocumentDetailColumn(doc)}</TableCell>
                            <TableCell>
                              {doc.documentCategory === 'Identity Proof' && doc.documentExpirationDate
                                ? formatDateValue(doc.documentExpirationDate)
                                : 'N/A'}
                            </TableCell>
                            <TableCell>{formatValue(doc.fileName)}</TableCell>
                            <TableCell>{formatValue(doc.documentNotes)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
            </>
            )}
          </Tabs>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>

            {formActionButtons}
          </div>
        </form>
  );
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSubmit,
  isLoading,
  registrationMode = 'full',
}) {
  const isQuickRegistration = registrationMode === 'quick';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isQuickRegistration
            ? 'max-h-[90vh] w-[min(calc(100vw-2rem),720px)] overflow-y-auto max-sm:min-w-0 sm:min-w-[560px] sm:max-w-[720px]'
            : 'max-h-[90vh] w-[min(calc(100vw-2rem),1100px)] overflow-y-auto max-sm:min-w-0 sm:min-w-[900px] sm:max-w-none sm:w-[clamp(900px,min(92vw,1100px),1100px)]'
        }
      >
        <DialogHeader>
          <DialogTitle>
            {patient
              ? 'Edit Patient'
              : isQuickRegistration
                ? 'Quick Patient Registration'
                : 'Add New Patient'}
          </DialogTitle>
        </DialogHeader>
        <PatientFormContent
          patient={patient}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
          isOpen={open}
          registrationMode={registrationMode}
        />
      </DialogContent>
    </Dialog>
  );
}
