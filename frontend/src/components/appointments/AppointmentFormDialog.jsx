import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
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
import {
  API_TYPE_TO_VISIT_TYPE,
  APPOINTMENT_TIME_SLOT_OPTIONS,
  buildAppointmentSubmitPayloadFromRegistration,
  emptyReferralPayload,
  parseNotesWithReferral,
  validateRegistrationAppointmentFields,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  getAppointmentStatuses,
  getDefaultAppointmentStatusName,
} from '@/lib/appointmentStatuses';
import { cn } from '@/lib/utils';

const emptyForm = () => ({
  patientId: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentStartTime: '',
  appointmentEndTime: '',
  appointmentVisitType: '',
  appointmentProvider: '',
  appointmentReason: '',
  appointmentNotes: '',
  ...emptyReferralPayload(),
  duration: 30,
  status: getDefaultAppointmentStatusName(),
});

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
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [statusOptions, setStatusOptions] = useState(() => getAppointmentStatuses());

  const isEditing = !!appointment;

  const statusSelectOptions = useMemo(() => {
    const options = [...statusOptions];
    const current = formData.status;
    if (current && !options.some((s) => s.name === current)) {
      options.unshift({ id: 'legacy-status', name: current, color: '#6b7280' });
    }
    return options;
  }, [statusOptions, formData.status]);

  const patientOptions = useMemo(
    () =>
      patients.map((patient) => ({
        value: patient.id,
        label: `${patient.firstName} ${patient.lastName} (${patient.mrn})`,
      })),
    [patients],
  );

  useEffect(() => {
    if (!open) return;

    const statuses = getAppointmentStatuses();
    setStatusOptions(statuses);
    const defaultStatus = statuses[0]?.name || 'Scheduled';

    if (appointment) {
      const { appointmentNotes, referral } = parseNotesWithReferral(appointment.notes);
      const visitType =
        API_TYPE_TO_VISIT_TYPE[appointment.appointmentType] || 'new-patient';
      setFormData({
        patientId: appointment.patientId || '',
        appointmentDate: appointment.appointmentDate
          ? appointment.appointmentDate.split('T')[0]
          : '',
        appointmentTime: appointment.appointmentTime || '',
        appointmentVisitType: visitType,
        appointmentProvider: appointment.provider || '',
        appointmentReason: appointment.visitReason || '',
        appointmentNotes,
        ...referral,
        duration: appointment.duration || 30,
        status: appointment.status || defaultStatus,
      });
    } else {
      setFormData({
        ...emptyForm(),
        appointmentDate: initialDate || '',
        appointmentTime: initialTime || '',
        status: defaultStatus,
      });
    }
    setErrors({});
  }, [appointment, open, initialDate, initialTime]);

  useEffect(() => {
    if (!open || appointment || !prefillPatientId) return;
    setFormData((prev) => ({ ...prev, patientId: prefillPatientId }));
  }, [open, appointment, prefillPatientId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const phoneRegex = /^[\d\s\-()]+$/;

    if (!formData.patientId) newErrors.patientId = 'Patient is required';
    validateRegistrationAppointmentFields(formData, newErrors);

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
    if (!validate()) return;

    const submitData = buildAppointmentSubmitPayloadFromRegistration(formData, formData.patientId, {
      defaultStatus: formData.status || getDefaultAppointmentStatusName(),
    });

    if (isEditing) {
      submitData.department = appointment?.department?.trim() || null;
    }

    onSubmit(submitData);
  };

  return (
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
            '!m-0 shrink-0 space-y-1.5 rounded-none border-b border-border/80 bg-gradient-to-br from-primary/[0.12] via-primary/[0.06] to-transparent px-6 py-5 text-left sm:text-left',
            'bg-transparent text-foreground',
          )}
        >
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            {isEditing ? 'Edit appointment' : 'Schedule new appointment'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a patient, then enter visit details.
          </DialogDescription>
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
                      placeholder="Search or select a patient"
                      disabled={isEditing}
                      triggerClassName={cn(
                        'h-11 bg-background',
                        errors.patientId ? 'border-destructive' : '',
                      )}
                    />
                  </div>
                  {!isEditing && onAddPatient && (
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
                timeSlotOptions={APPOINTMENT_TIME_SLOT_OPTIONS}
                showAppointmentStatus
                statusOptions={statusSelectOptions}
                hideReferralSection
                showReferringPhysicianSection
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border/80 bg-muted/25 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[160px]">
              {isLoading ? 'Saving...' : isEditing ? 'Update appointment' : 'Schedule appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
