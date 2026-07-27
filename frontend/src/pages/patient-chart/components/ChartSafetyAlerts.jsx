import { AlertTriangle, Languages, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { severityClass } from '../patientChartHelpers';

export function ChartSafetyAlerts({ patient, summary, onOpenAllergies }) {
  const nkda = summary?.noKnownDrugAllergies ?? patient?.noKnownDrugAllergies;
  const allergies = summary?.allergies || [];
  const allergyReviewed = nkda || allergies.length > 0;

  const flags = [];
  if (patient?.interpreterRequired) {
    flags.push({
      icon: Languages,
      label: `Interpreter required${patient.interpreterLanguageRequired ? `: ${patient.interpreterLanguageRequired}` : ''}`,
      tone: 'info',
    });
  }
  if (patient?.patientIsMinor) flags.push({ icon: ShieldAlert, label: 'Minor patient', tone: 'info' });
  if (patient?.generalNotes) flags.push({ icon: AlertTriangle, label: patient.generalNotes, tone: 'warning' });

  const toneClass = {
    info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100',
  };

  const visibleAllergies = allergies.slice(0, 4);
  const hiddenCount = Math.max(0, allergies.length - visibleAllergies.length);

  return (
    <div className="border-b border-border bg-card px-4 py-3 sm:px-6 lg:px-8 print:hidden">
      <div className="flex flex-col gap-3 rounded-xl border border-red-200/80 bg-red-50/50 p-3 dark:border-red-900/40 dark:bg-red-950/20 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <button
          type="button"
          onClick={onOpenAllergies}
          className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-700 transition-colors hover:text-red-800 dark:text-red-300"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200">
            <AlertTriangle className="h-4 w-4" />
          </span>
          Safety alerts
        </button>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {!allergyReviewed ? (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 font-normal text-amber-900">
              Allergy status not reviewed
            </Badge>
          ) : nkda ? (
            <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 font-normal text-green-800">
              <ShieldCheck className="h-3 w-3" /> No Known Allergies
            </Badge>
          ) : (
            <>
              {visibleAllergies.map((a) => (
                <button
                  key={a.id || a.allergenName}
                  type="button"
                  onClick={onOpenAllergies}
                  title={[a.allergenName, a.severity, a.reaction].filter(Boolean).join(' — ')}
                >
                  <Badge
                    variant="outline"
                    className={cn('max-w-[220px] truncate font-normal', severityClass(a.severity))}
                  >
                    {a.allergenName}
                    {a.severity ? ` · ${a.severity}` : ''}
                  </Badge>
                </button>
              ))}
              {hiddenCount > 0 && (
                <button type="button" onClick={onOpenAllergies} className="text-xs font-medium text-primary hover:underline">
                  +{hiddenCount} more
                </button>
              )}
            </>
          )}

          {flags.map((flag, i) => {
            const Icon = flag.icon;
            return (
              <Badge
                key={i}
                variant="outline"
                className={cn('max-w-xs gap-1 truncate font-normal', toneClass[flag.tone])}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {flag.label}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
