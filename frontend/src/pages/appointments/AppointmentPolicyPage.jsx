import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appointmentApi } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';

export function AppointmentPolicyPage() {
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [autoNoShowResult, setAutoNoShowResult] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const res = await appointmentApi.getPolicy();
      setPolicy(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (key, value) => {
    setPolicy((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!policy) return;
    setSaving(true);
    setMessage('');
    setError(null);
    try {
      const payload = {
        lateCancelHours: Number(policy.lateCancelHours),
        lateCancelFee: Number(policy.lateCancelFee),
        noShowFee: Number(policy.noShowFee),
        allowFeeWaive: !!policy.allowFeeWaive,
        blockAfterNoShowCount:
          policy.blockAfterNoShowCount === '' || policy.blockAfterNoShowCount == null
            ? null
            : Number(policy.blockAfterNoShowCount),
        autoNoShowMinutesPast: Number(policy.autoNoShowMinutesPast),
        notifyPatientOnCancel: !!policy.notifyPatientOnCancel,
        notifyPatientOnNoShow: !!policy.notifyPatientOnNoShow,
        requireDepositAfterNoShows:
          policy.requireDepositAfterNoShows === '' || policy.requireDepositAfterNoShows == null
            ? null
            : Number(policy.requireDepositAfterNoShows),
        depositAmount:
          policy.depositAmount === '' || policy.depositAmount == null
            ? null
            : Number(policy.depositAmount),
        maxRescheduleCount:
          policy.maxRescheduleCount === '' || policy.maxRescheduleCount == null
            ? null
            : Number(policy.maxRescheduleCount),
        waitlistAutoOffer: !!policy.waitlistAutoOffer,
        confirmationRequired: !!policy.confirmationRequired,
        refundPolicyNotes: policy.refundPolicyNotes || null,
      };
      const res = await appointmentApi.updatePolicy(payload);
      setPolicy(res.data);
      setMessage('Policy saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runAutoNoShow = async () => {
    setError(null);
    try {
      const res = await appointmentApi.runAutoNoShow();
      setAutoNoShowResult(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!policy) {
    return (
      <div className="ehr-page space-y-4 p-6">
        <PageHeader title="Appointment Policy" description="Configure cancel, no-show, and reminders." />
        {error ? <p className="text-destructive">{error}</p> : <p>Loading…</p>}
      </div>
    );
  }

  return (
    <div className="ehr-page space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Appointment Policy"
        description="Configurable cancellation, no-show, deposit, waitlist, and reminder rules."
      />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <div className="grid max-w-3xl gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
        {[
          ['lateCancelHours', 'Late cancel window (hours)'],
          ['lateCancelFee', 'Late cancel fee'],
          ['noShowFee', 'No-show fee'],
          ['autoNoShowMinutesPast', 'Auto no-show grace (minutes)'],
          ['blockAfterNoShowCount', 'Block after N no-shows'],
          ['requireDepositAfterNoShows', 'Require deposit after N no-shows'],
          ['depositAmount', 'Deposit amount'],
          ['maxRescheduleCount', 'Max reschedule count'],
        ].map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="number"
              value={policy[key] ?? ''}
              onChange={(e) => updateField(key, e.target.value)}
            />
          </div>
        ))}

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={!!policy.allowFeeWaive}
            onChange={(e) => updateField('allowFeeWaive', e.target.checked)}
          />
          Allow fee waiver
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={!!policy.notifyPatientOnCancel}
            onChange={(e) => updateField('notifyPatientOnCancel', e.target.checked)}
          />
          Notify patient on cancel
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={!!policy.notifyPatientOnNoShow}
            onChange={(e) => updateField('notifyPatientOnNoShow', e.target.checked)}
          />
          Notify patient on no-show
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={!!policy.waitlistAutoOffer}
            onChange={(e) => updateField('waitlistAutoOffer', e.target.checked)}
          />
          Auto-offer waitlist on cancel/no-show
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={!!policy.confirmationRequired}
            onChange={(e) => updateField('confirmationRequired', e.target.checked)}
          />
          Confirmation required
        </label>

        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="refundPolicyNotes">Refund policy notes</Label>
          <Input
            id="refundPolicyNotes"
            value={policy.refundPolicyNotes || ''}
            onChange={(e) => updateField('refundPolicyNotes', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save policy'}
        </Button>
        <Button type="button" variant="secondary" onClick={runAutoNoShow}>
          Run auto no-show job
        </Button>
      </div>

      {autoNoShowResult && (
        <p className="text-sm text-muted-foreground">
          Auto no-show marked {autoNoShowResult.marked} appointment(s) (grace{' '}
          {autoNoShowResult.graceMinutes} min).
        </p>
      )}
    </div>
  );
}
