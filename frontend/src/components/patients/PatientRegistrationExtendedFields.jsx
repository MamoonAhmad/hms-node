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
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { UsStateSelect } from '@/components/ui/us-state-select';
import { NEXT_OF_KIN_RELATIONSHIP_OPTIONS } from '@/components/patients/patientContactsConstants';
import {
  ADVANCE_DIRECTIVE_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
} from '@/components/patients/patientDemographicsConstants';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { normalizeUsZipInput } from '@/lib/usZip';

export function PatientRegistrationExtendedFields({
  formData,
  errors,
  onChange,
  users = [],
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Mailing address</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mailingSameAsResidential"
            checked={formData.mailingSameAsResidential !== false}
            onCheckedChange={(checked) => onChange('mailingSameAsResidential', checked)}
          />
          <Label htmlFor="mailingSameAsResidential" className="text-sm font-normal cursor-pointer">
            Same as residential address
          </Label>
        </div>
        {formData.mailingSameAsResidential === false && (
          <>
            <div className="space-y-2">
              <Label htmlFor="mailingAddress">Mailing street address</Label>
              <Input
                id="mailingAddress"
                value={formData.mailingAddress}
                onChange={(e) => onChange('mailingAddress', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailingAddressLine2">Mailing address line 2</Label>
              <Input
                id="mailingAddressLine2"
                value={formData.mailingAddressLine2}
                onChange={(e) => onChange('mailingAddressLine2', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mailingCity">City</Label>
                <Input
                  id="mailingCity"
                  value={formData.mailingCity}
                  onChange={(e) => onChange('mailingCity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mailingState">State</Label>
                <UsStateSelect
                  id="mailingState"
                  value={formData.mailingState}
                  onChange={(value) => onChange('mailingState', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mailingZip">ZIP</Label>
                <Input
                  id="mailingZip"
                  value={formData.mailingZip}
                  onChange={(e) => onChange('mailingZip', normalizeUsZipInput(e.target.value))}
                  placeholder="12345 or 12345-6789"
                  className={errors.mailingZip ? 'border-destructive' : ''}
                />
                {errors.mailingZip && (
                  <p className="text-xs text-destructive">{errors.mailingZip}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="mailingCountry">Country</Label>
              <SearchableSelect
                value={formData.mailingCountry || DEFAULT_COUNTRY}
                onValueChange={(value) => onChange('mailingCountry', value)}
                options={COUNTRY_OPTIONS}
                placeholder="Select country"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Payer identifiers</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medicareBeneficiaryId">Medicare Beneficiary ID (MBI)</Label>
            <Input
              id="medicareBeneficiaryId"
              value={formData.medicareBeneficiaryId}
              onChange={(e) => onChange('medicareBeneficiaryId', e.target.value.toUpperCase())}
              placeholder="1EG4-TE5-MK73"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicaidId">Medicaid ID</Label>
            <Input
              id="medicaidId"
              value={formData.medicaidId}
              onChange={(e) => onChange('medicaidId', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Preferred pharmacy</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preferredPharmacyName">Pharmacy name</Label>
            <Input
              id="preferredPharmacyName"
              value={formData.preferredPharmacyName}
              onChange={(e) => onChange('preferredPharmacyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredPharmacyPhone">Pharmacy phone</Label>
            <PhoneNumberInput
              id="preferredPharmacyPhone"
              value={formData.preferredPharmacyPhone}
              onChange={(value) => onChange('preferredPharmacyPhone', value)}
              error={errors.preferredPharmacyPhone}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredPharmacyAddress">Pharmacy address</Label>
          <Input
            id="preferredPharmacyAddress"
            value={formData.preferredPharmacyAddress}
            onChange={(e) => onChange('preferredPharmacyAddress', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Communication preferences</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="smsOptIn"
              checked={!!formData.smsOptIn}
              onCheckedChange={(checked) => onChange('smsOptIn', checked)}
            />
            <Label htmlFor="smsOptIn" className="text-sm font-normal cursor-pointer">
              SMS / text messages
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailOptIn"
              checked={!!formData.emailOptIn}
              onCheckedChange={(checked) => onChange('emailOptIn', checked)}
            />
            <Label htmlFor="emailOptIn" className="text-sm font-normal cursor-pointer">
              Email
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reminderOptIn"
              checked={!!formData.reminderOptIn}
              onCheckedChange={(checked) => onChange('reminderOptIn', checked)}
            />
            <Label htmlFor="reminderOptIn" className="text-sm font-normal cursor-pointer">
              Appointment reminders
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">HIPAA / release of information</h3>
        <p className="text-xs text-muted-foreground">
          Person authorized to receive this patient’s health information.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hipaaRoiName">Authorized contact name</Label>
            <Input
              id="hipaaRoiName"
              value={formData.hipaaRoiName}
              onChange={(e) => onChange('hipaaRoiName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hipaaRoiRelationship">Relationship</Label>
            <SearchableSelect
              value={formData.hipaaRoiRelationship}
              onValueChange={(value) => onChange('hipaaRoiRelationship', value)}
              options={NEXT_OF_KIN_RELATIONSHIP_OPTIONS}
              placeholder="Select relationship"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hipaaRoiPhone">Phone</Label>
            <PhoneNumberInput
              id="hipaaRoiPhone"
              value={formData.hipaaRoiPhone}
              onChange={(value) => onChange('hipaaRoiPhone', value)}
              error={errors.hipaaRoiPhone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hipaaRoiEmail">Email</Label>
            <Input
              id="hipaaRoiEmail"
              type="email"
              value={formData.hipaaRoiEmail}
              onChange={(e) => onChange('hipaaRoiEmail', e.target.value)}
              className={errors.hipaaRoiEmail ? 'border-destructive' : ''}
            />
            {errors.hipaaRoiEmail && (
              <p className="text-xs text-destructive">{errors.hipaaRoiEmail}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Advance directive / power of attorney</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="advanceDirectiveOnFile"
            checked={!!formData.advanceDirectiveOnFile}
            onCheckedChange={(checked) => onChange('advanceDirectiveOnFile', checked)}
          />
          <Label htmlFor="advanceDirectiveOnFile" className="text-sm font-normal cursor-pointer">
            Advance directive on file
          </Label>
        </div>
        {formData.advanceDirectiveOnFile && (
          <div className="space-y-2 max-w-md">
            <Label htmlFor="advanceDirectiveType">Directive type</Label>
            <Select
              value={formData.advanceDirectiveType}
              onValueChange={(value) => onChange('advanceDirectiveType', value)}
            >
              <SelectTrigger id="advanceDirectiveType" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ADVANCE_DIRECTIVE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="powerOfAttorneyName">Power of attorney name</Label>
            <Input
              id="powerOfAttorneyName"
              value={formData.powerOfAttorneyName}
              onChange={(e) => onChange('powerOfAttorneyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="powerOfAttorneyPhone">Power of attorney phone</Label>
            <PhoneNumberInput
              id="powerOfAttorneyPhone"
              value={formData.powerOfAttorneyPhone}
              onChange={(value) => onChange('powerOfAttorneyPhone', value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Allergies</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="noKnownDrugAllergies"
            checked={!!formData.noKnownDrugAllergies}
            onCheckedChange={(checked) => onChange('noKnownDrugAllergies', checked)}
          />
          <Label htmlFor="noKnownDrugAllergies" className="text-sm font-normal cursor-pointer">
            No known drug allergies (NKDA)
          </Label>
        </div>
        {!formData.noKnownDrugAllergies && (
          <div className="space-y-2">
            <Label htmlFor="allergyNotes">Allergy notes</Label>
            <Textarea
              id="allergyNotes"
              value={formData.allergyNotes}
              onChange={(e) => onChange('allergyNotes', e.target.value)}
              rows={3}
              placeholder="List known allergies and reactions"
            />
          </div>
        )}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Billing notes</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accountBalance">Account balance ($)</Label>
            <Input
              id="accountBalance"
              type="number"
              step="0.01"
              value={formData.accountBalance}
              onChange={(e) => onChange('accountBalance', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assigned registrar</Label>
            <Select
              value={formData.assignedToId || 'none'}
              onValueChange={(value) => onChange('assignedToId', value === 'none' ? '' : value)}
            >
              <SelectTrigger id="assignedToId" className="w-full">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name || person.email || person.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingNotes">Billing notes</Label>
          <Textarea
            id="billingNotes"
            value={formData.billingNotes}
            onChange={(e) => onChange('billingNotes', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
