import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatDuplicatePatientLine(patient) {
  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim();
  const parts = [name || 'Unknown patient'];
  if (patient.mrn) parts.push(`MRN: ${patient.mrn}`);
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      parts.push(`DOB: ${dob.toLocaleDateString()}`);
    }
  }
  if (patient.contactNumber) parts.push(`Phone: ${patient.contactNumber}`);
  return parts.join(' · ');
}

export function DuplicatePatientAlert({
  duplicates = [],
  onGoToExisting,
  onCancelRegistration,
  onContinueNew,
}) {
  if (!duplicates.length) return null;

  const primary = duplicates[0];

  return (
    <div
      className="rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold">Possible duplicate patient found</p>
            <p className="mt-1 text-sm">
              A patient with similar information already exists in the system:
            </p>
            <p className="mt-2 text-sm font-medium">{formatDuplicatePatientLine(primary)}</p>
            {duplicates.length > 1 && (
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                {duplicates.length - 1} additional match{duplicates.length > 2 ? 'es' : ''} found.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => onGoToExisting?.(primary)}>
              Go to Existing Patient Registration Form
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancelRegistration}>
              Cancel Registration
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={onContinueNew}>
              Continue New Patient
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
