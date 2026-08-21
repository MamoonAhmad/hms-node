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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { departmentApi, specialtyApi, subSpecialtyApi } from '@/services/api';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { US_STATES } from '@/lib/usStates';
import { cn } from '@/lib/utils';
import {
  FORM_NONE,
  STEPS,
  STEP_TITLES,
  NPI_TYPE_OPTIONS,
  SUFFIX_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  DEGREE_OPTIONS,
  GENDER_OPTIONS,
  TAX_ID_TYPE_OPTIONS,
  TREATMENT_OPTIONS,
  initialFormData,
  fkTrim,
  mapProviderToForm,
  buildProviderSubmitPayload,
  validateProviderStep,
  validateAllProviderSteps,
  firstInvalidStep,
  catalogLabel,
  reviewValue,
  formatReviewState,
  displayOptionLabel,
} from './providerFormModel';

const fieldClass = 'w-full min-w-0';
const LAST_STEP = STEPS.length - 1;

function Field({ id, label, required, error, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ReviewSection({ title, stepIndex, onEdit, showEdit, children }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {showEdit && (
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => onEdit(stepIndex)}>
            Edit
          </Button>
        )}
      </div>
      <dl>{children}</dl>
    </section>
  );
}

export function ProviderFormDialog({ open, onOpenChange, onSubmit, isLoading, provider, mode = 'create' }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
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

  const degreeOptions = useMemo(() => {
    if (formData.degree && !DEGREE_OPTIONS.some((o) => o.value === formData.degree)) {
      return [{ value: formData.degree, label: formData.degree }, ...DEGREE_OPTIONS];
    }
    return DEGREE_OPTIONS;
  }, [formData.degree]);

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
      setStep(0);
    }
  }, [open, provider]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const goToStep = (next) => {
    setErrors({});
    setStep(next);
  };

  const handleNext = () => {
    if (readOnly) {
      setStep((s) => Math.min(s + 1, LAST_STEP));
      return;
    }
    const stepErrors = validateProviderStep(step, formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((s) => Math.min(s + 1, LAST_STEP));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    if (step !== LAST_STEP) {
      handleNext();
      return;
    }
    const allErrors = validateAllProviderSteps(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const invalid = firstInvalidStep(formData);
      if (invalid >= 0) setStep(invalid);
      return;
    }
    onSubmit(buildProviderSubmitPayload(formData));
  };

  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
    if (readOnly || step < LAST_STEP) {
      e.preventDefault();
      if (!readOnly) handleNext();
    }
  };

  const specVal = fkTrim(formData.specialtyId) || FORM_NONE;
  const subVal = fkTrim(formData.subSpecialtyId) || FORM_NONE;
  const deptVal = fkTrim(formData.departmentId) || FORM_NONE;
  const disabled = readOnly || isLoading;

  const renderIdentity = () => (
    <div className="grid grid-cols-2 gap-4">
      <Field id="npi" label="NPI" required error={errors.npi}>
        <Input
          id="npi"
          value={formData.npi}
          onChange={(e) => handleChange('npi', e.target.value.replace(/\D/g, '').slice(0, 10))}
          disabled={disabled}
          className={fieldClass}
          inputMode="numeric"
          placeholder="##########"
          aria-invalid={!!errors.npi}
        />
      </Field>
      <Field id="npiType" label="NPI type">
        <Select value={formData.npiType || FORM_NONE} onValueChange={(v) => handleChange('npiType', v === FORM_NONE ? '' : v)} disabled={disabled}>
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="Select NPI type" />
          </SelectTrigger>
          <SelectContent>
            {NPI_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="firstName" label="First name" required error={errors.firstName}>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          disabled={disabled}
          className={fieldClass}
          aria-invalid={!!errors.firstName}
        />
      </Field>
      <Field id="middleName" label="Middle name">
        <Input
          id="middleName"
          value={formData.middleName}
          onChange={(e) => handleChange('middleName', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="lastName" label="Last name" required error={errors.lastName}>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          disabled={disabled}
          className={fieldClass}
          aria-invalid={!!errors.lastName}
        />
      </Field>
      <Field id="suffix" label="Suffix">
        <Select value={formData.suffix || FORM_NONE} onValueChange={(v) => handleChange('suffix', v === FORM_NONE ? '' : v)} disabled={disabled}>
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FORM_NONE}>None</SelectItem>
            {SUFFIX_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="initials" label="Initials">
        <Input
          id="initials"
          value={formData.initials}
          onChange={(e) => handleChange('initials', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="degree" label="Degree / credentials">
        <Select value={formData.degree || FORM_NONE} onValueChange={(v) => handleChange('degree', v === FORM_NONE ? '' : v)} disabled={disabled}>
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="Select degree" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FORM_NONE}>None</SelectItem>
            {degreeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="providerType" label="Provider type">
        <Select
          value={formData.providerType || FORM_NONE}
          onValueChange={(v) => handleChange('providerType', v === FORM_NONE ? '' : v)}
          disabled={disabled}
        >
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="Select provider type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FORM_NONE}>None</SelectItem>
            {PROVIDER_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="gender" label="Gender" required error={errors.gender}>
        <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)} disabled={disabled}>
          <SelectTrigger className={fieldClass} aria-invalid={!!errors.gender} disabled={disabled}>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="dateOfBirth" label="Date of birth">
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
    </div>
  );

  const renderSpecialty = () => (
    <div className="grid grid-cols-2 gap-4">
      <Field id="specialtyId" label="Specialty">
        <Select
          value={specVal}
          onValueChange={(v) => {
            const id = v === FORM_NONE ? '' : v;
            setFormData((prev) => ({ ...prev, specialtyId: id, subSpecialtyId: '' }));
            if (errors.specialtyId) setErrors((e) => ({ ...e, specialtyId: null }));
          }}
          disabled={disabled}
        >
          <SelectTrigger className={fieldClass} disabled={disabled}>
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
      </Field>
      <Field id="subSpecialtyId" label="Sub-specialty">
        <Select
          value={subVal}
          onValueChange={(v) => handleChange('subSpecialtyId', v === FORM_NONE ? '' : v)}
          disabled={disabled || !fkTrim(formData.specialtyId)}
        >
          <SelectTrigger className={fieldClass} disabled={disabled || !fkTrim(formData.specialtyId)}>
            <SelectValue placeholder={fkTrim(formData.specialtyId) ? 'Select sub-specialty' : 'Select a specialty first'} />
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
      </Field>
      <Field id="departmentId" label="Department">
        <Select value={deptVal} onValueChange={(v) => handleChange('departmentId', v === FORM_NONE ? '' : v)} disabled={disabled}>
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value={FORM_NONE}>None</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.departmentCode ? `${d.departmentName} (${d.departmentCode})` : d.departmentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="taxonomy" label="Primary taxonomy">
        <Input
          id="taxonomy"
          value={formData.taxonomy}
          onChange={(e) => handleChange('taxonomy', e.target.value)}
          disabled={disabled}
          className={fieldClass}
          placeholder="e.g. 207Q00000X"
        />
      </Field>
    </div>
  );

  const renderLicenses = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">State license</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field id="licenseState" label="License state">
            <Select
              value={formData.licenseState || FORM_NONE}
              onValueChange={(v) => handleChange('licenseState', v === FORM_NONE ? '' : v)}
              disabled={disabled}
            >
              <SelectTrigger className={fieldClass} disabled={disabled}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value={FORM_NONE}>None</SelectItem>
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="stateLicenseNumber" label="State license number">
            <Input
              id="stateLicenseNumber"
              value={formData.stateLicenseNumber}
              onChange={(e) => handleChange('stateLicenseNumber', e.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </Field>
          <Field id="stateLicenseEffectiveDate" label="License effective date">
            <Input
              id="stateLicenseEffectiveDate"
              type="date"
              value={formData.stateLicenseEffectiveDate}
              onChange={(e) => handleChange('stateLicenseEffectiveDate', e.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </Field>
          <Field id="stateLicenseExpiryDate" label="License expiry date" error={errors.stateLicenseExpiryDate}>
            <Input
              id="stateLicenseExpiryDate"
              type="date"
              value={formData.stateLicenseExpiryDate}
              onChange={(e) => handleChange('stateLicenseExpiryDate', e.target.value)}
              disabled={disabled}
              className={fieldClass}
              aria-invalid={!!errors.stateLicenseExpiryDate}
            />
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">DEA</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field id="deaNumber" label="DEA number" error={errors.deaNumber}>
            <Input
              id="deaNumber"
              value={formData.deaNumber}
              onChange={(e) => handleChange('deaNumber', e.target.value.toUpperCase())}
              disabled={disabled}
              className={fieldClass}
              placeholder="AB1234563"
              aria-invalid={!!errors.deaNumber}
            />
          </Field>
          <Field id="deaEffectiveDate" label="DEA effective date">
            <Input
              id="deaEffectiveDate"
              type="date"
              value={formData.deaEffectiveDate}
              onChange={(e) => handleChange('deaEffectiveDate', e.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </Field>
          <Field id="deaExpiryDate" label="DEA expiry date" error={errors.deaExpiryDate}>
            <Input
              id="deaExpiryDate"
              type="date"
              value={formData.deaExpiryDate}
              onChange={(e) => handleChange('deaExpiryDate', e.target.value)}
              disabled={disabled}
              className={fieldClass}
              aria-invalid={!!errors.deaExpiryDate}
            />
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">CSR / CDS</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field id="csrLicenseNumber" label="CSR license number">
            <Input
              id="csrLicenseNumber"
              value={formData.csrLicenseNumber}
              onChange={(e) => handleChange('csrLicenseNumber', e.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </Field>
          <Field id="csrExpiryDate" label="CSR expiry date">
            <Input
              id="csrExpiryDate"
              type="date"
              value={formData.csrExpiryDate}
              onChange={(e) => handleChange('csrExpiryDate', e.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </Field>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="grid grid-cols-2 gap-4">
      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={disabled}
          className={fieldClass}
          aria-invalid={!!errors.email}
        />
      </Field>
      <Field id="mobileNumber" label="Mobile number">
        <PhoneNumberInput
          id="mobileNumber"
          value={formData.mobileNumber}
          onChange={(v) => handleChange('mobileNumber', v)}
          disabled={disabled}
          inputClassName={fieldClass}
          error={errors.mobileNumber}
          placeholder="(201) 555-0123"
        />
      </Field>
      <Field id="officePhone" label="Office phone">
        <PhoneNumberInput
          id="officePhone"
          value={formData.officePhone}
          onChange={(v) => handleChange('officePhone', v)}
          disabled={disabled}
          inputClassName={fieldClass}
          error={errors.officePhone}
          placeholder="(201) 555-0123"
        />
      </Field>
      <Field id="fax" label="Fax">
        <PhoneNumberInput
          id="fax"
          value={formData.fax}
          onChange={(v) => handleChange('fax', v)}
          disabled={disabled}
          inputClassName={fieldClass}
          error={errors.fax}
          placeholder="(201) 555-0123"
        />
      </Field>
      <Field id="address" label="Address line 1" className="col-span-2">
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="addressLine2" label="Address line 2" className="col-span-2">
        <Input
          id="addressLine2"
          value={formData.addressLine2}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          disabled={disabled}
          className={fieldClass}
          placeholder="Suite, floor, building"
        />
      </Field>
      <Field id="city" label="City">
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="state" label="State">
        <Select value={formData.state || FORM_NONE} onValueChange={(v) => handleChange('state', v === FORM_NONE ? '' : v)} disabled={disabled}>
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value={FORM_NONE}>None</SelectItem>
            {US_STATES.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.code} — {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="zip" label="ZIP" error={errors.zip}>
        <Input
          id="zip"
          value={formData.zip}
          onChange={(e) => handleChange('zip', e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
          disabled={disabled}
          className={fieldClass}
          placeholder="12345"
          aria-invalid={!!errors.zip}
        />
      </Field>
      <Field id="zipPlus4" label="ZIP+4" error={errors.zipPlus4}>
        <Input
          id="zipPlus4"
          value={formData.zipPlus4}
          onChange={(e) => handleChange('zipPlus4', e.target.value.replace(/\D/g, '').slice(0, 4))}
          disabled={disabled}
          className={fieldClass}
          placeholder="6789"
          aria-invalid={!!errors.zipPlus4}
        />
      </Field>
    </div>
  );

  const renderBilling = () => (
    <div className="grid grid-cols-2 gap-4">
      <Field id="taxIdType" label="Tax ID type">
        <Select
          value={formData.taxIdType || FORM_NONE}
          onValueChange={(v) => handleChange('taxIdType', v === FORM_NONE ? '' : v)}
          disabled={disabled}
        >
          <SelectTrigger className={fieldClass} disabled={disabled}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FORM_NONE}>None</SelectItem>
            {TAX_ID_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="taxId" label="Tax ID / EIN" required error={errors.taxId}>
        <Input
          id="taxId"
          value={formData.taxId}
          onChange={(e) => handleChange('taxId', e.target.value)}
          disabled={disabled}
          className={fieldClass}
          placeholder={formData.taxIdType === 'ein' ? '12-3456789' : ''}
          aria-invalid={!!errors.taxId}
        />
      </Field>
      <Field id="group" label="Group / practice name">
        <Input
          id="group"
          value={formData.group}
          onChange={(e) => handleChange('group', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="groupNpi" label="Group NPI" error={errors.groupNpi}>
        <Input
          id="groupNpi"
          value={formData.groupNpi}
          onChange={(e) => handleChange('groupNpi', e.target.value.replace(/\D/g, '').slice(0, 10))}
          disabled={disabled}
          className={fieldClass}
          inputMode="numeric"
          placeholder="##########"
          aria-invalid={!!errors.groupNpi}
        />
      </Field>
      <Field id="medicarePtan" label="Medicare PTAN">
        <Input
          id="medicarePtan"
          value={formData.medicarePtan}
          onChange={(e) => handleChange('medicarePtan', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="medicaidId" label="Medicaid ID">
        <Input
          id="medicaidId"
          value={formData.medicaidId}
          onChange={(e) => handleChange('medicaidId', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
      <Field id="caqhId" label="CAQH ID">
        <Input
          id="caqhId"
          value={formData.caqhId}
          onChange={(e) => handleChange('caqhId', e.target.value)}
          disabled={disabled}
          className={fieldClass}
        />
      </Field>
    </div>
  );

  const renderReview = () => {
    const showEdit = !readOnly;
    const zipDisplay = [formData.zip, formData.zipPlus4].filter(Boolean).join('-') || '—';
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field id="treatment" label="Treatment setting">
            <Select
              value={formData.treatment || FORM_NONE}
              onValueChange={(v) => handleChange('treatment', v === FORM_NONE ? '' : v)}
              disabled={disabled}
            >
              <SelectTrigger className={fieldClass} disabled={disabled}>
                <SelectValue placeholder="Select treatment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FORM_NONE}>None</SelectItem>
                {TREATMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="experience" label="Experience">
            <Input
              id="experience"
              value={formData.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              disabled={disabled}
              className={fieldClass}
              placeholder="e.g. 10 years"
            />
          </Field>
          <Field id="cprsTabEffectiveDate" label="CPRS Tab effective date">
            <Input
              id="cprsTabEffectiveDate"
              type="date"
              value={formData.cprsTabEffectiveDate}
              onChange={(e) => handleChange('cprsTabEffectiveDate', e.target.value)}
              disabled={disabled}
              className={fieldClass}
            />
          </Field>
          <div className="flex items-end pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive !== false}
                onCheckedChange={(c) => handleChange('isActive', !!c)}
                disabled={disabled}
              />
              <Label htmlFor="isActive" className="font-normal normal-case tracking-normal">
                Active
              </Label>
            </div>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground">Review</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReviewSection title="Identity" stepIndex={0} onEdit={goToStep} showEdit={showEdit}>
            <ReviewRow label="NPI" value={reviewValue(formData.npi)} />
            <ReviewRow label="NPI type" value={reviewValue(displayOptionLabel(NPI_TYPE_OPTIONS, formData.npiType))} />
            <ReviewRow
              label="Name"
              value={reviewValue(
                [formData.firstName, formData.middleName, formData.lastName, formData.suffix].filter(Boolean).join(' '),
              )}
            />
            <ReviewRow label="Initials" value={reviewValue(formData.initials)} />
            <ReviewRow label="Degree" value={reviewValue(formData.degree)} />
            <ReviewRow label="Provider type" value={reviewValue(displayOptionLabel(PROVIDER_TYPE_OPTIONS, formData.providerType))} />
            <ReviewRow label="Gender" value={reviewValue(displayOptionLabel(GENDER_OPTIONS, formData.gender))} />
            <ReviewRow label="DOB" value={reviewValue(formData.dateOfBirth)} />
          </ReviewSection>
          <ReviewSection title="Specialty" stepIndex={1} onEdit={goToStep} showEdit={showEdit}>
            <ReviewRow label="Specialty" value={reviewValue(catalogLabel(specialties, formData.specialtyId, ['name']))} />
            <ReviewRow label="Sub-specialty" value={reviewValue(catalogLabel(subSpecialties, formData.subSpecialtyId, ['name']))} />
            <ReviewRow
              label="Department"
              value={reviewValue(catalogLabel(departments, formData.departmentId, ['departmentName']))}
            />
            <ReviewRow label="Taxonomy" value={reviewValue(formData.taxonomy)} />
          </ReviewSection>
          <ReviewSection title="Licenses" stepIndex={2} onEdit={goToStep} showEdit={showEdit}>
            <ReviewRow label="License state" value={formatReviewState(formData.licenseState)} />
            <ReviewRow label="License #" value={reviewValue(formData.stateLicenseNumber)} />
            <ReviewRow label="License dates" value={reviewValue([formData.stateLicenseEffectiveDate, formData.stateLicenseExpiryDate].filter(Boolean).join(' – '))} />
            <ReviewRow label="DEA" value={reviewValue(formData.deaNumber)} />
            <ReviewRow label="DEA dates" value={reviewValue([formData.deaEffectiveDate, formData.deaExpiryDate].filter(Boolean).join(' – '))} />
            <ReviewRow label="CSR" value={reviewValue(formData.csrLicenseNumber)} />
            <ReviewRow label="CSR expiry" value={reviewValue(formData.csrExpiryDate)} />
          </ReviewSection>
          <ReviewSection title="Contact" stepIndex={3} onEdit={goToStep} showEdit={showEdit}>
            <ReviewRow label="Email" value={reviewValue(formData.email)} />
            <ReviewRow label="Mobile" value={reviewValue(formData.mobileNumber)} />
            <ReviewRow label="Office" value={reviewValue(formData.officePhone)} />
            <ReviewRow label="Fax" value={reviewValue(formData.fax)} />
            <ReviewRow
              label="Address"
              value={reviewValue(
                [formData.address, formData.addressLine2, [formData.city, formData.state, zipDisplay !== '—' ? zipDisplay : ''].filter(Boolean).join(', ')].filter(Boolean).join(', '),
              )}
            />
          </ReviewSection>
          <ReviewSection title="Billing" stepIndex={4} onEdit={goToStep} showEdit={showEdit}>
            <ReviewRow label="Tax ID type" value={reviewValue(displayOptionLabel(TAX_ID_TYPE_OPTIONS, formData.taxIdType))} />
            <ReviewRow label="Tax ID" value={reviewValue(formData.taxId)} />
            <ReviewRow label="Group" value={reviewValue(formData.group)} />
            <ReviewRow label="Group NPI" value={reviewValue(formData.groupNpi)} />
            <ReviewRow label="Medicare PTAN" value={reviewValue(formData.medicarePtan)} />
            <ReviewRow label="Medicaid ID" value={reviewValue(formData.medicaidId)} />
            <ReviewRow label="CAQH ID" value={reviewValue(formData.caqhId)} />
          </ReviewSection>
          <ReviewSection title="Practice" stepIndex={5} onEdit={goToStep} showEdit={false}>
            <ReviewRow label="Treatment" value={reviewValue(displayOptionLabel(TREATMENT_OPTIONS, formData.treatment))} />
            <ReviewRow label="Experience" value={reviewValue(formData.experience)} />
            <ReviewRow label="CPRS date" value={reviewValue(formData.cprsTabEffectiveDate)} />
            <ReviewRow label="Status" value={formData.isActive !== false ? 'Active' : 'Inactive'} />
          </ReviewSection>
        </div>
      </div>
    );
  };

  const stepBody = [renderIdentity, renderSpecialty, renderLicenses, renderContact, renderBilling, renderReview][step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] min-h-0 w-[960px] max-w-[min(960px,calc(100vw-2rem))] flex-col overflow-hidden p-0 sm:max-w-[min(960px,calc(100vw-2rem))]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length} — {STEP_TITLES[step]}
          </p>
        </DialogHeader>

        <div className="shrink-0 border-b border-border px-6 py-3 sm:px-8">
          <Stepper
            steps={STEPS}
            currentStep={step}
            maxClickableStep={readOnly ? LAST_STEP : step}
            onStepClick={(index) => {
              if (readOnly || index <= step) goToStep(index);
            }}
          />
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">{stepBody()}</div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <>
                <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0 || isLoading}>
                  Back
                </Button>
                {step < LAST_STEP ? (
                  <Button type="button" onClick={handleNext} disabled={isLoading}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : submitLabel}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
