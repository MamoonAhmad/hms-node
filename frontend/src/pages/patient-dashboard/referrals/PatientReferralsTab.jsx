import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, MoreVertical, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { referralApi } from '@/services/api/referral.api';
import { usePatientChart } from '../PatientChartContext';
import { ReferralFormDialog } from './ReferralFormDialog';
import { ReferralDetailDialog } from './ReferralDetailDialog';
import {
  PRIORITY_BADGE_CLASSES,
  SAMPLE_REFERRALS,
  STATUS_BADGE_CLASSES,
  SUMMARY_CARDS,
  referralMatchesSummaryFilter,
} from './referralConstants';
import { ChartTabShell, StatusBadge } from '../components/chart-ui';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function ReferralStatusBadge({ status }) {
  return <StatusBadge status={status} className={cn('whitespace-nowrap', STATUS_BADGE_CLASSES[status] || '')} />;
}

function PriorityBadge({ priority }) {
  return (
    <Badge variant="outline" className={cn('border', PRIORITY_BADGE_CLASSES[priority] || '')}>
      {priority}
    </Badge>
  );
}

function ReferralContextPanel({ panel, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading patient context…</CardContent>
      </Card>
    );
  }
  if (!panel) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Patient Context</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demographics</p>
          <div><span className="text-muted-foreground">Patient:</span> {panel.patientName}</div>
          <div><span className="text-muted-foreground">MRN:</span> {panel.mrn}</div>
          <div><span className="text-muted-foreground">DOB:</span> {formatDate(panel.dateOfBirth)} ({panel.age} yrs)</div>
          <div><span className="text-muted-foreground">Gender:</span> {panel.gender}</div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allergies</p>
          {(panel.allergies || []).length === 0 ? (
            <p className="text-muted-foreground">None documented</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {panel.allergies.map((a) => (
                <Badge key={a.id || a.allergenName} variant="outline" className="border-red-200 bg-red-50 text-red-800">
                  {a.allergenName}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Insurance</p>
          {panel.insuranceSummary?.primaryInsurance ? (
            <p>
              Primary: {panel.insuranceSummary.primaryInsurance.payer}
              {panel.insuranceSummary.primaryInsurance.memberId ? ` · ${panel.insuranceSummary.primaryInsurance.memberId}` : ''}
            </p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Medications</p>
          <p>{(panel.currentMedications || []).join(', ') || '—'}</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Problems</p>
          {(panel.activeProblems || []).length === 0 ? (
            <p className="text-muted-foreground">—</p>
          ) : (
            <ul className="list-disc pl-4 text-muted-foreground">
              {(panel.activeProblems || []).map((p, i) => (
                <li key={i}>{p.code} {p.description}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralActionMenu({ referral, onAction, disabled }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const items = [
    { id: 'view', label: 'View' },
    { id: 'edit', label: 'Edit' },
    { id: 'send', label: 'Send' },
    { id: 'print', label: 'Print' },
    { id: 'cancel', label: 'Cancel' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        className="h-8 w-8"
        onClick={() => setOpen((v) => !v)}
        aria-label="Referral actions"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-40 rounded-md border bg-popover p-1 shadow-lg">
          {items.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start px-2 py-2"
              onClick={() => {
                setOpen(false);
                onAction?.(item.id, referral);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientReferralsTab() {
  const {
    patientId,
    appointmentId,
    isSampleChart,
    refreshKey,
    refreshChart,
  } = usePatientChart();

  const canFetch = Boolean(patientId && !isSampleChart);

  const [referrals, setReferrals] = useState([]);
  const [summary, setSummary] = useState({});
  const [panel, setPanel] = useState(null);
  const [referralTypes, setReferralTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [summaryFilter, setSummaryFilter] = useState('total');

  const filteredReferrals = useMemo(
    () => referrals.filter((ref) => referralMatchesSummaryFilter(ref, summaryFilter)),
    [referrals, summaryFilter],
  );

  const loadData = useCallback(async () => {
    if (!canFetch) {
      setError(null);
      setReferrals(SAMPLE_REFERRALS);
      setSummary({
        total: 1,
        pending: 0,
        scheduled: 1,
        authorized: 1,
        completed: 0,
        expired: 0,
        cancelled: 0,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = appointmentId ? { appointmentId } : {};
      const [listRes, summaryRes, typesRes] = await Promise.all([
        referralApi.getAll(patientId, params),
        referralApi.getSummary(patientId, params),
        referralApi.getTypes(patientId),
      ]);
      setReferrals(listRes.data || []);
      setSummary(summaryRes.data || {});
      setReferralTypes(typesRes.data || []);
    } catch (err) {
      setReferrals([]);
      setSummary({});
      setError(err?.message || 'Unable to load referrals.');
    } finally {
      setLoading(false);
    }
  }, [canFetch, patientId, appointmentId]);

  const loadPanel = useCallback(async () => {
    if (!canFetch) return;
    setPanelLoading(true);
    try {
      const params = appointmentId ? { appointmentId } : {};
      const res = await referralApi.getPanel(patientId, params);
      setPanel(res.data);
    } catch {
      setPanel(null);
    } finally {
      setPanelLoading(false);
    }
  }, [canFetch, patientId, appointmentId]);

  useEffect(() => {
    loadData();
    loadPanel();
  }, [loadData, loadPanel, refreshKey]);

  const openDetail = async (referral) => {
    if (!canFetch) {
      setSelectedReferral({ ...referral, timeline: [], notes: [] });
      setDetailOpen(true);
      return;
    }
    try {
      const res = await referralApi.getById(patientId, referral.id);
      const auditRes = await referralApi.getAuditLogs(patientId, referral.id);
      setSelectedReferral({ ...res.data, auditLogs: auditRes.data || [] });
      setDetailOpen(true);
    } catch {
      setSelectedReferral(referral);
      setDetailOpen(true);
    }
  };

  const handleCreate = async (payload) => {
    if (!canFetch) {
      setFormOpen(false);
      return;
    }
    const linkedAppointmentId = payload.appointmentId || appointmentId;
    if (!linkedAppointmentId) {
      setError('Select an active encounter before creating a referral.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = { ...payload, appointmentId: linkedAppointmentId };
      if (editRecord?.id) {
        await referralApi.update(patientId, editRecord.id, body);
      } else {
        await referralApi.create(patientId, body);
      }
      setFormOpen(false);
      setEditRecord(null);
      await loadData();
      await loadPanel();
      refreshChart();
    } catch (err) {
      setError(err?.message || 'Unable to save referral for this encounter.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (actionId, referral) => {
    if (actionId === 'view' || actionId === 'send') {
      await openDetail(referral);
      return;
    }
    if (actionId === 'edit') {
      if (canFetch) {
        const res = await referralApi.getById(patientId, referral.id);
        setEditRecord(res.data);
      } else {
        setEditRecord(referral);
      }
      setFormOpen(true);
      return;
    }
    if (actionId === 'print') {
      const win = window.open('', '_blank');
      win.document.write(`<pre>${referral.referralLetter?.body || referral.referralReason || ''}</pre>`);
      win.print();
      return;
    }
    if (actionId === 'cancel' && canFetch) {
      await referralApi.cancel(patientId, referral.id);
      await loadData();
    }
  };

  return (
    <>
      <ChartTabShell
        title="Referrals"
        description="Create, track, and manage patient referrals to specialists and external providers."
        actions={
          <Button
            onClick={() => {
              setEditRecord(null);
              setFormOpen(true);
            }}
            disabled={!appointmentId && canFetch}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Referral
          </Button>
        }
        loading={loading && referrals.length === 0}
        error={error}
        onRetry={loadData}
      >
        {!appointmentId && canFetch && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            Select an active encounter to create a referral linked to the current visit.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {SUMMARY_CARDS.map((card) => {
            const active = summaryFilter === card.key;
            const count = summary[card.key] ?? 0;
            return (
              <button
                key={card.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSummaryFilter(card.key)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  card.buttonClass,
                  active && card.activeClass,
                )}
              >
                {card.label}
                <span
                  className={cn(
                    'inline-flex min-w-[1.5rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                    card.countClass,
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Referral Listing</CardTitle>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Referred To</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Referring Provider</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Auth Status</TableHead>
                    <TableHead>Appt Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                        {referrals.length === 0
                          ? 'No referrals found. Click New Referral to create one.'
                          : 'No referrals match this status filter.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((ref) => (
                      <TableRow key={ref.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openDetail(ref)}>
                        <TableCell className="font-mono text-xs">{ref.referralNumber}</TableCell>
                        <TableCell>{formatDate(ref.referralDate)}</TableCell>
                        <TableCell>{ref.referralType}</TableCell>
                        <TableCell>{ref.specialty}</TableCell>
                        <TableCell>{ref.referredToName || '—'}</TableCell>
                        <TableCell>{ref.referredToOrganization || '—'}</TableCell>
                        <TableCell>{ref.referringProviderName || '—'}</TableCell>
                        <TableCell><PriorityBadge priority={ref.priority} /></TableCell>
                        <TableCell>{ref.authorizationStatus || '—'}</TableCell>
                        <TableCell>{formatDateTime(ref.appointmentScheduledDate)}</TableCell>
                        <TableCell><ReferralStatusBadge status={ref.status} /></TableCell>
                        <TableCell>{formatDate(ref.expirationDate)}</TableCell>
                        <TableCell>{ref.createdByName || '—'}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <ReferralActionMenu referral={ref} onAction={handleAction} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <ReferralContextPanel panel={panel} loading={panelLoading} />
        </div>

        {isSampleChart && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Share2 className="h-3.5 w-3.5" />
            Sample chart — connect a live patient to persist referrals.
          </p>
        )}
      </ChartTabShell>

      <ReferralFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditRecord(null);
        }}
        record={editRecord}
        patientId={patientId}
        appointmentId={appointmentId}
        referralTypes={referralTypes}
        onSubmit={handleCreate}
        isLoading={submitting}
      />

      <ReferralDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        referral={selectedReferral}
        loading={submitting}
        onEdit={(ref) => {
          setDetailOpen(false);
          setEditRecord(ref);
          setFormOpen(true);
        }}
        onSend={async (data) => {
          if (!canFetch || !selectedReferral) return;
          setSubmitting(true);
          try {
            await referralApi.send(patientId, selectedReferral.id, data);
            await openDetail(selectedReferral);
            await loadData();
          } finally {
            setSubmitting(false);
          }
        }}
        onCancel={async () => {
          if (!canFetch || !selectedReferral) return;
          await referralApi.cancel(patientId, selectedReferral.id);
          setDetailOpen(false);
          await loadData();
        }}
        onClose={async (data) => {
          if (!canFetch || !selectedReferral) return;
          await referralApi.close(patientId, selectedReferral.id, data);
          await openDetail(selectedReferral);
          await loadData();
        }}
        onAddNote={async (data) => {
          if (!canFetch || !selectedReferral) return;
          await referralApi.addNote(patientId, selectedReferral.id, data);
          await openDetail(selectedReferral);
        }}
        onPrint={(ref) => {
          const win = window.open('', '_blank');
          win.document.write(`<pre>${ref.referralLetter?.body || ref.referralReason || ''}</pre>`);
          win.print();
        }}
      />
    </>
  );
}
