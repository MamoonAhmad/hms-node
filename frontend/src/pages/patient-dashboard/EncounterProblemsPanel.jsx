import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Loader2,
  Receipt,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { encounterProblemApi } from '@/services/api/encounterProblem.api';
import { ProblemApInline } from './ProblemApInline';
import { EmptyState, StatusBadge } from './components/chart-ui';
import { cn } from '@/lib/utils';

export function EncounterProblemsPanel({
  patientId,
  appointmentId,
  refreshKey = 0,
  onChanged,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const load = useCallback(async () => {
    if (!patientId || !appointmentId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await encounterProblemApi.list(patientId, appointmentId);
      setItems(res.data?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load visit problems');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const patchItem = async (problemId, data) => {
    setBusyId(problemId);
    setError(null);
    setSyncMessage(null);
    try {
      await encounterProblemApi.upsert(patientId, appointmentId, problemId, data);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to update visit problem');
    } finally {
      setBusyId(null);
    }
  };

  const handleSetPrimary = async (problemId) => {
    setBusyId(problemId);
    setError(null);
    try {
      await encounterProblemApi.setPrimary(patientId, appointmentId, problemId);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to set primary');
    } finally {
      setBusyId(null);
    }
  };

  const handleSyncCoding = async () => {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await encounterProblemApi.syncCoding(patientId, appointmentId);
      setSyncMessage(res.message || 'Synced to Coding');
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to sync to Coding');
    } finally {
      setSyncing(false);
    }
  };

  if (!appointmentId) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h3 className="text-base font-semibold text-foreground">This visit</h3>
        </div>
        <EmptyState
          icon={ClipboardList}
          title="No encounter selected"
          description="Open this chart with an appointment to mark problems addressed today."
        />
      </section>
    );
  }

  const activeItems = items.filter(
    (item) => !item.problem?.status || item.problem.status !== 'Resolved',
  );
  const addressedCount = items.filter((i) => i.addressedThisVisit).length;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h3 className="text-base font-semibold text-foreground">This visit</h3>
          {addressedCount > 0 && (
            <Badge variant="secondary" className="status-soft-info">
              {addressedCount} addressed
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncCoding}
            disabled={syncing || addressedCount === 0}
          >
            {syncing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Receipt className="mr-2 h-3.5 w-3.5" />
            )}
            Send to Coding
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link
              to={`/patient-dashboard/${patientId}?appointmentId=${appointmentId}&tab=charge-capture`}
            >
              Open Coding
            </Link>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Mark problems addressed this encounter, set the primary diagnosis, and document visit A/P.
      </p>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {syncMessage && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
          {syncMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading visit problems…</span>
        </div>
      ) : activeItems.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No active problems on the list"
          description="Add a problem below, then mark it addressed for this visit."
        />
      ) : (
        <ul className="space-y-3">
          {activeItems.map((item) => {
            const problem = item.problem || {};
            const busy = busyId === item.problemId;
            return (
              <li
                key={item.problemId}
                className={cn(
                  'rounded-lg border border-border p-3 space-y-3',
                  item.addressedThisVisit && 'border-l-4 border-l-primary',
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <label className="flex items-center gap-2 pt-0.5 text-sm">
                    <Checkbox
                      checked={item.addressedThisVisit}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        patchItem(item.problemId, { addressedThisVisit: !!checked })
                      }
                    />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Addressed
                    </span>
                  </label>

                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                      item.isPrimary
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                    disabled={busy}
                    onClick={() => handleSetPrimary(item.problemId)}
                    aria-label={item.isPrimary ? 'Primary diagnosis' : 'Set as primary'}
                    title="Set as primary for this visit"
                  >
                    <Star
                      className={cn('h-3.5 w-3.5', item.isPrimary && 'fill-amber-400 text-amber-500')}
                    />
                    Primary
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">
                      {problem.diagnosisDescription || '—'}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {problem.icd10Code && (
                        <span className="font-mono">{problem.icd10Code}</span>
                      )}
                      <StatusBadge status={problem.status} />
                      {problem.problemType && (
                        <Badge variant="outline">{problem.problemType}</Badge>
                      )}
                      {problem.acuity && (
                        <Badge variant="outline">{problem.acuity}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Rank</span>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      className="h-8 w-16"
                      value={item.priority ?? ''}
                      disabled={busy}
                      placeholder="—"
                      onChange={(e) => {
                        const raw = e.target.value;
                        const value = raw === '' ? null : Number(raw);
                        setItems((prev) =>
                          prev.map((row) =>
                            row.problemId === item.problemId
                              ? { ...row, priority: value }
                              : row,
                          ),
                        );
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value;
                        const value = raw === '' ? null : Number(raw);
                        if (value === item.priority || (value == null && item.priority == null)) {
                          return;
                        }
                        patchItem(item.problemId, { priority: value });
                      }}
                    />
                  </div>
                </div>

                {item.addressedThisVisit && (
                  <ProblemApInline
                    assessment={item.assessment}
                    plan={item.plan}
                    disabled={busy}
                    defaultOpen={Boolean(item.assessment || item.plan)}
                    onSave={(ap) => patchItem(item.problemId, ap)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
