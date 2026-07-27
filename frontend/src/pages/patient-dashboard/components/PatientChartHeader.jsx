import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  Copy,
  FolderOpen,
  HeartPulse,
  Languages,
  Mail,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Shield,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import {
  calcAge,
  formatDob,
  formatEmergencyContactSummary,
  formatInsuranceLabel,
  formatPatientAddress,
  formatPatientName,
  formatPatientPhone,
  isSelfPayPatient,
  patientPhotoSrc,
} from '../patientChartUtils';

function CopyMrn({ mrn }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(mrn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {mrn}
      <Copy className="h-3 w-3 opacity-50" />
      {copied && <span className="font-sans text-primary">Copied</span>}
    </button>
  );
}

function InfoTile({ icon: Icon, label, value, className }) {
  if (!value) return null;
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1',
        className,
      )}
      title={`${label}: ${value}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
      <span className="truncate text-xs font-medium text-foreground">{value}</span>
    </span>
  );
}

function AllergyBadge({ allergy }) {
  const severity = (allergy.severity || '').toLowerCase();
  const isHigh = ['severe', 'critical', 'high', 'life-threatening'].some((s) => severity.includes(s));
  return (
    <Badge
      variant="outline"
      className={cn(
        'max-w-[200px] truncate font-normal',
        isHigh ? 'status-soft-danger border' : 'status-soft-warning border',
      )}
      title={[allergy.allergenName, allergy.reaction, allergy.severity].filter(Boolean).join(' · ')}
    >
      {allergy.allergenName}
      {allergy.severity ? ` (${allergy.severity})` : ''}
    </Badge>
  );
}

function EmergencyContactTooltip({ patient }) {
  const summary = formatEmergencyContactSummary(patient);
  if (!summary) {
    return (
      <div className="flex h-full items-center rounded-lg border border-dashed border-border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
        No emergency contact on file
      </div>
    );
  }

  const address = [
    patient.emergencyContactAddress,
    [patient.emergencyContactCity, patient.emergencyContactState, patient.emergencyContactZip]
      .filter(Boolean)
      .join(', '),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="group flex h-full w-full items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Emergency</span>
          <span className="truncate font-medium group-hover:text-primary">{summary}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-xs space-y-2 p-3 text-left">
        <p className="font-semibold">{patient.emergencyContactName}</p>
        {patient.emergencyContactRelationship && (
          <p className="text-background/80">{patient.emergencyContactRelationship}</p>
        )}
        {patient.emergencyContactNumber && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            {patient.emergencyContactNumber}
          </p>
        )}
        {patient.emergencyContactEmail && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            {patient.emergencyContactEmail}
          </p>
        )}
        {address && (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{address}</span>
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function HeaderSkeleton() {
  return (
    <header className="animate-pulse px-4 py-4 sm:px-5">
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
      </div>
    </header>
  );
}

export function PatientChartHeader() {
  const { patient, appointment, chartSummary, loading, error, refreshChart, tabCounts, isSampleChart } =
    usePatientChart();
  const [printOpen, setPrintOpen] = useState(false);
  const navigate = useNavigate();

  if (loading && !patient) {
    return <HeaderSkeleton />;
  }

  if (!patient) {
    return (
      <header className="border-b border-border bg-card px-4 py-8 sm:px-5">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-medium text-foreground">
            {error ? 'Unable to load patient chart' : 'No patient selected'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error
              ? error
              : 'Open a patient from Encounters or the Patients list to view their chart.'}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={refreshChart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {error ? 'Retry' : 'Refresh'}
          </Button>
        </div>
      </header>
    );
  }

  const displayName = formatPatientName(patient);
  const preferred = patient.preferredName ? ` "${patient.preferredName}"` : '';
  const age = calcAge(patient.dateOfBirth);
  const photo = patientPhotoSrc(patient);
  const initials = `${(patient.firstName?.[0] || '').toUpperCase()}${(patient.lastName?.[0] || '').toUpperCase()}`;
  const interpreter = patient.interpreterRequired;
  const phone = formatPatientPhone(patient);
  const address = formatPatientAddress(patient);
  const insuranceLabel = formatInsuranceLabel(patient);
  const selfPay = isSelfPayPatient(patient);

  const encounterNumber = appointment?.encounterNumber;
  const encounterProvider =
    chartSummary?.provider?.name || appointment?.provider || patient.primaryCarePhysician || null;
  const providerSpecialty = chartSummary?.provider?.specialty || appointment?.departmentRef?.departmentName || null;

  const allergies = chartSummary?.allergies || [];
  const nkda = chartSummary?.noKnownDrugAllergies ?? patient.noKnownDrugAllergies;

  const hasAlerts =
    interpreter ||
    patient.generalNotes ||
    tabCounts.pendingOrders > 0 ||
    tabCounts.pendingResults > 0 ||
    allergies.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <header className="relative overflow-hidden border-b border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.04] px-4 py-2.5 sm:px-5">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-sm font-bold shadow-sm ring-2 ring-background">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary">{initials}</span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <h1 className="text-lg font-bold leading-tight tracking-tight">
                  {displayName}
                  {preferred && (
                    <span className="text-sm font-medium text-muted-foreground">{preferred}</span>
                  )}
                </h1>
                {encounterNumber && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {encounterNumber}
                  </Badge>
                )}
                {isSampleChart && (
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                    Demo chart
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  <CopyMrn mrn={patient.mrn} />
                </span>
                {age != null && <span className="text-xs text-muted-foreground">{age} yrs</span>}
                <span className="text-xs text-muted-foreground">{patient.genderIdentity || patient.gender || '—'}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  DOB {formatDob(patient.dateOfBirth)}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <InfoTile icon={Phone} label="Phone" value={phone} />
                <InfoTile icon={Mail} label="Email" value={patient.email} />
                <InfoTile icon={MapPin} label="Address" value={address} className="max-w-[280px]" />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              onClick={() => setPrintOpen(true)}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="default" size="sm" className="h-8 gap-1.5" onClick={refreshChart}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {!isSampleChart && patient?.id && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => navigate(`/patients/${patient.id}/chart`)}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">View Patient Complete Chart</span>
                <span className="sm:hidden">Chart</span>
              </Button>
            )}
          </div>
        </div>

        <div className="relative mt-2 flex flex-wrap items-stretch gap-2 text-xs">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Coverage</span>
            <Badge
              variant="outline"
              className={cn(
                'font-medium',
                selfPay ? 'status-soft-muted border' : 'status-soft-info border',
              )}
            >
              {insuranceLabel}
            </Badge>
            {patient.copay != null && !selfPay && (
              <span className="text-muted-foreground">· Copay ${Number(patient.copay).toFixed(2)}</span>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5">
            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Care Team</span>
            <span className="truncate font-medium text-foreground">{encounterProvider || 'Not assigned'}</span>
            {providerSpecialty && <span className="truncate text-muted-foreground">· {providerSpecialty}</span>}
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5">
            <HeartPulse className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Allergies</span>
            {nkda ? (
              <Badge variant="success" className="font-normal">
                NKDA
              </Badge>
            ) : allergies.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {allergies.map((a) => (
                  <AllergyBadge key={a.id || a.allergenName} allergy={a} />
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">Not documented</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <EmergencyContactTooltip patient={patient} />
          </div>
        </div>

        {hasAlerts && (
          <div className="relative mt-2 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
            {interpreter && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <Languages className="h-3 w-3" />
                Interpreter{patient.interpreterLanguageRequired ? `: ${patient.interpreterLanguageRequired}` : ''}
              </Badge>
            )}
            {patient.generalNotes && (
              <Badge variant="outline" className="max-w-md gap-1 truncate font-normal">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {patient.generalNotes}
              </Badge>
            )}
            {tabCounts.pendingOrders > 0 && (
              <Badge variant="destructive" className="font-normal">
                {tabCounts.pendingOrders} pending order{tabCounts.pendingOrders !== 1 ? 's' : ''}
              </Badge>
            )}
            {tabCounts.pendingResults > 0 && (
              <Badge variant="warning" className="font-normal">
                {tabCounts.pendingResults} pending result{tabCounts.pendingResults !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </header>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Face sheet</DialogTitle>
            <DialogDescription>Print preview for {displayName}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => window.print()}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
