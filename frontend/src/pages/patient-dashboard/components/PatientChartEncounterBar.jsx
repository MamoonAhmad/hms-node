import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Clock, DoorOpen, LogOut, Play, Square, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { formatAppointmentLabel } from '../patientChartUtils';
import {
  ENCOUNTER_STATUS_FLOW,
  getEncounterStatusFlowIndex,
} from '@/lib/encounterVisitStatus';

export function PatientChartEncounterBar() {
  const {
    encounter,
    appointments,
    appointmentId,
    setAppointmentId,
    advanceVisitStatus,
    appointment,
  } = usePatientChart();
  const [, setSearchParams] = useSearchParams();
  const [minutes, setMinutes] = useState(encounter?.timeInRoomMinutes ?? 0);

  const startCheckout = () => {
    advanceVisitStatus('Checked Out');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'patient-checkout');
      if (appointmentId) next.set('appointmentId', appointmentId);
      return next;
    });
  };

  useEffect(() => {
    const id = setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!encounter) return null;

  const rawStatus = encounter.rawStatus || appointment?.status;
  if (
    rawStatus === 'Cancelled' ||
    rawStatus === 'No-Show' ||
    rawStatus === 'No Show' ||
    rawStatus === 'Left Without Being Seen (LWBS)'
  ) {
    return null;
  }

  const statusIndex = getEncounterStatusFlowIndex(
    encounter.visitStatus || rawStatus,
  );

  const advanceStatus = () => {
    if (statusIndex < ENCOUNTER_STATUS_FLOW.length - 1) {
      advanceVisitStatus(ENCOUNTER_STATUS_FLOW[statusIndex + 1]);
    }
  };

  return (
    <div
      className="border-t border-border/80 bg-gradient-to-r from-accent/50 via-accent/30 to-transparent px-4 py-3 sm:px-5"
      role="region"
      aria-label="Encounter context"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 text-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Stethoscope className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <Badge variant="info" className="font-medium">
            {encounter.type}
          </Badge>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">CC:</span> {encounter.reason}
          </span>
          {appointments.length > 1 && (
            <Select value={appointmentId || ''} onValueChange={setAppointmentId}>
              <SelectTrigger className="h-8 max-w-[240px] border-border/80 bg-card text-xs shadow-sm">
                <SelectValue placeholder="Select visit" />
              </SelectTrigger>
              <SelectContent>
                {appointments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {formatAppointmentLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-0.5 rounded-xl bg-card p-1 shadow-sm ring-1 ring-border/80"
            role="list"
            aria-label="Visit status progress"
          >
            {ENCOUNTER_STATUS_FLOW.map((step, i) => {
              const isComplete = i < statusIndex;
              const isCurrent = i === statusIndex;
              const isPending = !isComplete && !isCurrent;
              return (
                <span
                  key={step}
                  role="listitem"
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    isComplete &&
                      'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
                    isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                    isPending &&
                      'bg-background text-muted-foreground ring-1 ring-border/70',
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" aria-hidden /> : null}
                  {step}
                </span>
              );
            })}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-xs font-medium shadow-sm ring-1 ring-border/80">
            <DoorOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
            {encounter.room}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 font-mono text-xs tabular-nums text-muted-foreground shadow-sm ring-1 ring-border/80">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
            {minutes}m
          </span>
          <Button
            size="sm"
            variant="success"
            className="h-8"
            onClick={advanceStatus}
            disabled={statusIndex >= ENCOUNTER_STATUS_FLOW.length - 1}
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Advance
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={startCheckout}>
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Start Checkout
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => advanceVisitStatus('Checked Out')}
          >
            <Square className="h-3.5 w-3.5" aria-hidden />
            End
          </Button>
        </div>
      </div>
    </div>
  );
}
