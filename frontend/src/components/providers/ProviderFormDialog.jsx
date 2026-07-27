import { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departmentApi, specialtyApi, subSpecialtyApi } from '@/services/api';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { MultiSelect } from '@/components/ui/multi-select';
import { validatePhoneNumber } from '@/lib/phoneNumberUtils';

const FORM_NONE = '__none__';

const initialFormData = {
  npi: '',
  initials: '',
  firstName: '',
  lastName: '',
  middleName: '',
  gender: '',
  dateOfBirth: '',
  specialtyId: '',
  subSpecialtyId: '',
  departmentIds: [],
  taxonomy: '',
  email: '',
  taxId: '',
  group: '',
  deaNumber: '',
  deaEffectiveDate: '',
  deaExpiryDate: '',
  stateLicenseNumber: '',
  stateLicenseEffectiveDate: '',
  stateLicenseExpiryDate: '',
  csrLicenseNumber: '',
  csrExpiryDate: '',
  mobileNumber: '',
  degree: '',
  experience: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  treatment: '',
  cprsTabEffectiveDate: '',
};

const dateFields = [
  'dateOfBirth',
  'deaEffectiveDate',
  'deaExpiryDate',
  'stateLicenseEffectiveDate',
  'stateLicenseExpiryDate',
  'csrExpiryDate',
  'cprsTabEffectiveDate',
];

const fieldClass = 'w-full min-w-0';
const sectionTitleClass = 'text-sm font-semibold text-foreground border-b border-border pb-2 mb-3';

