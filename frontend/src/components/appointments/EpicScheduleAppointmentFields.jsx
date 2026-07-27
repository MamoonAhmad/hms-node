import { useMemo, useState, useEffect } from 'react';
import { Check } from 'lucide-react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  isGeneralAppointmentVisitType,
  VISIT_MODALITY_OPTIONS,
  DEFAULT_VISIT_MODALITY,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { AccessibilityRequirementsAccordion } from '@/components/patients/AccessibilityRequirementsAccordion';
import { ReferringPhysicianFields } from '@/components/patients/ReferringPhysicianFields';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { normalizeHexColor } from '@/lib/appointmentStatuses';
import { chiefComplaintApi } from '@/services/api';
import { cn } from '@/lib/utils';

function EpicWorkflowSection({ step, title, description, complete, children, className }) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-2.5 bg-primary px-3 py-2.5 text-primary-foreground sm:px-4">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
            complete
              ? 'bg-white text-primary'
              : 'bg-white/20 text-primary-foreground ring-1 ring-white/40',
          )}
        >
          {complete ? <Check className="h-3.5 w-3.5" aria-hidden /> : step}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-primary-foreground/80">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3 p-3 sm:p-4">{children}</div>
    </section>
  );
}

function getProviderDepartmentIds(providerOption) {
  if (!providerOption) return [];
  if (providerOption.departmentIds?.length) return providerOption.departmentIds;
  if (providerOption.departmentId) return [providerOption.departmentId];
  return [];
}

function resolveDepartmentFromProvider(providerOption, currentDepartmentId) {
  const deptIds = getProviderDepartmentIds(providerOption);
  if (!deptIds.length) return '';
  if (currentDepartmentId && deptIds.includes(currentDepartmentId)) {
    return currentDepartmentId;
  }
  return providerOption.departmentId || deptIds[0] || '';
}

/**
 * Scheduling layout: search provider (auto-fills department) → type → slot → visit details.
 */
