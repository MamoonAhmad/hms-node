import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { UsStateSelect } from '@/components/ui/us-state-select';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  NEXT_OF_KIN_RELATIONSHIP_OPTIONS,
  shouldShowLegalGuardianSection,
} from '@/components/patients/patientContactsConstants';
import { normalizeUsZipInput } from '@/lib/usZip';

function RelationshipSelect({ id, value, onChange, error }) {
  return (
    <>
      <SearchableSelect
        value={value}
        onValueChange={onChange}
        options={NEXT_OF_KIN_RELATIONSHIP_OPTIONS}
        placeholder="Select relationship"
        triggerClassName={error ? 'border-destructive' : ''}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  );
}

function AddressRow({ prefix, formData, errors, onChange }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}Address`}>Street address</Label>
        <Input
          id={`${prefix}Address`}
          value={formData[`${prefix}Address`] || ''}
          onChange={(e) => onChange(`${prefix}Address`, e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}City`}>City</Label>
          <Input
            id={`${prefix}City`}
            value={formData[`${prefix}City`] || ''}
            onChange={(e) => onChange(`${prefix}City`, e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}State`}>State</Label>
          <UsStateSelect
            id={`${prefix}State`}
            value={formData[`${prefix}State`] || ''}
            onChange={(value) => onChange(`${prefix}State`, value)}
            error={errors[`${prefix}State`]}
          />
          {errors[`${prefix}State`] && (
            <p className="text-xs text-destructive">{errors[`${prefix}State`]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}Zip`}>ZIP</Label>
          <Input
            id={`${prefix}Zip`}
            value={formData[`${prefix}Zip`] || ''}
            onChange={(e) => onChange(`${prefix}Zip`, normalizeUsZipInput(e.target.value))}
            placeholder="12345 or 12345-6789"
            className={errors[`${prefix}Zip`] ? 'border-destructive' : ''}
          />
          {errors[`${prefix}Zip`] && (
            <p className="text-xs text-destructive">{errors[`${prefix}Zip`]}</p>
          )}
        </div>
      </div>
    </>
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
              error={errors.emergencyContactRelationship}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactNumber">Emergency Contact Number</Label>
            <PhoneNumberInput
              id="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={(value) => onChange('emergencyContactNumber', value)}
              error={errors.emergencyContactNumber}
            />
          </div>
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
        <AddressRow prefix="emergencyContact" formData={formData} errors={errors} onChange={onChange} />
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
            <Label htmlFor="secondaryEmergencyContactRelationship">Relationship to patient</Label>
            <RelationshipSelect
              id="secondaryEmergencyContactRelationship"
              value={formData.secondaryEmergencyContactRelationship}
              onChange={(value) => onChange('secondaryEmergencyContactRelationship', value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryEmergencyContactNumber">Phone</Label>
            <PhoneNumberInput
              id="secondaryEmergencyContactNumber"
              value={formData.secondaryEmergencyContactNumber}
              onChange={(value) => onChange('secondaryEmergencyContactNumber', value)}
              error={errors.secondaryEmergencyContactNumber}
            />
          </div>
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
        <AddressRow
          prefix="secondaryEmergencyContact"
          formData={formData}
          errors={errors}
          onChange={onChange}
        />
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
            <Label htmlFor="authorizedRepresentativeRelationship">Relationship to patient</Label>
            <RelationshipSelect
              id="authorizedRepresentativeRelationship"
              value={formData.authorizedRepresentativeRelationship}
              onChange={(value) => onChange('authorizedRepresentativeRelationship', value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorizedRepresentativePhone">Phone</Label>
            <PhoneNumberInput
              id="authorizedRepresentativePhone"
              value={formData.authorizedRepresentativePhone}
              onChange={(value) => onChange('authorizedRepresentativePhone', value)}
              error={errors.authorizedRepresentativePhone}
            />
          </div>
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
        <AddressRow
          prefix="authorizedRepresentative"
          formData={formData}
          errors={errors}
          onChange={onChange}
        />
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
            <>
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
                  <Label htmlFor="legalGuardianRelationship">Relationship to patient</Label>
                  <RelationshipSelect
                    id="legalGuardianRelationship"
                    value={formData.legalGuardianRelationship}
                    onChange={(value) => onChange('legalGuardianRelationship', value)}
                    error={errors.legalGuardianRelationship}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalGuardianPhone">Phone</Label>
                  <PhoneNumberInput
                    id="legalGuardianPhone"
                    value={formData.legalGuardianPhone}
                    onChange={(value) => onChange('legalGuardianPhone', value)}
                    error={errors.legalGuardianPhone}
                  />
                </div>
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
              <AddressRow prefix="legalGuardian" formData={formData} errors={errors} onChange={onChange} />
            </>
          )}
        </div>
      )}

      <div className="space-y-4 border-t pt-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-foreground">Secondary Next of Kin</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="secondaryNextOfKinName">Name</Label>
            <Input
              id="secondaryNextOfKinName"
              value={formData.secondaryNextOfKinName}
              onChange={(e) => onChange('secondaryNextOfKinName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryNextOfKinRelationship">Relationship to patient</Label>
            <RelationshipSelect
              id="secondaryNextOfKinRelationship"
              value={formData.secondaryNextOfKinRelationship}
              onChange={(value) => onChange('secondaryNextOfKinRelationship', value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryNextOfKinPhone">Phone</Label>
            <PhoneNumberInput
              id="secondaryNextOfKinPhone"
              value={formData.secondaryNextOfKinPhone}
              onChange={(value) => onChange('secondaryNextOfKinPhone', value)}
              error={errors.secondaryNextOfKinPhone}
            />
          </div>
        </div>
        <AddressRow prefix="secondaryNextOfKin" formData={formData} errors={errors} onChange={onChange} />
      </div>
    </div>
  );
}