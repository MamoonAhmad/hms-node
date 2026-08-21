import { useEffect, useMemo, useState } from 'react';
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
import { appointmentApi } from '@/services/api';
import {
  formatAppointmentDateTime,
  formatPatientListName,
} from '@/lib/appointmentUtils';
import { AppointmentRescheduleFields } from '@/components/appointments/AppointmentRescheduleFields';

/**
 * @param {'cancel' | 'no_show'} mode
 */
export function AppointmentLifecycleDialog({
  open,
  onOpenChange,
  mode,
  appointment,
  onSuccess,
}) {
  const isCancel = mode === 'cancel';
  const action = isCancel ? 'cancel' : 'no_show';
  const title = isCancel ? 'Cancel appointment' : 'Mark no-show';

  const [preview, setPreview] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [reasonCode, setReasonCode] = useState('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [waiveFee, setWaiveFee] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [doReschedule, setDoReschedule] = useState(false);
  const [reschedulePayload, setReschedulePayload] = useState(null);

  useEffect(() => {
    if (!open || !appointment?.id) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setReasonCode('');
    setReasonNotes('');
    setWaiveFee(false);
    setWaiveReason('');
    setDoReschedule(false);
    setReschedulePayload(null);

    Promise.all([
      appointmentApi.getPolicyPreview(appointment.id, action),
      appointmentApi.getReasonCodes(isCancel ? 'cancel' : 'no_show'),
    ])
      .then(([previewRes, reasonsRes]) => {
        if (cancelled) return;
        const data = previewRes.data;
        setPreview(data);
        setReasons(Array.isArray(reasonsRes.data) ? reasonsRes.data : []);
        const suggested = data?.outcome?.suggestedFee ?? 0;
        setFeeAmount(String(suggested));
        setNotifyPatient(data?.outcome?.notifyPatientDefault !== false);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load policy');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, appointment?.id, action, isCancel]);

  const outcome = preview?.outcome;
  const blockers = preview?.blockers || [];
  const canProceed = preview?.canProceed !== false;

  const patientLabel = useMemo(
    () => formatPatientListName(appointment?.patient) || 'Patient',
    [appointment],
  );

  const handleSubmit = async () => {
    if (!appointment?.id) return;
    if (!reasonCode) {
      setError('Reason is required');
      return;
    }
    if (waiveFee && String(waiveReason || '').trim().length < 3) {
      setError('Waiver reason is required when waiving a fee');
      return;
    }
    if (doReschedule) {
      if (
        !reschedulePayload?.appointmentDate ||
        !reschedulePayload?.appointmentTime ||
        !reschedulePayload?.providerId
      ) {
        setError('Select a provider, date, and time slot to reschedule');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const body = {
        reasonCode,
        reasonNotes: reasonNotes || null,
        feeAmount: waiveFee ? 0 : Number(feeAmount || 0),
        waiveFee,
        waiveReason: waiveFee ? waiveReason : null,
        notifyPatient,
        reschedule: doReschedule,
        ...(doReschedule ? { reschedulePayload } : {}),
      };

      const res = isCancel
        ? await appointmentApi.cancel(appointment.id, body)
        : await appointmentApi.markNoShow(appointment.id, body);

      onSuccess?.(res.data);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-5 max-h-[70vh] overflow-y-auto">
          {appointment && (
            <div className="rounded-lg border bg-card p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">{patientLabel}</p>
              <p className="text-muted-foreground">
                {formatAppointmentDateTime(
                  appointment.appointmentDate,
                  appointment.appointmentTime,
                )}
                {appointment.provider ? ` · ${appointment.provider}` : ''}
              </p>
              <p className="text-muted-foreground">
                Status: <span className="text-foreground">{appointment.status}</span>
                {appointment.encounterNumber
                  ? ` · ${appointment.encounterNumber}`
                  : ''}
              </p>
            </div>
          )}

          {loading && <p className="text-sm text-muted-foreground">Loading policy…</p>}

          {!loading && outcome && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">Policy</p>
              {isCancel ? (
                <>
                  <p className="text-muted-foreground">
                    {outcome.isLate
                      ? `Late cancel (within ${outcome.lateCancelHours}h of start)`
                      : `Outside late-cancel window (${outcome.lateCancelHours}h)`}
                  </p>
                  <p className="text-muted-foreground">
                    Hours until start:{' '}
                    <span className="text-foreground">{outcome.hoursUntilStart}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Minutes past start:{' '}
                    <span className="text-foreground">{outcome.minutesPastStart}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Prior no-shows:{' '}
                    <span className="text-foreground">{outcome.patientNoShowCount}</span>
                    {outcome.riskFlag ? ' · risk threshold reached' : ''}
                  </p>
                </>
              )}
              <p className="text-muted-foreground">
                Suggested fee:{' '}
                <span className="text-foreground">
                  ${Number(outcome.suggestedFee || 0).toFixed(2)}
                </span>
              </p>
              {blockers.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-amber-800 dark:text-amber-200">
                  {blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Reason *</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lifecycle-notes">Notes</Label>
              <Textarea
                id="lifecycle-notes"
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifecycle-fee">Fee amount ($)</Label>
              <Input
                id="lifecycle-fee"
                type="number"
                min="0"
                step="0.01"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                disabled={waiveFee}
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={waiveFee}
                  onCheckedChange={(v) => setWaiveFee(!!v)}
                  disabled={outcome && outcome.allowFeeWaive === false}
                />
                Waive fee
              </label>
            </div>
            {waiveFee && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lifecycle-waive">Waiver reason *</Label>
                <Input
                  id="lifecycle-waive"
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={notifyPatient}
              onCheckedChange={(v) => setNotifyPatient(!!v)}
            />
            Notify patient
          </label>

          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={doReschedule}
                onCheckedChange={(v) => setDoReschedule(!!v)}
              />
              Reschedule to a new slot now
              <span className="font-normal text-muted-foreground">
                (original becomes Rescheduled)
              </span>
            </label>
            {doReschedule && appointment && (
              <AppointmentRescheduleFields
                appointment={appointment}
                onChange={setReschedulePayload}
              />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Keep appointment
          </Button>
          <Button
            type="button"
            variant={isCancel ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={submitting || loading || !canProceed}
          >
            {submitting ? 'Saving…' : title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
