import { REGISTRATION_TAB_LABELS } from '@/components/patients/patientRegistrationValidationDisplay';

/**
 * Red banner listing validation issues with tab + field context.
 */
export function PatientRegistrationValidationBanner({ issues = [], onGoToTab }) {
  if (!issues?.length) return null;

  return (
    <div
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm font-semibold">Validation failed — please fix the following:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {issues.map((issue, index) => {
          const tabLabel = issue.tabLabel || REGISTRATION_TAB_LABELS[issue.tab] || issue.tab || 'Form';
          const fieldLabel = issue.fieldLabel || issue.field || 'Field';
          const key = `${issue.tab || 'tab'}-${issue.field || 'field'}-${index}`;
          return (
            <li key={key}>
              {typeof onGoToTab === 'function' && issue.tab ? (
                <button
                  type="button"
                  className="font-medium underline underline-offset-2 hover:opacity-80"
                  onClick={() => onGoToTab(issue.tab)}
                >
                  {tabLabel}
                </button>
              ) : (
                <span className="font-medium">{tabLabel}</span>
              )}
              <span className="text-destructive/90">
                {' '}
                → {fieldLabel}: {issue.message}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
