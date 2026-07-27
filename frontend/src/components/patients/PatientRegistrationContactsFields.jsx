import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  buildEmergencyContactsList,
  buildGuarantorsList,
  emptyEmergencyContactEntry,
  emptyGuarantorEntry,
  GUARANTOR_REQUIRED_MAX_AGE,
  isPatientMinor,
  NEXT_OF_KIN_RELATIONSHIP_OPTIONS,
  syncEmergencyContactsToFormData,
  syncGuarantorsToFormData,
} from '@/components/patients/patientContactsConstants';
import {
  EMAIL_VALIDATION_MESSAGE,
  isValidEmail,
} from '@/components/patients/patientRegistrationConstants';
import { validatePhoneNumber } from '@/lib/phoneNumberUtils';

function RelationshipSelect({ id, value, onChange, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder || 'Select relationship'} />
      </SelectTrigger>
      <SelectContent>
        {NEXT_OF_KIN_RELATIONSHIP_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PhoneField({ id, label, value, onChange, error, required }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <PhoneNumberInput
        id={id}
        value={value}
        onChange={onChange}
        error={error}
        placeholder="(213) 324-3248"
      />
    </div>
  );
}

function EmailField({ id, label, value, onChange, error }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="email"
        value={value}
        onChange={onChange}
        className={error ? 'border-destructive' : ''}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function EmergencyContactForm({ entry, index, errors, onFieldChange, idPrefix }) {
  const field = (name) => `${idPrefix}-${name}-${index}`;

  return (
    <div className={index > 0 ? 'space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4' : 'space-y-4'}>
      {index > 0 && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Emergency contact {index + 1}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={field('name')}>Emergency Contact Name</Label>
          <Input
            id={field('name')}
            value={entry.name}
            onChange={(e) => onFieldChange(index, 'name', e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('relationship')}>Relationship to patient</Label>
          <RelationshipSelect
            id={field('relationship')}
            value={entry.relationship}
            onChange={(value) => onFieldChange(index, 'relationship', value)}
          />
          {errors[`emergencyContactRelationship_${index}`] && (
            <p className="text-xs text-destructive">{errors[`emergencyContactRelationship_${index}`]}</p>
          )}
        </div>
        <PhoneField
          id={field('number')}
          label="Emergency Contact Number"
          value={entry.number}
          onChange={(value) => onFieldChange(index, 'number', value)}
          error={errors[`emergencyContactNumber_${index}`]}
        />
        <EmailField
          id={field('email')}
          label="Email"
          value={entry.email}
          onChange={(e) => onFieldChange(index, 'email', e.target.value)}
          error={errors[`emergencyContactEmail_${index}`]}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={field('address')}>Street address</Label>
        <Input
          id={field('address')}
          value={entry.address}
          onChange={(e) => onFieldChange(index, 'address', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={field('city')}>City</Label>
          <Input
            id={field('city')}
            value={entry.city}
            onChange={(e) => onFieldChange(index, 'city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('state')}>State</Label>
          <Input
            id={field('state')}
            value={entry.state}
            onChange={(e) => onFieldChange(index, 'state', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('zip')}>ZIP</Label>
          <Input
            id={field('zip')}
            value={entry.zip}
            onChange={(e) => onFieldChange(index, 'zip', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function GuarantorContactForm({ entry, index, errors, onFieldChange, idPrefix, requiresGuarantor }) {
  const field = (name) => `${idPrefix}-${name}-${index}`;

  return (
    <div className={index > 0 ? 'space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4' : 'space-y-4'}>
      {index > 0 && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Guarantor {index + 1}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={field('name')}>
            Guarantor Name
            {requiresGuarantor && index === 0 && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input
            id={field('name')}
            value={entry.name}
            onChange={(e) => onFieldChange(index, 'name', e.target.value)}
            placeholder="Enter full name"
            className={errors[`guarantorName_${index}`] ? 'border-destructive' : ''}
          />
          {errors[`guarantorName_${index}`] && (
            <p className="text-xs text-destructive">{errors[`guarantorName_${index}`]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('relationship')}>
            Relationship to patient
            {requiresGuarantor && index === 0 && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <RelationshipSelect
            id={field('relationship')}
            value={entry.relationship}
            onChange={(value) => onFieldChange(index, 'relationship', value)}
          />
          {errors[`guarantorRelationship_${index}`] && (
            <p className="text-xs text-destructive">{errors[`guarantorRelationship_${index}`]}</p>
          )}
        </div>
        <PhoneField
          id={field('phone')}
          label="Guarantor Phone"
          value={entry.phone}
          onChange={(value) => onFieldChange(index, 'phone', value)}
          error={errors[`guarantorPhone_${index}`]}
          required={requiresGuarantor && index === 0}
        />
        <EmailField
          id={field('email')}
          label="Email"
          value={entry.email}
          onChange={(e) => onFieldChange(index, 'email', e.target.value)}
          error={errors[`guarantorEmail_${index}`]}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={field('address')}>Street address</Label>
        <Input
          id={field('address')}
          value={entry.address}
          onChange={(e) => onFieldChange(index, 'address', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={field('city')}>City</Label>
          <Input
            id={field('city')}
            value={entry.city}
            onChange={(e) => onFieldChange(index, 'city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('state')}>State</Label>
          <Input
            id={field('state')}
            value={entry.state}
            onChange={(e) => onFieldChange(index, 'state', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('zip')}>ZIP</Label>
          <Input
            id={field('zip')}
            value={entry.zip}
            onChange={(e) => onFieldChange(index, 'zip', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export function PatientRegistrationContactsFields({
  formData,
  errors,
  onChange,
  dateOfBirth,
  requiresGuarantor = false,
}) {
  const patientIsMinor = isPatientMinor(dateOfBirth);
  const guarantorRequired = requiresGuarantor || patientIsMinor;
  const emergencyContacts = buildEmergencyContactsList(formData);
  const guarantors = buildGuarantorsList(formData);

  const defaultAccordion = guarantorRequired
    ? ['emergency', 'guarantor']
    : ['emergency'];
  const [openSections, setOpenSections] = useState(defaultAccordion);

  const updateEmergencyContacts = (nextContacts) => {
    onChange(syncEmergencyContactsToFormData(nextContacts));
  };

  const updateGuarantors = (nextGuarantors) => {
    onChange(syncGuarantorsToFormData(nextGuarantors));
  };

  const handleEmergencyFieldChange = (index, fieldName, value) => {
    const next = emergencyContacts.map((entry, i) =>
      i === index ? { ...entry, [fieldName]: value } : entry,
    );
    updateEmergencyContacts(next);
  };

  const handleGuarantorFieldChange = (index, fieldName, value) => {
    const next = guarantors.map((entry, i) =>
      i === index ? { ...entry, [fieldName]: value } : entry,
    );
    updateGuarantors(next);
  };

  const addEmergencyContact = () => {
    updateEmergencyContacts([...emergencyContacts, emptyEmergencyContactEntry()]);
    setOpenSections((prev) => (prev.includes('emergency') ? prev : [...prev, 'emergency']));
  };

  const addGuarantor = () => {
    updateGuarantors([...guarantors, emptyGuarantorEntry()]);
    setOpenSections((prev) => (prev.includes('guarantor') ? prev : [...prev, 'guarantor']));
  };

  return (
    <Accordion
      type="multiple"
      value={openSections}
      onValueChange={setOpenSections}
      className="w-full space-y-2"
    >
      <AccordionItem value="emergency" className="overflow-hidden rounded-xl border border-border/80">
        <AccordionTrigger className="rounded-t-xl px-4">
          <span className="text-sm font-semibold text-primary-foreground">Emergency Contact</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-4 pb-4">
          {emergencyContacts.map((entry, index) => (
            <EmergencyContactForm
              key={`emergency-${index}`}
              entry={entry}
              index={index}
              errors={errors}
              idPrefix="emergency"
              onFieldChange={handleEmergencyFieldChange}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addEmergencyContact}
          >
            <Plus className="h-4 w-4" />
            Add more
          </Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="guarantor" className="overflow-hidden rounded-xl border border-border/80">
        <AccordionTrigger className="rounded-t-xl px-4">
          <span className="text-sm font-semibold text-primary-foreground">Guarantor Information</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-4 pb-4">
          {guarantorRequired && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Patient is less than {GUARANTOR_REQUIRED_MAX_AGE} years old — guarantor information is
              required.
            </div>
          )}
          {guarantors.map((entry, index) => (
            <GuarantorContactForm
              key={`guarantor-${index}`}
              entry={entry}
              index={index}
              errors={errors}
              idPrefix="guarantor"
              requiresGuarantor={guarantorRequired}
              onFieldChange={handleGuarantorFieldChange}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addGuarantor}
          >
            <Plus className="h-4 w-4" />
            Add more
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function validateContactPhoneField(value, fieldName, newErrors) {
  if (!value?.trim()) return;
  const check = validatePhoneNumber(value);
  if (!check.valid) {
    newErrors[fieldName] = check.message || 'Enter a valid phone number for the selected country';
  }
}

export function validateContactEmailField(value, fieldName, newErrors) {
  if (!value?.trim()) return;
  if (!isValidEmail(value)) {
    newErrors[fieldName] = EMAIL_VALIDATION_MESSAGE;
  }
}
