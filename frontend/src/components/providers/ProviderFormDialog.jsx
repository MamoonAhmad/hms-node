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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialFormData = {
  npi: '',
  initials: '',
  firstName: '',
  lastName: '',
  middleName: '',
  gender: '',
  dateOfBirth: '',
  specialty: '',
  subSpecialty: '',
  department: '',
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

const fieldClass = 'w-full min-w-0';
const sectionTitleClass = 'text-sm font-semibold text-foreground border-b border-border pb-2 mb-3';

export function ProviderFormDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [open]);

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Provider</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
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
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger className={fieldClass} aria-invalid={!!errors.gender}>
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
                <Select value={formData.specialty} onValueChange={(v) => handleChange('specialty', v)}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                    <SelectItem value="family_medicine">Family Medicine</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub specialty</Label>
                <Select value={formData.subSpecialty} onValueChange={(v) => handleChange('subSpecialty', v)}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select sub specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interventional_cardiology">Interventional Cardiology</SelectItem>
                    <SelectItem value="general_pediatrics">General Pediatrics</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.department} onValueChange={(v) => handleChange('department', v)}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="radiology">Radiology</SelectItem>
                    <SelectItem value="lab">Laboratory</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxonomy">Taxonomy</Label>
                <Input
                  id="taxonomy"
                  value={formData.taxonomy}
                  onChange={(e) => handleChange('taxonomy', e.target.value)}
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
                <Input
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => handleChange('degree', e.target.value)}
                  placeholder="e.g. MD, DO"
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
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
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
                <Select value={formData.treatment} onValueChange={(v) => handleChange('treatment', v)}>
                  <SelectTrigger className={fieldClass}>
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
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          <DialogFooter className="gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Create Provider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
