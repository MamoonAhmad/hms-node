import { useState } from 'react';
import {
  Calendar,
  CalendarClock,
  Copy,
  Languages,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  calcAge,
  formatDob,
  formatPatientAddress,
  formatPatientName,
  formatPatientPhone,
  patientPhotoSrc,
} from '../../patient-dashboard/patientChartUtils';
import { formatDate, formatTime, resolvePatientStatus } from '../patientChartHelpers';

function CopyMrn({ mrn }) {
  const [copied, setCopied] = useState(false);
  if (!mrn) return null;
  const copy = () => {
    navigator.clipboard?.writeText(mrn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Copy MRN"
    >
      MRN {mrn}
      <Copy className="h-3 w-3 opacity-50" />
      {copied && <span className="font-sans text-primary">Copied</span>}
    </button>
  );
}

function MetaItem({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ChartPatientHeader({ patient, summary, visits, onRefresh, onPrint }) {
  const displayName = formatPatientName(patient);
  const age = calcAge(patient.dateOfBirth);
  const photo = patientPhotoSrc(patient);
  const initials = `${(patient.firstName?.[0] || '').toUpperCase()}${(patient.lastName?.[0] || '').toUpperCase()}`;
  const status = resolvePatientStatus(patient);
  const phone = formatPatientPhone(patient);
  const address = formatPatientAddress(patient);
  const provider = summary?.provider?.name || patient.primaryCarePhysician;
  const upcoming = visits?.upcoming;
  const last = visits?.last;

  return (
    <header className="border-b border-border bg-card px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-lg font-bold ring-1 ring-border">
            {photo ? (
              <img src={photo} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                {initials || <UserRound className="h-7 w-7" />}
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {displayName}
                  {patient.preferredName ? (
                    <span className="ml-2 text-base font-medium text-muted-foreground">
                      “{patient.preferredName}”
                    </span>
                  ) : null}
                </h1>
                <Badge variant="outline" className={cn('font-medium', status.className)}>
                  {status.label}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <CopyMrn mrn={patient.mrn} />
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  DOB {formatDob(patient.dateOfBirth)}
                </span>
                {age != null && <span>Age {age}</span>}
                {patient.gender && <span>{patient.gender}</span>}
                {patient.pronouns && <span>({patient.pronouns})</span>}
                {patient.language && (
                  <span className="inline-flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" />
                    {patient.language}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <MetaItem icon={Phone}>{phone && phone !== '—' ? phone : null}</MetaItem>
              <MetaItem icon={MapPin}>{address && address !== '—' ? address : null}</MetaItem>
              <MetaItem icon={Stethoscope}>{provider || 'Provider not assigned'}</MetaItem>
              <MetaItem icon={CalendarClock}>
                {upcoming
                  ? `Next: ${formatDate(upcoming.appointmentDate)} ${formatTime(upcoming.appointmentTime) || ''}`.trim()
                  : last
                    ? `Last visit: ${formatDate(last.appointmentDate || last.encounterDate)}`
                    : 'No upcoming visit'}
              </MetaItem>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start print:hidden">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onPrint}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="default" size="sm" className="h-9 gap-1.5" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
