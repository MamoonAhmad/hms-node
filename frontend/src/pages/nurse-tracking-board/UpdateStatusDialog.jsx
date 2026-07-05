import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appointmentStatusApi } from '@/services/api';
import { getAppointmentStatusesFallback } from '@/lib/appointmentStatuses';

export function UpdateStatusDialog({
  open,
  onOpenChange,
  appointment,
  onUpdateStatus,
  onReschedule,
  isLoading,
}) {
  const [statusOptions, setStatusOptions] = useState(() => getAppointmentStatusesFallback());
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedStatus(appointment?.status || '');
    appointmentStatusApi
      .getActive()
      .then((res) => {
        const rows = Array.isArray(res.data) && res.data.length ? res.data : getAppointmentStatusesFallback();
        setStatusOptions(rows);
      })
      .catch(() => setStatusOptions(getAppointmentStatusesFallback()));
  }, [open, appointment?.status]);

  const patientLabel = appointment?.patient?.displayName || 'Patient';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
          <DialogDescription>
            Update appointment status for {patientLabel} or reschedule the visit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tracking-status">Appointment status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="tracking-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.id || status.name} value={status.name}>
                    {status.name}
                  </SelectItem>
                ))}
                {appointment?.status &&
                  !statusOptions.some((s) => s.name === appointment.status) && (
                    <SelectItem value={appointment.status}>{appointment.status}</SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onReschedule?.()}>
            Reschedule
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading || !selectedStatus || selectedStatus === appointment?.status}
              onClick={() => onUpdateStatus?.(selectedStatus)}
            >
              Save status
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
