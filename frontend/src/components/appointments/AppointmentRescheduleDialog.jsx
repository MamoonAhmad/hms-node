import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppointmentRescheduleFields } from '@/components/appointments/AppointmentRescheduleFields';
import { appointmentApi } from '@/services/api';
import {
  formatAppointmentDateTime,
  formatPatientListName,
} from '@/lib/appointmentUtils';

export function AppointmentRescheduleDialog({ open, onOpenChange, appointment, onSuccess }) {
  const [payload, setPayload] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open || !appointment?.id) return;
    let cancelled = false;
    setError('');
    setNotes('');
    setPayload(null);
    appointmentApi
      .getPolicyPreview(appointment.id, 'reschedule')
      .then((res) => {
        if (!cancelled) setPreview(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load preview');
      });
    return () => {
      cancelled = true;
    };
  }, [open, appointment?.id]);

  const patientLabel = useMemo(
    () => formatPatientListName(appointment?.patient) || 'Patient',
    [appointment],
  );

  const handleSubmit = async () => {
    if (!appointment?.id || !payload?.appointmentDate || !payload?.appointmentTime) {
      setError('Select a new date and time slot');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await appointmentApi.reschedule(appointment.id, {
        ...payload,
        notes: notes || null,
      });
      onSuccess?.(res.data);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {appointment && (
            <div className="rounded-lg border bg-card p-3 text-sm space-y-1">
              <p className="font-medium">{patientLabel}</p>
              <p className="text-muted-foreground">
                Current:{' '}
                {formatAppointmentDateTime(
                  appointment.appointmentDate,
                  appointment.appointmentTime,
                )}
              </p>
              <p className="text-muted-foreground">
                Original becomes <span className="text-foreground">Rescheduled</span>
              </p>
            </div>
          )}

          {preview?.blockers?.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-amber-800">
              {preview.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}

          {appointment && (
            <AppointmentRescheduleFields appointment={appointment} onChange={setPayload} />
          )}

          <div className="space-y-2">
            <Label htmlFor="reschedule-notes">Notes</Label>
            <Textarea
              id="reschedule-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || preview?.canProceed === false}
          >
            {submitting ? 'Saving…' : 'Confirm reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
