import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Loader2, Printer, RefreshCw, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { emarApi } from '@/services/api/emar.api';
import { usePatientChart } from './PatientChartContext';
import { EmarTimeline } from './emar/EmarTimeline';
import { AdministerMedicationDialog } from './emar/AdministerMedicationDialog';
import { EmarPrintDialog } from './emar/EmarPrintDialog';
import { EMAR_TABS, MAR_STATUS_BADGE } from './emar/emarConstants';
import { ChartTabShell, EmptyState, SectionCard, StatusBadge } from './components/chart-ui';

const ADMINISTRABLE_TABS = new Set(['active', 'scheduled', 'prn', 'missed']);
const TERMINAL_MAR_STATUS = new Set(['Discontinued', 'Cancelled', 'Completed', 'Expired']);

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function MarStatusBadge({ status }) {
  return <StatusBadge status={status} className={cn(MAR_STATUS_BADGE[status] || '')} />;
}

export function PatientEmarTab() {
  const { patientId, appointmentId, isSampleChart, refreshKey } = usePatientChart();
  const canFetch = Boolean(patientId && !isSampleChart);

  const [activeTab, setActiveTab] = useState('active');
  const [entries, setEntries] = useState([]);
  const [counts, setCounts] = useState({});
  const [panel, setPanel] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [administerEntry, setAdministerEntry] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!canFetch) {
      setEntries([]);
      setCounts({});
      setPanel(null);
      setTimeline([]);
      return;
    }

    setLoading(true);
    try {
      const params = { tab: activeTab, ...(appointmentId ? { appointmentId } : {}) };
      const panelParams = appointmentId ? { appointmentId } : {};
      const [entriesRes, countsRes, panelRes, timelineRes] = await Promise.allSettled([
        emarApi.getEntries(patientId, params),
        emarApi.getTabCounts(patientId, panelParams),
        emarApi.getPatientPanel(patientId, panelParams),
        emarApi.getTimeline(patientId, panelParams),
      ]);
      setEntries(entriesRes.status === 'fulfilled' ? entriesRes.value.data || [] : []);
      setCounts(countsRes.status === 'fulfilled' ? countsRes.value.data || {} : {});
      setPanel(panelRes.status === 'fulfilled' ? panelRes.value.data : null);
      setTimeline(timelineRes.status === 'fulfilled' ? timelineRes.value.data || [] : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, patientId, appointmentId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const openFullEmar = () => {
    const qs = appointmentId ? `?appointmentId=${appointmentId}` : '';
    window.open(`/emar/${patientId}${qs}`, '_blank');
  };

  const handleAdminister = async (payload) => {
    if (!administerEntry) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await emarApi.recordAdministration(patientId, administerEntry.id, payload);
      setAdministerEntry(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to record administration');
    } finally {
      setSubmitting(false);
    }
  };

  const showAdminister = ADMINISTRABLE_TABS.has(activeTab);

  return (
    <ChartTabShell
      title="eMAR"
      description="Electronic Medication Administration Record for this patient."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading || !canFetch}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)} disabled={!canFetch}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" onClick={openFullEmar} disabled={!canFetch}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Full eMAR
          </Button>
        </>
      }
    >
      {!canFetch && (
        <EmptyState
          icon={Syringe}
          title="Demo chart"
          description="eMAR is available for live patient charts. Open a registered patient to view medication administration records."
        />
      )}

      {canFetch && (
        <>
          <div className="flex flex-wrap gap-2">
            {EMAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-active={activeTab === tab.id}
                className="chart-filter-chip"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {counts[tab.id] != null && (
                  <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-muted px-1.5 text-xs">
                    {counts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive">
              {actionError}
            </div>
          )}

          <SectionCard
            title={`${activeTab.replace(/_/g, ' ')} medications`}
            icon={Syringe}
            accent="info"
            actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            contentClassName="p-0"
          >
            <div className="chart-table-wrap border-0 shadow-none">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dose / Route</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>MAR Status</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Last Administered</TableHead>
                    <TableHead>Prescriber</TableHead>
                    {showAdminister && <TableHead className="text-right">Administer</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showAdminister ? 8 : 7} className="py-10 text-center text-muted-foreground">
                        No medications in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">{entry.medicationName}</div>
                          {entry.strength && (
                            <div className="text-xs text-muted-foreground">{entry.strength} {entry.dosageForm}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {[entry.dose, entry.unit, entry.route].filter(Boolean).join(' ') || entry.sigPreview || '—'}
                        </TableCell>
                        <TableCell>{entry.frequency || '—'}{entry.prn ? ' PRN' : ''}</TableCell>
                        <TableCell><MarStatusBadge status={entry.marStatus} /></TableCell>
                        <TableCell>{formatDateTime(entry.nextDueAt)}</TableCell>
                        <TableCell>{formatDateTime(entry.lastAdministeredAt)}</TableCell>
                        <TableCell>{entry.prescriber || entry.signedBy || '—'}</TableCell>
                        {showAdminister && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={TERMINAL_MAR_STATUS.has(entry.marStatus)}
                              onClick={() => { setActionError(null); setAdministerEntry(entry); }}
                            >
                              <Syringe className="mr-1.5 h-3.5 w-3.5" />
                              Administer
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <SectionCard title="Medication timeline" icon={Syringe} accent="muted">
            <EmarTimeline events={timeline} loading={loading} />
          </SectionCard>

          <AdministerMedicationDialog
            open={Boolean(administerEntry)}
            onOpenChange={(open) => !open && setAdministerEntry(null)}
            entry={administerEntry}
            panel={panel}
            onSubmit={handleAdminister}
            submitting={submitting}
          />

          <EmarPrintDialog
            open={printOpen}
            onOpenChange={setPrintOpen}
            patientId={patientId}
            appointmentId={appointmentId}
            panel={panel}
          />
        </>
      )}
    </ChartTabShell>
  );
}
