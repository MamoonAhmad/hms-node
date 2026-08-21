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
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  WAITLIST_DAYS,
  WAITLIST_PRIORITIES,
  WAITLIST_TIME_WINDOWS,
  emptyWaitlistForm,
  entryToForm,
  formToPayload,
} from '@/lib/waitlistConstants';
import { buildPatientSearchOption } from '@/lib/appointmentUtils';
import { appointmentApi, waitlistApi } from '@/services/api';

export function WaitlistEntryFormDialog({
  open,
  onOpenChange,
  mode = 'create',
  entry = null,
  patients = [],
  providers = [],
  departments = [],
  appointmentTypes = [],
  onSuccess,
}) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(emptyWaitlistForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [availableDates, setAvailableDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slotOptions, setSlotOptions] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [scheduleHint, setScheduleHint] = useState('');

  const patientOptions = useMemo(
    () => patients.map((p) => buildPatientSearchOption(p)),
    [patients],
  );

  const selectedTypeName = useMemo(() => {
    if (!form.appointmentTypeId) return undefined;
    return appointmentTypes.find((t) => t.id === form.appointmentTypeId)?.name;
  }, [form.appointmentTypeId, appointmentTypes]);

  const hasProvider = Boolean(form.preferredProviderId);

  useEffect(() => {
    if (!open) return;
    setForm(isEdit ? entryToForm(entry) : emptyWaitlistForm());
    setErrors({});
    setError('');
    setAvailableDates([]);
    setSlotOptions([]);
    setScheduleHint('');
  }, [open, isEdit, entry]);

  // Load available dates from provider schedule
  useEffect(() => {
    if (!open || !form.preferredProviderId) {
      setAvailableDates([]);
      setDatesLoading(false);
      setScheduleHint(
        open && !form.preferredProviderId
          ? 'Select a preferred provider to load schedule dates and times.'
          : '',
      );
      return;
    }

    let cancelled = false;
    setDatesLoading(true);
    setScheduleHint('');
    appointmentApi
      .getAvailableDates({
        providerId: form.preferredProviderId,
        appointmentType: selectedTypeName,
      })
      .then((res) => {
        if (cancelled) return;
        const dates = res.data?.dates || [];
        setAvailableDates(dates);
        if (!dates.length) {
          setScheduleHint('No available dates on this provider’s schedule for the selected type.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailableDates([]);
          setScheduleHint(err.message || 'Failed to load provider schedule dates');
        }
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, form.preferredProviderId, selectedTypeName]);

  // Load slots for preferred date from provider schedule
  useEffect(() => {
    const dateKey = form.preferredDateFrom;
    if (!open || !form.preferredProviderId || !dateKey) {
      setSlotOptions([]);
      setSlotsLoading(false);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    appointmentApi
      .getAvailableSlots({
        providerId: form.preferredProviderId,
        date: dateKey,
        appointmentType: selectedTypeName,
      })
      .then((res) => {
        if (cancelled) return;
        const options = (res.data?.slots || []).map((slot) => ({
          value: slot.value || slot.startTime,
          label: slot.label || `${slot.startTime}${slot.endTime ? ` – ${slot.endTime}` : ''}`,
        }));
        setSlotOptions(options);
        // Drop preferred times that are no longer on this day's schedule
        setForm((prev) => ({
          ...prev,
          preferredTimes: (prev.preferredTimes || []).filter((t) =>
            options.some((o) => o.value === t),
          ),
        }));
        if (!options.length) {
          setScheduleHint('No open slots on this date for the provider’s schedule.');
        } else {
          setScheduleHint('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSlotOptions([]);
          setScheduleHint(err.message || 'Failed to load schedule times');
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, form.preferredProviderId, form.preferredDateFrom, selectedTypeName]);

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'preferredProviderId') {
        next.preferredDateFrom = '';
        next.preferredDateTo = '';
        next.preferredTimes = [];
      }
      if (key === 'appointmentTypeId') {
        next.preferredDateFrom = '';
        next.preferredDateTo = '';
        next.preferredTimes = [];
      }
      if (key === 'preferredDateFrom') {
        next.preferredDateTo = value;
        next.preferredTimes = [];
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!isEdit && !form.patientId) next.patientId = 'Patient is required';
    if (form.preferredDateFrom && form.preferredDateTo && form.preferredDateTo < form.preferredDateFrom) {
      next.preferredDateTo = 'End date must be on or after start date';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        await waitlistApi.update(entry.id, formToPayload(form, { includePatient: false }));
      } else {
        await waitlistApi.create(formToPayload(form, { includePatient: true }));
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save waitlist entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit waitlist entry' : 'Add to waitlist'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Patient *</Label>
              <SearchableSelect
                value={form.patientId}
                onValueChange={(v) => setField('patientId', v)}
                options={patientOptions}
                placeholder="Search patient…"
              />
              {errors.patientId && <p className="text-xs text-destructive">{errors.patientId}</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Preferred provider</Label>
              <Select
                value={form.preferredProviderId || 'any'}
                onValueChange={(v) => setField('preferredProviderId', v === 'any' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any provider</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.preferredDepartmentId || 'any'}
                onValueChange={(v) => setField('preferredDepartmentId', v === 'any' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.departmentName || d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Appointment type</Label>
              <Select
                value={form.appointmentTypeId || 'any'}
                onValueChange={(v) => setField('appointmentTypeId', v === 'any' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any type</SelectItem>
                  {appointmentTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setField('priority', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAITLIST_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasProvider ? (
              <>
                <div className="space-y-2">
                  <Label>Preferred date (from schedule)</Label>
                  <Select
                    value={form.preferredDateFrom || ''}
                    onValueChange={(v) => setField('preferredDateFrom', v)}
                    disabled={datesLoading || !availableDates.length}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          datesLoading
                            ? 'Loading schedule dates…'
                            : availableDates.length
                              ? 'Select available date'
                              : 'No schedule dates'
                        }
                      />
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
                  <Label>Preferred times (from schedule)</Label>
                  <MultiSelect
                    options={slotOptions}
                    value={form.preferredTimes || []}
                    onChange={(v) => setField('preferredTimes', v)}
                    placeholder={
                      slotsLoading
                        ? 'Loading schedule times…'
                        : form.preferredDateFrom
                          ? slotOptions.length
                            ? 'Select preferred time slots'
                            : 'No open slots'
                          : 'Select a date first'
                    }
                    searchable
                  />
                  <p className="text-xs text-muted-foreground">
                    Times come from the provider’s open schedule slots for the selected date.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Preferred from</Label>
                  <Input
                    type="date"
                    value={form.preferredDateFrom}
                    onChange={(e) => setField('preferredDateFrom', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred to</Label>
                  <Input
                    type="date"
                    value={form.preferredDateTo}
                    onChange={(e) => setField('preferredDateTo', e.target.value)}
                  />
                  {errors.preferredDateTo && (
                    <p className="text-xs text-destructive">{errors.preferredDateTo}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Time window</Label>
                  <Select
                    value={form.preferredTimeWindow}
                    onValueChange={(v) => setField('preferredTimeWindow', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WAITLIST_TIME_WINDOWS.map((w) => (
                        <SelectItem key={w.value} value={w.value}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred days</Label>
                  <MultiSelect
                    options={WAITLIST_DAYS.map((d) => ({ value: d.value, label: d.label }))}
                    value={form.preferredDays}
                    onChange={(v) => setField('preferredDays', v)}
                    placeholder="Any day"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => setField('contactPhone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact email</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setField('contactEmail', e.target.value)}
              />
            </div>
          </div>

          {scheduleHint && (
            <p className="text-sm text-amber-800 dark:text-amber-200">{scheduleHint}</p>
          )}

          {hasProvider && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Time window (optional fallback)</Label>
                <Select
                  value={form.preferredTimeWindow}
                  onValueChange={(v) => setField('preferredTimeWindow', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WAITLIST_TIME_WINDOWS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred days (optional)</Label>
                <MultiSelect
                  options={WAITLIST_DAYS.map((d) => ({ value: d.value, label: d.label }))}
                  value={form.preferredDays}
                  onChange={(v) => setField('preferredDays', v)}
                  placeholder="Any day"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={form.reason}
              onChange={(e) => setField('reason', e.target.value)}
              placeholder="Why is the patient waiting?"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add to waitlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
