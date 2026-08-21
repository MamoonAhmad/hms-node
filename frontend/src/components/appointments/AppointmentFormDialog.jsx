import { useState, useEffect, useMemo, useCallback } from 'react';

/* eslint-disable react-hooks/set-state-in-effect -- Dialog form sync and async catalog load */

import { Plus, Clock, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PatientRegistrationAppointmentFields } from '@/components/patients/PatientRegistrationAppointmentFields';
import { AppointmentHistorySidebar } from '@/components/appointments/AppointmentHistorySidebar';
import {
  buildAppointmentSubmitPayloadFromRegistration,
  emptyReferralPayload,
  parseNotesWithReferral,
  validateRegistrationAppointmentFields,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  getDefaultAppointmentStatusName,
  getAppointmentStatusesFallback,
  getManualStatusOptions,
} from '@/lib/appointmentStatuses';
import { buildPatientSearchOption } from '@/lib/appointmentUtils';
import {
  appointmentApi,
  appointmentStatusApi,
  appointmentTypeApi,
  departmentApi,
  providerApi,
} from '@/services/api';
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
  ...emptyReferralPayload(),
  duration: 30,
  status: getDefaultAppointmentStatusName(),
});

function mapAppointmentToForm(appointment, defaultStatus) {
  const { appointmentNotes, referral } = parseNotesWithReferral(appointment.notes);
  return {
    patientId: appointment.patientId || '',
    appointmentDate: appointment.appointmentDate ? appointment.appointmentDate.split('T')[0] : '',
    appointmentTime: appointment.appointmentTime || '',
    appointmentStartTime: appointment.appointmentEndTime ? appointment.appointmentTime : '',
    appointmentEndTime: appointment.appointmentEndTime || '',
    appointmentVisitType: appointment.appointmentType || '',
    appointmentTypeName: appointment.appointmentType || '',
    appointmentDepartment: appointment.department || appointment.departmentRef?.departmentName || '',
    appointmentDepartmentId: appointment.departmentId || appointment.departmentRef?.id || '',
    appointmentProvider: appointment.provider || '',
    appointmentProviderId: appointment.providerId || appointment.providerRef?.id || '',
    appointmentReason: appointment.visitReason || '',
    appointmentNotes,
    ...referral,
    duration: appointment.duration || 30,
    status: appointment.status || defaultStatus,
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
  isLoading,
  initialDate = '',
  initialTime = '',
  mode = 'create',
  onModeChange,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [statusOptions, setStatusOptions] = useState(() => getAppointmentStatusesFallback());
  const [departments, setDepartments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState(null);
  const [availableDates, setAvailableDates] = useState(null);
  const [availableDatesLoading, setAvailableDatesLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [internalMode, setInternalMode] = useState(mode);

  const isEditing = Boolean(appointment);
  const readOnly = internalMode === 'view';
  const dialogMode = isEditing ? internalMode : 'create';

  useEffect(() => {
    if (open) setInternalMode(mode);
  }, [open, mode, appointment?.id]);

  const statusSelectOptions = useMemo(() => {
    const options = [...getManualStatusOptions(statusOptions)];
    const current = formData.status;
    if (current && !options.some((s) => s.name === current)) {
      options.unshift({ id: 'legacy-status', name: current, color: '#6b7280' });
    }
    return options;
  }, [statusOptions, formData.status]);

  const patientOptions = useMemo(
    () => patients.map((patient) => buildPatientSearchOption(patient)),
    [patients],
  );

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.departmentName })),
    [departments],
  );

  const filteredProviders = useMemo(() => {
    if (!formData.appointmentDepartmentId) return providers;
    return providers.filter((p) => p.departmentId === formData.appointmentDepartmentId);
  }, [providers, formData.appointmentDepartmentId]);

  const providerOptions = useMemo(
    () =>
      filteredProviders.map((provider) => ({
        value: provider.id,
        label: [provider.lastName, [provider.firstName, provider.middleName].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', '),
        displayLabel: `${provider.firstName || ''} ${provider.lastName || ''} ${provider.npi || ''}`,
      })),
    [filteredProviders],
  );

  const appointmentTypeOptions = useMemo(
    () =>
      appointmentTypes.map((type) => ({
        value: type.name,
        label: type.name,
      })),
    [appointmentTypes],
  );

  const loadMasterData = useCallback(async () => {
    const [statusRes, deptRes, provRes, typeRes] = await Promise.all([
      appointmentStatusApi.getActive().catch(() => ({ data: getAppointmentStatusesFallback() })),
      departmentApi.getAll({ limit: 200 }).catch(() => ({ data: [] })),
      providerApi.getAll({ limit: 500, isActive: true }).catch(() => ({ data: [] })),
      appointmentTypeApi.getActive().catch(() => ({ data: [] })),
    ]);
    setStatusOptions(
      Array.isArray(statusRes.data) && statusRes.data.length
        ? statusRes.data
        : getAppointmentStatusesFallback(),
    );
    setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
    setProviders(Array.isArray(provRes.data) ? provRes.data : []);
    setAppointmentTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    loadMasterData().then(() => {
      if (cancelled) return;
      const defaultStatus = getDefaultAppointmentStatusName(statusOptions);
      if (appointment) {
        setFormData(mapAppointmentToForm(appointment, defaultStatus));
      } else {
        setFormData({
          ...emptyForm(),
          appointmentDate: initialDate || '',
          appointmentTime: initialTime || '',
          status: defaultStatus,
        });
      }
      setErrors({});
    });

    return () => {
      cancelled = true;
    };
  }, [appointment, open, initialDate, initialTime, loadMasterData]);

  useEffect(() => {
    if (!open || appointment || !prefillPatientId) return;
    setFormData((prev) => ({ ...prev, patientId: prefillPatientId }));
  }, [open, appointment, prefillPatientId]);

  useEffect(() => {
    if (!open || !formData.appointmentProviderId || !formData.appointmentVisitType) {
      setAvailableDates(null);
      setAvailableDatesLoading(false);
      return;
    }
    let cancelled = false;
    setAvailableDatesLoading(true);
    appointmentApi
      .getAvailableDates({
        providerId: formData.appointmentProviderId,
        appointmentType: formData.appointmentVisitType,
      })
      .then((res) => {
        if (cancelled) return;
        setAvailableDates(new Set(res.data?.dates || []));
      })
      .catch(() => {
        if (!cancelled) setAvailableDates(new Set());
      })
      .finally(() => {
        if (!cancelled) setAvailableDatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, formData.appointmentProviderId, formData.appointmentVisitType]);

  useEffect(() => {
    if (!open || !formData.appointmentProviderId || !formData.appointmentDate) {
      setTimeSlotOptions(null);
      return;
    }
    let cancelled = false;
    appointmentApi
      .getAvailableSlots({
        providerId: formData.appointmentProviderId,
        date: formData.appointmentDate,
        appointmentType: formData.appointmentVisitType || undefined,
        excludeAppointmentId: appointment?.id,
      })
      .then((res) => {
        if (cancelled) return;
        const slots = (res.data?.slots || []).map((slot) => ({
          value: slot.value || slot.startTime,
          label: slot.label || `${slot.startTime} – ${slot.endTime}`,
        }));
        setTimeSlotOptions(slots.length ? slots : []);
      })
      .catch(() => {
        if (!cancelled) setTimeSlotOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    formData.appointmentProviderId,
    formData.appointmentDate,
    formData.appointmentVisitType,
    appointment?.id,
  ]);

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
    if (!validate()) return;

    const submitData = buildAppointmentSubmitPayloadFromRegistration(formData, formData.patientId, {
      defaultStatus: formData.status || getDefaultAppointmentStatusName(statusOptions),
    });

    onSubmit(submitData);
  };

  const openHistory = async () => {
    if (!appointment?.id) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await appointmentApi.getHistory(appointment.id);
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
        : 'Schedule new appointment';

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
                {readOnly
                  ? 'Review appointment information. Click Edit to make changes.'
                  : 'Choose a patient, then enter visit details.'}
              </DialogDescription>
              {appointment?.encounterNumber && (
                <p className="text-xs font-mono text-muted-foreground">
                  Encounter: {appointment.encounterNumber}
                </p>
              )}
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-6">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 shadow-sm space-y-4">
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
                          'h-11 bg-background',
                          errors.patientId ? 'border-destructive' : '',
                        )}
                      />
                    </div>
                    {!isEditing && !readOnly && onAddPatient && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0"
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

              <div className="rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm space-y-6">
                <PatientRegistrationAppointmentFields
                  idPrefix="appt-schedule"
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                  timeSlotOptions={timeSlotOptions}
                  showAppointmentStatus
                  statusOptions={statusSelectOptions}
                  hideReferralSection
                  showReferringPhysicianSection
                  departmentOptions={departmentOptions}
                  providerOptions={providerOptions}
                  appointmentTypeOptions={
                    appointmentTypeOptions.length ? appointmentTypeOptions : undefined
                  }
                  referringProviders={providers}
                  readOnly={readOnly}
                  availableDates={availableDates}
                  availableDatesLoading={availableDatesLoading}
                />
              </div>
            </div>

            {!readOnly && (
              <DialogFooter className="shrink-0 gap-3 border-t border-border/80 bg-muted/25 px-6 py-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-[160px]">
                  {isLoading
                    ? 'Saving...'
                    : isEditing
                      ? 'Save changes'
                      : 'Schedule appointment'}
                </Button>
              </DialogFooter>
            )}
          </form>
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
