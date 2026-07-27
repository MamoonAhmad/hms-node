import { useState, useEffect, useMemo, useCallback } from 'react';

/* eslint-disable react-hooks/set-state-in-effect -- Dialog form sync and async catalog load */

import { Plus, Clock, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EpicScheduleAppointmentFields } from '@/components/appointments/EpicScheduleAppointmentFields';
import { PatientRegistrationAppointmentFields } from '@/components/patients/PatientRegistrationAppointmentFields';
import { AppointmentHistorySidebar } from '@/components/appointments/AppointmentHistorySidebar';
import {
  buildAppointmentSubmitPayloadFromRegistration,
  emptyReferralPayload,
  validateRegistrationAppointmentFields,
  isGeneralAppointmentVisitType,
  DEFAULT_VISIT_MODALITY,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  getDefaultAppointmentStatusName,
  getAppointmentStatusesFallback,
  getCanonicalAppointmentStatuses,
} from '@/lib/appointmentStatuses';
import { buildPatientSearchOption, formatProviderListName } from '@/lib/appointmentUtils';
import { formatAppointmentTimeSlot } from '@/components/patients/patientRegistrationAppointmentConstants';
import {
  appointmentApi,
  appointmentStatusApi,
  departmentApi,
  providerApi,
} from '@/services/api';
import { useAppointmentAvailability } from '@/hooks/useAppointmentAvailability';
import {
  mapAppointmentToRegistrationForm,
  RESCHEDULED_APPOINTMENT_STATUS,
  buildAppointmentUpdatePayload,
  didScheduleOrSlotChange,
  isAppointmentFormDirty,
} from '@/lib/appointmentFormUtils';
import { cn } from '@/lib/utils';

const emptyForm = () => ({
  patientId: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentStartTime: '',
  appointmentEndTime: '',
  appointmentVisitType: '',
  appointmentTypeName: '',
  appointmentDepartment: '',
  appointmentDepartmentId: '',
  appointmentProvider: '',
  appointmentProviderId: '',
  appointmentReason: '',
  appointmentNotes: '',
  visitModality: DEFAULT_VISIT_MODALITY,
  accessibilityRequirements: [],
  accessibilityRequirementsNotes: '',
  ...emptyReferralPayload(),
  duration: 30,
  status: getDefaultAppointmentStatusName(),
});

