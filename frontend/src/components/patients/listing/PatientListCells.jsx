import { Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_SOFT } from '@/lib/statusColors';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  formatGenderAbbrev,
  formatGenderLabel,
  formatPatientDobWithAge,
  formatPatientListAgeLabel,
  formatPatientListName,
  formatPatientListPhone,
  getConsentStatusMeta,
  getPendingRegistrationItems,
  getRegistrationStatusMeta,
} from '@/components/patients/listing/patientListUtils';

function StatusChip({ tone = 'muted', icon: Icon, children, className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        STATUS_SOFT[tone] || STATUS_SOFT.muted,
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-3 w-3 shrink-0 opacity-80" aria-hidden /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function PatientListPatientCell({ patient }) {
  const genderKey = formatGenderAbbrev(patient?.gender);
  const dobAge = formatPatientDobWithAge(patient?.dateOfBirth);
  const ageLabel = formatPatientListAgeLabel(patient?.dateOfBirth);
  const dobOnly = patient?.dateOfBirth && dobAge !== '—' ? dobAge.split(' (')[0] : null;

  return (
    <div className="min-w-0 space-y-1">
      <p className="truncate text-sm font-semibold text-foreground">
        {formatPatientListName(patient)}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 font-semibold tabular-nums text-foreground"
          title={formatGenderLabel(patient?.gender)}
        >
          {genderKey}
        </span>
        {dobOnly && (
          <>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{dobOnly}</span>
          </>
        )}
        {ageLabel && (
          <>
            <span aria-hidden>·</span>
            <span className="tabular-nums font-medium text-foreground/80">{ageLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function PatientListContactCell({ patient }) {
  const email = patient?.email?.trim();
  const phone = formatPatientListPhone(patient);
  const hasPhone = phone && phone !== '—';

  if (!email && !hasPhone) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="max-w-[240px] min-w-0 space-y-1">
      {email && (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <a
            href={`mailto:${email}`}
            className="truncate text-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {email}
          </a>
        </div>
      )}
      {hasPhone && (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="truncate tabular-nums text-muted-foreground hover:text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {phone}
          </a>
        </div>
      )}
    </div>
  );
}

export function PatientRegistrationStatusCell({ patient }) {
  const meta = getRegistrationStatusMeta(patient);
  const pendingItems =
    meta.label === 'Pending' ? getPendingRegistrationItems(patient) : [];

  if (!pendingItems.length) {
    return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <StatusChip tone={meta.tone} className="cursor-help">
          {meta.label}
        </StatusChip>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left">
        <p className="mb-1 font-medium">Pending because:</p>
        <ul className="list-disc space-y-0.5 pl-3.5">
          {pendingItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

export function PatientConsentStatusCell({ patient }) {
  const meta = getConsentStatusMeta(patient);

  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
}

export function PatientInsuranceCell({ summary }) {
  const value = summary || '—';
  const isSelfPay = String(value).toLowerCase() === 'self pay';

  if (value === '—') {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <StatusChip tone={isSelfPay ? 'muted' : 'info'} className="max-w-[220px]">
      {value}
    </StatusChip>
  );
}

/** Subtle row accent for Draft / Pending registration rows. */
export function getPatientRowAccentClass(patient, getRegistrationStatusMetaFn = getRegistrationStatusMeta) {
  const tone = getRegistrationStatusMetaFn(patient)?.tone;
  if (tone === 'muted') {
    return 'border-l-[3px] border-l-[var(--status-muted-border)] bg-[var(--status-muted-bg)]/40';
  }
  if (tone === 'warning') {
    return 'border-l-[3px] border-l-[var(--status-warning-border)] bg-[var(--status-warning-bg)]/50';
  }
  return '';
}
