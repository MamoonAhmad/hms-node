import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPatientName } from '@/lib/waitlistConstants';
import { appointmentApi, waitlistApi } from '@/services/api';

export function WaitlistBookDialog({
  open,
  onOpenChange,
  entry,
  providers = [],
  departments = [],
  appointmentTypes = [],
  onSuccess,
}) {
  const [providerId, setProviderId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !entry) return;
    setProviderId(entry.preferredProviderId || entry.offeredProviderId || '');
    setDepartmentId(entry.preferredDepartmentId || '');
    setAppointmentTypeId(entry.appointmentTypeId || '');
    setDate(
      entry.offeredSlotDate ? String(entry.offeredSlotDate).slice(0, 10) : '',
    );
    setTime(entry.offeredSlotStart || '');
    setEndTime(entry.offeredSlotEnd || '');
    setDuration(30);
    setNotes(entry.notes || '');
    setError('');
  }, [open, entry]);

  useEffect(() => {
    if (!open || !providerId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    const typeName =
      appointmentTypes.find((t) => t.id === appointmentTypeId)?.name ||
      entry?.appointmentType?.name;
    appointmentApi
      .getAvailableSlots({
        providerId,
        date,
        appointmentType: typeName,
      })
      .then((res) => {
        if (cancelled) return;
        setSlots(
          (res.data?.slots || []).map((slot) => ({
            value: slot.value || slot.startTime,
            label: slot.label || `${slot.startTime} – ${slot.endTime}`,
            endTime: slot.endTime || null,
            duration: slot.duration,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setSlots([]);
          setError(err.message || 'Failed to load slots');
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, providerId, date, appointmentTypeId, appointmentTypes, entry?.appointmentType?.name]);

  const handleSubmit = async () => {
    if (!entry?.id) return;
    if (!providerId || !date || !time || !appointmentTypeId) {
      setError('Provider, type, date, and time are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await waitlistApi.book(entry.id, {
        providerId,
        appointmentDate: date,
        appointmentTime: time,
        appointmentEndTime: endTime || null,
        duration,
        appointmentTypeId,
        departmentId: departmentId || null,
        notes: notes || null,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book from waitlist</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Booking for{' '}
            <span className="font-medium text-foreground">{formatPatientName(entry?.patient)}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Provider *</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Appointment type *</Label>
              <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={departmentId || 'any'}
                onValueChange={(v) => setDepartmentId(v === 'any' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.departmentName || d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Select
                value={time}
                onValueChange={(v) => {
                  setTime(v);
                  const slot = slots.find((s) => s.value === v);
                  setEndTime(slot?.endTime || '');
                  if (slot?.duration) setDuration(slot.duration);
                }}
                disabled={!date || slotsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={slotsLoading ? 'Loading…' : 'Select slot'} />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Booking…' : 'Book appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
