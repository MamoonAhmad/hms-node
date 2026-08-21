import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appointmentApi } from '@/services/api';

/**
 * Shared provider/date/slot picker for reschedule flows.
 * Emits a payload compatible with cancel/no-show/reschedule APIs.
 */
export function AppointmentRescheduleFields({ appointment, onChange }) {
  const [availableDates, setAvailableDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [providerId, setProviderId] = useState(appointment?.providerId || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(appointment?.duration || 30);
  const [error, setError] = useState('');

  const appointmentTypeName =
    appointment?.appointmentType || appointment?.appointmentTypeRef?.name || undefined;

  useEffect(() => {
    setProviderId(appointment?.providerId || '');
    setDate('');
    setTime('');
    setEndTime('');
    setDuration(appointment?.duration || 30);
    setError('');
  }, [appointment?.id, appointment?.providerId, appointment?.duration]);

  useEffect(() => {
    if (!providerId) {
      setAvailableDates([]);
      return;
    }
    let cancelled = false;
    setDatesLoading(true);
    setError('');
    appointmentApi
      .getAvailableDates({
        providerId,
        appointmentType: appointmentTypeName,
      })
      .then((res) => {
        if (cancelled) return;
        setAvailableDates(res.data?.dates || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailableDates([]);
          setError(err.message || 'Failed to load dates');
        }
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [providerId, appointmentTypeName]);

  useEffect(() => {
    if (!providerId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    appointmentApi
      .getAvailableSlots({
        providerId,
        date,
        appointmentType: appointmentTypeName,
        excludeAppointmentId: appointment?.id,
      })
      .then((res) => {
        if (cancelled) return;
        const list = (res.data?.slots || []).map((slot) => ({
          value: slot.value || slot.startTime,
          label: slot.label || `${slot.startTime} – ${slot.endTime}`,
          endTime: slot.endTime || null,
          duration: slot.duration,
        }));
        setSlots(list);
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
  }, [providerId, date, appointment?.id, appointmentTypeName]);

  useEffect(() => {
    if (!providerId || !date || !time) {
      onChange?.(null);
      return;
    }
    onChange?.({
      appointmentDate: date,
      appointmentTime: time,
      appointmentEndTime: endTime || null,
      duration: duration || 30,
      providerId,
      departmentId: appointment?.departmentId || null,
      appointmentTypeId: appointment?.appointmentTypeId || null,
      visitReason: appointment?.visitReason || null,
      notes: null,
    });
  }, [
    providerId,
    date,
    time,
    endTime,
    duration,
    appointment?.departmentId,
    appointment?.appointmentTypeId,
    appointment?.visitReason,
    onChange,
  ]);

  const handleSlotChange = (value) => {
    setTime(value);
    const slot = slots.find((s) => s.value === value);
    if (slot) {
      setEndTime(slot.endTime || '');
      if (slot.duration) setDuration(slot.duration);
    }
  };

  const providerLabel =
    [
      appointment?.providerRef?.lastName,
      appointment?.providerRef?.firstName,
    ]
      .filter(Boolean)
      .join(', ') ||
    appointment?.provider ||
    'Current provider';

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>Provider</Label>
        <Select
          value={providerId || ''}
          onValueChange={(v) => {
            setProviderId(v);
            setDate('');
            setTime('');
          }}
          disabled={!appointment?.providerId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {appointment?.providerId && (
              <SelectItem value={appointment.providerId}>{providerLabel}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>New date</Label>
          <Select
            value={date}
            onValueChange={(v) => {
              setDate(v);
              setTime('');
            }}
            disabled={!providerId || datesLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={datesLoading ? 'Loading…' : 'Select date'} />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>New time</Label>
          <Select
            value={time}
            onValueChange={handleSlotChange}
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
    </div>
  );
}
