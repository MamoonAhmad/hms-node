import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  APPOINTMENT_VISIT_TYPE_OPTIONS,
  GENERAL_APPOINTMENT_VISIT_TYPE,
  isGeneralAppointmentVisitType,
  REFERRAL_SOURCES,
  OUTPATIENT_PROVIDERS,
  DEPARTMENT_OPTIONS,
  referringFieldsFromProvider,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { MultiSelect } from '@/components/ui/multi-select';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { UsStateSelect } from '@/components/ui/us-state-select';
import { normalizeUsZipInput } from '@/lib/usZip';
import { normalizeHexColor } from '@/lib/appointmentStatuses';
import { cn } from '@/lib/utils';

/**
 * Outpatient appointment + referral fields (same block as Patient registration → Appointment tab).
 * @param {Object} props
 * @param {Record<string, unknown>} props.formData
 * @param {Record<string, string>} props.errors
 * @param {(field: string, value: unknown) => void} props.onChange
 * @param {string} [props.idPrefix] — prefix for HTML ids when multiple instances could exist
 * @param {{ value: string, label: string }[]} [props.timeSlotOptions] — when set, appointment time is a slot dropdown
 * @param {boolean} [props.showAppointmentStatus] — show appointment status dropdown (schedule form)
 * @param {{ id: string, name: string, color?: string }[]} [props.statusOptions]
 * @param {boolean} [props.hideReferralSection] — hide referral source dropdown
 * @param {boolean} [props.showReferringPhysicianSection] — show referring physician block (defaults to !hideReferralSection)
 * @param {{ value: string, label: string }[]} [props.departmentOptions]
 * @param {{ value: string, label: string, displayLabel?: string }[]} [props.providerOptions]
 * @param {{ value: string, label: string }[]} [props.appointmentTypeOptions]
 * @param {(providerId: string) => string[]} [props.getProviderDepartmentIds]
 * @param {Array<Record<string, unknown>>} [props.referringProviders] — providers listing used by Referred By
 * @param {boolean} [props.readOnly]
 * @param {Set<string>|string[]} [props.availableDates]
 * @param {boolean} [props.availableDatesLoading]
 */
