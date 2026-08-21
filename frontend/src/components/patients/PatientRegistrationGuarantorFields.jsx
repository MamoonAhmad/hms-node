import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { UsStateSelect } from '@/components/ui/us-state-select';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { GUARANTOR_RELATIONSHIP_OPTIONS } from '@/components/patients/patientContactsConstants';
import { normalizeUsZipInput } from '@/lib/usZip';

export function PatientRegistrationGuarantorFields({ formData, errors, onChange }) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-sm font-semibold text-foreground">Guarantor Information</h3>
      <p className="text-xs text-muted-foreground">
        Person financially responsible for this account. Use Self if the patient is the guarantor.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guarantorName">Guarantor name</Label>
          <Input
            id="guarantorName"
            value={formData.guarantorName}
            onChange={(e) => onChange('guarantorName', e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorRelationship">Relationship to patient</Label>
          <SearchableSelect
            value={formData.guarantorRelationship}
            onValueChange={(value) => onChange('guarantorRelationship', value)}
            options={GUARANTOR_RELATIONSHIP_OPTIONS}
            placeholder="Select relationship"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorPhone">Guarantor phone</Label>
          <PhoneNumberInput
            id="guarantorPhone"
            value={formData.guarantorPhone}
            onChange={(value) => onChange('guarantorPhone', value)}
            error={errors.guarantorPhone}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorEmail">Guarantor email</Label>
          <Input
            id="guarantorEmail"
            type="email"
            value={formData.guarantorEmail}
            onChange={(e) => onChange('guarantorEmail', e.target.value)}
            className={errors.guarantorEmail ? 'border-destructive' : ''}
          />
          {errors.guarantorEmail && (
            <p className="text-xs text-destructive">{errors.guarantorEmail}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorDateOfBirth">Guarantor date of birth</Label>
          <Input
            id="guarantorDateOfBirth"
            type="date"
            value={formData.guarantorDateOfBirth}
            onChange={(e) => onChange('guarantorDateOfBirth', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="guarantorAddress">Guarantor street address</Label>
        <Input
          id="guarantorAddress"
          value={formData.guarantorAddress}
          onChange={(e) => onChange('guarantorAddress', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guarantorCity">City</Label>
          <Input
            id="guarantorCity"
            value={formData.guarantorCity}
            onChange={(e) => onChange('guarantorCity', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorState">State</Label>
          <UsStateSelect
            id="guarantorState"
            value={formData.guarantorState}
            onChange={(value) => onChange('guarantorState', value)}
            error={errors.guarantorState}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorZip">ZIP</Label>
          <Input
            id="guarantorZip"
            value={formData.guarantorZip}
            onChange={(e) => onChange('guarantorZip', normalizeUsZipInput(e.target.value))}
            placeholder="12345 or 12345-6789"
            className={errors.guarantorZip ? 'border-destructive' : ''}
          />
          {errors.guarantorZip && (
            <p className="text-xs text-destructive">{errors.guarantorZip}</p>
          )}
        </div>
      </div>
    </div>
  );
}