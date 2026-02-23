import { useState, useEffect } from 'react';
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
import { insuranceProviderApi } from '@/services/api';

const initialFormData = {
  // Patient Info
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  homePhone: '',
  workPhone: '',
  cellPhone: '',
  referredBy: '',
  generalNotes: '',
  ethnicity: '',
  language: '',
  race: '',
  sexualOrientation: '',
  interpreterRequired: false,
  interpreterLanguageRequired: '',
  fromLanguage: '',
  toLanguage: '',
  // Emergency Contact (moved to Contacts tab)
  emergencyContactName: '',
  emergencyContactNumber: '',
  // Guarantor Contact
  guarantorContactName: '',
  guarantorContactNumber: '',
  // Secondary Contact
  // Primary Next of Kin
  primaryNextOfKinName: '',
  primaryNextOfKinRelationship: '',
  primaryNextOfKinPhone: '',
  maritalStatus: '',
  employmentStatus: '',
  employerName: '',
  occupation: '',
  employerPhoneNumber: '',
  employerAddress: '',
  preferredLanguage: '',
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
  coverageStartDate: '',
  coverageEndDate: '',
  copay: '',
  deductible: '',
  coinsurancePercentage: '',
  authorizationRequired: '',
  authorizationNumber: '',
  // Billing Info
  billingType: '',
  guarantorName: '',
  guarantorRelationship: '',
  guarantorPhone: '',
  guarantorEmail: '',
  paymentMethod: '',
  billingNotes: '',
  accountBalance: '',
};

// Static sample data
const sampleInsuranceList = [
  {
    id: 1,
    insuranceType: 'Primary',
    payerName: 'Blue Cross Blue Shield',
    coverageDate: '2024-01-01',
    effectiveDate: '2024-01-01',
  },
  {
    id: 2,
    insuranceType: 'Secondary',
    payerName: 'Medicare',
    coverageDate: '2024-06-01',
    effectiveDate: '2024-06-01',
  },
];

const sampleDocuments = [
  {
    id: 1,
    documentName: 'Driver License',
    documentCategory: 'ID Proof',
    fileName: 'driver-license.pdf',
  },
  {
    id: 2,
    documentName: 'Insurance Card',
    documentCategory: 'Insurance',
    fileName: 'insurance-card.jpg',
  },
  {
    id: 3,
    documentName: 'Lab Report - CBC',
    documentCategory: 'Lab Report',
    fileName: 'lab-cbc.pdf',
  },
];

