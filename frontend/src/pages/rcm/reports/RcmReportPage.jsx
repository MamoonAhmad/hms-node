import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { RcmReportShell, TrendPeriodChart } from './RcmReportShell';
import { getReportDefinition } from './rcmReportDefinitions';
import { rcmApi } from '@/services/api';

export function RcmReportPage() {
  const { reportSlug } = useParams();
  const def = getReportDefinition(reportSlug);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!def || !reportSlug) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    rcmApi
      .report(reportSlug, { days: 90 })
      .then((res) => {
        if (!cancelled) setLive(res.data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load report');
          setLive(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportSlug, def]);

  if (!def) {
    return <Navigate to="/404" replace />;
  }

  const columns = live?.columns?.length ? live.columns : def.columns;
  const rows = live?.rows || [];
  const summaryCards = live?.summaryCards?.length ? live.summaryCards : def.summaryCards || [];
  const numericFooterKeys = live?.numericFooterKeys || def.numericFooterKeys || [];

  const beforeTable =
    def.trendSeries?.length > 0 ? (
      <TrendPeriodChart series={def.trendSeries} metrics={def.trendMetrics || ['submitted', 'paid', 'denied']} />
    ) : null;

  return (
    <RcmReportShell
      title={def.title}
      description={def.description}
      dateFilterLabel={def.dateFilterLabel}
      dateFilterHint={def.dateFilterHint}
      showAsOfDate={def.showAsOfDate}
      columns={columns}
      rows={rows}
      summaryCards={summaryCards}
      breakdown={def.breakdown}
      numericFooterKeys={numericFooterKeys}
      showPdfExport={def.showPdfExport}
      helpRule={def.helpRule}
      footNote={error || (loading ? 'Loading live report…' : def.footNote || 'Live DB-driven report')}
      beforeTable={beforeTable}
      rowClickPath={def.rowClickPath === undefined ? '/rcm/claims' : def.rowClickPath}
      emptyMessage={loading ? 'Loading…' : 'No rows for this report yet.'}
    />
  );
}
