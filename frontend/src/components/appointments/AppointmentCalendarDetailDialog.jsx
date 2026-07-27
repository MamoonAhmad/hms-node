import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDob } from '@/pages/patient-dashboard/patientChartUtils';
import { formatProviderListName } from '@/lib/appointmentUtils';

function formatGender(gender) {
  if (!gender) return '—';
  const value = String(gender).toLowerCase();
  if (value === 'm' || value === 'male') return 'Male';
  if (value === 'f' || value === 'female') return 'Female';
  return gender;
}

export function AppointmentCalendarDetailDialog({
  open,
  onOpenChange,
  appointment,
  onEdit,
}) {
  if (!appointment) return null;

  const patient = appointment.patient || {};
  const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || '—';
  const providerName =
    formatProviderListName(appointment.providerRef) || appointment.provider || '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            {appointment.appointmentType || 'Appointment'} · {appointment.encounterNumber || '—'}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Patient Name</dt>
            <dd className="font-medium">{patientName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Patient MRN</dt>
            <dd className="font-medium font-mono">{patient.mrn || '—'}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">DOB</dt>
              <dd className="font-medium">{patient.dateOfBirth ? formatDob(patient.dateOfBirth) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Gender</dt>
              <dd className="font-medium">{formatGender(patient.gender)}</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Provider Name</dt>
            <dd className="font-medium">{providerName}</dd>
          </div>
        </dl>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={() => onEdit?.(appointment)}>
            <Pencil className="mr-1 h-4 w-4" />
            Edit / Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
