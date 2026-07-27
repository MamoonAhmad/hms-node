import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentFormDialog } from '@/components/appointments/AppointmentFormDialog';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import {
  createAppointmentFromRegistrationIfNeeded,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import { getDefaultAppointmentStatusName } from '@/lib/appointmentStatuses';
import { appointmentApi, patientApi } from '@/services/api';

function buildCreateSearchParams({
  date,
  time,
  patientId,
  providerId,
  departmentId,
  appointmentType,
} = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (time) params.set('time', time);
  if (patientId) params.set('patientId', patientId);
  if (providerId) params.set('providerId', providerId);
  if (departmentId) params.set('departmentId', departmentId);
  if (appointmentType) params.set('appointmentType', appointmentType);
  const qs = params.toString();
  return qs ? `/appointments/new?${qs}` : '/appointments/new';
}

/** Build the new-appointment URL with optional prefill query params. */
export function getNewAppointmentPath(prefill = {}) {
  return buildCreateSearchParams(prefill);
}

/** Build the edit/reschedule appointment URL. */
export function getEditAppointmentPath(appointmentId) {
  return `/appointments/${appointmentId}/edit`;
}

export function AppointmentFormPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(appointmentId);

  const [patients, setPatients] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);

  const initialDate = searchParams.get('date') || '';
  const initialTime = searchParams.get('time') || '';
  const prefillPatientId = searchParams.get('patientId') || '';
  const prefillProviderId = searchParams.get('providerId') || '';
  const prefillDepartmentId = searchParams.get('departmentId') || '';
  const prefillAppointmentType = searchParams.get('appointmentType') || '';

  const fetchPatients = useCallback(async () => {
    try {
      const response = await patientApi.getAll({ limit: 100 });
      setPatients(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPatients([]);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!appointmentId) {
      setAppointment(null);
      setLoadError(null);
      setIsLoadingAppointment(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingAppointment(true);
    setLoadError(null);

    appointmentApi
      .getById(appointmentId)
      .then((res) => {
        if (!cancelled) setAppointment(res?.data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setAppointment(null);
          setLoadError(err.message || 'Failed to load appointment');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAppointment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const goBack = () => navigate('/appointments');

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit && appointmentId) {
        await appointmentApi.update(appointmentId, data);
      } else {
        await appointmentApi.create(data);
      }
      navigate('/appointments');
    } catch (err) {
      const details = Array.isArray(err.details)
        ? err.details.map((d) => d.message || d).filter(Boolean)
        : Array.isArray(err.errors)
          ? err.errors.map((e) => e.message || e).filter(Boolean)
          : [];
      setSubmitError(
        details.length
          ? `${err.message || 'Validation failed'}: ${details.join('; ')}`
          : err.message || (isEdit ? 'Failed to update appointment' : 'Failed to book appointment'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { bookAppointment, ...patientData } = data;
      const response = await patientApi.create(patientData);
      const patientId = response?.data?.id;

      const createdAppointment = patientId
        ? await createAppointmentFromRegistrationIfNeeded(patientId, data, {
            appointmentApi,
            defaultStatus: getDefaultAppointmentStatusName(),
            evaluateRegistrationStatus: true,
          })
        : null;

      setIsPatientFormOpen(false);
      await fetchPatients();

      if (createdAppointment) {
        navigate('/appointments');
        return;
      }

      if (patientId) {
        navigate(
          getNewAppointmentPath({
            date: initialDate,
            time: initialTime,
            patientId,
            providerId: prefillProviderId,
            departmentId: prefillDepartmentId,
            appointmentType: prefillAppointmentType,
          }),
          { replace: true },
        );
      }
    } catch (err) {
      const details = Array.isArray(err.details)
        ? err.details.map((d) => d.message || d).filter(Boolean)
        : Array.isArray(err.errors)
          ? err.errors.map((e) => e.message || e).filter(Boolean)
          : [];
      setSubmitError(
        details.length
          ? `${err.message || 'Validation failed'}: ${details.join('; ')}`
          : err.message || 'Failed to create patient',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="shrink-0"
          aria-label="Back to appointments"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit / Reschedule Appointment' : 'New Appointment'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? 'Update appointment details or change the schedule date and time.'
              : 'Schedule a patient visit: patient → provider & department → slot → details.'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        {isEdit && isLoadingAppointment ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading appointment...
          </div>
        ) : isEdit && (loadError || !appointment) ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-destructive">
              {loadError || 'Appointment not found'}
            </p>
            <Button type="button" variant="outline" onClick={goBack}>
              Back to appointments
            </Button>
          </div>
        ) : (
          <AppointmentFormDialog
            variant="page"
            open
            onOpenChange={(open) => {
              if (!open) goBack();
            }}
            appointment={isEdit ? appointment : null}
            patients={patients}
            onSubmit={handleSubmit}
            onAddPatient={isEdit ? undefined : () => setIsPatientFormOpen(true)}
            prefillPatientId={prefillPatientId}
            prefillProviderId={prefillProviderId}
            prefillDepartmentId={prefillDepartmentId}
            prefillAppointmentType={prefillAppointmentType}
            isLoading={isSubmitting}
            initialDate={initialDate}
            initialTime={initialTime}
            mode={isEdit ? 'edit' : 'create'}
            submitError={submitError}
          />
        )}
      </div>

      {!isEdit && (
        <PatientFormDialog
          open={isPatientFormOpen}
          onOpenChange={(open) => {
            setIsPatientFormOpen(open);
            if (!open) setSubmitError(null);
          }}
          patient={null}
          onSubmit={handlePatientSubmit}
          isLoading={isSubmitting}
          registrationMode="quick"
          submitError={submitError}
          onNavigateToExisting={(existingPatient) => {
            setIsPatientFormOpen(false);
            if (existingPatient?.id) {
              navigate(
                getNewAppointmentPath({
                  date: initialDate,
                  time: initialTime,
                  patientId: existingPatient.id,
                  providerId: prefillProviderId,
                  departmentId: prefillDepartmentId,
                  appointmentType: prefillAppointmentType,
                }),
                { replace: true },
              );
              return;
            }
            if (existingPatient?.mrn) {
              navigate(`/patients?mrn=${encodeURIComponent(existingPatient.mrn)}`);
            }
          }}
        />
      )}
    </div>
  );
}
