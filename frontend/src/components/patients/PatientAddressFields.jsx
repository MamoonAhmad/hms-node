import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  ADDRESS_COUNTRY_OPTIONS,
  US_STATE_OPTIONS,
} from '@/components/patients/patientRegistrationConstants';
import { DEFAULT_COUNTRY } from '@/components/patients/patientDemographicsConstants';

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
    </Label>
  );
}

export function PatientAddressFields({
  formData,
  errors = {},
  onChange,
  idPrefix = '',
}) {
  const pid = (name) => (idPrefix ? `${idPrefix}-${name}` : name);
  const country = formData.country || DEFAULT_COUNTRY;
  const isUnitedStates = country === 'US';

  const stateOptions = US_STATE_OPTIONS.map((s) => ({ value: s.value, label: s.label }));
  const countryOptions = ADDRESS_COUNTRY_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const handleCountryChange = (value) => {
    onChange('country', value);
    if (value !== 'US') {
      onChange('state', formData.state || '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-w-md">
        <RequiredLabel htmlFor={pid('country')}>Country</RequiredLabel>
        <SearchableSelect
          value={country}
          onValueChange={handleCountryChange}
          options={countryOptions}
          placeholder="Select country"
          triggerClassName={errors.country ? 'border-destructive' : ''}
        />
        {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
      </div>

      <div className="space-y-2">
        <RequiredLabel htmlFor={pid('address')}>Address</RequiredLabel>
        <Input
          id={pid('address')}
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          className={errors.address ? 'border-destructive' : ''}
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor={pid('addressLine2')}>Address line 2</Label>
        <Input
          id={pid('addressLine2')}
          value={formData.addressLine2}
          onChange={(e) => onChange('addressLine2', e.target.value)}
          placeholder="Apt, suite, unit"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <RequiredLabel htmlFor={pid('city')}>City</RequiredLabel>
          <Input
            id={pid('city')}
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor={pid('state')}>State</RequiredLabel>
          {isUnitedStates ? (
            <SearchableSelect
              value={formData.state || ''}
              onValueChange={(value) => onChange('state', value)}
              options={stateOptions}
              placeholder="Select state"
              triggerClassName={errors.state ? 'border-destructive' : ''}
            />
          ) : (
            <Input
              id={pid('state')}
              value={formData.state}
              onChange={(e) => onChange('state', e.target.value)}
              className={errors.state ? 'border-destructive' : ''}
              placeholder="State / province / region"
            />
          )}
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor={pid('zip')}>Zip</RequiredLabel>
          <Input
            id={pid('zip')}
            value={formData.zip}
            onChange={(e) => onChange('zip', e.target.value)}
            className={errors.zip ? 'border-destructive' : ''}
          />
          {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
        </div>
      </div>
    </div>
  );
}
