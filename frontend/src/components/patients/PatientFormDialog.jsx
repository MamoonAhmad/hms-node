import { useState, useEffect, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Edit, Upload, FileText } from 'lucide-react';
import { insuranceProviderApi, providerApi, appointmentStatusApi, patientApi, departmentApi } from '@/services/api';
import { useAppointmentAvailability } from '@/hooks/useAppointmentAvailability';
import { useAuth } from '@/contexts/AuthContext';
import {
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
  INSURANCE_TYPE_LABELS,
  applyInsuranceEntryToFormData,
  buildInsuranceListFromForms,
  createEmptyInsuranceForms,
  hydrateInsuranceForms,
  entryHasData,
  INSURANCE_RANK_ORDER,
} from '@/components/patients/patientRegistrationInsuranceConstants';
import { PatientInsuranceAccordions } from '@/components/patients/PatientInsuranceAccordions';
import {
  getDefaultAppointmentStatusName,
  getAppointmentStatusesFallback,
  getCanonicalAppointmentStatuses,
} from '@/lib/appointmentStatuses';
import {
  buildAppointmentReviewItems,
  buildContactsReviewItems,
  buildDemographicsReviewItems,
  buildInsuranceReviewItems,
  formatAppointmentVisitType,
} from '@/components/patients/patientRegistrationReview';
import { EpicScheduleAppointmentFields } from '@/components/appointments/EpicScheduleAppointmentFields';
import { PatientRegistrationAppointmentFields } from '@/components/patients/PatientRegistrationAppointmentFields';
import {
  isAppointmentEditable,
  mapAppointmentToRegistrationForm,
} from '@/lib/appointmentFormUtils';
import { PatientRegistrationContactsFields } from '@/components/patients/PatientRegistrationContactsFields';
import { PatientRegistrationDocumentsTab } from '@/components/patients/PatientRegistrationDocumentsTab';
import {
  emptyNewDocument,
  formatDocumentDetailColumn,
  serializeDocumentsForSubmit,
  upsertInsuranceCardDocument,
  validatePatientDocuments,
} from '@/components/patients/patientDocumentsConstants';
import { PatientPhotoUpload } from '@/components/patients/PatientPhotoUpload';
import {
  buildEmergencyContactsList,
  buildGuarantorsList,
  formatContactRelationship,
  PHONE_REGEX,
  shouldShowLegalGuardianSection,
  isPatientMinor,
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
import {
  getPatientQueueDraftById,
  hasDraftableRegistrationData,
  savePatientQueueDraft,
} from '@/components/patients/patientRegistrationQueue';
import { validatePhoneNumber } from '@/lib/phoneNumberUtils';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { MultiSelect } from '@/components/ui/multi-select';
import { PatientRegistrationHeader } from '@/components/patients/PatientRegistrationHeader';
import { DuplicatePatientAlert } from '@/components/patients/DuplicatePatientAlert';
import { InsuranceCardUploadModal } from '@/components/patients/InsuranceCardUploadModal';
import { PatientAddressFields } from '@/components/patients/PatientAddressFields';
import {
  validateContactEmailField,
  validateContactPhoneField,
} from '@/components/patients/PatientRegistrationContactsFields';
import { formatConsentType } from '@/pages/administration/consent-forms/consentFormsConstants';
import {
  fetchActiveConsentForms,
  mapPatientConsentSignaturesToState,
} from '@/components/patients/patientRegistrationConsentUtils';
import {
  calculateAgeFromDob,
  DEFAULT_VISIT_MODALITY,
  DISABILITY_OPTIONS,
  EMAIL_VALIDATION_MESSAGE,
  GUARANTOR_SIGNATURE_MIN_AGE,
  INTERPRETER_LANGUAGE_OPTIONS,
  isRegistrationOnlyChannel,
  isValidEmail,
  MILITARY_BRANCH_OPTIONS,
  parseJsonArray,
  serializeJsonArray,
} from '@/components/patients/patientRegistrationConstants';
import { formatClientValidationIssues } from '@/components/patients/patientRegistrationValidationDisplay';

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

const TAB_SCOPE_ERROR_KEYS = {
  patient: [
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
    'ethnicity',
    'race',
    'militaryBranch',
    'disabilities',
    'interpreterLanguages',
    'employerPhoneNumber',
  ],
  contacts: [
    'emergencyContactNumber',
    'emergencyContactRelationship',
    'emergencyContactEmail',
    'secondaryEmergencyContactNumber',
    'secondaryEmergencyContactEmail',
    'guarantorPhone',
    'guarantorEmail',
    'guarantorName',
    'guarantorRelationship',
    'authorizedRepresentativePhone',
    'authorizedRepresentativeEmail',
    'legalGuardianName',
    'legalGuardianRelationship',
    'legalGuardianPhone',
    'legalGuardianEmail',
    'primaryNextOfKinPhone',
    'secondaryNextOfKinPhone',
  ],
  appointment: [
    'appointmentDate',
    'appointmentTime',
    'appointmentVisitType',
    'appointmentStartTime',
    'appointmentEndTime',
    'visitModality',
    'appointmentProvider',
    'appointmentDepartment',
    'referringPhysicianPhone',
    'referringPhysicianFax',
  ],
  insurance: [
    'insuranceBillingType',
    'paymentMethod',
    'subscriberPhone',
    'subscriberEmail',
    'subscriberSsnLast4',
  ],
  documents: ['documentsPhotoId', 'documentsInsuranceFront'],
  consentForms: ['consentForms'],
};

const CONTACT_ERROR_KEY_PREFIXES = [
  'emergencyContact',
  'secondaryEmergencyContact',
  'guarantor',
  'authorizedRepresentative',
  'legalGuardian',
  'primaryNextOfKin',
  'secondaryNextOfKin',
];

function isContactsScopeErrorKey(key) {
  return CONTACT_ERROR_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
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
  ssn: '',
  dateOfBirth: '',
  email: '',
  noEmail: false,
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
  militaryBranch: '',
  disabilityStatus: '',
  disabilities: [],
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
  interpreterLanguages: [],
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
  additionalEmergencyContacts: [],
  additionalGuarantors: [],
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
  appointmentTypeId: '',
  appointmentTypeName: '',
  visitModality: DEFAULT_VISIT_MODALITY,
  accessibilityRequirements: [],
  accessibilityRequirementsNotes: '',
  appointmentDepartment: '',
  appointmentDepartmentId: '',
  appointmentProvider: '',
  appointmentProviderId: '',
  appointmentReason: '',
  appointmentNotes: '',
  status: getDefaultAppointmentStatusName(),
};

function ConsentFormName({ form }) {
  if (!form) return null;
  if (!form.isMandatory) {
    return <span>{form.consentTitle}</span>;
  }
  return (
    <span className="text-destructive">
      <span aria-hidden="true">* </span>
      {form.consentTitle}
    </span>
  );
}

export const PatientFormContent = forwardRef(function PatientFormContent({
  patient,
  linkedAppointment = null,
  onSubmit,
  isLoading,
  onCancel,
  queueDraftId = null,
  isOpen = true,
  registrationMode = 'full',
  onNavigateToExisting,
  onCancelRegistration,
  onValidationFailed,
  submitError = null,
}, ref) {
  const isQuickRegistration = registrationMode === 'quick';
  const isEditingExistingPatient = Boolean(patient?.id);
  const [appointmentEditMode, setAppointmentEditMode] = useState(false);
  const isNewRegistration = !patient;
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [careProviders, setCareProviders] = useState([]);
  const [loadingCareProviders, setLoadingCareProviders] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('patient');
  const [documents, setDocuments] = useState([]);
  const [insuranceForms, setInsuranceForms] = useState(() => createEmptyInsuranceForms());
  const [newDocument, setNewDocument] = useState(emptyNewDocument);
  const [documentFormErrors, setDocumentFormErrors] = useState({});

  useImperativeHandle(ref, () => ({
    goToTab: (tab) => {
      if (tab) setActiveTab(tab);
    },
  }), []);

  const reportValidationFailed = useCallback(
    (errorMap, errorTab) => {
      const issues = formatClientValidationIssues(errorMap);
      if (errorTab && issues.length && !issues.some((i) => i.tab === errorTab)) {
        // Ensure the primary failing tab is first for navigation/banner focus.
        issues.sort((a, b) => (a.tab === errorTab ? -1 : b.tab === errorTab ? 1 : 0));
      }
      onValidationFailed?.(issues);
    },
    [onValidationFailed],
  );

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
  const [consentForms, setConsentForms] = useState([]);
  const [consentFormsLoading, setConsentFormsLoading] = useState(false);
  const [consentFormsError, setConsentFormsError] = useState(null);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const [insuranceUploadType, setInsuranceUploadType] = useState(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [activeConsentFormId, setActiveConsentFormId] = useState(null);
  const [signatureMode, setSignatureMode] = useState('draw'); // draw | type
  const [typedSignature, setTypedSignature] = useState('');
  const [drawHasInk, setDrawHasInk] = useState(false);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const formDataRef = useRef(formData);
  const submittedRef = useRef(false);
  const queueDraftIdRef = useRef(queueDraftId);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    queueDraftIdRef.current = queueDraftId;
  }, [queueDraftId]);

  const activeConsentForm = useMemo(
    () => consentForms.find((f) => f.id === activeConsentFormId) || null,
    [activeConsentFormId, consentForms],
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

    if (requiresGuarantorSignature) {
      if (!formData.guarantorName?.trim()) {
        alert('Guarantor name is required before signing consent forms for patients under 6 years old.');
        return;
      }
    }

    const signedAt = new Date().toISOString();
    const signerName = requiresGuarantorSignature
      ? formData.guarantorName.trim()
      : loggedInUserName;
    const signatureRole = requiresGuarantorSignature ? 'guarantor' : 'patient';

    if (signatureMode === 'type') {
      const value = typedSignature.trim();
      if (!value) return;
      if (requiresGuarantorSignature && value.toLowerCase() !== signerName.toLowerCase()) {
        alert('Typed signature must match the guarantor name for patients under 6 years old.');
        return;
      }
      setConsentSignatures((prev) => ({
        ...prev,
        [activeConsentFormId]: {
          mode: 'type',
          value,
          signedBy: signerName,
          signatureRole,
          signedAt,
        },
      }));
      closeConsentDialog();
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
        signedBy: signerName,
        signatureRole,
        signedAt,
      },
    }));
    closeConsentDialog();
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

  const insuranceList = useMemo(
    () => buildInsuranceListFromForms(insuranceForms, getPayerName),
    // getPayerName closes over insuranceProviders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insuranceForms, insuranceProviders],
  );

  const activeInsuranceTypes = useMemo(() => {
    if (formData.insuranceBillingType !== 'insurance') return [];
    return INSURANCE_RANK_ORDER.filter((key) => entryHasData(insuranceForms[key]));
  }, [formData.insuranceBillingType, insuranceForms]);

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

  const departmentOptions = useMemo(
    () =>
      departments.map((d) => ({
        value: d.id,
        label: d.departmentCode
          ? `${d.departmentName} (${d.departmentCode})`
          : d.departmentName,
        departmentName: d.departmentName,
      })),
    [departments],
  );

  const registrationProviderOptions = useMemo(
    () =>
      careProviders.map((provider) => {
        const departmentIds = provider.departmentIds?.length
          ? provider.departmentIds
          : provider.departmentId || provider.department?.id
            ? [provider.departmentId || provider.department?.id]
            : [];
        return {
          value: provider.id,
          label: [provider.lastName, [provider.firstName, provider.middleName].filter(Boolean).join(' ')]
            .filter(Boolean)
            .join(', '),
          displayLabel: `${provider.firstName || ''} ${provider.lastName || ''} ${provider.npi || ''}`,
          departmentId: provider.departmentId || provider.department?.id || departmentIds[0] || '',
          departmentIds,
          departmentName:
            provider.department?.departmentName ||
            provider.departments?.[0]?.departmentName ||
            '',
        };
      }),
    [careProviders],
  );

  const {
    availableDates,
    availableDatesLoading,
    availabilityError,
    timeSlotOptions: scheduleTimeSlotOptions,
    filteredAppointmentTypeOptions,
    appointmentTypeOptions: catalogAppointmentTypeOptions,
    scheduleTypesLoading,
    hasProviderSchedules,
  } = useAppointmentAvailability({
    enabled: isOpen && !isRegistrationOnlyChannel(formData.registrationChannel),
    providerId: formData.appointmentProviderId,
    departmentId: formData.appointmentDepartmentId,
    appointmentType: formData.appointmentVisitType,
    appointmentDate: formData.appointmentDate,
    excludeAppointmentId: linkedAppointment?.id,
  });

  const registrationAppointmentTypeOptions = useMemo(() => {
    // Use schedule-filtered list even when empty (provider-required types stay hidden).
    if (Array.isArray(filteredAppointmentTypeOptions)) return filteredAppointmentTypeOptions;
    return catalogAppointmentTypeOptions || [];
  }, [filteredAppointmentTypeOptions, catalogAppointmentTypeOptions]);

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
    () => (activeTab === 'review' ? buildDemographicsReviewItems(formData, reviewHelpers) : []),
    [activeTab, formData, reviewHelpers],
  );
  const contactsReviewItems = useMemo(
    () => (activeTab === 'review' ? buildContactsReviewItems(formData, reviewHelpers) : []),
    [activeTab, formData, reviewHelpers],
  );
  const appointmentReviewItems = useMemo(
    () => (activeTab === 'review' ? buildAppointmentReviewItems(formData, reviewHelpers) : []),
    [activeTab, formData, reviewHelpers],
  );

  const registrationPatientLabel = useMemo(() => {
    const name = [formData.lastName, formData.firstName, formData.middleName]
      .filter(Boolean)
      .join(', ')
      .replace(/, ,/g, ',')
      .trim();
    return name || null;
  }, [formData.firstName, formData.lastName, formData.middleName]);

  const appointmentScheduleSummary = useMemo(() => {
    const parts = [];
    if (registrationPatientLabel) {
      parts.push({ label: 'Patient', value: registrationPatientLabel });
    }
    if (formData.appointmentDepartment) {
      parts.push({ label: 'Department', value: formData.appointmentDepartment });
    }
    if (formData.appointmentProvider) {
      parts.push({ label: 'Provider', value: formData.appointmentProvider });
    }
    if (formData.appointmentVisitType) {
      parts.push({ label: 'Type', value: formData.appointmentVisitType });
    }
    if (formData.appointmentDate) {
      const dateLabel = new Date(`${formData.appointmentDate}T12:00:00`).toLocaleDateString(
        'en-US',
        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
      );
      let timeLabel = '';
      if (formData.appointmentTime) {
        timeLabel = formatAppointmentTimeSlot(formData.appointmentTime, scheduleTimeSlotOptions || []);
      } else if (formData.appointmentStartTime) {
        timeLabel = formData.appointmentEndTime
          ? `${formData.appointmentStartTime} – ${formData.appointmentEndTime}`
          : formData.appointmentStartTime;
      }
      parts.push({
        label: 'When',
        value: timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel,
      });
    }
    return parts;
  }, [registrationPatientLabel, formData, scheduleTimeSlotOptions]);
  const insuranceReviewItems = useMemo(
    () => (activeTab === 'review' ? buildInsuranceReviewItems(formData, reviewHelpers) : []),
    [activeTab, formData, reviewHelpers],
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    appointmentStatusApi
      .getActive()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setStatusOptions(getCanonicalAppointmentStatuses(rows));
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
    if (!isOpen) return undefined;
    let cancelled = false;

    const loadConsentForms = async () => {
      setConsentFormsLoading(true);
      setConsentFormsError(null);
      try {
        const rows = await fetchActiveConsentForms();
        if (!cancelled) setConsentForms(rows);
      } catch (err) {
        if (!cancelled) {
          setConsentForms([]);
          setConsentFormsError(err.message || 'Failed to load consent forms');
        }
      } finally {
        if (!cancelled) setConsentFormsLoading(false);
      }
    };

    loadConsentForms();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchCareProviders = async () => {
      setLoadingCareProviders(true);
      try {
        const response = await providerApi.getAll({ limit: 500, isActive: true });
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
    departmentApi
      .getActive()
      .then((res) => setDepartments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDepartments([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (patient) {
      const appointmentFields = linkedAppointment
        ? mapAppointmentToRegistrationForm(
            linkedAppointment,
            linkedAppointment.status || patient.appointmentStatus || getDefaultAppointmentStatusName(),
          )
        : {
            appointmentDate: '',
            appointmentTime: '',
            appointmentStartTime: '',
            appointmentEndTime: '',
            appointmentVisitType: '',
            appointmentTypeId: '',
            appointmentTypeName: '',
            visitModality: DEFAULT_VISIT_MODALITY,
            accessibilityRequirements: [],
            accessibilityRequirementsNotes: '',
            appointmentDepartment: '',
            appointmentDepartmentId: '',
            appointmentProvider: '',
            appointmentProviderId: '',
            appointmentReason: '',
            appointmentNotes: '',
            status: patient.appointmentStatus || getDefaultAppointmentStatusName(),
          };
      setAppointmentEditMode(false);

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
        ssn: patient.ssn || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        email: patient.email || '',
        noEmail: patient.noEmail || false,
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
        militaryBranch: patient.militaryBranch || '',
        disabilityStatus: patient.disabilityStatus || '',
        disabilities: parseJsonArray(patient.disabilities),
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
        interpreterLanguages: parseJsonArray(patient.interpreterLanguages),
        registrationChannel: patient.registrationChannel || 'appointment',
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

        ...appointmentFields,
      });
      setDocuments(Array.isArray(patient.documents) ? patient.documents : []);
      setInsuranceForms(
        hydrateInsuranceForms(
          Array.isArray(patient.insuranceList) ? patient.insuranceList : [],
          {
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
            subscriberDateOfBirth: patient.subscriberDateOfBirth
              ? patient.subscriberDateOfBirth.split('T')[0]
              : '',
            subscriberAddress: patient.subscriberAddress || '',
            subscriberCity: patient.subscriberCity || '',
            subscriberState: patient.subscriberState || '',
            subscriberZip: patient.subscriberZip || '',
            subscriberPhone: patient.subscriberPhone || '',
            subscriberSsnLast4: patient.subscriberSsnLast4 || patient.subscriberSsn?.slice(-4) || '',
            subscriberEmployer: patient.subscriberEmployer || '',
            subscriberEmail: patient.subscriberEmail || '',
            coverageStartDate: patient.coverageStartDate
              ? patient.coverageStartDate.split('T')[0]
              : '',
            coverageEndDate: patient.coverageEndDate ? patient.coverageEndDate.split('T')[0] : '',
            copay: patient.copay || '',
            deductible: patient.deductible || '',
            coinsurancePercentage: patient.coinsurancePercentage || '',
            authorizationRequired: patient.authorizationRequired || '',
            authorizationNumber: patient.authorizationNumber || '',
          },
        ),
      );
      setConsentSignatures(
        mapPatientConsentSignaturesToState(patient.consentSignatures, {
          fallbackSigner: patient.guarantorName || loggedInUserName,
        }),
      );
    } else if (queueDraftId) {
      const draft = getPatientQueueDraftById(queueDraftId);
      if (draft?.formData) {
        const draftForm = {
          ...initialFormData,
          ...draft.formData,
          registrationChannel: draft.registrationChannel || draft.formData.registrationChannel || 'appointment',
        };
        setFormData(draftForm);
        setDocuments(Array.isArray(draft.documents) ? draft.documents : []);
        setInsuranceForms(
          hydrateInsuranceForms(
            Array.isArray(draft.insuranceList) ? draft.insuranceList : [],
            draftForm,
          ),
        );
        setConsentSignatures(draft.consentSignatures || {});
      } else {
        setFormData(initialFormData);
        setDocuments([]);
        setInsuranceForms(createEmptyInsuranceForms());
        setConsentSignatures({});
      }
    } else {
      setFormData(
        isQuickRegistration
          ? { ...initialFormData, registrationChannel: 'appointment', preferredContactMethod: 'cell' }
          : initialFormData,
      );
      setDocuments([]);
      setInsuranceForms(createEmptyInsuranceForms());
      setConsentSignatures({});
    }
    setNewDocument(emptyNewDocument());
    setDocumentFormErrors({});
    setErrors({});
    setActiveTab('patient');
    setDuplicateMatches([]);
    setDuplicateDismissed(false);
  }, [patient, isOpen, queueDraftId, isQuickRegistration, loggedInUserName, linkedAppointment]);

  const isRegistrationOnly = isRegistrationOnlyChannel(formData.registrationChannel);
  const appointmentFormReadOnly =
    isEditingExistingPatient && linkedAppointment && !appointmentEditMode;
  const canEditLinkedAppointment =
    linkedAppointment && isAppointmentEditable(linkedAppointment);
  const patientAge = useMemo(
    () => calculateAgeFromDob(formData.dateOfBirth),
    [formData.dateOfBirth],
  );
  const requiresGuarantorSignature = patientAge != null && patientAge < GUARANTOR_SIGNATURE_MIN_AGE;
  const requiresGuarantorInfo = isPatientMinor(formData.dateOfBirth);

  useEffect(() => {
    if (!isOpen) {
      setDuplicateMatches([]);
      setDuplicateDismissed(false);
      return;
    }
    if (patient?.id) {
      return;
    }

    const { firstName, lastName, dateOfBirth, cellPhone, gender } = formData;
    const phone = (cellPhone || '').trim();
    const hasRequiredIdentity =
      Boolean(firstName?.trim()) &&
      Boolean(lastName?.trim()) &&
      Boolean(dateOfBirth) &&
      Boolean(phone) &&
      Boolean(gender);

    if (!hasRequiredIdentity) {
      setDuplicateMatches([]);
      setDuplicateDismissed(false);
      return;
    }

    if (duplicateDismissed) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await patientApi.checkDuplicates({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          contactNumber: phone,
          gender,
          excludeId: patient?.id || null,
        });
        if (res.hasDuplicates && res.duplicates?.length) {
          setDuplicateMatches(res.duplicates);
        } else {
          setDuplicateMatches([]);
        }
      } catch {
        setDuplicateMatches([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    duplicateDismissed,
    formData.firstName,
    formData.lastName,
    formData.dateOfBirth,
    formData.cellPhone,
    formData.gender,
    patient?.id,
  ]);

  // Re-enable duplicate checks when identity fields change after dismiss
  const duplicateIdentityKey = [
    formData.firstName,
    formData.lastName,
    formData.dateOfBirth,
    formData.cellPhone,
    formData.gender,
  ].join('|');
  const lastDuplicateIdentityKeyRef = useRef(duplicateIdentityKey);
  useEffect(() => {
    if (lastDuplicateIdentityKeyRef.current !== duplicateIdentityKey) {
      lastDuplicateIdentityKeyRef.current = duplicateIdentityKey;
      setDuplicateDismissed(false);
    }
  }, [duplicateIdentityKey]);

  const handleInsuranceDocumentsSave = ({ insuranceType, front, back }) => {
    const typeKey = insuranceType || 'primary';
    const typeLabel = INSURANCE_TYPE_LABELS[typeKey] || 'Primary';
    let nextDocs = documents;
    if (front?.fileData) {
      nextDocs = upsertInsuranceCardDocument(nextDocs, {
        typeKey,
        typeLabel,
        side: 'front',
        fileMeta: front,
      });
    }
    if (back?.fileData) {
      nextDocs = upsertInsuranceCardDocument(nextDocs, {
        typeKey,
        typeLabel,
        side: 'back',
        fileMeta: back,
      });
    }
    setDocuments(nextDocs);
  };

  useEffect(() => {
    if (patient?.id || isQuickRegistration) return undefined;

    const persistDraft = () => {
      if (submittedRef.current || isLoading) return;
      const current = formDataRef.current;
      if (!hasDraftableRegistrationData(current)) return;
      const entry = savePatientQueueDraft({
        id: queueDraftIdRef.current,
        registrationChannel: current.registrationChannel,
        formData: current,
        documents,
        insuranceList,
      });
      queueDraftIdRef.current = entry.id;
    };

    const onBeforeUnload = () => persistDraft();
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      persistDraft();
    };
  }, [patient?.id, isQuickRegistration, isLoading, documents, insuranceList]);

  useEffect(() => {
    if ((isRegistrationOnly || isQuickRegistration) && activeTab === 'appointment') {
      setActiveTab('insurance');
    }
  }, [isRegistrationOnly, isQuickRegistration, activeTab]);

  const handleCancelRegistration = useCallback(() => {
    if (!patient?.id && !isQuickRegistration && hasDraftableRegistrationData(formDataRef.current)) {
      savePatientQueueDraft({
        id: queueDraftIdRef.current,
        registrationChannel: formDataRef.current.registrationChannel,
        formData: formDataRef.current,
        documents,
        insuranceList,
      });
    }
    onCancelRegistration?.() ?? onCancel?.();
  }, [patient?.id, isQuickRegistration, documents, insuranceList, onCancelRegistration, onCancel]);

  const handleChange = useCallback((field, value) => {
    // Support batch patches: onChange({ fieldA: valA, fieldB: valB })
    if (field && typeof field === 'object' && value === undefined) {
      const patch = field;
      setFormData((prev) => ({ ...prev, ...patch }));
      setErrors((prev) => {
        const touchesContacts = Object.keys(patch).some(isContactsScopeErrorKey);
        let next = prev;
        const clearKey = (key) => {
          if (next[key]) {
            if (next === prev) next = { ...prev };
            next[key] = null;
          }
        };
        if (touchesContacts) {
          Object.keys(next).forEach((key) => {
            if (isContactsScopeErrorKey(key)) clearKey(key);
          });
        } else {
          Object.keys(patch).forEach((key) => clearKey(key));
        }
        return next;
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }, []);

  const handleInsuranceEntryChange = useCallback((typeKey, field, value) => {
    setInsuranceForms((prev) => ({
      ...prev,
      [typeKey]: {
        ...prev[typeKey],
        [field]: value,
        insuranceTypeKey: typeKey,
        insuranceType: INSURANCE_TYPE_LABELS[typeKey],
      },
    }));

    if (typeKey === 'primary') {
      setFormData((prev) => ({ ...prev, [field]: value, insuranceType: 'primary' }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
    }
  }, []);

  const handleInsuranceEntryChangeMany = useCallback((typeKey, patch) => {
    setInsuranceForms((prev) => ({
      ...prev,
      [typeKey]: {
        ...prev[typeKey],
        ...patch,
        insuranceTypeKey: typeKey,
        insuranceType: INSURANCE_TYPE_LABELS[typeKey],
      },
    }));

    if (typeKey === 'primary') {
      setFormData((prev) => ({
        ...prev,
        ...patch,
        insuranceType: 'primary',
      }));
      setErrors((prev) => {
        const next = { ...prev };
        Object.keys(patch || {}).forEach((key) => {
          if (next[key]) next[key] = null;
        });
        return next;
      });
    }
  }, []);

  const applyValidationErrors = (newErrors, { mergeErrors = false, scope = 'all' } = {}) => {
    if (!mergeErrors || scope === 'all') {
      setErrors(newErrors);
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      if (scope === 'contacts') {
        Object.keys(next).forEach((key) => {
          if (isContactsScopeErrorKey(key)) delete next[key];
        });
      } else {
        (TAB_SCOPE_ERROR_KEYS[scope] || []).forEach((key) => {
          delete next[key];
        });
      }
      return { ...next, ...newErrors };
    });
  };

  const validateQuickRegistration = ({ bookAppointment = false, scope = 'all', mergeErrors = false } = {}) => {
    const newErrors = {};
    const appointmentErrorKeys = new Set([
      'appointmentDate',
      'appointmentTime',
      'appointmentVisitType',
      'appointmentStartTime',
      'appointmentEndTime',
      'appointmentDepartment',
      'appointmentProvider',
      'visitModality',
    ]);
    const insuranceErrorKeys = new Set(['insuranceBillingType', 'paymentMethod']);
    const includePatient = scope === 'all' || scope === 'patient';
    const includeInsurance = scope === 'all' || scope === 'insurance';
    const includeAppointment = bookAppointment || scope === 'appointment';

    if (includePatient) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.cellPhone?.trim()) {
        newErrors.cellPhone = 'Cell phone is required';
      } else {
        const phoneCheck = validatePhoneNumber(formData.cellPhone);
        if (!phoneCheck.valid) {
          newErrors.cellPhone = phoneCheck.message || 'Enter a valid phone number for the selected country';
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

      if (formData.email && !isValidEmail(formData.email)) {
        newErrors.email = EMAIL_VALIDATION_MESSAGE;
      }

      if (formData.ssn?.trim()) {
        const ssnDigits = String(formData.ssn).replace(/\D/g, '');
        if (ssnDigits.length !== 9) {
          newErrors.ssn = 'SSN must be 9 digits (XXX-XX-XXXX)';
        }
      }
    }

    if (includeInsurance) {
      if (!formData.insuranceBillingType && !formData.billingType) {
        newErrors.insuranceBillingType = 'Billing type is required';
      }
    }

    if (includeAppointment) {
      validateRegistrationAppointmentFields(formData, newErrors, {
        requireProvider: true,
        requireDepartment: true,
        timeSlotOptions: scheduleTimeSlotOptions || undefined,
      });
      if (formData.referringPhysicianPhone && !PHONE_REGEX.test(formData.referringPhysicianPhone)) {
        newErrors.referringPhysicianPhone = 'Invalid phone number format';
      }
      if (formData.referringPhysicianFax && !PHONE_REGEX.test(formData.referringPhysicianFax)) {
        newErrors.referringPhysicianFax = 'Invalid fax number format';
      }
    }

    const errorScope = bookAppointment ? 'appointment' : scope;
    applyValidationErrors(newErrors, { mergeErrors, scope: errorScope });

    let errorTab = errorScope !== 'all' ? errorScope : 'patient';
    if (scope === 'all') {
      if (Object.keys(newErrors).some((key) => appointmentErrorKeys.has(key))) {
        errorTab = 'appointment';
      } else if (Object.keys(newErrors).some((key) => insuranceErrorKeys.has(key))) {
        errorTab = 'insurance';
      }
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errorTab,
      fieldErrors: newErrors,
      documentWarnings: [],
      missingRequiredDocuments: [],
    };
  };

  const validate = ({ scope = 'all', mergeErrors = false } = {}) => {
    if (isQuickRegistration) {
      if (scope === 'appointment') {
        return validateQuickRegistration({ bookAppointment: true, mergeErrors, scope: 'appointment' });
      }
      if (scope === 'insurance') {
        return validateQuickRegistration({ mergeErrors, scope: 'insurance' });
      }
      if (scope === 'patient') {
        return validateQuickRegistration({ mergeErrors, scope: 'patient' });
      }
      return validateQuickRegistration({ mergeErrors, scope: 'all' });
    }

    const newErrors = {};
    const includePatient = scope === 'all' || scope === 'patient';
    const includeContacts = scope === 'all' || scope === 'contacts';
    const includeAppointment = scope === 'all' || scope === 'appointment';
    const includeInsurance = scope === 'all' || scope === 'insurance';
    const includeDocuments = scope === 'all' || scope === 'documents';
    const includeConsent = scope === 'all' || scope === 'consentForms';

    if (
      !includePatient &&
      !includeContacts &&
      !includeAppointment &&
      !includeInsurance &&
      !includeDocuments &&
      !includeConsent
    ) {
      return {
        isValid: true,
        errorTab: 'patient',
        fieldErrors: {},
        documentWarnings: [],
        missingRequiredDocuments: [],
      };
    }

    if (includePatient) {
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
    if (!formData.ethnicity) newErrors.ethnicity = 'Ethnicity is required';
    if (!formData.race) newErrors.race = 'Race is required';

    if (!formData.cellPhone?.trim()) {
      newErrors.cellPhone = 'Cell phone is required';
    } else {
      const cellCheck = validatePhoneNumber(formData.cellPhone);
      if (!cellCheck.valid) {
        newErrors.cellPhone = cellCheck.message || 'Enter a valid phone number for the selected country';
      }
    }

    const method = formData.preferredContactMethod;
    // Home and work phones are always optional; only email stays required when preferred.
    if (method === 'email' && !formData.noEmail && !formData.email?.trim()) {
      newErrors.email = 'Email is required when email is the preferred contact method';
    }

    if (formData.veteranStatus === 'yes' && !formData.militaryBranch) {
      newErrors.militaryBranch = 'Military branch is required when veteran status is Yes';
    }
    if (formData.disabilityStatus === 'yes' && (!formData.disabilities || formData.disabilities.length === 0)) {
      newErrors.disabilities = 'Select at least one disability';
    }
    if (formData.interpreterRequired && (!formData.interpreterLanguages || formData.interpreterLanguages.length === 0)) {
      newErrors.interpreterLanguages = 'Select at least one interpreter language';
    }

    if (!formData.noEmail && formData.email && !isValidEmail(formData.email)) {
      newErrors.email = EMAIL_VALIDATION_MESSAGE;
    }

    if (formData.homePhone?.trim()) validateContactPhoneField(formData.homePhone, 'homePhone', newErrors);
    if (formData.workPhone?.trim()) validateContactPhoneField(formData.workPhone, 'workPhone', newErrors);
    if (formData.employerPhoneNumber?.trim()) {
      validateContactPhoneField(formData.employerPhoneNumber, 'employerPhoneNumber', newErrors);
    }

    // Validate DOB is not in future
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    if (formData.ssn?.trim()) {
      const ssnDigits = String(formData.ssn).replace(/\D/g, '');
      if (ssnDigits.length !== 9) {
        newErrors.ssn = 'SSN must be 9 digits (XXX-XX-XXXX)';
      }
    }
    }

    if (includeContacts) {
    if (requiresGuarantorInfo) {
      if (!formData.guarantorName?.trim()) {
        newErrors.guarantorName_0 = 'Guarantor name is required for patients under 18 years old';
        newErrors.guarantorName = newErrors.guarantorName_0;
      }
      if (!formData.guarantorRelationship) {
        newErrors.guarantorRelationship_0 =
          'Guarantor relationship is required for patients under 18 years old';
        newErrors.guarantorRelationship = newErrors.guarantorRelationship_0;
      }
      if (!formData.guarantorPhone?.trim()) {
        newErrors.guarantorPhone_0 = 'Guarantor phone is required for patients under 18 years old';
        newErrors.guarantorPhone = newErrors.guarantorPhone_0;
      }
    }
    if (requiresGuarantorSignature) {
      if (!formData.guarantorName?.trim() && !newErrors.guarantorName_0) {
        newErrors.guarantorName_0 = 'Guarantor name is required for patients under 6 years old';
        newErrors.guarantorName = newErrors.guarantorName_0;
      }
      if (!formData.guarantorRelationship && !newErrors.guarantorRelationship_0) {
        newErrors.guarantorRelationship_0 =
          'Guarantor relationship is required for patients under 6 years old';
        newErrors.guarantorRelationship = newErrors.guarantorRelationship_0;
      }
      if (!formData.guarantorPhone?.trim() && !newErrors.guarantorPhone_0) {
        newErrors.guarantorPhone_0 = 'Guarantor phone is required for patients under 6 years old';
        newErrors.guarantorPhone = newErrors.guarantorPhone_0;
      }
    }

    buildEmergencyContactsList(formData).forEach((entry, index) => {
      validateContactPhoneField(entry.number, `emergencyContactNumber_${index}`, newErrors);
      validateContactEmailField(entry.email, `emergencyContactEmail_${index}`, newErrors);
      if (index === 0) {
        if (newErrors.emergencyContactNumber_0) {
          newErrors.emergencyContactNumber = newErrors.emergencyContactNumber_0;
        }
        if (newErrors.emergencyContactEmail_0) {
          newErrors.emergencyContactEmail = newErrors.emergencyContactEmail_0;
        }
      }
      if (index === 1) {
        if (newErrors.emergencyContactNumber_1) {
          newErrors.secondaryEmergencyContactNumber = newErrors.emergencyContactNumber_1;
        }
        if (newErrors.emergencyContactEmail_1) {
          newErrors.secondaryEmergencyContactEmail = newErrors.emergencyContactEmail_1;
        }
      }
    });

    buildGuarantorsList(formData).forEach((entry, index) => {
      validateContactPhoneField(entry.phone, `guarantorPhone_${index}`, newErrors);
      validateContactEmailField(entry.email, `guarantorEmail_${index}`, newErrors);
      if (index === 0) {
        if (newErrors.guarantorPhone_0 && !newErrors.guarantorPhone) {
          newErrors.guarantorPhone = newErrors.guarantorPhone_0;
        }
        if (newErrors.guarantorEmail_0) {
          newErrors.guarantorEmail = newErrors.guarantorEmail_0;
        }
      }
    });
    }

    if (scope === 'all' && !isRegistrationOnly && includeAppointment) {
      validateRegistrationAppointmentFields(formData, newErrors, {
        skipAppointment: false,
        requireProvider: true,
        requireDepartment: true,
        timeSlotOptions: scheduleTimeSlotOptions || undefined,
      });
    } else if (includeAppointment && !isRegistrationOnly) {
      validateRegistrationAppointmentFields(formData, newErrors, {
        skipAppointment: false,
        requireProvider: true,
        requireDepartment: true,
        timeSlotOptions: scheduleTimeSlotOptions || undefined,
      });
      if (formData.referringPhysicianPhone?.trim()) {
        validateContactPhoneField(formData.referringPhysicianPhone, 'referringPhysicianPhone', newErrors);
      }
      if (formData.referringPhysicianFax?.trim()) {
        validateContactPhoneField(formData.referringPhysicianFax, 'referringPhysicianFax', newErrors);
      }
    }

    if (includeInsurance) {
    if (!formData.insuranceBillingType && !formData.billingType) {
      newErrors.insuranceBillingType = 'Billing type is required';
    }
    if (formData.subscriberPhone?.trim()) {
      validateContactPhoneField(formData.subscriberPhone, 'subscriberPhone', newErrors);
    }
    if (formData.subscriberEmail && !isValidEmail(formData.subscriberEmail)) {
      newErrors.subscriberEmail = EMAIL_VALIDATION_MESSAGE;
    }
    if (formData.subscriberSsnLast4 && !/^\d{4}$/.test(formData.subscriberSsnLast4.replace(/\D/g, ''))) {
      newErrors.subscriberSsnLast4 = 'Enter exactly 4 digits for SSN last 4';
    }
    }

    if (includeConsent) {
    if (requiresGuarantorSignature) {
      const unsignedConsents = consentForms.filter((form) => !consentSignatures[form.id]?.signedAt);
      if (unsignedConsents.length) {
        newErrors.consentForms = 'Guarantor signature is required on all consent forms for patients under 6 years old';
      }
    }
    }

    let docValidation = { errors: {}, warnings: [], missingRequired: [] };
    if (includeDocuments) {
      docValidation = validatePatientDocuments(documents, { strictMode: false });
      Object.assign(newErrors, docValidation.errors);
    }

    applyValidationErrors(newErrors, { mergeErrors, scope });

    const documentErrorKeys = new Set(['documentsPhotoId', 'documentsInsuranceFront']);
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
      'ethnicity',
      'race',
      'militaryBranch',
      'disabilities',
      'interpreterLanguages',
    ]);
    const insuranceErrorKeys = new Set(['insuranceBillingType', 'paymentMethod']);
    const appointmentErrorKeys = new Set([
      'appointmentDate',
      'appointmentTime',
      'appointmentVisitType',
      'appointmentStartTime',
      'appointmentEndTime',
      'visitModality',
      'appointmentProvider',
      'appointmentDepartment',
    ]);
    let errorTab = scope !== 'all' ? scope : 'patient';
    if (scope === 'all') {
    if (Object.keys(newErrors).some((key) => documentErrorKeys.has(key))) {
      errorTab = 'documents';
    } else if (Object.keys(newErrors).some((key) => key === 'consentForms')) {
      errorTab = 'consentForms';
    } else if (Object.keys(newErrors).some((key) => insuranceErrorKeys.has(key))) {
      errorTab = 'insurance';
    } else if (Object.keys(newErrors).some((key) => appointmentErrorKeys.has(key))) {
      errorTab = 'appointment';
    } else if (Object.keys(newErrors).some((key) => isContactsScopeErrorKey(key))) {
      errorTab = 'contacts';
    } else if (Object.keys(newErrors).some((key) => patientErrorKeys.has(key))) {
      errorTab = 'patient';
    }
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errorTab,
      fieldErrors: newErrors,
      documentWarnings: docValidation.warnings,
      missingRequiredDocuments: docValidation.missingRequired,
    };
  };

  const buildSubmitPayload = () => {
    const submitData = applyInsuranceEntryToFormData(formData, insuranceForms.primary);
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
    if (submitData.ssn) {
      const digits = String(submitData.ssn).replace(/\D/g, '').slice(0, 9);
      submitData.ssn = digits.length === 9
        ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
        : digits || null;
    }

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === '') {
        submitData[key] = null;
      }
    });

    const toOptionalNumber = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    submitData.copay = toOptionalNumber(submitData.copay);
    submitData.deductible = toOptionalNumber(submitData.deductible);
    submitData.coinsurancePercentage = toOptionalNumber(submitData.coinsurancePercentage);
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
    if (submitData.noEmail) {
      submitData.email = null;
    }
    submitData.disabilities = serializeJsonArray(submitData.disabilities);
    submitData.interpreterLanguages = serializeJsonArray(submitData.interpreterLanguages);
    submitData.accessibilityRequirements = serializeJsonArray(submitData.accessibilityRequirements);
    if (!submitData.visitModality) submitData.visitModality = DEFAULT_VISIT_MODALITY;

    delete submitData.profilePhotoFileName;
    delete submitData.mrn;
    submitData.documents = serializeDocumentsForSubmit(documents);
    submitData.insuranceList = insuranceList;
    submitData.consentSignatures = Object.entries(consentSignatures)
      .filter(([, sig]) => sig?.value)
      .map(([consentFormId, sig]) => ({
      consentFormId,
      signatureType: sig.mode === 'draw' ? 'drawn' : 'typed',
      signatureData: sig.value,
      scrolledToEnd: !!sig.scrolledToEnd,
      nameMatched: !!sig.nameMatched,
    }));

    if (linkedAppointment?.id) {
      submitData.linkedAppointmentId = linkedAppointment.id;
      submitData.appointmentEdited = appointmentEditMode;
    }

    return submitData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validate();
    if (!validation.isValid) {
      setActiveTab(validation.errorTab === 'appointment' && isQuickRegistration ? 'insurance' : validation.errorTab);
      reportValidationFailed(validation.fieldErrors, validation.errorTab);
      return;
    }
    if (appointmentEditMode && linkedAppointment) {
      const appointmentErrors = {};
      validateRegistrationAppointmentFields(formData, appointmentErrors, {
        requireProvider: true,
        requireDepartment: true,
        timeSlotOptions: scheduleTimeSlotOptions || undefined,
      });
      if (Object.keys(appointmentErrors).length) {
        setErrors((prev) => ({ ...prev, ...appointmentErrors }));
        setActiveTab('appointment');
        reportValidationFailed(appointmentErrors, 'appointment');
        return;
      }
    }
    submittedRef.current = true;
    onValidationFailed?.([]);
    onSubmit(buildSubmitPayload());
  };

  const fullTabOrder = isRegistrationOnly
    ? ['patient', 'contacts', 'insurance', 'documents', 'consentForms', 'review']
    : ['patient', 'contacts', 'appointment', 'insurance', 'documents', 'consentForms', 'review'];
  const tabOrder = isQuickRegistration
    ? ['patient', 'insurance']
    : fullTabOrder;
  const tabCount = tabOrder.length;
  const currentTabIndex = tabOrder.indexOf(activeTab);
  const canGoPrev = currentTabIndex > 0;
  const canGoNext = currentTabIndex >= 0 && currentTabIndex < tabOrder.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    setActiveTab(tabOrder[currentTabIndex - 1]);
  };

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;

    const currentIndex = tabOrder.indexOf(activeTab);
    const nextIndex = tabOrder.indexOf(nextTab);
    if (nextIndex === -1) return;

    if (nextIndex <= currentIndex) {
      setActiveTab(nextTab);
      return;
    }

    for (let i = currentIndex; i < nextIndex; i += 1) {
      const tabToValidate = tabOrder[i];
      const result = validate({ scope: tabToValidate, mergeErrors: true });
      if (!result.isValid) {
        setActiveTab(tabToValidate);
        reportValidationFailed(result.fieldErrors, result.errorTab || tabToValidate);
        return;
      }
    }

    onValidationFailed?.([]);
    setActiveTab(nextTab);
  };

  const goNext = () => {
    if (!canGoNext) return;
    const result = validate({ scope: activeTab, mergeErrors: true });
    if (!result.isValid) {
      reportValidationFailed(result.fieldErrors, result.errorTab || activeTab);
      return;
    }
    onValidationFailed?.([]);
    setActiveTab(tabOrder[currentTabIndex + 1]);
  };

  const isReviewTab = activeTab === 'review';
  const submitButtonLabel = isLoading
    ? isQuickRegistration
      ? 'Saving...'
      : isNewRegistration && isReviewTab
        ? 'Registering...'
        : 'Saving...'
    : isQuickRegistration
      ? 'Create Patient'
      : isNewRegistration && isReviewTab
        ? 'Register Patient'
        : 'Save and Close';

  const formActionButtons = (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0">
      {canGoNext && (
        <Button
          type="button"
          variant="outline"
          onClick={goNext}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Save and Next
        </Button>
      )}
      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {submitButtonLabel}
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="ehr-form space-y-4">
          {submitError ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </div>
          ) : null}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {isQuickRegistration ? (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patient">Demographics</TabsTrigger>
                <TabsTrigger value="insurance">Insurance Info</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className={`grid w-full grid-cols-${tabCount}`} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
                <TabsTrigger value="patient">Demographics</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                {!isRegistrationOnly && <TabsTrigger value="appointment">Appointment</TabsTrigger>}
                <TabsTrigger value="insurance">Insurance Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="consentForms">Consent Forms</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
            )}

            <PatientRegistrationHeader formData={formData} />

            {!isQuickRegistration && (
              <div className="flex justify-end pt-3">{formActionButtons}</div>
            )}

            {/* TAB 1: Patient Info */}
            <TabsContent value="patient" className="space-y-4 mt-3">
              {activeTab === 'patient' && (
              <>
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

                {/* Row 2: Gender, DOB, SSN (PHI) */}
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
                    <Label htmlFor="ssn">SSN (PHI)</Label>
                    <Input
                      id="ssn"
                      value={formData.ssn || ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        let formatted = digits;
                        if (digits.length > 5) {
                          formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
                        } else if (digits.length > 3) {
                          formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                        }
                        handleChange('ssn', formatted);
                      }}
                      placeholder="XXX-XX-XXXX"
                      inputMode="numeric"
                      autoComplete="off"
                      className={errors.ssn ? 'border-destructive' : ''}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Protected health information — collect only when required for care or billing.
                    </p>
                    {errors.ssn && (
                      <p className="text-xs text-destructive">{errors.ssn}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="email">Email</Label>
                    <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                      <Checkbox
                        id="noEmail"
                        checked={formData.noEmail}
                        onCheckedChange={(checked) => {
                          handleChange('noEmail', checked);
                          if (checked) {
                            handleChange('email', '');
                            setErrors((prev) => ({ ...prev, email: null }));
                          }
                        }}
                        disabled={isLoading}
                      />
                      No Email
                    </label>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={formData.noEmail || isLoading}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
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

                <PatientAddressFields
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homePhone">Home Phone</Label>
                    <PhoneNumberInput
                      id="homePhone"
                      value={formData.homePhone}
                      onChange={(value) => handleChange('homePhone', value)}
                      error={errors.homePhone}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workPhone">Work Phone</Label>
                    <PhoneNumberInput
                      id="workPhone"
                      value={formData.workPhone}
                      onChange={(value) => handleChange('workPhone', value)}
                      error={errors.workPhone}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="cellPhone">Cell Phone</RequiredFieldLabel>
                    <PhoneNumberInput
                      id="cellPhone"
                      value={formData.cellPhone}
                      onChange={(value) => handleChange('cellPhone', value)}
                      error={errors.cellPhone}
                      disabled={isLoading}
                    />
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
                    <Label htmlFor="veteranStatus">Military Service / Care and Reporting</Label>
                    <Select
                      value={formData.veteranStatus}
                      onValueChange={(value) => {
                        handleChange('veteranStatus', value);
                        if (value !== 'yes') handleChange('militaryBranch', '');
                      }}
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
                  {formData.veteranStatus === 'yes' && (
                    <div className="space-y-2">
                      <Label htmlFor="militaryBranch">Military Branch</Label>
                      <Select
                        value={formData.militaryBranch}
                        onValueChange={(value) => handleChange('militaryBranch', value)}
                      >
                        <SelectTrigger className={`w-full ${errors.militaryBranch ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select military branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {MILITARY_BRANCH_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.militaryBranch && (
                        <p className="text-xs text-destructive">{errors.militaryBranch}</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="disabilityStatus">Disability</Label>
                    <Select
                      value={formData.disabilityStatus}
                      onValueChange={(value) => {
                        handleChange('disabilityStatus', value);
                        if (value !== 'yes') handleChange('disabilities', []);
                      }}
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
                  {formData.disabilityStatus === 'yes' && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="disabilities">Disabilities</Label>
                      <MultiSelect
                        id="disabilities"
                        options={DISABILITY_OPTIONS}
                        value={formData.disabilities || []}
                        onChange={(value) => handleChange('disabilities', value)}
                        placeholder="Select disabilities"
                        searchable
                        searchPlaceholder="Search disabilities..."
                        className="w-full"
                      />
                      {errors.disabilities && (
                        <p className="text-xs text-destructive">{errors.disabilities}</p>
                      )}
                    </div>
                  )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="ethnicity">Ethnicity</RequiredFieldLabel>
                    <Select
                      value={formData.ethnicity}
                      onValueChange={(value) => handleChange('ethnicity', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.ethnicity ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                        <SelectItem value="not-hispanic">Not Hispanic or Latino</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.ethnicity && (
                      <p className="text-xs text-destructive">{errors.ethnicity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <RequiredFieldLabel htmlFor="race">Race</RequiredFieldLabel>
                    <Select
                      value={formData.race}
                      onValueChange={(value) => handleChange('race', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.race ? 'border-destructive' : ''}`}>
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
                    {errors.race && <p className="text-xs text-destructive">{errors.race}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="interpreterLanguages">Languages</Label>
                      <MultiSelect
                        id="interpreterLanguages"
                        options={INTERPRETER_LANGUAGE_OPTIONS}
                        value={formData.interpreterLanguages || []}
                        onChange={(value) => handleChange('interpreterLanguages', value)}
                        placeholder="Select languages"
                        searchable
                        searchPlaceholder="Search languages..."
                        className="w-full"
                      />
                      {errors.interpreterLanguages && (
                        <p className="text-xs text-destructive">{errors.interpreterLanguages}</p>
                      )}
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
                        <PhoneNumberInput
                          id="employerPhoneNumber"
                          value={formData.employerPhoneNumber}
                          onChange={(value) => handleChange('employerPhoneNumber', value)}
                          error={errors.employerPhoneNumber}
                          disabled={isLoading}
                        />
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
              </>
              )}
            </TabsContent>

            {/* TAB 2: Contacts */}
            {!isQuickRegistration && (
            <TabsContent value="contacts" className="space-y-4 mt-3">
              {activeTab === 'contacts' && (
              <PatientRegistrationContactsFields
                formData={formData}
                errors={errors}
                onChange={handleChange}
                dateOfBirth={formData.dateOfBirth}
                requiresGuarantor={requiresGuarantorInfo}
              />
              )}
            </TabsContent>
            )}

            {/* TAB 3: Appointment (Outpatient) — hidden in quick add-from-schedule modal */}
            {!isRegistrationOnly && !isQuickRegistration && (
            <TabsContent value="appointment" className="space-y-4 mt-4">
              {activeTab === 'appointment' && (
              <>
              <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isEditingExistingPatient && linkedAppointment
                      ? 'Linked outpatient appointment'
                      : 'Schedule outpatient visit'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {appointmentFormReadOnly
                      ? 'Review appointment details below. Click Edit Appointment to reschedule.'
                      : 'Same Epic Cadence flow as Appointments → New appointment: context, slot, then visit details.'}
                  </p>
                  {linkedAppointment?.encounterNumber && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      Encounter {linkedAppointment.encounterNumber}
                      {formData.status ? ` · Status ${formData.status}` : ''}
                    </p>
                  )}
                </div>
                {appointmentEditMode && linkedAppointment && (
                  <p className="text-xs text-muted-foreground sm:text-right">
                    Saving will set appointment status to Rescheduled.
                  </p>
                )}
                {appointmentFormReadOnly && canEditLinkedAppointment && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setAppointmentEditMode(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Appointment
                  </Button>
                )}
                {appointmentEditMode && linkedAppointment && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setAppointmentEditMode(false);
                      const restored = mapAppointmentToRegistrationForm(
                        linkedAppointment,
                        linkedAppointment.status || getDefaultAppointmentStatusName(),
                      );
                      setFormData((prev) => ({ ...prev, ...restored }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        [
                          'appointmentDate',
                          'appointmentTime',
                          'appointmentVisitType',
                          'appointmentDepartment',
                          'appointmentProvider',
                          'appointmentStartTime',
                          'appointmentEndTime',
                        ].forEach((key) => delete next[key]);
                        return next;
                      });
                    }}
                  >
                    Cancel edit
                  </Button>
                )}
              </div>

              {appointmentScheduleSummary.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    Appointment summary
                  </p>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {appointmentScheduleSummary.map((item) => (
                      <div key={item.label} className="min-w-0">
                        <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd className="truncate text-sm font-medium text-foreground">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {appointmentFormReadOnly ? (
                <div className="rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm">
                  <PatientRegistrationAppointmentFields
                    idPrefix="patient-reg"
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    readOnly
                    timeSlotOptions={scheduleTimeSlotOptions}
                    showAppointmentStatus
                    statusOptions={statusSelectOptions}
                    hideReferralSection
                    showReferringPhysicianSection
                    departmentOptions={departmentOptions}
                    providerOptions={registrationProviderOptions}
                    appointmentTypeOptions={registrationAppointmentTypeOptions}
                    scheduleTypesLoading={scheduleTypesLoading}
                    hasProviderSchedules={hasProviderSchedules}
                    availableDates={availableDates}
                    availableDatesLoading={availableDatesLoading}
                    availabilityError={availabilityError}
                    referringProviders={careProviders}
                  />
                </div>
              ) : (
              <EpicScheduleAppointmentFields
                idPrefix="patient-reg"
                formData={formData}
                errors={errors}
                onChange={handleChange}
                timeSlotOptions={scheduleTimeSlotOptions}
                showAppointmentStatus={false}
                statusOptions={statusSelectOptions}
                departmentOptions={departmentOptions}
                providerOptions={registrationProviderOptions}
                appointmentTypeOptions={registrationAppointmentTypeOptions}
                scheduleTypesLoading={scheduleTypesLoading}
                hasProviderSchedules={hasProviderSchedules}
                availableDates={availableDates}
                availableDatesLoading={availableDatesLoading}
                availabilityError={availabilityError}
                referringProviders={careProviders}
              />
              )}
              </>
              )}
            </TabsContent>
            )}

            {/* TAB 4: Insurance Info */}
            <TabsContent value="insurance" className="space-y-4 mt-3">
              {activeTab === 'insurance' && (
              <>
              {/* Billing Type */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <RequiredFieldLabel htmlFor="insuranceBillingType">Billing Type</RequiredFieldLabel>
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
                        ...(billingType === 'insurance' ? { insuranceType: 'primary' } : {}),
                      }));
                      if (errors.insuranceBillingType) {
                        setErrors((prev) => ({ ...prev, insuranceBillingType: null }));
                      }
                      if (billingType !== 'self-pay' && errors.paymentMethod) {
                        setErrors((prev) => ({ ...prev, paymentMethod: null }));
                      }
                    }}
                  >
                    <SelectTrigger id="insuranceBillingType" className={`w-full max-w-xs ${errors.insuranceBillingType ? 'border-destructive' : ''}`}>
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
                  {errors.insuranceBillingType && (
                    <p className="text-xs text-destructive">{errors.insuranceBillingType}</p>
                  )}
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

              {formData.insuranceBillingType === 'insurance' && (
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Insurance policies</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter primary coverage (required for insurance billing). Secondary and tertiary are optional.
                    </p>
                  </div>
                  <PatientInsuranceAccordions
                    insuranceForms={insuranceForms}
                    onEntryChange={handleInsuranceEntryChange}
                    onEntryChangeMany={handleInsuranceEntryChangeMany}
                    patientDemographics={formData}
                    insuranceProviders={insuranceProviders}
                    loadingProviders={loadingProviders}
                    errors={errors}
                    disabled={isLoading}
                    onUploadDocuments={setInsuranceUploadType}
                  />
                </div>
              )}
              </>
              )}

            </TabsContent>

            {!isQuickRegistration && (
            <>
            {/* TAB 5: Documents */}
            <TabsContent value="documents" className="space-y-4 mt-3">
              {activeTab === 'documents' && (
              <>
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
                activeInsuranceTypes={activeInsuranceTypes}
              />
              </>
              )}
            </TabsContent>

            {/* TAB 6: Consent Forms */}
            <TabsContent value="consentForms" className="space-y-4 mt-3">
              {activeTab === 'consentForms' && (
              <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Consent Forms</h3>
                <p className="text-sm text-muted-foreground">
                  Review and sign consent forms configured in administration. Forms marked with{' '}
                  <span className="text-destructive font-medium">*</span> are mandatory for registration completion.
                  You may continue without signing; registration will remain pending until required forms are signed.
                </p>
              </div>

              {consentFormsError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  {consentFormsError}
                </div>
              )}

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signed By</TableHead>
                      <TableHead>Signed At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consentFormsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Loading consent forms...
                        </TableCell>
                      </TableRow>
                    ) : consentForms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          No active consent forms found. Add forms in Administration → Consent Forms.
                        </TableCell>
                      </TableRow>
                    ) : (
                      consentForms.map((form) => {
                        const sig = consentSignatures[form.id];
                        const isSigned = !!sig?.signedAt;
                        return (
                          <TableRow key={form.id}>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="font-medium">
                                  <ConsentFormName form={form} />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Version {form.versionNumber || '—'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                                {formatConsentType(form.consentType)}
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
                                {isSigned ? 'View / Re-sign' : 'Read and Sign'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              </>
              )}

              <Dialog
                open={consentDialogOpen}
                onOpenChange={(open) => {
                  if (!open) closeConsentDialog();
                }}
              >
                <DialogContent className="min-w-[800px] w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {activeConsentForm ? <ConsentFormName form={activeConsentForm} /> : 'Consent Form'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Review and sign the selected consent form for this patient.
                    </DialogDescription>
                  </DialogHeader>

                  {activeConsentForm ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            Type:{' '}
                            <span className="text-foreground font-medium">
                              {formatConsentType(activeConsentForm.consentType)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Version:{' '}
                            <span className="text-foreground font-medium">
                              {activeConsentForm.versionNumber || '—'}
                            </span>
                          </div>
                        </div>

                        {activeConsentForm.description ? (
                          <p className="text-sm text-muted-foreground">{activeConsentForm.description}</p>
                        ) : null}

                        <div
                          className="rounded-lg border bg-muted/20 p-4 prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-headings:text-foreground"
                          dangerouslySetInnerHTML={{
                            __html:
                              activeConsentForm.consentContent ||
                              '<p class="text-muted-foreground">No content.</p>',
                          }}
                        />
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground">Signature</div>
                            <div className="text-sm text-muted-foreground">
                              {requiresGuarantorSignature
                                ? 'Guarantor signature required for patients under 6 years old.'
                                : 'Choose a signature method below, then sign.'}
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
            <TabsContent value="review" className="space-y-4 mt-3">
              {activeTab === 'review' && (
              <>
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
                <p className="text-sm text-muted-foreground">Billing type and primary insurance summary</p>
                <ReviewGrid items={insuranceReviewItems} />
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-foreground">Insurance policies</p>
                  {insuranceList.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-3">
                      No insurance policies entered
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
                        <TableHead>Type</TableHead>
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
                            <TableCell className="font-medium">
                              <ConsentFormName form={form} />
                            </TableCell>
                            <TableCell>{formatConsentType(form.consentType)}</TableCell>
                            <TableCell>{form.versionNumber || '—'}</TableCell>
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
                    No documents uploaded
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
              </>
              )}
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

          <InsuranceCardUploadModal
            open={Boolean(insuranceUploadType)}
            onOpenChange={(open) => {
              if (!open) setInsuranceUploadType(null);
            }}
            insuranceType={insuranceUploadType}
            onSave={handleInsuranceDocumentsSave}
          />

          <DuplicatePatientAlert
            open={duplicateMatches.length > 0 && !duplicateDismissed && !patient?.id}
            duplicates={duplicateMatches}
            onCancelAndContinue={() => setDuplicateDismissed(true)}
            onOpenRegisteredPatient={(match) => onNavigateToExisting?.(match)}
          />
        </form>
  );
});

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSubmit,
  isLoading,
  registrationMode = 'full',
  onNavigateToExisting,
  submitError = null,
}) {
  const isQuickRegistration = registrationMode === 'quick';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeOnOverlayClick={false}
        closeButtonClassName="rounded-md bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-[var(--primary-hover)] hover:text-primary-foreground"
        className={
          isQuickRegistration
            ? 'max-h-[90vh] w-[min(calc(100vw-2rem),1080px)] overflow-y-auto max-sm:min-w-0 sm:min-w-[720px] sm:max-w-[1080px]'
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
          <DialogDescription className="sr-only">
            {patient
              ? 'Update patient demographics and insurance information.'
              : isQuickRegistration
                ? 'Enter required patient demographics and billing type to create a patient for scheduling.'
                : 'Enter patient demographics, contacts, insurance, and consent information.'}
          </DialogDescription>
        </DialogHeader>
        <PatientFormContent
          patient={patient}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
          isOpen={open}
          registrationMode={registrationMode}
          onNavigateToExisting={onNavigateToExisting}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  );
}