export function EpicScheduleAppointmentFields({
  formData,
  errors = {},
  onChange,
  idPrefix = '',
  timeSlotOptions = null,
  showAppointmentStatus = false,
  statusOptions = [],
  departmentOptions = [],
  providerOptions = [],
  appointmentTypeOptions = [],
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
  const [referralOpen, setReferralOpen] = useState('');
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
    const current = String(formData.appointmentReason || '').trim();
    if (current && !options.some((opt) => opt.value === current)) {
      options.unshift({ value: current, label: current, displayLabel: current });
    }
    return options;
  }, [chiefComplaints, formData.appointmentReason]);

  const departmentValue = formData.appointmentDepartmentId || '';
  const providerValue = formData.appointmentProviderId || '';
  const isGeneralType = isGeneralAppointmentVisitType(formData.appointmentVisitType);
  const appointmentTypeSelected = Boolean(formData.appointmentVisitType);

  const availableDateList = useMemo(() => {
    if (!availableDates) return [];
    const list = availableDates instanceof Set ? [...availableDates] : [...(availableDates || [])];
    return list.sort();
  }, [availableDates]);

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
    if (formData.appointmentDate && !availableDateList.includes(formData.appointmentDate)) {
      options.unshift({
        value: formData.appointmentDate,
        label: formatAvailableDateLabel(formData.appointmentDate),
      });
    }
    return options;
  }, [availableDateList, formData.appointmentDate]);

  const noProviderAvailability =
    Boolean(providerValue) &&
    !scheduleTypesLoading &&
    hasProviderSchedules &&
    appointmentTypeSelected &&
    !availableDatesLoading &&
    availableDates !== null &&
    availableDateList.length === 0;

  const slotSelectionReady =
    Boolean(providerValue) && hasProviderSchedules && !scheduleTypesLoading;

  const schedulingContextComplete =
    Boolean(departmentValue) && Boolean(providerValue) && appointmentTypeSelected;

  const slotComplete = isGeneralType
    ? Boolean(formData.appointmentDate && formData.appointmentStartTime && formData.appointmentEndTime)
    : Boolean(formData.appointmentDate && formData.appointmentTime);

  const clearSlotAndTypeFields = () => {
    onChange('appointmentVisitType', '');
    onChange('appointmentTypeId', '');
    onChange('appointmentTypeName', '');
    onChange('appointmentTypeDefaultTime', '');
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
    onChange('appointmentStartTime', '');
    onChange('appointmentEndTime', '');
  };

  const handleDepartmentChange = (value) => {
    onChange('appointmentDepartmentId', value);
    const match = departmentOptions.find((o) => o.value === value);
    onChange('appointmentDepartment', match?.departmentName || match?.label || '');

    if (providerValue) {
      const provider = providerOptions.find((o) => o.value === providerValue);
      const providerDeptIds = getProviderDepartmentIds(provider);
      if (!providerDeptIds.includes(value)) {
        onChange('appointmentProviderId', '');
        onChange('appointmentProvider', '');
      }
    }

    clearSlotAndTypeFields();
  };

  const handleProviderChange = (value) => {
    onChange('appointmentProviderId', value);
    const match = providerOptions.find((o) => o.value === value);
    onChange('appointmentProvider', match?.label || '');

    if (match) {
      const resolvedDeptId = resolveDepartmentFromProvider(match, departmentValue);
      if (resolvedDeptId) {
        onChange('appointmentDepartmentId', resolvedDeptId);
        const deptMatch = departmentOptions.find((o) => o.value === resolvedDeptId);
        onChange(
          'appointmentDepartment',
          deptMatch?.departmentName ||
            deptMatch?.label ||
            match.departmentName ||
            '',
        );
      }
    }

    clearSlotAndTypeFields();
  };

  const handleVisitTypeChange = (value) => {
    const match = appointmentTypeOptions.find((opt) => opt.value === value);
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

  const handleAppointmentDateChange = (next) => {
    onChange('appointmentDate', next);
    onChange('appointmentTime', '');
  };

  useEffect(() => {
    if (readOnly || !providerValue || scheduleTypesLoading) return;
    if (!appointmentTypeOptions.length) return;

    const current = formData.appointmentVisitType || '';
    const isValid = appointmentTypeOptions.some((opt) => opt.value === current);

    if (current && !isValid) {
      onChange('appointmentVisitType', '');
      onChange('appointmentTypeId', '');
      onChange('appointmentTypeName', '');
      onChange('appointmentTypeDefaultTime', '');
      onChange('appointmentDate', '');
      onChange('appointmentTime', '');
      return;
    }

    if (!current && appointmentTypeOptions.length === 1) {
      const only = appointmentTypeOptions[0];
      onChange('appointmentVisitType', only.value);
      onChange('appointmentTypeId', only.id || '');
      onChange('appointmentTypeName', only.label || only.value);
      onChange(
        'appointmentTypeDefaultTime',
        only.defaultTime != null ? only.defaultTime : '',
      );
    }
  }, [
    readOnly,
    providerValue,
    scheduleTypesLoading,
    appointmentTypeOptions,
    formData.appointmentVisitType,
    onChange,
  ]);

  return (
    <div className="space-y-4">
      <EpicWorkflowSection
        step="2"
        title="Scheduling context"
        description="Search and select a provider to auto-fill department, then choose an appointment type."
        complete={schedulingContextComplete}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentProvider')}>
              Provider <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              value={providerValue}
              onValueChange={handleProviderChange}
              options={providerOptions}
              placeholder="Search provider by name or NPI"
              disabled={readOnly}
              triggerClassName={errors.appointmentProvider ? 'border-destructive' : ''}
            />
            {errors.appointmentProvider && (
              <p className="text-xs text-destructive">{errors.appointmentProvider}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDepartment')}>
              Department <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              value={departmentValue}
              onValueChange={handleDepartmentChange}
              options={departmentOptions}
              placeholder="Select department"
              disabled={readOnly}
              preserveOptionOrder
              triggerClassName={errors.appointmentDepartment ? 'border-destructive' : ''}
            />
            {!readOnly && (
              <p className="text-xs text-muted-foreground">
                Auto-filled from the selected provider; you can change it if needed.
              </p>
            )}
            {errors.appointmentDepartment && (
              <p className="text-xs text-destructive">{errors.appointmentDepartment}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={pid('appointmentVisitType')}>
              Appointment type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.appointmentVisitType || ''}
              onValueChange={handleVisitTypeChange}
              disabled={readOnly || !providerValue || (scheduleTypesLoading && !appointmentTypeOptions.length)}
            >
              <SelectTrigger
                id={pid('appointmentVisitType')}
                className={cn('w-full', errors.appointmentVisitType && 'border-destructive')}
              >
                <SelectValue
                  placeholder={
                    !providerValue
                      ? 'Select provider first'
                      : scheduleTypesLoading && !appointmentTypeOptions.length
                        ? 'Loading appointment types…'
                        : !appointmentTypeOptions.length
                          ? 'No appointment types configured'
                          : 'Select appointment type'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!scheduleTypesLoading && providerValue && !appointmentTypeOptions.length && (
              <p className="text-xs text-muted-foreground">
                No active schedule found for this provider in the selected department.
              </p>
            )}
            {errors.appointmentVisitType && (
              <p className="text-xs text-destructive">{errors.appointmentVisitType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={pid('visitModality')}>
              Visit modality <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.visitModality || DEFAULT_VISIT_MODALITY}
              onValueChange={(value) => onChange('visitModality', value)}
              disabled={readOnly || !appointmentTypeSelected}
            >
              <SelectTrigger
                id={pid('visitModality')}
                className={cn('w-full', errors.visitModality && 'border-destructive')}
              >
                <SelectValue placeholder="In person, phone, or telehealth" />
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
      </EpicWorkflowSection>

      <EpicWorkflowSection
        step="3"
        title="Date & time"
        description={
          isGeneralType
            ? 'Choose an available date, then enter start and end times within the provider schedule.'
            : 'Pick an open slot sized to the appointment type duration. Only available dates and times are shown.'
        }
        complete={slotComplete}
        className={cn(!slotSelectionReady && !readOnly && 'opacity-75')}
      >
        {!slotSelectionReady && !readOnly && providerValue && !scheduleTypesLoading && !hasProviderSchedules && (
          <p className="text-xs text-muted-foreground">
            No active schedule found for this provider in the selected department.
          </p>
        )}
        <div
          className={cn(
            'grid gap-4',
            isGeneralType ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDate')}>
              Appointment date <span className="text-destructive">*</span>
            </Label>
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
              disabled={readOnly || !slotSelectionReady || availableDatesLoading}
              preserveOptionOrder
              triggerClassName={cn(errors.appointmentDate && 'border-destructive')}
            />
            {noProviderAvailability && (
              <p className="text-xs text-muted-foreground">
                No open dates for this provider, department, and appointment type. Confirm the provider
                schedule includes this appointment type for the selected department.
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
              <Label htmlFor={pid('appointmentTime')}>
                Appointment time <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={formData.appointmentTime || ''}
                onValueChange={(value) => onChange('appointmentTime', value)}
                options={timeSlotOptions || []}
                placeholder={
                  !formData.appointmentDate
                    ? 'Select date first'
                    : timeSlotOptions?.length
                      ? 'Select time slot'
                      : 'No available times'
                }
                disabled={readOnly || !formData.appointmentDate}
                preserveOptionOrder
                triggerClassName={cn(errors.appointmentTime && 'border-destructive')}
              />
              {errors.appointmentTime && (
                <p className="text-xs text-destructive">{errors.appointmentTime}</p>
              )}
            </div>
          )}

          {isGeneralType && (
            <>
              <div className="space-y-2">
                <Label htmlFor={pid('appointmentStartTime')}>Start time</Label>
                <Input
                  id={pid('appointmentStartTime')}
                  type="time"
                  value={formData.appointmentStartTime ?? ''}
                  onChange={(e) => onChange('appointmentStartTime', e.target.value)}
                  disabled={readOnly || !formData.appointmentDate}
                  className={cn(errors.appointmentStartTime && 'border-destructive')}
                />
                {errors.appointmentStartTime && (
                  <p className="text-xs text-destructive">{errors.appointmentStartTime}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('appointmentEndTime')}>End time</Label>
                <Input
                  id={pid('appointmentEndTime')}
                  type="time"
                  value={formData.appointmentEndTime ?? ''}
                  onChange={(e) => onChange('appointmentEndTime', e.target.value)}
                  disabled={readOnly || !formData.appointmentDate}
                  className={cn(errors.appointmentEndTime && 'border-destructive')}
                />
                {errors.appointmentEndTime && (
                  <p className="text-xs text-destructive">{errors.appointmentEndTime}</p>
                )}
              </div>
            </>
          )}

          {showAppointmentStatus && (
            <div className="space-y-2">
              <Label htmlFor={pid('appointmentStatus')}>Appointment status</Label>
              <div
                id={pid('appointmentStatus')}
                className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm"
              >
                {(() => {
                  const current =
                    statusOptions.find((s) => s.name === formData.status) ||
                    statusOptions[0];
                  const hex = normalizeHexColor(current?.color) || '#6b7280';
                  return (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-border/60"
                        style={{ backgroundColor: hex }}
                        aria-hidden
                      />
                      {formData.status || 'Scheduled'}
                      <span className="text-xs text-muted-foreground">(auto)</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </EpicWorkflowSection>

      <EpicWorkflowSection
        step="4"
        title="Visit information"
        description="Enter reason for visit and scheduling notes after the slot is selected."
        complete={Boolean(formData.appointmentReason?.trim())}
        className={cn(!slotComplete && !readOnly && 'opacity-75')}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentReason')}>Reason for visit</Label>
            <SearchableSelect
              value={formData.appointmentReason || ''}
              onValueChange={(value) => onChange('appointmentReason', value)}
              options={reasonOfVisitOptions}
              placeholder="Select reason for visit"
              disabled={readOnly || (!slotComplete && !readOnly)}
              preserveOptionOrder
              triggerClassName="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={pid('appointmentNotes')}>Scheduling comments</Label>
            <Textarea
              id={pid('appointmentNotes')}
              value={formData.appointmentNotes ?? ''}
              onChange={(e) => onChange('appointmentNotes', e.target.value)}
              disabled={readOnly || (!slotComplete && !readOnly)}
              rows={3}
              placeholder="Internal scheduling notes (optional)"
            />
          </div>

          {showAccessibilityAccordion && (
            <AccessibilityRequirementsAccordion
              selected={formData.accessibilityRequirements || []}
              notes={formData.accessibilityRequirementsNotes || ''}
              onChangeSelected={(value) => onChange('accessibilityRequirements', value)}
              onChangeNotes={(value) => onChange('accessibilityRequirementsNotes', value)}
              disabled={readOnly || (!slotComplete && !readOnly)}
            />
          )}
        </div>
      </EpicWorkflowSection>

      <Accordion
        type="single"
        collapsible
        value={referralOpen}
        onValueChange={setReferralOpen}
        className="rounded-xl border border-border/80 bg-card shadow-sm"
      >
        <AccordionItem value="referral" className="border-0">
          <AccordionTrigger className="rounded-xl px-3 py-2.5 text-sm font-semibold sm:px-4">
            Referring physician (optional)
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-4 pb-5 sm:px-5">
            <ReferringPhysicianFields
              formData={formData}
              errors={errors}
              onChange={onChange}
              idPrefix={idPrefix}
              readOnly={readOnly}
              providers={referringProviders}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
