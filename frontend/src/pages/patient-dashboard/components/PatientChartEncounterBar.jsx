import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, DoorOpen, Play, Square, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { formatAppointmentLabel } from '../patientChartUtils';

const STATUS_FLOW = ['Arrived', 'Roomed', 'With Provider', 'Checkout'];

export function PatientChartEncounterBar() {
  const {
    encounter,
    appointments,
    appointmentId,
    setAppointmentId,
    advanceVisitStatus,
  } = usePatientChart();
  const [minutes, setMinutes] = useState(encounter?.timeInRoomMinutes ?? 0);

  useEffect(() => {
    const id = setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!encounter || encounter.status !== 'Open') return null;

  const statusIndex = STATUS_FLOW.indexOf(encounter.visitStatus);

  const advanceStatus = () => {
    if (statusIndex < STATUS_FLOW.length - 1) {
      advanceVisitStatus(STATUS_FLOW[statusIndex + 1]);
    }
  };

  return (
    <div
      className="border-t border-border bg-accent/40 px-4 py-2.5 sm:px-5"
      role="region"
      aria-label="Encounter context"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
          <Stethoscope className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <Badge variant="secondary" className="font-medium">
            {encounter.type}
          </Badge>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">CC:</span> {encounter.reason}
          </span>
          {appointments.length > 1 && (
            <Select value={appointmentId || ''} onValueChange={setAppointmentId}>
              <SelectTrigger className="h-8 max-w-[220px] text-xs">
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
          <div className="flex items-center gap-0.5 rounded-lg bg-card p-0.5 shadow-sm ring-1 ring-border">
            {STATUS_FLOW.map((step, i) => (
              <span
                key={step}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                  i <= statusIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {step}
              </span>
            ))}
          </div>

          <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-xs font-medium ring-1 ring-border">
            <DoorOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
            {encounter.room}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 font-mono text-xs text-muted-foreground ring-1 ring-border">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {minutes}m
          </span>
          <Button size="sm" className="h-8" onClick={advanceStatus}>
            <Play className="mr-1 h-3.5 w-3.5" aria-hidden />
            Advance
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => advanceVisitStatus('Checkout')}
          >
            <Square className="mr-1 h-3.5 w-3.5" aria-hidden />
            End
          </Button>
        </div>
      </div>
    </div>
  );
}
