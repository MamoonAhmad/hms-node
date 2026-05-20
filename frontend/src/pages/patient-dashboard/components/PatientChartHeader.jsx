import { useState } from 'react';
import { Copy, RefreshCw, AlertTriangle, Languages, Printer } from 'lucide-react';
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
import { usePatientChart } from '../PatientChartContext';
import {
  calcAge,
  formatDob,
  formatPatientName,
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
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {mrn}
      <Copy className="h-3 w-3 opacity-50" />
      {copied && <span className="font-sans text-primary">Copied</span>}
    </button>
  );
}

export function PatientChartHeader() {
  const { patient, refreshChart, tabCounts } = usePatientChart();
  const [printOpen, setPrintOpen] = useState(false);

  if (!patient) return null;

  const displayName = formatPatientName(patient);
  const preferred = patient.preferredName ? ` (${patient.preferredName})` : '';
  const age = calcAge(patient.dateOfBirth);
  const photo = patientPhotoSrc(patient);
  const initials = `${(patient.firstName?.[0] || '').toUpperCase()}${(patient.lastName?.[0] || '').toUpperCase()}`;
  const interpreter = patient.interpreterRequired;
  const hasAlerts =
    interpreter ||
    patient.generalNotes ||
    tabCounts.pendingOrders > 0 ||
    tabCounts.pendingResults > 0;

  return (
    <>
      <header className="px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold ring-2 ring-border">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">
                {displayName}
                {preferred}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{formatDob(patient.dateOfBirth)}</span>
                {age != null && <span>· {age}y</span>}
                <span>· {patient.genderIdentity || patient.gender}</span>
                <span className="hidden sm:inline">·</span>
                <CopyMrn mrn={patient.mrn} />
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5" onClick={() => setPrintOpen(true)}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="default" size="sm" className="h-8 gap-1.5" onClick={refreshChart}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {hasAlerts && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            <Badge variant="outline" className="border-green-600/30 bg-green-50 text-green-800 font-normal">
              NKA
            </Badge>
            {interpreter && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <Languages className="h-3 w-3" />
                Interpreter
              </Badge>
            )}
            {patient.generalNotes && (
              <Badge variant="outline" className="max-w-xs gap-1 truncate font-normal">
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
              <Badge className="bg-amber-500 font-normal hover:bg-amber-500/90">
                {tabCounts.pendingResults} pending lab{tabCounts.pendingResults !== 1 ? 's' : ''}
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
            <Button variant="outline" onClick={() => setPrintOpen(false)}>Cancel</Button>
            <Button onClick={() => window.print()}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
