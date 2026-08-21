import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appointmentApi } from '@/services/api';
import { CodeLookupField } from '@/components/rcm/CodeLookupField';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'authorization', label: 'Authorization' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'room', label: 'Room' },
  { id: 'telehealth', label: 'Telehealth' },
  { id: 'referral', label: 'Referral' },
  { id: 'notifications', label: 'Notifications' },
];

function money(value) {
  if (value == null || value === '') return '—';
  return `$${Number(value).toFixed(2)}`;
}

export function AppointmentRcmPanel({ open, appointmentId, onClose, onChanged }) {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [eligibility, setEligibility] = useState({ latest: null, history: [] });
  const [authorizations, setAuthorizations] = useState([]);
  const [ledger, setLedger] = useState({ balance: 0, entries: [] });
  const [notifications, setNotifications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [busy, setBusy] = useState(false);

  const [checkInForm, setCheckInForm] = useState({
    collectPayment: true,
    paymentMethod: 'cash',
    collectedAmount: '',
  });
  const [authForm, setAuthForm] = useState({
    authorizationNumber: '',
    status: 'Pending',
    serviceCode: '',
    notes: '',
  });
  const [telehealthForm, setTelehealthForm] = useState({
    platform: '',
    joinUrl: '',
    meetingId: '',
  });
  const [referralForm, setReferralForm] = useState({
    referralNumber: '',
    referringProviderName: '',
    referralReason: '',
    diagnosisCode: '',
  });
  const [roomId, setRoomId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const refresh = async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const [aptRes, eligRes, authRes, ledgerRes, notifRes, roomsRes] = await Promise.all([
        appointmentApi.getById(appointmentId),
        appointmentApi.getEligibility(appointmentId),
        appointmentApi.getAuthorizations(appointmentId),
        appointmentApi.getLedger(appointmentId),
        appointmentApi.getNotifications(appointmentId),
        appointmentApi.listRooms(),
      ]);
      setAppointment(aptRes.data);
      setEligibility(eligRes.data || { latest: null, history: [] });
      setAuthorizations(authRes.data || []);
      setLedger(ledgerRes.data || { balance: 0, entries: [] });
      setNotifications(notifRes.data || []);
      setRooms(roomsRes.data || []);
      setRoomId(aptRes.data?.roomId || '');
      setTelehealthForm({
        platform: aptRes.data?.telehealthPlatform || '',
        joinUrl: aptRes.data?.telehealthJoinUrl || '',
        meetingId: aptRes.data?.telehealthMeetingId || '',
      });
      if (eligRes.data?.latest?.copay != null) {
        setCheckInForm((prev) => ({
          ...prev,
          collectedAmount: String(eligRes.data.latest.copay),
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && appointmentId) {
      setTab('overview');
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  if (!open) return null;

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const latest = eligibility.latest;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close RCM panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l bg-card shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">Appointment RCM</h2>
            <p className="text-xs text-muted-foreground">
              {appointment?.encounterNumber || appointmentId}
              {appointment?.rcmStatus ? ` · ${appointment.rcmStatus}` : ''}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b px-2 py-2">
          {TABS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={tab === item.id ? 'default' : 'ghost'}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {tab === 'overview' && appointment && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span> {appointment.status}
              </p>
              <p>
                <span className="text-muted-foreground">RCM:</span> {appointment.rcmStatus || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Primary insurance:</span>{' '}
                {appointment.primaryInsurance?.insuranceProvider?.name ||
                  appointment.primaryInsurance?.memberId ||
                  'Not linked'}
              </p>
              <p>
                <span className="text-muted-foreground">Location:</span>{' '}
                {appointment.location?.name || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Room:</span>{' '}
                {appointment.room?.displayName || appointment.room?.roomNumber || '—'}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.confirm(appointmentId))}
                >
                  Confirm
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.markArrived(appointmentId))}
                >
                  Arrived
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.startVisit(appointmentId))}
                >
                  Start visit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.complete(appointmentId))}
                >
                  Complete
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.checkOut(appointmentId))}
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}

          {tab === 'eligibility' && (
            <div className="space-y-4">
              <Button
                type="button"
                disabled={busy}
                onClick={() => run(() => appointmentApi.verifyEligibility(appointmentId))}
              >
                Verify eligibility (270/271)
              </Button>
              {latest ? (
                <div className="space-y-2 rounded-md border p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Status:</span> {latest.status} /{' '}
                    {latest.coverageStatus || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Payer:</span> {latest.payerName || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Member ID:</span> {latest.memberId || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Copay:</span> {money(latest.copay)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Coinsurance:</span>{' '}
                    {latest.coinsurancePercentage != null
                      ? `${latest.coinsurancePercentage}%`
                      : '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Deductible remaining:</span>{' '}
                    {money(latest.deductibleRemaining)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Prior auth required:</span>{' '}
                    {latest.priorAuthRequired ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verified {latest.verifiedAt ? new Date(latest.verifiedAt).toLocaleString() : '—'}{' '}
                    via {latest.verificationSource || '—'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No eligibility response yet.</p>
              )}
              {eligibility.history?.length > 1 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">History</p>
                  {eligibility.history.slice(0, 5).map((row) => (
                    <p key={row.id} className="text-xs text-muted-foreground">
                      {row.status} · {row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '—'}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'authorization' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <Label>Authorization number</Label>
                  <Input
                    value={authForm.authorizationNumber}
                    onChange={(e) =>
                      setAuthForm((p) => ({ ...p, authorizationNumber: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={authForm.status}
                    onValueChange={(value) => setAuthForm((p) => ({ ...p, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'Required',
                        'Not Required',
                        'Pending',
                        'Approved',
                        'Denied',
                        'Expired',
                        'Exhausted',
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service / procedure code</Label>
                  <Input
                    value={authForm.serviceCode}
                    onChange={(e) => setAuthForm((p) => ({ ...p, serviceCode: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={authForm.notes}
                    onChange={(e) => setAuthForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => appointmentApi.createAuthorization(appointmentId, authForm))
                  }
                >
                  Save authorization
                </Button>
              </div>
              <div className="space-y-2">
                {authorizations.map((auth) => (
                  <div key={auth.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {auth.authorizationNumber || 'No number'} · {auth.status}
                    </p>
                    <p className="text-muted-foreground">{auth.serviceCode || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'checkin' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Suggested copay: {money(latest?.copay)}
              </p>
              <div className="grid gap-3">
                <div>
                  <Label>Collected amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={checkInForm.collectedAmount}
                    onChange={(e) =>
                      setCheckInForm((p) => ({ ...p, collectedAmount: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Payment method</Label>
                  <Select
                    value={checkInForm.paymentMethod}
                    onValueChange={(value) =>
                      setCheckInForm((p) => ({ ...p, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['cash', 'card', 'check', 'other'].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checkInForm.collectPayment}
                    onChange={(e) =>
                      setCheckInForm((p) => ({ ...p, collectPayment: e.target.checked }))
                    }
                  />
                  Collect payment at check-in
                </label>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      appointmentApi.checkIn(appointmentId, {
                        verifyEligibility: true,
                        collectPayment: checkInForm.collectPayment,
                        collectedAmount: checkInForm.collectedAmount
                          ? Number(checkInForm.collectedAmount)
                          : undefined,
                        paymentMethod: checkInForm.paymentMethod,
                      }),
                    )
                  }
                >
                  Check in
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.markReady(appointmentId))}
                >
                  Mark ready
                </Button>
              </div>
            </div>
          )}

          {tab === 'ledger' && (
            <div className="space-y-4">
              <p className="text-sm">
                Running balance: <span className="font-semibold">{money(ledger.balance)}</span>
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <Button
                  type="button"
                  disabled={busy || !paymentAmount}
                  onClick={() =>
                    run(() =>
                      appointmentApi.collectPayment(appointmentId, {
                        amount: Number(paymentAmount),
                        paymentMethod: 'cash',
                        purpose: 'patient_responsibility',
                      }),
                    )
                  }
                >
                  Collect
                </Button>
              </div>
              <div className="space-y-2">
                {(ledger.entries || []).map((row) => (
                  <div key={row.id} className="rounded-md border p-2 text-xs">
                    <div className="flex justify-between">
                      <span>
                        {row.transactionType} ({row.direction})
                      </span>
                      <span>{money(row.amount)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Balance {money(row.runningBalance)} ·{' '}
                      {row.postedAt ? new Date(row.postedAt).toLocaleString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'room' && (
            <div className="space-y-3">
              <Label>Assign room</Label>
              <Select value={roomId || undefined} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.displayName || room.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={busy || !roomId}
                  onClick={() =>
                    run(() => appointmentApi.assignRoom(appointmentId, { roomId }))
                  }
                >
                  Assign
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => appointmentApi.releaseRoom(appointmentId))}
                >
                  Release
                </Button>
              </div>
            </div>
          )}

          {tab === 'telehealth' && (
            <div className="grid gap-3">
              <div>
                <Label>Platform</Label>
                <Input
                  value={telehealthForm.platform}
                  onChange={(e) => setTelehealthForm((p) => ({ ...p, platform: e.target.value }))}
                />
              </div>
              <div>
                <Label>Join URL</Label>
                <Input
                  value={telehealthForm.joinUrl}
                  onChange={(e) => setTelehealthForm((p) => ({ ...p, joinUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label>Meeting ID</Label>
                <Input
                  value={telehealthForm.meetingId}
                  onChange={(e) => setTelehealthForm((p) => ({ ...p, meetingId: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => appointmentApi.upsertTelehealth(appointmentId, telehealthForm))
                }
              >
                Save telehealth
              </Button>
            </div>
          )}

          {tab === 'referral' && (
            <div className="grid gap-3">
              <div>
                <Label>Referral number</Label>
                <Input
                  value={referralForm.referralNumber}
                  onChange={(e) =>
                    setReferralForm((p) => ({ ...p, referralNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Referring provider</Label>
                <Input
                  value={referralForm.referringProviderName}
                  onChange={(e) =>
                    setReferralForm((p) => ({ ...p, referringProviderName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Input
                  value={referralForm.referralReason}
                  onChange={(e) =>
                    setReferralForm((p) => ({ ...p, referralReason: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Diagnosis</Label>
                <CodeLookupField
                  catalog="diagnosis"
                  value={referralForm.diagnosisCode}
                  onChange={(code) => setReferralForm((p) => ({ ...p, diagnosisCode: code }))}
                  onSelect={(item) =>
                    setReferralForm((p) => ({
                      ...p,
                      diagnosisCode: item.code,
                      referralReason: p.referralReason || item.description,
                    }))
                  }
                  placeholder="Search ICD-10"
                />
              </div>
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => appointmentApi.createReferral(appointmentId, referralForm))
                }
              >
                Save referral
              </Button>
              {appointment?.referral && (
                <p className="text-sm text-muted-foreground">
                  Active referral: {appointment.referral.referralNumber || appointment.referral.id}
                </p>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    appointmentApi.sendNotification(appointmentId, {
                      eventKey: 'appointment.reminder',
                    }),
                  )
                }
              >
                Send reminder
              </Button>
              {(notifications || []).map((n) => (
                <div key={n.id} className="rounded-md border p-2 text-xs">
                  <p>
                    {n.eventKey} · {n.channel} · {n.status}
                  </p>
                  <p className="text-muted-foreground">{n.recipient}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
