import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Pencil, Phone, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentFormDialog } from '@/components/appointments/AppointmentFormDialog';
import { appointmentApi, patientApi } from '@/services/api';
import {
  buildRescheduledAppointmentUpdatePayload,
  categorizeAppointments,
  isAppointmentEditable,
} from '@/lib/appointmentFormUtils';
import {
  formatPatientListName,
  formatProviderListName,
} from '@/lib/appointmentUtils';
import { statusChipStyle } from '@/lib/appointmentStatuses';
import { normalizeAppointmentStatus } from '@/lib/appointmentStatusWorkflow';

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeString) {
  if (!timeString) return '—';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function AppointmentCard({ appointment, showEdit, onEdit }) {
  const statusLabel = normalizeAppointmentStatus(appointment.status);
  const chip = statusChipStyle(statusLabel);
  const patientName = formatPatientListName(appointment.patient);
  const providerName =
    formatProviderListName(appointment.providerRef) || appointment.provider || '—';
  const insurance =
    appointment.patient?.insuranceProvider?.trim() ||
    appointment.patient?.insuranceProviderName ||
    'Not on file';

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">{patientName}</h3>
          <p className="text-xs font-mono text-muted-foreground">
            {appointment.encounterNumber || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
            style={chip}
          >
            {statusLabel}
          </span>
          {showEdit && isAppointmentEditable(appointment) && (
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(appointment)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Provider</dt>
            <dd className="font-medium">{providerName}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Appointment Type</dt>
            <dd className="font-medium">{appointment.appointmentType || '—'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Date & Time</dt>
            <dd className="font-medium">
              {formatDate(appointment.appointmentDate)} · {formatTime(appointment.appointmentTime)}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="font-medium">{appointment.patient?.contactNumber || '—'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 sm:col-span-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Department</dt>
            <dd className="font-medium">
              {appointment.department || appointment.departmentRef?.departmentName || '—'}
            </dd>
          </div>
        </div>
        {appointment.visitReason && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Visit reason</dt>
            <dd className="font-medium">{appointment.visitReason}</dd>
          </div>
        )}
        <div className="flex items-start gap-2 sm:col-span-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Insurance</dt>
            <dd className="font-medium">{insurance}</dd>
          </div>
        </div>
      </dl>
    </article>
  );
}

function AppointmentSection({ title, appointments, emptyMessage, showEdit, onEdit }) {
  if (!appointments.length) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {title}{' '}
        <span className="text-sm font-normal text-muted-foreground">({appointments.length})</span>
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {appointments.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            showEdit={showEdit}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

export function PatientAppointmentHistoryPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogMode, setDialogMode] = useState('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [patientRes, appointmentsRes] = await Promise.all([
        patientApi.getById(patientId),
        appointmentApi.getAll({ patientId, limit: 500 }),
      ]);
      setPatient(patientRes?.data || null);
      setAppointments(Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load appointment history');
      setPatient(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { past, current, future } = useMemo(
    () => categorizeAppointments(appointments),
    [appointments],
  );

  const patientName = patient ? formatPatientListName(patient) : 'Patient';
  const patientOptions = useMemo(() => (patient ? [patient] : []), [patient]);

  const openAppointmentDialog = (appointment, mode = 'view') => {
    setSelectedAppointment(appointment);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleAppointmentSubmit = async (data) => {
    if (!selectedAppointment?.id || !patientId) return;
    setIsSubmitting(true);
    try {
      const payload = buildRescheduledAppointmentUpdatePayload(data, patientId);
      await appointmentApi.update(selectedAppointment.id, payload);
      setDialogOpen(false);
      setSelectedAppointment(null);
      setDialogMode('view');
      await loadData();
    } catch (err) {
      alert(err?.message || 'Failed to update appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Patient Appointments"
        description={
          patient
            ? `${patientName} · MRN ${patient.mrn || '—'} · Complete appointment history`
            : 'Complete appointment history'
        }
        breadcrumbs={
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => navigate('/patients')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Patients
            </Button>
            <span>/ Appointment history</span>
          </span>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading appointments…
        </div>
      ) : (
        <div className="space-y-8">
          <AppointmentSection
            title="Current Appointment"
            appointments={current}
            emptyMessage="No appointment in progress for today."
            showEdit
            onEdit={(apt) => openAppointmentDialog(apt, 'view')}
          />
          <AppointmentSection
            title="Future Appointments"
            appointments={future}
            emptyMessage="No upcoming appointments scheduled."
            showEdit
            onEdit={(apt) => openAppointmentDialog(apt, 'view')}
          />
          <AppointmentSection
            title="Past Appointments"
            appointments={past}
            emptyMessage="No past appointments on record."
            showEdit={false}
            onEdit={() => {}}
          />
        </div>
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedAppointment(null);
            setDialogMode('view');
          }
        }}
        appointment={selectedAppointment}
        patients={patientOptions}
        onSubmit={handleAppointmentSubmit}
        isLoading={isSubmitting}
        mode={dialogMode}
        onModeChange={setDialogMode}
      />
    </div>
  );
}
