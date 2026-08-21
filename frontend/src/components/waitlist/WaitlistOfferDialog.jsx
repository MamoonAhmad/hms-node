import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

export function WaitlistOfferDialog({ open, onOpenChange, entry, providers = [], onSuccess }) {
  const [providerId, setProviderId] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [notes, setNotes] = useState('');
  const [offerExpiresAt, setOfferExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !entry) return;
    setProviderId(entry.preferredProviderId || '');
    setSlotDate('');
    setSlotStart('');
    setSlotEnd('');
    setNotes('');
    setNotifyPatient(true);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setOfferExpiresAt(tomorrow.toISOString().slice(0, 16));
    setError('');
  }, [open, entry]);

  useEffect(() => {
    if (!open || !providerId || !slotDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    appointmentApi
      .getAvailableSlots({
        providerId,
        date: slotDate,
        appointmentType: entry?.appointmentType?.name,
      })
      .then((res) => {
        if (cancelled) return;
        setSlots(
          (res.data?.slots || []).map((slot) => ({
            value: slot.value || slot.startTime,
            label: slot.label || `${slot.startTime} – ${slot.endTime}`,
            endTime: slot.endTime || null,
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
  }, [open, providerId, slotDate, entry?.appointmentType?.name]);

  const handleSubmit = async () => {
    if (!entry?.id) return;
    if (!providerId || !slotDate || !slotStart) {
      setError('Provider, date, and time are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await waitlistApi.offer(entry.id, {
        providerId,
        slotDate,
        slotStart,
        slotEnd: slotEnd || null,
        offerExpiresAt: offerExpiresAt ? new Date(offerExpiresAt).toISOString() : null,
        notifyPatient,
        notes: notes || null,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to offer slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Offer slot</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Offering to <span className="text-foreground font-medium">{formatPatientName(entry?.patient)}</span>
          </p>
          <div className="space-y-2">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Select
                value={slotStart}
                onValueChange={(v) => {
                  setSlotStart(v);
                  const slot = slots.find((s) => s.value === v);
                  setSlotEnd(slot?.endTime || '');
                }}
                disabled={!slotDate || slotsLoading}
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
            <Label>Offer expires</Label>
            <Input
              type="datetime-local"
              value={offerExpiresAt}
              onChange={(e) => setOfferExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notifyPatient} onCheckedChange={(v) => setNotifyPatient(!!v)} />
            Notify patient
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Offering…' : 'Send offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
