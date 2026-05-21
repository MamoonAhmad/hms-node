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
import {
  NEXT_OF_KIN_RELATIONSHIP_OPTIONS,
  shouldShowLegalGuardianSection,
} from '@/components/patients/patientContactsConstants';

function RelationshipSelect({
  id,
  value,
  onChange,
  options = NEXT_OF_KIN_RELATIONSHIP_OPTIONS,
  placeholder,
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder || 'Select relationship'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PhoneField({ id, label, value, onChange, error, required, placeholder = '(123) 123-1234' }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? 'border-destructive' : ''}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PatientRegistrationContactsFields({
  formData,
  errors,
  onChange,
  dateOfBirth,
}) {
  const showLegalGuardian = shouldShowLegalGuardianSection(dateOfBirth, formData.patientIsMinor);
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => onChange('emergencyContactName', e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Relationship to patient</Label>
            <RelationshipSelect
              id="emergencyContactRelationship"
              value={formData.emergencyContactRelationship}
              onChange={(value) => onChange('emergencyContactRelationship', value)}
            />
            {errors.emergencyContactRelationship && (
              <p className="text-xs text-destructive">{errors.emergencyContactRelationship}</p>
            )}
          </div>
          <PhoneField
            id="emergencyContactNumber"
            label="Emergency Contact Number"
            value={formData.emergencyContactNumber}
            onChange={(e) => onChange('emergencyContactNumber', e.target.value)}
            error={errors.emergencyContactNumber}
          />
          <div className="space-y-2">
            <Label htmlFor="emergencyContactEmail">Email</Label>
            <Input
              id="emergencyContactEmail"
              type="email"
              value={formData.emergencyContactEmail}
              onChange={(e) => onChange('emergencyContactEmail', e.target.value)}
              className={errors.emergencyContactEmail ? 'border-destructive' : ''}
            />
            {errors.emergencyContactEmail && (
              <p className="text-xs text-destructive">{errors.emergencyContactEmail}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactAddress">Street address</Label>
          <Input
            id="emergencyContactAddress"
            value={formData.emergencyContactAddress}
            onChange={(e) => onChange('emergencyContactAddress', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactCity">City</Label>
            <Input
              id="emergencyContactCity"
              value={formData.emergencyContactCity}
              onChange={(e) => onChange('emergencyContactCity', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactState">State</Label>
            <Input
              id="emergencyContactState"
              value={formData.emergencyContactState}
              onChange={(e) => onChange('emergencyContactState', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactZip">ZIP</Label>
            <Input
              id="emergencyContactZip"
              value={formData.emergencyContactZip}
              onChange={(e) => onChange('emergencyContactZip', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-foreground">Secondary Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="secondaryEmergencyContactName">Name</Label>
            <Input
              id="secondaryEmergencyContactName"
              value={formData.secondaryEmergencyContactName}
              onChange={(e) => onChange('secondaryEmergencyContactName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryEmergencyContactRelationship">Relationship</Label>
            <RelationshipSelect
              id="secondaryEmergencyContactRelationship"
              value={formData.secondaryEmergencyContactRelationship}
              onChange={(value) => onChange('secondaryEmergencyContactRelationship', value)}
            />
          </div>
          <PhoneField
            id="secondaryEmergencyContactNumber"
            label="Phone"
            value={formData.secondaryEmergencyContactNumber}
            onChange={(e) => onChange('secondaryEmergencyContactNumber', e.target.value)}
            error={errors.secondaryEmergencyContactNumber}
          />
          <div className="space-y-2">
            <Label htmlFor="secondaryEmergencyContactEmail">Email</Label>
            <Input
              id="secondaryEmergencyContactEmail"
              type="email"
              value={formData.secondaryEmergencyContactEmail}
              onChange={(e) => onChange('secondaryEmergencyContactEmail', e.target.value)}
              className={errors.secondaryEmergencyContactEmail ? 'border-destructive' : ''}
            />
            {errors.secondaryEmergencyContactEmail && (
              <p className="text-xs text-destructive">{errors.secondaryEmergencyContactEmail}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Authorized Representative</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="authorizedRepresentativeName">Authorized representative name</Label>
            <Input
              id="authorizedRepresentativeName"
              value={formData.authorizedRepresentativeName}
              onChange={(e) => onChange('authorizedRepresentativeName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorizedRepresentativeRelationship">Relationship</Label>
            <RelationshipSelect
              id="authorizedRepresentativeRelationship"
              value={formData.authorizedRepresentativeRelationship}
              onChange={(value) => onChange('authorizedRepresentativeRelationship', value)}
            />
          </div>
          <PhoneField
            id="authorizedRepresentativePhone"
            label="Phone"
            value={formData.authorizedRepresentativePhone}
            onChange={(e) => onChange('authorizedRepresentativePhone', e.target.value)}
            error={errors.authorizedRepresentativePhone}
          />
          <div className="space-y-2">
            <Label htmlFor="authorizedRepresentativeEmail">Email</Label>
            <Input
              id="authorizedRepresentativeEmail"
              type="email"
              value={formData.authorizedRepresentativeEmail}
              onChange={(e) => onChange('authorizedRepresentativeEmail', e.target.value)}
              className={errors.authorizedRepresentativeEmail ? 'border-destructive' : ''}
            />
            {errors.authorizedRepresentativeEmail && (
              <p className="text-xs text-destructive">{errors.authorizedRepresentativeEmail}</p>
            )}
          </div>
        </div>
      </div>

      {(showLegalGuardian || !dateOfBirth) && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Legal Guardian</h3>
            {!dateOfBirth && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="patientIsMinor"
                  checked={formData.patientIsMinor}
                  onCheckedChange={(checked) => onChange('patientIsMinor', checked)}
                />
                <Label htmlFor="patientIsMinor" className="text-sm font-normal cursor-pointer">
                  Patient is a minor
                </Label>
              </div>
            )}
          </div>
          {showLegalGuardian && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalGuardianName">Legal guardian name</Label>
                <Input
                  id="legalGuardianName"
                  value={formData.legalGuardianName}
                  onChange={(e) => onChange('legalGuardianName', e.target.value)}
                  className={errors.legalGuardianName ? 'border-destructive' : ''}
                />
                {errors.legalGuardianName && (
                  <p className="text-xs text-destructive">{errors.legalGuardianName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalGuardianRelationship">Relationship</Label>
                <RelationshipSelect
                  id="legalGuardianRelationship"
                  value={formData.legalGuardianRelationship}
                  onChange={(value) => onChange('legalGuardianRelationship', value)}
                />
                {errors.legalGuardianRelationship && (
                  <p className="text-xs text-destructive">{errors.legalGuardianRelationship}</p>
                )}
              </div>
              <PhoneField
                id="legalGuardianPhone"
                label="Phone"
                value={formData.legalGuardianPhone}
                onChange={(e) => onChange('legalGuardianPhone', e.target.value)}
                error={errors.legalGuardianPhone}
              />
              <div className="space-y-2">
                <Label htmlFor="legalGuardianEmail">Email</Label>
                <Input
                  id="legalGuardianEmail"
                  type="email"
                  value={formData.legalGuardianEmail}
                  onChange={(e) => onChange('legalGuardianEmail', e.target.value)}
                  className={errors.legalGuardianEmail ? 'border-destructive' : ''}
                />
                {errors.legalGuardianEmail && (
                  <p className="text-xs text-destructive">{errors.legalGuardianEmail}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 border-t pt-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-foreground">Secondary Next of Kin</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="secondaryNextOfKinName">Name</Label>
            <Input
              id="secondaryNextOfKinName"
              value={formData.secondaryNextOfKinName}
              onChange={(e) => onChange('secondaryNextOfKinName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryNextOfKinRelationship">Relationship</Label>
            <RelationshipSelect
              id="secondaryNextOfKinRelationship"
              value={formData.secondaryNextOfKinRelationship}
              onChange={(value) => onChange('secondaryNextOfKinRelationship', value)}
            />
          </div>
          <PhoneField
            id="secondaryNextOfKinPhone"
            label="Phone"
            value={formData.secondaryNextOfKinPhone}
            onChange={(e) => onChange('secondaryNextOfKinPhone', e.target.value)}
            error={errors.secondaryNextOfKinPhone}
          />
        </div>
      </div>
    </div>
  );
}