export function PatientFormDialog({ open, onOpenChange, patient, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [activeTab, setActiveTab] = useState('patient');
  const [documents, setDocuments] = useState(sampleDocuments);
  const [insuranceList, setInsuranceList] = useState(sampleInsuranceList);
  const [newDocument, setNewDocument] = useState({
    documentCategory: '',
    documentName: '',
    file: null,
  });

  const isEditing = !!patient;

  // Fetch insurance providers on mount
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

    if (open) {
      fetchProviders();
    }
  }, [open]);

  useEffect(() => {
    if (patient) {
      setFormData({
        lastName: patient.lastName || '',
        firstName: patient.firstName || '',
        middleName: patient.middleName || '',
        suffix: patient.suffix || '',
        gender: patient.gender || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        email: patient.email || '',
        address: patient.address || '',
        city: patient.city || '',
        state: patient.state || '',
        zip: patient.zip || '',
        homePhone: patient.homePhone || '',
        workPhone: patient.workPhone || '',
        cellPhone: patient.cellPhone || patient.contactNumber || '',
        referredBy: patient.referredBy || '',
        generalNotes: patient.generalNotes || '',
        ethnicity: patient.ethnicity || '',
        language: patient.language || '',
        race: patient.race || '',
        sexualOrientation: patient.sexualOrientation || '',
        interpreterRequired: patient.interpreterRequired || false,
        interpreterLanguageRequired: patient.interpreterLanguageRequired || '',
        fromLanguage: patient.fromLanguage || '',
        toLanguage: patient.toLanguage || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactNumber: patient.emergencyContactNumber || patient.emergencyContactPhone || '',
        guarantorContactName: patient.guarantorContactName || patient.guarantorName || '',
        guarantorContactNumber: patient.guarantorContactNumber || patient.guarantorPhone || '',
        primaryNextOfKinName: patient.primaryNextOfKinName || '',
        primaryNextOfKinRelationship: patient.primaryNextOfKinRelationship || '',
        primaryNextOfKinPhone: patient.primaryNextOfKinPhone || '',
        maritalStatus: patient.maritalStatus || '',
        employmentStatus: patient.employmentStatus || '',
        employerName: patient.employerName || '',
        occupation: patient.occupation || '',
        employerPhoneNumber: patient.employerPhoneNumber || '',
        employerAddress: patient.employerAddress || '',
        preferredLanguage: patient.preferredLanguage || '',
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
        coverageStartDate: patient.coverageStartDate ? patient.coverageStartDate.split('T')[0] : '',
        coverageEndDate: patient.coverageEndDate ? patient.coverageEndDate.split('T')[0] : '',
        copay: patient.copay || '',
        deductible: patient.deductible || '',
        coinsurancePercentage: patient.coinsurancePercentage || '',
        authorizationRequired: patient.authorizationRequired || '',
        authorizationNumber: patient.authorizationNumber || '',
        billingType: patient.billingType || '',
        guarantorName: patient.guarantorName || '',
        guarantorRelationship: patient.guarantorRelationship || '',
        guarantorPhone: patient.guarantorPhone || '',
        guarantorEmail: patient.guarantorEmail || '',
        paymentMethod: patient.paymentMethod || '',
        billingNotes: patient.billingNotes || '',
        accountBalance: patient.accountBalance || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setActiveTab('patient');
  }, [patient, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields only
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.zip?.trim()) newErrors.zip = 'Zip is required';

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
    
    // Validate phone formats (basic)
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    if (formData.homePhone && !phoneRegex.test(formData.homePhone)) {
      newErrors.homePhone = 'Invalid phone number format';
    }
    if (formData.workPhone && !phoneRegex.test(formData.workPhone)) {
      newErrors.workPhone = 'Invalid phone number format';
    }
    if (formData.cellPhone && !phoneRegex.test(formData.cellPhone)) {
      newErrors.cellPhone = 'Invalid phone number format';
    }
    if (formData.emergencyContactNumber && !phoneRegex.test(formData.emergencyContactNumber)) {
      newErrors.emergencyContactNumber = 'Invalid phone number format';
    }
    if (formData.guarantorPhone && !phoneRegex.test(formData.guarantorPhone)) {
      newErrors.guarantorPhone = 'Invalid phone number format';
    }
    if (formData.employerPhoneNumber && !phoneRegex.test(formData.employerPhoneNumber)) {
      newErrors.employerPhoneNumber = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      // Switch to patient tab if there are errors
      setActiveTab('patient');
      return;
    }

    const submitData = { ...formData };
    
    // Map cellPhone to contactNumber for API compatibility
    if (submitData.cellPhone) {
      submitData.contactNumber = submitData.cellPhone;
    }
    
    // Convert empty strings to null for optional fields
    Object.keys(submitData).forEach((key) => {  
      if (submitData[key] === '') {
        submitData[key] = null;
      }
    });

    // Convert numeric fields
    if (submitData.copay) submitData.copay = parseFloat(submitData.copay);
    if (submitData.deductible) submitData.deductible = parseFloat(submitData.deductible);
    if (submitData.coinsurancePercentage) submitData.coinsurancePercentage = parseFloat(submitData.coinsurancePercentage);
    if (submitData.accountBalance) submitData.accountBalance = parseFloat(submitData.accountBalance);

    // Map insuranceCompany to insuranceProviderId for API compatibility
    if (submitData.insuranceCompany) {
      submitData.insuranceProviderId = submitData.insuranceCompany;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="min-w-[700px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patient">Patient Info</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="insurance">Insurance Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* TAB 1: Patient Info */}
            <TabsContent value="patient" className="space-y-6 mt-4">
              {/* Basic Patient Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Basic Patient Information</h3>
                
                {/* Row 1: First Name, Middle Name, Last Name, Suffix */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
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
                    <Label htmlFor="lastName">Last Name *</Label>
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

                {/* Row 2: Gender, DOB, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
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
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
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

                {/* Row 3: Address (100% width) */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
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

                {/* Row 4: City, State, Zip (required) */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip *</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => handleChange('zip', e.target.value)}
                      className={errors.zip ? 'border-destructive' : ''}
                    />
                    {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
                  </div>
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
              </div>

              {/* Admission Details Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Admission Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="referredBy">Referred By</Label>
                    <Input
                      id="referredBy"
                      value={formData.referredBy}
                      onChange={(e) => handleChange('referredBy', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generalNotes">General Notes</Label>
                  <Textarea
                    id="generalNotes"
                    value={formData.generalNotes}
                    onChange={(e) => handleChange('generalNotes', e.target.value)}
                    rows={3}
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
                  <div className="grid grid-cols-3 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="fromLanguage">From Language</Label>
                      <Select
                        value={formData.fromLanguage}
                        onValueChange={(value) => handleChange('fromLanguage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toLanguage">To Language</Label>
                      <Select
                        value={formData.toLanguage}
                        onValueChange={(value) => handleChange('toLanguage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
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
                    <div className="space-y-2">
                      <Label htmlFor="employerAddress">Employer Address</Label>
                      <Textarea
                        id="employerAddress"
                        value={formData.employerAddress}
                        onChange={(e) => handleChange('employerAddress', e.target.value)}
                        placeholder="Enter employer address"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredLanguage">Preferred Language</Label>
                    <Input
                      id="preferredLanguage"
                      value={formData.preferredLanguage}
                      onChange={(e) => handleChange('preferredLanguage', e.target.value)}
                    />
                  </div>
                </div>
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
            </TabsContent>

            {/* TAB 2: Contacts */}
            <TabsContent value="contacts" className="space-y-6 mt-4">
              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactNumber">Emergency Contact Number</Label>
                    <Input
                      id="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
                      placeholder="(123) 123-1234"
                      className={errors.emergencyContactNumber ? 'border-destructive' : ''}
                    />
                    {errors.emergencyContactNumber && (
                      <p className="text-xs text-destructive">{errors.emergencyContactNumber}</p>
                    )}
                  </div>
                </div>
              </div>

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

            {/* TAB 3: Insurance Info */}
            <TabsContent value="insurance" className="space-y-6 mt-4">
              {/* Billing Type Dropdown */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceBillingType">Billing Type</Label>
                  <Select
                    value={formData.insuranceBillingType || ''}
                    onValueChange={(value) => handleChange('insuranceBillingType', value)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="self-pay">Self Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Show message if Self Pay is selected */}
              {formData.insuranceBillingType === 'self-pay' && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Self Pay selected. No insurance information required.
                  </p>
                </div>
              )}

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
                <div className="space-y-2">
                  <Label htmlFor="subscriberAddress">Subscriber Address</Label>
                  <Input
                    id="subscriberAddress"
                    value={formData.subscriberAddress}
                    onChange={(e) => handleChange('subscriberAddress', e.target.value)}
                  />
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
                                      <Button variant="ghost" size="sm">
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

            {/* TAB 4: Documents */}
            <TabsContent value="documents" className="space-y-6 mt-4">
              {/* Document Upload Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Upload Document</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentCategory">Document Category</Label>
                    <Select
                      value={newDocument.documentCategory}
                      onValueChange={(value) =>
                        setNewDocument({ ...newDocument, documentCategory: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ID Proof">ID Proof</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Lab Report">Lab Report</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentName">Document Name</Label>
                    <Input
                      id="documentName"
                      value={newDocument.documentName}
                      onChange={(e) =>
                        setNewDocument({ ...newDocument, documentName: e.target.value })
                      }
                      placeholder="Enter document name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">File Upload</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="fileUpload"
                        type="file"
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            file: e.target.files[0],
                            fileName: e.target.files[0]?.name || '',
                          })
                        }
                        className="cursor-pointer"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newDocument.documentName && newDocument.documentCategory) {
                            const doc = {
                              id: Date.now(),
                              documentName: newDocument.documentName,
                              documentCategory: newDocument.documentCategory,
                              fileName: newDocument.fileName || 'uploaded-file.pdf',
                            };
                            setDocuments([doc, ...documents]);
                            setNewDocument({ documentCategory: '', documentName: '', file: null });
                          }
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Listing */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Uploaded Documents</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Document Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                            No documents uploaded
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{doc.documentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                                {doc.documentCategory}
                              </span>
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
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
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
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Saving...' : isEditing ? 'Update Patient' : 'Create Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
