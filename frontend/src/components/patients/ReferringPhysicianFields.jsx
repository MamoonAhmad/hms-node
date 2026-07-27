import { useMemo, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { buildProviderSearchOption } from '@/lib/appointmentUtils';

function applyReferringProviderFields(provider) {
  if (!provider) {
    return {
      referringPhysicianFirstName: '',
      referringPhysicianLastName: '',
      referringPhysicianNpi: '',
      referringPhysicianPhone: '',
      referringPhysicianFax: '',
      referringPhysicianAddress: '',
      referringPhysicianCity: '',
      referringPhysicianState: '',
      referringPhysicianZip: '',
    };
  }

  return {
    referringPhysicianFirstName: provider.firstName || '',
    referringPhysicianLastName: provider.lastName || '',
    referringPhysicianNpi: provider.npi || '',
    referringPhysicianPhone: provider.mobileNumber || '',
    referringPhysicianFax: '',
    referringPhysicianAddress: provider.address || '',
    referringPhysicianCity: provider.city || '',
    referringPhysicianState: provider.state || '',
    referringPhysicianZip: provider.zip || '',
  };
}

export function ReferringPhysicianFields({
  formData,
  errors = {},
  onChange,
  idPrefix = '',
  readOnly = false,
  providers = [],
  showAddressFields = false,
  firstNameLabel = 'First name',
  lastNameLabel = 'Last name',
}) {
  const pid = (name) => (idPrefix ? `${idPrefix}-${name}` : name);

  const providerOptions = useMemo(
    () => providers.map((provider) => buildProviderSearchOption(provider)),
    [providers],
  );

  const matchedProviderId = useMemo(() => {
    const npi = formData.referringPhysicianNpi?.trim();
    if (!npi) return '';
    const match = providers.find((provider) => provider.npi === npi);
    return match?.id || '';
  }, [formData.referringPhysicianNpi, providers]);

  const [selectedProviderId, setSelectedProviderId] = useState('');
  const referringProviderId = selectedProviderId || matchedProviderId;

  useEffect(() => {
    if (
      !formData.referringPhysicianNpi?.trim() &&
      !formData.referringPhysicianFirstName?.trim() &&
      !formData.referringPhysicianLastName?.trim()
    ) {
      setSelectedProviderId('');
    }
  }, [
    formData.referringPhysicianNpi,
    formData.referringPhysicianFirstName,
    formData.referringPhysicianLastName,
  ]);

  const handleProviderSelect = (providerId) => {
    setSelectedProviderId(providerId);
    const provider = providers.find((row) => row.id === providerId);
    const fields = applyReferringProviderFields(provider);
    const coreFields = [
      'referringPhysicianFirstName',
      'referringPhysicianLastName',
      'referringPhysicianNpi',
      'referringPhysicianPhone',
      'referringPhysicianFax',
    ];
    const addressFields = [
      'referringPhysicianAddress',
      'referringPhysicianCity',
      'referringPhysicianState',
      'referringPhysicianZip',
    ];
    const fieldsToApply = showAddressFields ? [...coreFields, ...addressFields] : coreFields;
    fieldsToApply.forEach((field) => onChange(field, fields[field]));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={pid('referringPhysicianProvider')}>Referring provider</Label>
        <SearchableSelect
          value={referringProviderId}
          onValueChange={handleProviderSelect}
          options={providerOptions}
          placeholder="Select from providers"
          disabled={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={pid('referringPhysicianNpi')}>NPI</Label>
        <Input
          id={pid('referringPhysicianNpi')}
          value={formData.referringPhysicianNpi ?? ''}
          onChange={(e) => onChange('referringPhysicianNpi', e.target.value)}
          disabled={readOnly}
          placeholder="10-digit NPI"
          inputMode="numeric"
          maxLength={20}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={pid('referringPhysicianFirstName')}>{firstNameLabel}</Label>
          <Input
            id={pid('referringPhysicianFirstName')}
            value={formData.referringPhysicianFirstName ?? ''}
            onChange={(e) => onChange('referringPhysicianFirstName', e.target.value)}
            disabled={readOnly}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={pid('referringPhysicianLastName')}>{lastNameLabel}</Label>
          <Input
            id={pid('referringPhysicianLastName')}
            value={formData.referringPhysicianLastName ?? ''}
            onChange={(e) => onChange('referringPhysicianLastName', e.target.value)}
            disabled={readOnly}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={pid('referringPhysicianPhone')}>Phone</Label>
          <Input
            id={pid('referringPhysicianPhone')}
            value={formData.referringPhysicianPhone ?? ''}
            onChange={(e) => onChange('referringPhysicianPhone', e.target.value)}
            disabled={readOnly}
            className={errors.referringPhysicianPhone ? 'border-destructive' : ''}
            placeholder="Phone"
          />
          {errors.referringPhysicianPhone && (
            <p className="text-xs text-destructive">{errors.referringPhysicianPhone}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={pid('referringPhysicianFax')}>Fax</Label>
          <Input
            id={pid('referringPhysicianFax')}
            value={formData.referringPhysicianFax ?? ''}
            onChange={(e) => onChange('referringPhysicianFax', e.target.value)}
            disabled={readOnly}
            className={errors.referringPhysicianFax ? 'border-destructive' : ''}
            placeholder="Fax"
          />
          {errors.referringPhysicianFax && (
            <p className="text-xs text-destructive">{errors.referringPhysicianFax}</p>
          )}
        </div>
      </div>

      {showAddressFields && (
        <>
          <div className="space-y-2">
            <Label htmlFor={pid('referringPhysicianAddress')}>Street address</Label>
            <Input
              id={pid('referringPhysicianAddress')}
              value={formData.referringPhysicianAddress ?? ''}
              onChange={(e) => onChange('referringPhysicianAddress', e.target.value)}
              disabled={readOnly}
              placeholder="Address"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={pid('referringPhysicianCity')}>City</Label>
              <Input
                id={pid('referringPhysicianCity')}
                value={formData.referringPhysicianCity ?? ''}
                onChange={(e) => onChange('referringPhysicianCity', e.target.value)}
                disabled={readOnly}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={pid('referringPhysicianState')}>State</Label>
              <Input
                id={pid('referringPhysicianState')}
                value={formData.referringPhysicianState ?? ''}
                onChange={(e) => onChange('referringPhysicianState', e.target.value)}
                disabled={readOnly}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={pid('referringPhysicianZip')}>ZIP</Label>
              <Input
                id={pid('referringPhysicianZip')}
                value={formData.referringPhysicianZip ?? ''}
                onChange={(e) => onChange('referringPhysicianZip', e.target.value)}
                disabled={readOnly}
                placeholder="ZIP"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
