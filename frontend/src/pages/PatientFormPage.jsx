import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientFormContent } from '@/components/patients/PatientFormDialog';
import { patientApi } from '@/services/api';
import { removePatientQueueDraft } from '@/components/patients/patientRegistrationQueue';

export function PatientFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const queueDraftId = location.state?.queueDraftId ?? null;
  const [patient, setPatient] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      setIsLoadingPatient(true);
      patientApi
        .getById(id)
        .then((res) => setPatient(res?.data ?? null))
        .catch(() => setPatient(null))
        .finally(() => setIsLoadingPatient(false));
    } else {
      setPatient(null);
    }
  }, [id]);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await patientApi.update(id, data);
      } else {
        await patientApi.create(data);
        if (queueDraftId) {
          removePatientQueueDraft(queueDraftId);
        }
      }
      navigate('/patients');
    } catch (err) {
      alert(err?.message || 'Failed to save patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
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

      <div className="rounded-lg border bg-card p-6">
        <PatientFormContent
          patient={patient}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          onCancel={handleCancel}
          queueDraftId={queueDraftId}
          isOpen={true}
        />
      </div>
    </div>
  );
}