export function PatientRegistrationAppointmentFields({
  formData,
  errors = {},
  onChange,
  idPrefix = '',
  timeSlotOptions = null,
  showAppointmentStatus = false,
  statusOptions = [],
  hideReferralSection = false,
  showReferringPhysicianSection,
  departmentOptions = null,
  providerOptions = null,
  appointmentTypeOptions = null,
  getProviderDepartmentIds = null,
  referringProviders = null,
  readOnly = false,
  availableDates = null,
  availableDatesLoading = false,
}) {
  const pid = (name) => (idPrefix ? `${idPrefix}-${name}` : name);
  const showReferralSource = !hideReferralSection;
  const showPhysician =
    showReferringPhysicianSection !== undefined
      ? showReferringPhysicianSection
      : !hideReferralSection;

  const deptOptions = departmentOptions || DEPARTMENT_OPTIONS;
  const provOptions =
    providerOptions ||
    OUTPATIENT_PROVIDERS.map((p) => ({ value: p.name, label: p.name }));
  const typeOptions = appointmentTypeOptions || APPOINTMENT_VISIT_TYPE_OPTIONS;
  const useProviderIds = Boolean(providerOptions);
  const useDepartmentIds = Boolean(departmentOptions);
  const providerValue = useProviderIds
    ? formData.appointmentProviderId || ''
    : formData.appointmentProvider || '';
  const departmentValue = useDepartmentIds
    ? formData.appointmentDepartmentId || ''
    : formData.appointmentDepartment || '';

  const selectedDepartmentIds = useMemo(() => {
    if (Array.isArray(formData.appointmentDepartmentIds) && formData.appointmentDepartmentIds.length) {
      return formData.appointmentDepartmentIds;
    }
    return departmentValue ? [departmentValue] : [];
  }, [formData.appointmentDepartmentIds, departmentValue]);

  const isGeneralType = isGeneralAppointmentVisitType(formData.appointmentVisitType);

  const applyDepartmentSelection = (ids) => {
    const uniqueIds = [...new Set((ids || []).filter(Boolean))];
    onChange('appointmentDepartmentIds', uniqueIds);
    const first = uniqueIds[0] || '';
    if (useDepartmentIds) {
      onChange('appointmentDepartmentId', first);
      const labels = uniqueIds
        .map((id) => deptOptions.find((o) => o.value === id)?.label)
        .filter(Boolean);
      onChange('appointmentDepartment', labels.join(', '));
    } else {
      onChange('appointmentDepartment', first);
    }
  };

  const handleDepartmentChange = (value) => {
    applyDepartmentSelection(value ? [value] : []);
    if (useProviderIds && providerValue && typeof getProviderDepartmentIds === 'function') {
      const assigned = getProviderDepartmentIds(providerValue);
      if (assigned.length && !assigned.includes(value)) {
        onChange('appointmentProviderId', '');
        onChange('appointmentProvider', '');
      }
    } else if (!useProviderIds) {
      onChange('appointmentProviderId', '');
      onChange('appointmentProvider', '');
    }
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
  };

  const handleDepartmentIdsChange = (ids) => {
    applyDepartmentSelection(ids);
    if (useProviderIds && providerValue && typeof getProviderDepartmentIds === 'function') {
      const assigned = getProviderDepartmentIds(providerValue);
      const stillAssigned = (ids || []).some((id) => assigned.includes(id));
      if (assigned.length && !stillAssigned) {
        onChange('appointmentProviderId', '');
        onChange('appointmentProvider', '');
      }
    }
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
  };

  const handleProviderChange = (value) => {
    if (useProviderIds) {
      onChange('appointmentProviderId', value);
      const match = provOptions.find((o) => o.value === value);
      onChange('appointmentProvider', match?.label || '');
      if (typeof getProviderDepartmentIds === 'function') {
        const assigned = getProviderDepartmentIds(value);
        if (assigned.length) applyDepartmentSelection(assigned);
      }
    } else {
      onChange('appointmentProvider', value);
    }
    onChange('appointmentVisitType', '');
    onChange('appointmentTypeName', '');
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
  };

  const handleVisitTypeChange = (value) => {
    onChange('appointmentVisitType', value);
    onChange('appointmentTypeName', value);
    onChange('appointmentTime', '');
    if (value === GENERAL_APPOINTMENT_VISIT_TYPE) {
      onChange('appointmentTime', '');
    } else {
      onChange('appointmentStartTime', '');
      onChange('appointmentEndTime', '');
    }
  };

  const showReferringProviderSelect = Array.isArray(referringProviders);
  const referringProviderOptions = useMemo(() => {
    if (!showReferringProviderSelect) return [];
    return referringProviders.map((provider) => {
      const name = [provider.firstName, provider.middleName, provider.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const label = provider.npi ? `${name} (${provider.npi})` : name;
      return {
        value: provider.id,
        label,
        displayLabel: label,
      };
    });
  }, [referringProviders, showReferringProviderSelect]);

  const applyReferringFields = (patch) => {
    Object.entries(patch).forEach(([field, value]) => onChange(field, value));
  };

  const handleReferringProviderChange = (value) => {
    if (!value || value === 'none') {
      applyReferringFields(referringFieldsFromProvider(null));
      return;
    }
    const provider = referringProviders.find((item) => item.id === value);
    applyReferringFields(referringFieldsFromProvider(provider || null));
  };

  const availableDateList = useMemo(() => {
    if (!availableDates) return [];
    const list = availableDates instanceof Set ? [...availableDates] : [...(availableDates || [])];
    return list.sort();
  }, [availableDates]);

  const useScheduledDatePicker = useProviderIds && Boolean(providerValue);
  const appointmentTypeSelected = Boolean(formData.appointmentVisitType);
  const dateFieldEnabled =
    !readOnly &&
    Boolean(providerValue) &&
    (!useScheduledDatePicker || appointmentTypeSelected);
  const noProviderAvailability =
    useScheduledDatePicker &&
    appointmentTypeSelected &&
    !availableDatesLoading &&
    availableDates !== null &&
    availableDateList.length === 0;

  const formatAvailableDateLabel = (dateStr) =>
    new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const availableDateOptions = useMemo(() => {
    const options = availableDateList.map((dateStr) => ({
      value: dateStr,
      label: formatAvailableDateLabel(dateStr),
    }));
    if (
      formData.appointmentDate &&
      !availableDateList.includes(formData.appointmentDate)
    ) {
      options.unshift({
        value: formData.appointmentDate,
        label: formatAvailableDateLabel(formData.appointmentDate),
      });
    }
    return options;
  }, [availableDateList, formData.appointmentDate]);

  const handleAppointmentDateChange = (next) => {
    onChange('appointmentDate', next);
    onChange('appointmentTime', '');
  };

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Outpatient Appointment</h3>
        <p className="text-sm text-muted-foreground">Capture appointment details for the outpatient clinic visit.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDepartment')}>Department</Label>
            {useDepartmentIds ? (
              <MultiSelect
                id={pid('appointmentDepartment')}
                options={deptOptions}
                value={selectedDepartmentIds}
                onChange={handleDepartmentIdsChange}
                placeholder="Select department"
                searchable
                searchPlaceholder="Search departments..."
                disabled={readOnly}
                error={Boolean(errors.appointmentDepartment)}
              />
            ) : (
              <Select
                value={departmentValue}
                onValueChange={handleDepartmentChange}
                disabled={readOnly}
              >
                <SelectTrigger
                  id={pid('appointmentDepartment')}
                  className={`w-full ${errors.appointmentDepartment ? 'border-destructive' : ''}`}
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {deptOptions.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {useDepartmentIds && selectedDepartmentIds.length > 1 && (
              <p className="text-xs text-muted-foreground">
                This provider is assigned to multiple departments. All assigned departments are selected.
              </p>
            )}
            {errors.appointmentDepartment && (
              <p className="text-xs text-destructive">{errors.appointmentDepartment}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentProvider')}>
              Provider <span className="text-destructive">*</span>
            </Label>
            {useProviderIds ? (
              <SearchableSelect
                value={providerValue}
                onValueChange={handleProviderChange}
                options={provOptions}
                placeholder="Search provider by name or NPI"
                disabled={readOnly}
                triggerClassName={errors.appointmentProvider ? 'border-destructive' : ''}
              />
            ) : (
              <Select
                value={providerValue}
                onValueChange={handleProviderChange}
                disabled={readOnly}
              >
                <SelectTrigger
                  id={pid('appointmentProvider')}
                  className={errors.appointmentProvider ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {provOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.appointmentProvider && (
              <p className="text-xs text-destructive">{errors.appointmentProvider}</p>
            )}
          </div>
        </div>

        <div
          className={cn(
            'grid gap-4',
            isGeneralType
              ? showAppointmentStatus
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : showAppointmentStatus && timeSlotOptions
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-3',
          )}
        >
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentVisitType')}>Appointment Type</Label>
            <SearchableSelect
              value={formData.appointmentVisitType || ''}
              onValueChange={handleVisitTypeChange}
              options={typeOptions}
              placeholder={
                useProviderIds && !providerValue
                  ? 'Select provider first'
                  : typeOptions.length
                    ? 'Select appointment type'
                    : 'No appointment types assigned'
              }
              disabled={readOnly || (useProviderIds && !providerValue)}
              triggerClassName={errors.appointmentVisitType ? 'border-destructive' : ''}
            />
            {useProviderIds && providerValue && !typeOptions.length && (
              <p className="text-xs text-muted-foreground">
                No appointment types are assigned to this provider in scheduling.
              </p>
            )}
            {errors.appointmentVisitType && (
              <p className="text-xs text-destructive">{errors.appointmentVisitType}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDate')}>Appointment Date</Label>
            {useScheduledDatePicker ? (
              <Select
                value={formData.appointmentDate || ''}
                onValueChange={handleAppointmentDateChange}
                disabled={!dateFieldEnabled || availableDatesLoading}
              >
                <SelectTrigger
                  id={pid('appointmentDate')}
                  className={cn('w-full', errors.appointmentDate ? 'border-destructive' : '')}
                >
                  <SelectValue
                    placeholder={
                      !appointmentTypeSelected
                        ? 'Select appointment type first'
                        : availableDatesLoading
                          ? 'Loading available dates…'
                          : 'Select available date'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDateOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={pid('appointmentDate')}
                type="date"
                value={formData.appointmentDate ?? ''}
                onChange={(e) => handleAppointmentDateChange(e.target.value)}
                disabled={!dateFieldEnabled}
                min={new Date().toISOString().split('T')[0]}
                className={errors.appointmentDate ? 'border-destructive' : ''}
              />
            )}
            {useScheduledDatePicker && !appointmentTypeSelected && providerValue && (
              <p className="text-xs text-muted-foreground">
                Select an appointment type to load available dates for this provider.
              </p>
            )}
            {noProviderAvailability && (
              <p className="text-xs text-muted-foreground">
                No scheduled availability found for this provider and appointment type.
              </p>
            )}
            {errors.appointmentDate && (
              <p className="text-xs text-destructive">{errors.appointmentDate}</p>
            )}
          </div>
          {!isGeneralType && (
            <div className="space-y-2">
              <Label htmlFor={pid('appointmentTime')}>Appointment Time</Label>
              {timeSlotOptions ? (
                <Select
                  value={formData.appointmentTime || ''}
                  onValueChange={(value) => onChange('appointmentTime', value)}
                  disabled={readOnly || !formData.appointmentDate}
                >
                  <SelectTrigger
                    id={pid('appointmentTime')}
                    className={cn('w-full', errors.appointmentTime ? 'border-destructive' : '')}
                  >
                    <SelectValue
                      placeholder={
                        !formData.appointmentDate
                          ? 'Select date first'
                          : timeSlotOptions.length
                            ? 'Select time slot'
                            : 'No available time slots'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlotOptions.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                    {formData.appointmentTime &&
                      !timeSlotOptions.some((s) => s.value === formData.appointmentTime) && (
                        <SelectItem value={formData.appointmentTime}>
                          {formData.appointmentTime}
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={pid('appointmentTime')}
                  type="time"
                  value={formData.appointmentTime ?? ''}
                  onChange={(e) => onChange('appointmentTime', e.target.value)}
                  className={errors.appointmentTime ? 'border-destructive' : ''}
                />
              )}
              {errors.appointmentTime && (
                <p className="text-xs text-destructive">{errors.appointmentTime}</p>
              )}
            </div>
          )}
          {isGeneralType && (
            <>
              <div className="w-full max-w-[11rem] space-y-2">
                <Label htmlFor={pid('appointmentStartTime')}>Appointment Start Time</Label>
                <Input
                  id={pid('appointmentStartTime')}
                  type="time"
                  value={formData.appointmentStartTime ?? ''}
                  onChange={(e) => onChange('appointmentStartTime', e.target.value)}
                  disabled={readOnly}
                  className={cn('w-full', errors.appointmentStartTime ? 'border-destructive' : '')}
                />
                {errors.appointmentStartTime && (
                  <p className="text-xs text-destructive">{errors.appointmentStartTime}</p>
                )}
              </div>
              <div className="w-full max-w-[11rem] space-y-2">
                <Label htmlFor={pid('appointmentEndTime')}>Appointment End Time</Label>
                <Input
                  id={pid('appointmentEndTime')}
                  type="time"
                  value={formData.appointmentEndTime ?? ''}
                  onChange={(e) => onChange('appointmentEndTime', e.target.value)}
                  disabled={readOnly}
                  className={cn('w-full', errors.appointmentEndTime ? 'border-destructive' : '')}
                />
                {errors.appointmentEndTime && (
                  <p className="text-xs text-destructive">{errors.appointmentEndTime}</p>
                )}
              </div>
            </>
          )}
          {showAppointmentStatus && (
            <div className="space-y-2">
              <Label htmlFor={pid('appointmentStatus')}>Appointment Status</Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => onChange('status', value)}
                disabled={readOnly}
              >
                <SelectTrigger id={pid('appointmentStatus')} className="w-full">
                  <SelectValue placeholder="Select appointment status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => {
                    const hex = normalizeHexColor(status.color) || '#6b7280';
                    return (
                      <SelectItem key={status.id} value={status.name}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border border-border/60"
                            style={{ backgroundColor: hex }}
                            aria-hidden
                          />
                          {status.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={pid('appointmentReason')}>Reason for Visit</Label>
          <Input
            id={pid('appointmentReason')}
            value={formData.appointmentReason ?? ''}
            onChange={(e) => onChange('appointmentReason', e.target.value)}
            disabled={readOnly}
            placeholder="e.g., Annual physical, cough, follow-up labs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={pid('appointmentNotes')}>Appointment Notes</Label>
          <Textarea
            id={pid('appointmentNotes')}
            value={formData.appointmentNotes ?? ''}
            onChange={(e) => onChange('appointmentNotes', e.target.value)}
            disabled={readOnly}
            rows={4}
            placeholder="Any special instructions, symptoms, or scheduling notes"
          />
        </div>

        {(showReferralSource || showPhysician || showReferringProviderSelect) && (
        <div className="space-y-4 border-t pt-6">
          {showReferringProviderSelect && (
          <div className="space-y-2">
            <Label htmlFor={pid('referringProviderId')}>Select provider</Label>
            <p className="text-xs text-muted-foreground" id={pid('referringProvider-hint')}>
              Referring provider (optional). Selecting a provider fills NPI, phone, fax, and address.
            </p>
            <SearchableSelect
              value={formData.referringProviderId || 'none'}
              onValueChange={handleReferringProviderChange}
              options={[
                { value: 'none', label: 'None selected', displayLabel: 'None selected' },
                ...referringProviderOptions,
              ]}
              placeholder="Search provider by name or NPI"
              disabled={readOnly}
              triggerClassName="w-full max-w-md"
            />
          </div>
          )}

          {showReferralSource && !showReferringProviderSelect && (
          <div className="space-y-2">
            <Label htmlFor={pid('referredBy')}>Referred By</Label>
            <p className="text-xs text-muted-foreground" id={pid('referredBy-hint')}>
              Source of referral (optional)
            </p>
            <Select
              value={
                formData.referredBy && REFERRAL_SOURCES.some((o) => o.value === formData.referredBy)
                  ? formData.referredBy
                  : 'none'
              }
              onValueChange={(value) => onChange('referredBy', value === 'none' ? '' : value)}
            >
              <SelectTrigger
                id={pid('referredBy')}
                className="w-full max-w-md"
                aria-describedby={pid('referredBy-hint')}
              >
                <SelectValue placeholder="Select source of referral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None selected</SelectItem>
                {REFERRAL_SOURCES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.referredBy && !REFERRAL_SOURCES.some((o) => o.value === formData.referredBy) && (
              <p className="text-xs text-muted-foreground">
                Legacy free-text value on file:{' '}
                <span className="font-medium text-foreground">{formData.referredBy}</span>. Pick a standard option
                above to replace it on save.
              </p>
            )}
          </div>
          )}

          {showPhysician && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Referring physician information</h4>
            <p className="text-xs text-muted-foreground">
              All fields below are optional. Use for billing or care coordination when a referring provider applies.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianFirstName')}>Referring physician first name</Label>
                <Input
                  id={pid('referringPhysicianFirstName')}
                  value={formData.referringPhysicianFirstName ?? ''}
                  onChange={(e) => onChange('referringPhysicianFirstName', e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianLastName')}>Referring physician last name</Label>
                <Input
                  id={pid('referringPhysicianLastName')}
                  value={formData.referringPhysicianLastName ?? ''}
                  onChange={(e) => onChange('referringPhysicianLastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianNpi')}>NPI</Label>
                <Input
                  id={pid('referringPhysicianNpi')}
                  value={formData.referringPhysicianNpi ?? ''}
                  onChange={(e) => onChange('referringPhysicianNpi', e.target.value)}
                  placeholder="10-digit NPI"
                  inputMode="numeric"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianPhone')}>Phone</Label>
                <PhoneNumberInput
                  id={pid('referringPhysicianPhone')}
                  value={formData.referringPhysicianPhone ?? ''}
                  onChange={(value) => onChange('referringPhysicianPhone', value)}
                  error={errors.referringPhysicianPhone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianFax')}>Fax</Label>
                <PhoneNumberInput
                  id={pid('referringPhysicianFax')}
                  value={formData.referringPhysicianFax ?? ''}
                  onChange={(value) => onChange('referringPhysicianFax', value)}
                  error={errors.referringPhysicianFax}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={pid('referringPhysicianAddress')}>Street address</Label>
              <Input
                id={pid('referringPhysicianAddress')}
                value={formData.referringPhysicianAddress ?? ''}
                onChange={(e) => onChange('referringPhysicianAddress', e.target.value)}
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
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianState')}>State</Label>
                <UsStateSelect
                  id={pid('referringPhysicianState')}
                  value={formData.referringPhysicianState ?? ''}
                  onChange={(value) => onChange('referringPhysicianState', value)}
                  error={errors.referringPhysicianState}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianZip')}>ZIP</Label>
                <Input
                  id={pid('referringPhysicianZip')}
                  value={formData.referringPhysicianZip ?? ''}
                  onChange={(e) => onChange('referringPhysicianZip', normalizeUsZipInput(e.target.value))}
                  placeholder="12345 or 12345-6789"
                  className={errors.referringPhysicianZip ? 'border-destructive' : ''}
                />
                {errors.referringPhysicianZip && (
                  <p className="text-xs text-destructive">{errors.referringPhysicianZip}</p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
        )}
      </div>
    </>
  );
}

