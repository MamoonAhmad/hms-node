import {
  calculateAgeFromDob,
  formatPatientFullName,
} from '@/components/patients/patientRegistrationConstants';

export function PatientRegistrationHeader({ formData }) {
  const fullName = formatPatientFullName(formData);
  const hasName = Boolean(formData?.firstName?.trim() && formData?.lastName?.trim());
  const hasDob = Boolean(formData?.dateOfBirth);

  if (!hasName || !hasDob) return null;

  const age = calculateAgeFromDob(formData.dateOfBirth);
  const dobLabel = new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="sticky top-0 z-10 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">Patient: </span>
          <span className="font-semibold text-foreground">{fullName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Date of Birth: </span>
          <span className="font-medium text-foreground">{dobLabel}</span>
        </div>
        {age != null && (
          <div>
            <span className="text-muted-foreground">Age: </span>
            <span className="font-medium text-foreground">{age} years</span>
          </div>
        )}
      </div>
    </div>
  );
}