function toDateInputValue(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function fkTrim(v) {
  if (!v || v === FORM_NONE) return '';
  return String(v).trim();
}

/** Collect department UUIDs from any shape the provider API may return. */
function extractProviderDepartmentIds(provider) {
  if (!provider) return [];
  const ids = [];

  if (Array.isArray(provider.departmentIds)) {
    provider.departmentIds.forEach((id) => {
      const trimmed = fkTrim(id);
      if (trimmed) ids.push(trimmed);
    });
  }

  if (Array.isArray(provider.departments)) {
    provider.departments.forEach((d) => {
      const trimmed = fkTrim(d?.id);
      if (trimmed) ids.push(trimmed);
    });
  }

  if (Array.isArray(provider.departmentLinks)) {
    provider.departmentLinks.forEach((link) => {
      const trimmed = fkTrim(link?.departmentId ?? link?.department?.id);
      if (trimmed) ids.push(trimmed);
    });
  }

  const legacy = fkTrim(provider.departmentId ?? provider.department?.id);
  if (legacy) ids.push(legacy);

  return [...new Set(ids)];
}

function mapProviderToForm(provider) {
  if (!provider) return initialFormData;

  const specialtyId = fkTrim(provider.specialtyId ?? provider.specialty?.id);
  const subSpecialtyId = fkTrim(provider.subSpecialtyId ?? provider.subSpecialty?.id);
  const departmentIds = extractProviderDepartmentIds(provider);

  return {
    ...initialFormData,
    npi: provider.npi ?? '',
    initials: provider.initials ?? '',
    firstName: provider.firstName ?? '',
    lastName: provider.lastName ?? '',
    middleName: provider.middleName ?? '',
    gender: provider.gender ?? '',
    dateOfBirth: toDateInputValue(provider.dateOfBirth),
    specialtyId,
    subSpecialtyId,
    departmentIds,
    taxonomy: provider.taxonomy ?? '',
    email: provider.email ?? '',
    taxId: provider.taxId ?? '',
    group: provider.group ?? '',
    deaNumber: provider.deaNumber ?? '',
    deaEffectiveDate: toDateInputValue(provider.deaEffectiveDate),
    deaExpiryDate: toDateInputValue(provider.deaExpiryDate),
    stateLicenseNumber: provider.stateLicenseNumber ?? '',
    stateLicenseEffectiveDate: toDateInputValue(provider.stateLicenseEffectiveDate),
    stateLicenseExpiryDate: toDateInputValue(provider.stateLicenseExpiryDate),
    csrLicenseNumber: provider.csrLicenseNumber ?? '',
    csrExpiryDate: toDateInputValue(provider.csrExpiryDate),
    mobileNumber: provider.mobileNumber ?? '',
    degree: provider.degree ?? '',
    experience: provider.experience ?? '',
    address: provider.address ?? '',
    city: provider.city ?? '',
    state: provider.state ?? '',
    zip: provider.zip ?? '',
    treatment: provider.treatment ?? '',
    cprsTabEffectiveDate: toDateInputValue(provider.cprsTabEffectiveDate),
  };
}

function buildProviderSubmitPayload(formData) {
  const specialtyId = fkTrim(formData.specialtyId);
  const subSpecialtyId = fkTrim(formData.subSpecialtyId);
  const departmentIds = Array.isArray(formData.departmentIds)
    ? [...new Set(formData.departmentIds.map((id) => fkTrim(id)).filter(Boolean))]
    : [];

  const out = {
    npi: String(formData.npi || '').trim(),
    initials: formData.initials?.trim() || null,
    firstName: formData.firstName?.trim(),
    lastName: formData.lastName?.trim(),
    middleName: formData.middleName?.trim() || null,
    gender: formData.gender?.trim(),
    taxonomy: formData.taxonomy?.trim() || null,
    email: formData.email?.trim() || null,
    taxId: formData.taxId?.trim(),
    group: formData.group?.trim() || null,
    deaNumber: formData.deaNumber?.trim() || null,
    stateLicenseNumber: formData.stateLicenseNumber?.trim() || null,
    csrLicenseNumber: formData.csrLicenseNumber?.trim() || null,
    mobileNumber: (() => {
      const result = validatePhoneNumber(formData.mobileNumber);
      return result.normalized ?? (formData.mobileNumber?.trim() || null);
    })(),
    degree: formData.degree?.trim() || null,
    experience: formData.experience?.trim() || null,
    address: formData.address?.trim() || null,
    city: formData.city?.trim() || null,
    state: formData.state?.trim() || null,
    zip: formData.zip?.trim() || null,
    treatment: formData.treatment?.trim() || null,
    specialtyId: specialtyId || null,
    subSpecialtyId: subSpecialtyId || null,
    departmentIds,
    departmentId: departmentIds[0] || null,
  };

  for (const k of dateFields) {
    out[k] = formData[k] ? formData[k] : null;
  }

  return out;
}

export function ProviderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  provider,
  mode = 'create',
  submitError = null,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [specialties, setSpecialties] = useState([]);
  const [subSpecialties, setSubSpecialties] = useState([]);
  const [departments, setDepartments] = useState([]);

  const readOnly = mode === 'view';
  const title = useMemo(() => {
    if (mode === 'edit') return 'Edit Provider';
    if (mode === 'view') return 'View Provider';
    return 'Add Provider';
  }, [mode]);
  const submitLabel = mode === 'edit' ? 'Save Updates' : 'Create Provider';

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      if (!open) return;
      try {
        const [specRes, deptRes] = await Promise.all([specialtyApi.getActive(), departmentApi.getActive()]);
        if (cancelled) return;
        setSpecialties(Array.isArray(specRes.data) ? specRes.data : []);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      } catch {
        if (!cancelled) {
          setSpecialties([]);
          setDepartments([]);
        }
      }
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubs() {
      if (!open) return;
      const sid = fkTrim(formData.specialtyId);
      if (!sid) {
        setSubSpecialties([]);
        return;
      }
      try {
        const res = await subSpecialtyApi.getAll({ specialtyId: sid, limit: 100, isActive: true });
        if (cancelled) return;
        setSubSpecialties(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setSubSpecialties([]);
      }
    }
    loadSubs();
    return () => {
      cancelled = true;
    };
  }, [open, formData.specialtyId]);

  useEffect(() => {
    if (open) {
      setFormData(mapProviderToForm(provider));
      setErrors({});
    }
  }, [open, provider]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const required = ['npi', 'firstName', 'lastName', 'gender', 'taxId'];
    const newErrors = {};
    required.forEach((key) => {
      const v = formData[key];
      if (v == null || String(v).trim() === '') {
        const labels = {
          npi: 'NPI',
          firstName: 'First name',
          lastName: 'Last name',
          gender: 'Gender',
          taxId: 'Tax ID',
        };
        newErrors[key] = `${labels[key] || key} is required`;
      }
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    const mobileResult = validatePhoneNumber(formData.mobileNumber);
    if (!mobileResult.valid) {
      newErrors.mobileNumber = mobileResult.message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    if (!validate()) return;
    onSubmit(buildProviderSubmitPayload(formData));
  };

  const specVal = fkTrim(formData.specialtyId) || FORM_NONE;
  const subVal = fkTrim(formData.subSpecialtyId) || FORM_NONE;

  // Active catalog + any departments already assigned on the provider (so edit always shows selection).
  const departmentOptions = useMemo(() => {
    const byId = new Map();
    departments.forEach((d) => {
      const id = fkTrim(d.id);
      if (!id) return;
      byId.set(id, {
        value: id,
        label: d.departmentCode ? `${d.departmentName} (${d.departmentCode})` : d.departmentName,
      });
    });
    (provider?.departments || []).forEach((d) => {
      const id = fkTrim(d?.id);
      if (!id || byId.has(id)) return;
      byId.set(id, {
        value: id,
        label: d.departmentCode ? `${d.departmentName} (${d.departmentCode})` : d.departmentName || id,
      });
    });
    if (provider?.department?.id) {
      const id = fkTrim(provider.department.id);
      if (id && !byId.has(id)) {
        byId.set(id, {
          value: id,
          label: provider.department.departmentCode
            ? `${provider.department.departmentName} (${provider.department.departmentCode})`
            : provider.department.departmentName || id,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [departments, provider]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="ehr-form space-y-4">
          {submitError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {submitError}
            </div>
          ) : null}

          {/* Basic information */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>Basic information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="npi">NPI *</Label>
                <Input
                  id="npi"
                  value={formData.npi}
                  onChange={(e) => handleChange('npi', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                  aria-invalid={!!errors.npi}
                />
                {errors.npi && <p className="text-xs text-destructive">{errors.npi}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="initials">Initials</Label>
                <Input
                  id="initials"
                  value={formData.initials}
                  onChange={(e) => handleChange('initials', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)} disabled={readOnly || isLoading}>
                  <SelectTrigger className={fieldClass} aria-invalid={!!errors.gender} disabled={readOnly || isLoading}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="dont_want_to_answer">Don&apos;t want to answer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">DOB</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* Specialty & department */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>Specialty & department</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={specVal}
                  onValueChange={(v) => {
                    const id = v === FORM_NONE ? '' : v;
                    setFormData((prev) => ({ ...prev, specialtyId: id, subSpecialtyId: '' }));
                    if (errors.specialtyId) setErrors((e) => ({ ...e, specialtyId: null }));
                  }}
                  disabled={readOnly || isLoading}
                >
                  <SelectTrigger className={fieldClass} disabled={readOnly || isLoading}>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value={FORM_NONE}>None</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code ? `${s.name} (${s.code})` : s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-specialty</Label>
                <Select
                  value={subVal}
                  onValueChange={(v) => handleChange('subSpecialtyId', v === FORM_NONE ? '' : v)}
                  disabled={readOnly || isLoading || !fkTrim(formData.specialtyId)}
                >
                  <SelectTrigger className={fieldClass} disabled={readOnly || isLoading || !fkTrim(formData.specialtyId)}>
                    <SelectValue
                      placeholder={fkTrim(formData.specialtyId) ? 'Select sub-specialty' : 'Select a specialty first'}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value={FORM_NONE}>None</SelectItem>
                    {subSpecialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code ? `${s.name} (${s.code})` : s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department(s)</Label>
                <MultiSelect
                  options={departmentOptions}
                  value={formData.departmentIds}
                  onChange={(departmentIds) => handleChange('departmentIds', departmentIds)}
                  placeholder="Select department(s)"
                  searchable
                  showSelectAll
                  selectAllLabel="Select all departments"
                  disabled={readOnly || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxonomy">Taxonomy</Label>
                <Input
                  id="taxonomy"
                  value={formData.taxonomy}
                  onChange={(e) => handleChange('taxonomy', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* Contact & billing */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>Contact & billing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID *</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                  aria-invalid={!!errors.taxId}
                />
                {errors.taxId && <p className="text-xs text-destructive">{errors.taxId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Input
                  id="group"
                  value={formData.group}
                  onChange={(e) => handleChange('group', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* DEA */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>DEA</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deaNumber">Provider DEA number</Label>
                <Input
                  id="deaNumber"
                  value={formData.deaNumber}
                  onChange={(e) => handleChange('deaNumber', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deaEffectiveDate">DEA effective date</Label>
                <Input
                  id="deaEffectiveDate"
                  type="date"
                  value={formData.deaEffectiveDate}
                  onChange={(e) => handleChange('deaEffectiveDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deaExpiryDate">DEA expiry date</Label>
                <Input
                  id="deaExpiryDate"
                  type="date"
                  value={formData.deaExpiryDate}
                  onChange={(e) => handleChange('deaExpiryDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* State license */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>State license</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stateLicenseNumber">State license number</Label>
                <Input
                  id="stateLicenseNumber"
                  value={formData.stateLicenseNumber}
                  onChange={(e) => handleChange('stateLicenseNumber', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateLicenseEffectiveDate">State license effective date</Label>
                <Input
                  id="stateLicenseEffectiveDate"
                  type="date"
                  value={formData.stateLicenseEffectiveDate}
                  onChange={(e) => handleChange('stateLicenseEffectiveDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateLicenseExpiryDate">State license expiry date</Label>
                <Input
                  id="stateLicenseExpiryDate"
                  type="date"
                  value={formData.stateLicenseExpiryDate}
                  onChange={(e) => handleChange('stateLicenseExpiryDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* CSR license */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>CSR license</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="csrLicenseNumber">CSR license number</Label>
                <Input
                  id="csrLicenseNumber"
                  value={formData.csrLicenseNumber}
                  onChange={(e) => handleChange('csrLicenseNumber', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="csrExpiryDate">CSR expiry date</Label>
                <Input
                  id="csrExpiryDate"
                  type="date"
                  value={formData.csrExpiryDate}
                  onChange={(e) => handleChange('csrExpiryDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* Profile & address */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>Profile & address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile number</Label>
                <PhoneNumberInput
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(v) => handleChange('mobileNumber', v)}
                  disabled={readOnly || isLoading}
                  inputClassName={fieldClass}
                  error={errors.mobileNumber}
                  placeholder="(201) 555-0123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => handleChange('degree', e.target.value)}
                  placeholder="e.g. MD, DO"
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="e.g. 10 years"
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          {/* Treatment & CPRS */}
          <section className="space-y-4">
            <h3 className={sectionTitleClass}>Treatment & system</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Treatment</Label>
                <Select value={formData.treatment} onValueChange={(v) => handleChange('treatment', v)} disabled={readOnly || isLoading}>
                  <SelectTrigger className={fieldClass} disabled={readOnly || isLoading}>
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cprsTabEffectiveDate">CPRS Tab effective date</Label>
                <Input
                  id="cprsTabEffectiveDate"
                  type="date"
                  value={formData.cprsTabEffectiveDate}
                  onChange={(e) => handleChange('cprsTabEffectiveDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          <DialogFooter className="gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : submitLabel}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
