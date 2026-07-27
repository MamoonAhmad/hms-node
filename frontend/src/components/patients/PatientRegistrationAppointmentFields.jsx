import { useEffect, useMemo, useState } from 'react';
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
  isGeneralAppointmentVisitType,
  REFERRAL_SOURCES,
  OUTPATIENT_PROVIDERS,
  DEPARTMENT_OPTIONS,
  VISIT_MODALITY_OPTIONS,
  DEFAULT_VISIT_MODALITY,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { AccessibilityRequirementsAccordion } from '@/components/patients/AccessibilityRequirementsAccordion';
import { ReferringPhysicianFields } from '@/components/patients/ReferringPhysicianFields';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { normalizeHexColor } from '@/lib/appointmentStatuses';
import { chiefComplaintApi } from '@/services/api';
import { cn } from '@/lib/utils';

function ensureCurrentOption(options, value, label) {
  if (!value) return options;
  if (options.some((o) => String(o.value) === String(value))) return options;
  return [{ value, label: label || value }, ...options];
}

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
 * @param {boolean} [props.readOnly]
 * @param {Set<string>|string[]} [props.availableDates]
 * @param {boolean} [props.scheduleTypesLoading]
 * @param {boolean} [props.hasProviderSchedules]
 * @param {string} [props.availabilityError]
 * @param {boolean} [props.showAccessibilityAccordion]
 * @param {Object[]} [props.referringProviders]
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
  readOnly = false,
  availableDates = null,
  availableDatesLoading = false,
  availabilityError = '',
  scheduleTypesLoading = false,
  hasProviderSchedules = false,
  showAccessibilityAccordion = true,
  referringProviders = [],
}) {
  const pid = (name) => (idPrefix ? `${idPrefix}-${name}` : name);
  const showReferralSource = !hideReferralSection;
  const showPhysician =
    showReferringPhysicianSection !== undefined
      ? showReferringPhysicianSection
      : !hideReferralSection;
  const [chiefComplaints, setChiefComplaints] = useState([]);

  useEffect(() => {
    let cancelled = false;
    chiefComplaintApi
      .getActive()
      .then((res) => {
        if (!cancelled) setChiefComplaints(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setChiefComplaints([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reasonOfVisitOptions = useMemo(() => {
    const options = chiefComplaints.map((complaint) => ({
      value: complaint.name,
      label: complaint.code ? `${complaint.name} (${complaint.code})` : complaint.name,
      displayLabel: `${complaint.name} ${complaint.code || ''}`,
    }));
    return ensureCurrentOption(options, formData.appointmentReason?.trim(), formData.appointmentReason);
  }, [chiefComplaints, formData.appointmentReason]);

  const deptOptions = departmentOptions ?? DEPARTMENT_OPTIONS;
  const provOptions =
    providerOptions ??
    OUTPATIENT_PROVIDERS.map((p) => ({ value: p.name, label: p.name }));
  const baseTypeOptions = appointmentTypeOptions ?? APPOINTMENT_VISIT_TYPE_OPTIONS;
  const useProviderIds = Boolean(providerOptions);
  const useDepartmentIds = Boolean(departmentOptions);
  const providerValue = useProviderIds
    ? formData.appointmentProviderId || ''
    : formData.appointmentProvider || '';
  const departmentValue = useDepartmentIds
    ? formData.appointmentDepartmentId || ''
    : formData.appointmentDepartment || '';

  const resolvedDeptOptions = useMemo(
    () =>
      ensureCurrentOption(
        deptOptions,
        departmentValue,
        formData.appointmentDepartment || departmentValue,
      ),
    [deptOptions, departmentValue, formData.appointmentDepartment],
  );

  const resolvedProvOptions = useMemo(
    () =>
      ensureCurrentOption(
        provOptions,
        providerValue,
        formData.appointmentProvider || providerValue,
      ),
    [provOptions, providerValue, formData.appointmentProvider],
  );

  const typeOptions = useMemo(
    () =>
      ensureCurrentOption(
        baseTypeOptions,
        formData.appointmentVisitType,
        formData.appointmentTypeName || formData.appointmentVisitType,
      ),
    [baseTypeOptions, formData.appointmentVisitType, formData.appointmentTypeName],
  );

  const resolvedTimeSlotOptions = useMemo(() => {
    if (!formData.appointmentTime) return timeSlotOptions;
    if (!timeSlotOptions?.length) {
      return [{ value: formData.appointmentTime, label: formData.appointmentTime }];
    }
    if (timeSlotOptions.some((slot) => slot.value === formData.appointmentTime)) {
      return timeSlotOptions;
    }
    return [
      { value: formData.appointmentTime, label: formData.appointmentTime },
      ...timeSlotOptions,
    ];
  }, [timeSlotOptions, formData.appointmentTime]);

  const isGeneralType = isGeneralAppointmentVisitType(formData.appointmentVisitType);

  const handleDepartmentChange = (value) => {
    if (useDepartmentIds) {
      onChange('appointmentDepartmentId', value);
      const match = deptOptions.find((o) => o.value === value);
      onChange('appointmentDepartment', match?.departmentName || match?.label || '');
    } else {
      onChange('appointmentDepartment', value);
    }
    onChange('appointmentProviderId', '');
    onChange('appointmentProvider', '');
    onChange('appointmentVisitType', '');
    onChange('appointmentTypeId', '');
    onChange('appointmentTypeName', '');
    onChange('appointmentTypeDefaultTime', '');
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
  };

  const handleProviderChange = (value) => {
    if (useProviderIds) {
      onChange('appointmentProviderId', value);
      const match = provOptions.find((o) => o.value === value);
      onChange('appointmentProvider', match?.label || '');
    } else {
      onChange('appointmentProvider', value);
    }
    onChange('appointmentVisitType', '');
    onChange('appointmentTypeId', '');
    onChange('appointmentTypeName', '');
    onChange('appointmentTypeDefaultTime', '');
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
  };

  const handleVisitTypeChange = (value) => {
    const match = typeOptions.find((opt) => opt.value === value);
    onChange('appointmentVisitType', value);
    onChange('appointmentTypeId', match?.id || '');
    onChange('appointmentTypeName', match?.label || value);
    onChange(
      'appointmentTypeDefaultTime',
      match?.defaultTime != null ? match.defaultTime : '',
    );
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
    if (isGeneralAppointmentVisitType(value)) {
      onChange('appointmentTime', '');
    } else {
      onChange('appointmentStartTime', '');
      onChange('appointmentEndTime', '');
    }
  };

  const availableDateList = useMemo(() => {
    if (!availableDates) return [];
    const list = availableDates instanceof Set ? [...availableDates] : [...(availableDates || [])];
    return list.sort();
  }, [availableDates]);

  const useScheduledDatePicker = useProviderIds && Boolean(providerValue) && !readOnly;
  const appointmentTypeSelected = Boolean(formData.appointmentVisitType);
  const slotSelectionReady =
    useScheduledDatePicker && Boolean(providerValue) && hasProviderSchedules && !scheduleTypesLoading;
  const dateFieldEnabled = readOnly || slotSelectionReady;
  const noProviderAvailability =
    useScheduledDatePicker &&
    slotSelectionReady &&
    appointmentTypeSelected &&
    !availableDatesLoading &&
    availableDates !== null &&
    availableDateList.length === 0;

  const formatAvailableDateLabel = (dateStr) =>
    new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
            <Label htmlFor={pid('visitModality')}>
              Visit Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.visitModality || DEFAULT_VISIT_MODALITY}
              onValueChange={(value) => onChange('visitModality', value)}
              disabled={readOnly}
            >
              <SelectTrigger
                id={pid('visitModality')}
                className={`w-full ${errors.visitModality ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder="Select visit type" />
              </SelectTrigger>
              <SelectContent>
                {VISIT_MODALITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.visitModality && (
              <p className="text-xs text-destructive">{errors.visitModality}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDepartment')}>Department</Label>
            {useDepartmentIds ? (
              <SearchableSelect
                value={departmentValue}
                onValueChange={handleDepartmentChange}
                options={resolvedDeptOptions}
                placeholder="Select department"
                disabled={readOnly}
                preserveOptionOrder={useDepartmentIds}
                triggerClassName={errors.appointmentDepartment ? 'border-destructive' : ''}
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
                options={resolvedProvOptions}
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
            <Select
              value={formData.appointmentVisitType || ''}
              onValueChange={handleVisitTypeChange}
              disabled={readOnly || (useProviderIds && !readOnly && (!providerValue || scheduleTypesLoading))}
            >
              <SelectTrigger
                id={pid('appointmentVisitType')}
                className={`w-full ${errors.appointmentVisitType ? 'border-destructive' : ''}`}
              >
                <SelectValue
                  placeholder={
                    useProviderIds && !providerValue
                      ? 'Select provider first'
                      : scheduleTypesLoading
                        ? 'Loading schedule types…'
                        : useProviderIds && providerValue && !typeOptions.length
                          ? 'No types on provider schedule'
                          : 'Select appointment type'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.appointmentVisitType && (
              <p className="text-xs text-destructive">{errors.appointmentVisitType}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDate')}>Appointment Date</Label>
            {useScheduledDatePicker ? (
              <SearchableSelect
                value={formData.appointmentDate || ''}
                onValueChange={handleAppointmentDateChange}
                options={availableDateOptions}
                placeholder={
                  !providerValue
                    ? 'Select provider first'
                    : scheduleTypesLoading
                      ? 'Loading provider schedule…'
                      : !hasProviderSchedules
                        ? 'No schedule for this provider'
                        : availableDatesLoading
                          ? 'Loading available dates…'
                          : 'Select available date'
                }
                disabled={readOnly || (!readOnly && (!dateFieldEnabled || availableDatesLoading))}
                preserveOptionOrder
                triggerClassName={cn(errors.appointmentDate ? 'border-destructive' : '')}
              />
            ) : (
              <Input
                id={pid('appointmentDate')}
                type="date"
                value={formData.appointmentDate ?? ''}
                onChange={(e) => handleAppointmentDateChange(e.target.value)}
                disabled={readOnly || !dateFieldEnabled}
                min={new Date().toISOString().split('T')[0]}
                className={errors.appointmentDate ? 'border-destructive' : ''}
              />
            )}
            {useScheduledDatePicker && providerValue && !scheduleTypesLoading && !hasProviderSchedules && (
              <p className="text-xs text-muted-foreground">
                No active schedule found for this provider in the selected department.
              </p>
            )}
            {useScheduledDatePicker && slotSelectionReady && !appointmentTypeSelected && (
              <p className="text-xs text-muted-foreground">
                Select an appointment type to narrow available dates, or pick a date from the provider schedule.
              </p>
            )}
            {noProviderAvailability && (
              <p className="text-xs text-muted-foreground">
                No scheduled availability found for this provider, department, and appointment type.
                Partial block hours only remove affected time slots — if no dates appear, verify the
                provider schedule and department selection.
              </p>
            )}
            {availabilityError && (
              <p className="text-xs text-destructive">{availabilityError}</p>
            )}
            {errors.appointmentDate && (
              <p className="text-xs text-destructive">{errors.appointmentDate}</p>
            )}
          </div>
          {!isGeneralType && (
            <div className="space-y-2">
              <Label htmlFor={pid('appointmentTime')}>Appointment Time</Label>
              {resolvedTimeSlotOptions ? (
                <SearchableSelect
                  value={formData.appointmentTime || ''}
                  onValueChange={(value) => onChange('appointmentTime', value)}
                  options={resolvedTimeSlotOptions}
                  placeholder={
                    !formData.appointmentDate
                      ? 'Select appointment date first'
                      : resolvedTimeSlotOptions?.length
                        ? 'Select time slot'
                        : 'No available times (blocked or fully booked)'
                  }
                  disabled={readOnly || !formData.appointmentDate}
                  triggerClassName={cn(errors.appointmentTime ? 'border-destructive' : '')}
                />
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
          <SearchableSelect
            value={formData.appointmentReason || ''}
            onValueChange={(value) => onChange('appointmentReason', value)}
            options={reasonOfVisitOptions}
            placeholder="Select reason for visit"
            disabled={readOnly}
            preserveOptionOrder
            triggerClassName="w-full"
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

        {showAccessibilityAccordion && (
          <AccessibilityRequirementsAccordion
            selected={formData.accessibilityRequirements || []}
            notes={formData.accessibilityRequirementsNotes || ''}
            onChangeSelected={(value) => onChange('accessibilityRequirements', value)}
            onChangeNotes={(value) => onChange('accessibilityRequirementsNotes', value)}
            disabled={readOnly}
          />
        )}

        {(showReferralSource || showPhysician) && (
        <div className="space-y-4 border-t pt-6">
          {showReferralSource && (
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
            <ReferringPhysicianFields
              formData={formData}
              errors={errors}
              onChange={onChange}
              idPrefix={idPrefix}
              readOnly={readOnly}
              providers={referringProviders}
              showAddressFields
              firstNameLabel="Referring physician first name"
              lastNameLabel="Referring physician last name"
            />
          </div>
          )}
        </div>
        )}
      </div>
    </>
  );
}

