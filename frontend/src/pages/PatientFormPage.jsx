import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientFormContent } from '@/components/patients/PatientFormDialog';
import { PatientRegistrationValidationBanner } from '@/components/patients/PatientRegistrationValidationBanner';
import { formatApiValidationIssues } from '@/components/patients/patientRegistrationValidationDisplay';
import { patientApi, appointmentApi } from '@/services/api';
import { removePatientQueueDraft } from '@/components/patients/patientRegistrationQueue';
import {
  createAppointmentFromRegistrationIfNeeded,
} from '@/components/patients/patientRegistrationAppointmentConstants';
import {
  pickPrimaryEditableAppointment,
  updateLinkedAppointmentFromRegistration,
} from '@/lib/appointmentFormUtils';
import { getDefaultAppointmentStatusName } from '@/lib/appointmentStatuses';
import {
  patientHasBillingChoice,
  patientHasSignedConsent,
} from '@/components/patients/listing/patientListUtils';

export function PatientFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const queueDraftId = location.state?.queueDraftId ?? null;
  const [patient, setPatient] = useState(null);
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const formContentRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    if (id) {
      setIsLoadingPatient(true);
      Promise.all([
        patientApi.getById(id),
        appointmentApi.getAll({ patientId: id, limit: 100 }),
      ])
        .then(([patientRes, appointmentsRes]) => {
          setPatient(patientRes?.data ?? null);
          const rows = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];
          setLinkedAppointment(pickPrimaryEditableAppointment(rows));
        })
        .catch(() => {
          setPatient(null);
          setLinkedAppointment(null);
        })
        .finally(() => setIsLoadingPatient(false));
    } else {
      setPatient(null);
      setLinkedAppointment(null);
    }
  }, [id]);

  const scrollToBanner = () => {
    requestAnimationFrame(() => {
      bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    setValidationIssues([]);
    try {
      const {
        bookAppointment: _bookAppointment,
        linkedAppointmentId: _linkedAppointmentId,
        appointmentEdited: _appointmentEdited,
        ...patientData
      } = data;
      let patientId = id;

      // Draft: intentional save-for-later. Pending: mostly complete with outstanding items.
      // Completed: consents + billing (or already completed) — ready for scheduling/check-in.
      const mergedForStatus = { ...patient, ...patientData };
      const alreadyCompleted =
        String(patient?.registrationStatus || '').toLowerCase() === 'completed';
      const registrationComplete =
        patientHasSignedConsent(mergedForStatus) && patientHasBillingChoice(mergedForStatus);
      if (isEditing && (alreadyCompleted || registrationComplete)) {
        patientData.registrationStatus = 'completed';
      } else if (patientData.registrationStatus !== 'draft') {
        patientData.registrationStatus = 'pending';
      }

      if (isEditing) {
        if (data.linkedAppointmentId && data.appointmentEdited) {
          await updateLinkedAppointmentFromRegistration(
            data.linkedAppointmentId,
            data,
            id,
            { appointmentApi },
          );
        } else if (!data.linkedAppointmentId) {
          const existingApptsRes = await appointmentApi.getAll({ patientId: id, limit: 100 });
          await createAppointmentFromRegistrationIfNeeded(id, data, {
            appointmentApi,
            defaultStatus: getDefaultAppointmentStatusName(),
            evaluateRegistrationStatus: true,
            existingAppointments: existingApptsRes?.data || [],
          });
        }
        await patientApi.update(id, patientData);
      } else {
        const response = await patientApi.create(patientData);
        patientId = response?.data?.id;

        if (patientId) {
          await createAppointmentFromRegistrationIfNeeded(patientId, data, {
            appointmentApi,
            defaultStatus: getDefaultAppointmentStatusName(),
            evaluateRegistrationStatus: true,
          });
        }

        if (queueDraftId) {
          removePatientQueueDraft(queueDraftId);
        }
      }
      navigate('/patients');
    } catch (err) {
      const issues = formatApiValidationIssues(err);
      setValidationIssues(issues);
      const firstTab = issues.find((i) => i.tab)?.tab;
      if (firstTab) {
        formContentRef.current?.goToTab?.(firstTab);
      }
      scrollToBanner();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    navigate('/patients');
  };

  if (isEditing && isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/patients')}
          className="shrink-0"
          aria-label="Back to patients"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Patient' : queueDraftId ? 'Continue queued registration' : 'Add New Patient'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Update patient information.'
              : queueDraftId
                ? 'Finish registration started from the patient queue.'
                : 'Create a new patient record.'}
          </p>
        </div>
      </div>

      <div ref={bannerRef}>
        <PatientRegistrationValidationBanner
          issues={validationIssues}
          onGoToTab={(tab) => formContentRef.current?.goToTab?.(tab)}
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <PatientFormContent
          ref={formContentRef}
          patient={patient}
          linkedAppointment={linkedAppointment}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          onCancel={handleFormCancel}
          queueDraftId={queueDraftId}
          isOpen={true}
          onValidationFailed={(issues) => {
            setValidationIssues(issues);
            scrollToBanner();
          }}
          onNavigateToExisting={(existingPatient) => {
            if (existingPatient?.id) {
              navigate(`/patients/edit/${existingPatient.id}`, { state: { scrollToDemographics: true } });
            }
          }}
          onCancelRegistration={handleFormCancel}
        />
      </div>
    </div>
  );
}
