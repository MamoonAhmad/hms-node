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
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import {
  INSURANCE_TYPE_LABELS,
} from '@/components/patients/patientRegistrationInsuranceConstants';

function buildSubscriberSelfFields(source) {
  const firstName = source.firstName?.trim() || '';
  const lastName = source.lastName?.trim() || '';
  const middleName = source.middleName?.trim() || '';
  const subscriberName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const street = [source.address, source.addressLine2].filter(Boolean).join(', ');

  return {
    subscriberFirstName: firstName,
    subscriberLastName: lastName,
    subscriberName,
    subscriberGender: source.gender || '',
    subscriberDateOfBirth: source.dateOfBirth || '',
    subscriberPhone: source.cellPhone || source.homePhone || source.workPhone || '',
    subscriberEmail: source.noEmail ? '' : source.email || '',
    subscriberAddress: street,
    subscriberCity: source.city || '',
    subscriberState: source.state || '',
    subscriberZip: source.zip || '',
    subscriberEmployer: source.employerName || '',
  };
}

/**
 * Single insurance policy form. Insurance Type is locked to the accordion rank.
 */
export function PatientInsuranceEntryForm({
  insuranceTypeKey,
  value,
  onChange,
  onChangeMany,
  patientDemographics,
  insuranceProviders = [],
  loadingProviders = false,
  idPrefix = '',
  errors = {},
  disabled = false,
  onUploadDocuments,
}) {
  const typeKey = insuranceTypeKey || value?.insuranceTypeKey || 'primary';
  const typeLabel = INSURANCE_TYPE_LABELS[typeKey] || typeKey;
  const prefix = idPrefix || typeKey;

  const setField = (field, fieldValue) => {
    onChange?.(field, fieldValue);
  };

  const handleSubscriberRelationshipChange = (relationship) => {
    if (relationship === 'self') {
      onChangeMany?.({
        subscriberRelationship: relationship,
        ...buildSubscriberSelfFields(patientDemographics || {}),
      });
      return;
    }
    setField('subscriberRelationship', relationship);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-insuranceType`}>Insurance Type</Label>
            <Select value={typeKey} disabled>
              <SelectTrigger id={`${prefix}-insuranceType`} className="w-full" disabled>
                <SelectValue placeholder="Select insurance type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="tertiary">Tertiary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => onUploadDocuments?.(typeKey)}
            >
              Add {typeLabel} Insurance Documents
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefix}-insuranceCompany`}>Payer Name</Label>
            <Select
              value={value.insuranceCompany || ''}
              onValueChange={(v) => setField('insuranceCompany', v === 'none' ? '' : v)}
              disabled={disabled}
            >
              <SelectTrigger id={`${prefix}-insuranceCompany`} className="w-full">
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
            <Label htmlFor={`${prefix}-policyType`}>Policy Type</Label>
            <Select
              value={value.policyType || ''}
              onValueChange={(v) => setField('policyType', v)}
              disabled={disabled}
            >
              <SelectTrigger id={`${prefix}-policyType`} className="w-full">
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
            <Label htmlFor={`${prefix}-planName`}>Plan Name</Label>
            <Input
              id={`${prefix}-planName`}
              value={value.planName || ''}
              onChange={(e) => setField('planName', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-policyNumber`}>Policy Number</Label>
            <Input
              id={`${prefix}-policyNumber`}
              value={value.policyNumber || ''}
              onChange={(e) => setField('policyNumber', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-groupNumber`}>Group Number</Label>
            <Input
              id={`${prefix}-groupNumber`}
              value={value.groupNumber || ''}
              onChange={(e) => setField('groupNumber', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Subscriber Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberRelationship`}>Relationship to Patient</Label>
            <Select
              value={value.subscriberRelationship || ''}
              onValueChange={handleSubscriberRelationshipChange}
              disabled={disabled}
            >
              <SelectTrigger id={`${prefix}-subscriberRelationship`} className="w-full">
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
            <Label htmlFor={`${prefix}-subscriberFirstName`}>Subscriber First Name</Label>
            <Input
              id={`${prefix}-subscriberFirstName`}
              value={value.subscriberFirstName || ''}
              onChange={(e) => setField('subscriberFirstName', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberLastName`}>Subscriber Last Name</Label>
            <Input
              id={`${prefix}-subscriberLastName`}
              value={value.subscriberLastName || ''}
              onChange={(e) => setField('subscriberLastName', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberName`}>Subscriber Name</Label>
            <Input
              id={`${prefix}-subscriberName`}
              value={value.subscriberName || ''}
              onChange={(e) => setField('subscriberName', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberGender`}>Subscriber Gender</Label>
            <Select
              value={value.subscriberGender || ''}
              onValueChange={(v) => setField('subscriberGender', v)}
              disabled={disabled}
            >
              <SelectTrigger id={`${prefix}-subscriberGender`} className="w-full">
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
            <Label htmlFor={`${prefix}-subscriberDateOfBirth`}>Subscriber Date of Birth</Label>
            <Input
              id={`${prefix}-subscriberDateOfBirth`}
              type="date"
              value={value.subscriberDateOfBirth || ''}
              onChange={(e) => setField('subscriberDateOfBirth', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberPhone`}>Subscriber phone</Label>
            <PhoneNumberInput
              id={`${prefix}-subscriberPhone`}
              value={value.subscriberPhone || ''}
              onChange={(v) => setField('subscriberPhone', v)}
              error={errors.subscriberPhone}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberEmail`}>Subscriber email</Label>
            <Input
              id={`${prefix}-subscriberEmail`}
              type="email"
              value={value.subscriberEmail || ''}
              onChange={(e) => setField('subscriberEmail', e.target.value)}
              className={errors.subscriberEmail ? 'border-destructive' : ''}
              disabled={disabled}
            />
            {errors.subscriberEmail && (
              <p className="text-xs text-destructive">{errors.subscriberEmail}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberSsnLast4`}>Subscriber SSN (last 4)</Label>
            <Input
              id={`${prefix}-subscriberSsnLast4`}
              value={value.subscriberSsnLast4 || ''}
              onChange={(e) =>
                setField('subscriberSsnLast4', e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="Last 4 digits"
              inputMode="numeric"
              maxLength={4}
              className={errors.subscriberSsnLast4 ? 'border-destructive' : ''}
              disabled={disabled}
            />
            {errors.subscriberSsnLast4 && (
              <p className="text-xs text-destructive">{errors.subscriberSsnLast4}</p>
            )}
          </div>
        </div>

        <div className="max-w-md space-y-2">
          <Label htmlFor={`${prefix}-subscriberEmployer`}>Subscriber employer</Label>
          <Input
            id={`${prefix}-subscriberEmployer`}
            value={value.subscriberEmployer || ''}
            onChange={(e) => setField('subscriberEmployer', e.target.value)}
            placeholder="Employer for group / sponsored plans"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-subscriberAddress`}>Subscriber street address</Label>
          <Input
            id={`${prefix}-subscriberAddress`}
            value={value.subscriberAddress || ''}
            onChange={(e) => setField('subscriberAddress', e.target.value)}
            placeholder="Street address"
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberCity`}>Subscriber city</Label>
            <Input
              id={`${prefix}-subscriberCity`}
              value={value.subscriberCity || ''}
              onChange={(e) => setField('subscriberCity', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberState`}>Subscriber state</Label>
            <Input
              id={`${prefix}-subscriberState`}
              value={value.subscriberState || ''}
              onChange={(e) => setField('subscriberState', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-subscriberZip`}>Subscriber ZIP</Label>
            <Input
              id={`${prefix}-subscriberZip`}
              value={value.subscriberZip || ''}
              onChange={(e) => setField('subscriberZip', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Coverage Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-coverageStartDate`}>Coverage Start Date</Label>
            <Input
              id={`${prefix}-coverageStartDate`}
              type="date"
              value={value.coverageStartDate || ''}
              onChange={(e) => setField('coverageStartDate', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-coverageEndDate`}>Coverage End Date</Label>
            <Input
              id={`${prefix}-coverageEndDate`}
              type="date"
              value={value.coverageEndDate || ''}
              onChange={(e) => setField('coverageEndDate', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-copay`}>Copay Amount ($)</Label>
            <Input
              id={`${prefix}-copay`}
              type="number"
              step="0.01"
              min="0"
              value={value.copay || ''}
              onChange={(e) => setField('copay', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-deductible`}>Deductible ($)</Label>
            <Input
              id={`${prefix}-deductible`}
              type="number"
              step="0.01"
              min="0"
              value={value.deductible || ''}
              onChange={(e) => setField('deductible', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-coinsurancePercentage`}>Coinsurance Percentage (%)</Label>
            <Input
              id={`${prefix}-coinsurancePercentage`}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value.coinsurancePercentage || ''}
              onChange={(e) => setField('coinsurancePercentage', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-authorizationRequired`}>Authorization Required</Label>
            <Select
              value={value.authorizationRequired || ''}
              onValueChange={(v) => {
                setField('authorizationRequired', v);
                if (v !== 'yes') setField('authorizationNumber', '');
              }}
              disabled={disabled}
            >
              <SelectTrigger id={`${prefix}-authorizationRequired`} className="w-full">
                <SelectValue placeholder="Yes / No" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {value.authorizationRequired === 'yes' && (
            <div className="space-y-2">
              <Label htmlFor={`${prefix}-authorizationNumber`}>Authorization Number</Label>
              <Input
                id={`${prefix}-authorizationNumber`}
                value={value.authorizationNumber || ''}
                onChange={(e) => setField('authorizationNumber', e.target.value)}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