function mapAppointmentToForm(appointment, defaultStatus) {
  return {
    ...emptyForm(),
    ...mapAppointmentToRegistrationForm(appointment, defaultStatus),
    patientId: appointment?.patientId || '',
    duration: appointment?.duration || 30,
  };
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  patients = [],
  onSubmit,
  onAddPatient,
  prefillPatientId = '',
  prefillProviderId = '',
  prefillDepartmentId = '',
  prefillAppointmentType = '',
  isLoading,
  initialDate = '',
  initialTime = '',
  mode = 'create',
  onModeChange,
  /** 'dialog' (default) or 'page' for full-page scheduling */
  variant = 'dialog',
  submitError = null,
}) {
  const isPage = variant === 'page';
  const [formData, setFormData] = useState(emptyForm);
  const [baselineForm, setBaselineForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [statusOptions, setStatusOptions] = useState(() => getAppointmentStatusesFallback());
  const [departments, setDepartments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [internalMode, setInternalMode] = useState(mode);
  const [detailAppointment, setDetailAppointment] = useState(appointment);
  const [detailLoading, setDetailLoading] = useState(false);

  const isEditing = Boolean(appointment);
  const readOnly = internalMode === 'view';
  const dialogMode = isEditing ? internalMode : 'create';
  const isDirty = isEditing && isAppointmentFormDirty(baselineForm, formData);
  const willReschedule =
    isEditing && !readOnly && didScheduleOrSlotChange(baselineForm, formData);

  useEffect(() => {
    if (open) setInternalMode(mode);
  }, [open, mode, appointment?.id]);

  const statusSelectOptions = useMemo(() => {
    const options = [...statusOptions];
    const current = formData.status;
    if (current && !options.some((s) => s.name === current)) {
      options.unshift({ id: 'legacy-status', name: current, color: '#6b7280' });
    }
    return options;
  }, [statusOptions, formData.status]);

  const patientOptions = useMemo(() => {
    const options = patients.map((patient) => buildPatientSearchOption(patient));
    const sourcePatient = detailAppointment?.patient || appointment?.patient;
    const sourceId = detailAppointment?.patientId || appointment?.patientId;
    if (sourceId && sourcePatient && !options.some((o) => o.value === sourceId)) {
      options.unshift(buildPatientSearchOption(sourcePatient));
    }
    return options;
  }, [patients, detailAppointment, appointment]);

  const departmentOptions = useMemo(() => {
    const options = departments.map((d) => ({
      value: d.id,
      label: d.departmentCode
        ? `${d.departmentName} (${d.departmentCode})`
        : d.departmentName,
      departmentName: d.departmentName,
    }));
    const deptId = formData.appointmentDepartmentId;
    if (deptId && !options.some((o) => o.value === deptId)) {
      options.unshift({
        value: deptId,
        label: formData.appointmentDepartment || deptId,
        departmentName: formData.appointmentDepartment || deptId,
      });
    }
    return options;
  }, [departments, formData.appointmentDepartmentId, formData.appointmentDepartment]);

  const providerOptions = useMemo(() => {
    const toOption = (provider) => {
      const departmentIds = provider.departmentIds?.length
        ? provider.departmentIds
        : provider.departmentId || provider.department?.id
          ? [provider.departmentId || provider.department?.id]
          : [];
      return {
        value: provider.id,
        label: [provider.lastName, [provider.firstName, provider.middleName].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', '),
        displayLabel: `${provider.firstName || ''} ${provider.lastName || ''} ${provider.npi || ''}`,
        departmentId: provider.departmentId || provider.department?.id || departmentIds[0] || '',
        departmentIds,
        departmentName:
          provider.department?.departmentName ||
          provider.departments?.[0]?.departmentName ||
          '',
      };
    };

    const options = providers.map(toOption);
    const providerId = formData.appointmentProviderId;
    if (providerId && !options.some((o) => o.value === providerId)) {
      const fromAll = providers.find((p) => p.id === providerId);
      options.unshift(
        fromAll
          ? toOption(fromAll)
          : {
              value: providerId,
              label: formData.appointmentProvider || providerId,
              displayLabel: formData.appointmentProvider || providerId,
              departmentId: formData.appointmentDepartmentId || '',
              departmentIds: formData.appointmentDepartmentId
                ? [formData.appointmentDepartmentId]
                : [],
              departmentName: formData.appointmentDepartment || '',
            },
      );
    }
    return options;
  }, [
    providers,
    formData.appointmentProviderId,
    formData.appointmentProvider,
    formData.appointmentDepartmentId,
    formData.appointmentDepartment,
  ]);

  const loadMasterData = useCallback(async () => {
    const [statusRes, deptRes, provRes] = await Promise.all([
      appointmentStatusApi.getActive().catch(() => ({ data: getAppointmentStatusesFallback() })),
      departmentApi.getActive().catch(() => ({ data: [] })),
      providerApi.getAll({ limit: 500, isActive: true }).catch(() => ({ data: [] })),
    ]);
    const nextStatusOptions = getCanonicalAppointmentStatuses(
      Array.isArray(statusRes.data) ? statusRes.data : [],
    );
    const nextDepartments = Array.isArray(deptRes.data) ? deptRes.data : [];
    const nextProviders = Array.isArray(provRes.data) ? provRes.data : [];

    setStatusOptions(nextStatusOptions);
    setDepartments(nextDepartments);
    setProviders(nextProviders);

    return {
      statusOptions: nextStatusOptions,
      departments: nextDepartments,
      providers: nextProviders,
    };
  }, []);

  const {
    availableDates,
    availableDatesLoading,
    availabilityError,
    timeSlotOptions,
    filteredAppointmentTypeOptions,
    scheduleTypesLoading,
    hasProviderSchedules,
  } = useAppointmentAvailability({
    enabled: open,
    providerId: formData.appointmentProviderId,
    departmentId: formData.appointmentDepartmentId,
    appointmentType: formData.appointmentVisitType,
    appointmentDate: formData.appointmentDate,
    excludeAppointmentId: detailAppointment?.id || appointment?.id,
  });

  const appointmentTypeOptions = filteredAppointmentTypeOptions;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const hydrate = async () => {
      setDetailLoading(Boolean(appointment?.id));
      const [{ statusOptions: loadedStatusOptions, providers: loadedProviders, departments: loadedDepartments }, detailRes] =
        await Promise.all([
          loadMasterData(),
          appointment?.id
            ? appointmentApi.getById(appointment.id).catch(() => null)
            : Promise.resolve(null),
        ]);

      if (cancelled) return;

      const defaultStatus = getDefaultAppointmentStatusName(loadedStatusOptions);
      const resolvedAppointment = detailRes?.data || appointment || null;
      setDetailAppointment(resolvedAppointment);

      if (resolvedAppointment) {
        const mapped = mapAppointmentToForm(resolvedAppointment, defaultStatus);
        setFormData(mapped);
        setBaselineForm({
          ...mapped,
          accessibilityRequirements: [...(mapped.accessibilityRequirements || [])],
        });
      } else {
        const provider = prefillProviderId
          ? loadedProviders.find((row) => row.id === prefillProviderId)
          : null;
        const resolvedDepartmentId =
          prefillDepartmentId ||
          provider?.departmentId ||
          provider?.departmentIds?.[0] ||
          '';
        const department = resolvedDepartmentId
          ? loadedDepartments.find((row) => row.id === resolvedDepartmentId)
          : null;

        const created = {
          ...emptyForm(),
          appointmentDate: initialDate || '',
          appointmentTime: initialTime || '',
          status: defaultStatus,
          ...(provider
            ? {
                appointmentProviderId: prefillProviderId,
                appointmentProvider: formatProviderListName(provider),
              }
            : {}),
          ...(department
            ? {
                appointmentDepartmentId: department.id,
                appointmentDepartment: department.departmentName,
              }
            : {}),
          ...(prefillAppointmentType
            ? {
                appointmentVisitType: prefillAppointmentType,
                appointmentTypeName: prefillAppointmentType,
              }
            : {}),
        };
        setFormData(created);
        setBaselineForm(null);
      }
      setErrors({});
      setDetailLoading(false);
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    appointment,
    open,
    initialDate,
    initialTime,
    prefillProviderId,
    prefillDepartmentId,
    prefillAppointmentType,
    loadMasterData,
  ]);

  useEffect(() => {
    if (!open || appointment || !prefillPatientId) return;
    setFormData((prev) => ({ ...prev, patientId: prefillPatientId }));
  }, [open, appointment, prefillPatientId]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'appointmentVisitType') {
        next.appointmentTypeName = value;
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const phoneRegex = /^[\d\s\-()+]+$/;

    if (!formData.patientId) newErrors.patientId = 'Patient is required';
    validateRegistrationAppointmentFields(formData, newErrors, {
      requireProvider: true,
      requireDepartment: true,
      timeSlotOptions: timeSlotOptions || undefined,
    });

    if (formData.referringPhysicianPhone && !phoneRegex.test(formData.referringPhysicianPhone)) {
      newErrors.referringPhysicianPhone = 'Invalid phone number format';
    }
    if (formData.referringPhysicianFax && !phoneRegex.test(formData.referringPhysicianFax)) {
      newErrors.referringPhysicianFax = 'Invalid fax number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (isEditing && !isDirty) return;
    if (!validate()) return;

    if (isEditing) {
      const submitData = buildAppointmentUpdatePayload(
        formData,
        formData.patientId,
        {
          baseline: baselineForm,
          timeSlotOptions: timeSlotOptions || undefined,
        },
      );
      onSubmit(submitData);
      return;
    }

    const submitData = buildAppointmentSubmitPayloadFromRegistration(formData, formData.patientId, {
      defaultStatus: formData.status || getDefaultAppointmentStatusName(statusOptions),
      timeSlotOptions: timeSlotOptions || undefined,
    });
    onSubmit(submitData);
  };

  const openHistory = async () => {
    const id = detailAppointment?.id || appointment?.id;
    if (!id) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await appointmentApi.getHistory(id);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditClick = () => {
    setInternalMode('edit');
    onModeChange?.('edit');
  };

  const title =
    dialogMode === 'view'
      ? 'Appointment details'
      : isEditing
        ? 'Edit appointment'
        : 'Schedule appointment';

  const selectedPatientLabel = useMemo(() => {
    if (!formData.patientId) return null;
    const match = patientOptions.find((o) => o.value === formData.patientId);
    return match?.label || null;
  }, [formData.patientId, patientOptions]);

  const scheduleSummary = useMemo(() => {
    const parts = [];
    if (selectedPatientLabel) parts.push({ label: 'Patient', value: selectedPatientLabel });
    if (formData.appointmentDepartment) {
      parts.push({ label: 'Department', value: formData.appointmentDepartment });
    }
    if (formData.appointmentProvider) {
      parts.push({ label: 'Provider', value: formData.appointmentProvider });
    }
    if (formData.appointmentVisitType) {
      parts.push({ label: 'Type', value: formData.appointmentVisitType });
    }
    if (formData.appointmentDate) {
      const dateLabel = new Date(`${formData.appointmentDate}T12:00:00`).toLocaleDateString(
        'en-US',
        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
      );
      let timeLabel = '';
      if (formData.appointmentTime) {
        timeLabel = formatAppointmentTimeSlot(formData.appointmentTime, timeSlotOptions || []);
      } else if (formData.appointmentStartTime) {
        timeLabel = formData.appointmentEndTime
          ? `${formData.appointmentStartTime} – ${formData.appointmentEndTime}`
          : formData.appointmentStartTime;
      }
      parts.push({
        label: 'When',
        value: timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel,
      });
    }
    return parts;
  }, [selectedPatientLabel, formData, timeSlotOptions]);

  const description = readOnly
    ? 'Review appointment information. Click Edit to make changes.'
    : isEditing
      ? 'Update scheduling details for this visit.'
      : 'Epic-style flow: patient → scheduling context → slot → visit details.';

  const formBody = (
    <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col', isPage && 'gap-0')}>
      <div
        className={cn(
          'ehr-form min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden',
          isPage ? 'px-0 py-0' : 'px-5 py-4',
        )}
      >
        {submitError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {submitError}
          </div>
        ) : null}

        {detailLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading appointment details…
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
                  1
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Patient</p>
                  <p className="text-xs text-muted-foreground">Identify who this visit is for.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-form-patientId" className="text-sm font-medium">
                  Patient <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <SearchableSelect
                      value={formData.patientId}
                      onValueChange={(value) => handleChange('patientId', value)}
                      options={patientOptions}
                      placeholder="Search patient by name or MRN"
                      disabled={readOnly || isEditing}
                      triggerClassName={cn(
                        'h-8 bg-background',
                        errors.patientId ? 'border-destructive' : '',
                      )}
                    />
                  </div>
                  {!isEditing && !readOnly && onAddPatient && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={onAddPatient}
                      title="Add new patient"
                      aria-label="Add new patient"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errors.patientId && <p className="text-xs text-destructive">{errors.patientId}</p>}
              </div>
            </div>

            {scheduleSummary.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  Appointment summary
                </p>
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {scheduleSummary.map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="truncate text-sm font-medium text-foreground">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="space-y-4">
              {isEditing ? (
                <div className="rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm">
                  <PatientRegistrationAppointmentFields
                    idPrefix="appt-schedule"
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    timeSlotOptions={timeSlotOptions}
                    showAppointmentStatus={readOnly}
                    statusOptions={statusSelectOptions}
                    hideReferralSection
                    showReferringPhysicianSection
                    departmentOptions={departmentOptions}
                    providerOptions={providerOptions}
                    appointmentTypeOptions={appointmentTypeOptions}
                    scheduleTypesLoading={scheduleTypesLoading}
                    hasProviderSchedules={hasProviderSchedules}
                    readOnly={readOnly}
                    availableDates={availableDates}
                    availableDatesLoading={availableDatesLoading}
                    availabilityError={availabilityError}
                    referringProviders={providers}
                  />
                </div>
              ) : (
                <EpicScheduleAppointmentFields
                  idPrefix="appt-schedule"
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                  timeSlotOptions={timeSlotOptions}
                  showAppointmentStatus={false}
                  statusOptions={statusSelectOptions}
                  departmentOptions={departmentOptions}
                  providerOptions={providerOptions}
                  appointmentTypeOptions={appointmentTypeOptions}
                  scheduleTypesLoading={scheduleTypesLoading}
                  hasProviderSchedules={hasProviderSchedules}
                  readOnly={readOnly}
                  availableDates={availableDates}
                  availableDatesLoading={availableDatesLoading}
                  availabilityError={availabilityError}
                  referringProviders={providers}
                />
              )}
            </div>
          </>
        )}
      </div>

      {!readOnly && (
        <div
          className={cn(
            'shrink-0 flex flex-col gap-2 sm:flex-row sm:justify-end',
            isPage
              ? 'border-t border-border pt-4 mt-6'
              : 'border-t border-border/80 bg-muted/25 px-6 py-4',
          )}
        >
          {willReschedule && (
            <p className="w-full text-xs text-muted-foreground sm:mr-auto sm:w-auto sm:self-center">
              Schedule, date, or time changes will set status to {RESCHEDULED_APPOINTMENT_STATUS}.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || detailLoading || (isEditing && !isDirty)}
            className="min-w-[160px]"
          >
            {isLoading
              ? 'Saving...'
              : isEditing
                ? 'Save changes'
                : 'Book appointment'}
          </Button>
        </div>
      )}
    </form>
  );

  if (isPage) {
    return (
      <>
        <div className="space-y-4">
          {(isEditing || readOnly) && (
            <div className="flex items-center justify-end gap-1.5">
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={openHistory}
                  title="History"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              {readOnly && (
                <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
          {(detailAppointment?.encounterNumber || appointment?.encounterNumber) && (
            <p className="text-xs font-mono text-muted-foreground">
              Encounter: {detailAppointment?.encounterNumber || appointment?.encounterNumber}
            </p>
          )}
          {formBody}
        </div>
        <AppointmentHistorySidebar
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={history}
          isLoading={historyLoading}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className={cn(
            'flex max-h-[min(90vh,920px)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-card p-0 shadow-2xl',
            'ring-1 ring-border/60 dark:ring-white/10',
            'w-[min(calc(100vw-1.5rem),1100px)] max-sm:min-w-0 sm:min-w-[900px] sm:w-[clamp(900px,min(92vw,1100px),1100px)]',
            'sm:max-w-none',
          )}
        >
          <DialogHeader
            className={cn(
              '!m-0 shrink-0 space-y-1.5 rounded-none border-b border-border/80 bg-gradient-to-br from-primary/[0.12] via-primary/[0.06] to-transparent py-5 pl-6 pr-28 text-left sm:text-left',
              'bg-transparent text-foreground',
            )}
          >
            {(isEditing || readOnly) && (
              <div className="absolute top-3.5 right-14 z-20 flex items-center gap-1.5">
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={openHistory}
                    title="History"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
                {readOnly && (
                  <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
            <div className="space-y-1.5 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
              {(detailAppointment?.encounterNumber || appointment?.encounterNumber) && (
                <p className="text-xs font-mono text-muted-foreground">
                  Encounter: {detailAppointment?.encounterNumber || appointment?.encounterNumber}
                </p>
              )}
            </div>
          </DialogHeader>

          {formBody}
        </DialogContent>
      </Dialog>

      <AppointmentHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        isLoading={historyLoading}
      />
    </>
  );
}
