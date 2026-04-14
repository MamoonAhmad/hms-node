import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

export function ViewScheduleDialog({ open, onOpenChange, schedule }) {
  if (!schedule) return null;
  const daysLabel = (schedule.days || []).join(', ') || '-';
  const status = schedule.effectiveEndDate && schedule.effectiveEndDate < new Date().toISOString().split('T')[0]
    ? 'Inactive (Expired)'
    : schedule.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Provider</Label>
              <p className="font-medium">{schedule.providerName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Clinic</Label>
              <p className="font-medium">{schedule.clinicName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Specialty</Label>
              <p className="font-medium">{schedule.specialty || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Sub-Specialty</Label>
              <p className="font-medium">{schedule.subSpecialty || '-'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Days</Label>
            <p className="font-medium">{daysLabel}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Time Slot(s)</Label>
            <p className="font-medium">{formatTimeSlot(schedule.startTime, schedule.endTime)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Slot Duration</Label>
              <p className="font-medium">{schedule.slotDuration} min</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Appointment Type</Label>
              <p className="font-medium">{schedule.appointmentType}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Max per Slot</Label>
              <p className="font-medium">{schedule.maxAppointmentsPerSlot}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Status</Label>
              <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>
            </div>
          </div>
          {schedule.locationRoom && (
            <div className="space-y-1">
              <Label className="text-muted-foreground">Location / Room</Label>
              <p className="font-medium">{schedule.locationRoom}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Teleconsultation allowed</Label>
            <span className="font-medium">{schedule.teleconsultationAllowed ? 'Yes' : 'No'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Effective Start</Label>
              <p className="font-medium">{schedule.effectiveStartDate || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Effective End</Label>
              <p className="font-medium">{schedule.effectiveEndDate || '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
