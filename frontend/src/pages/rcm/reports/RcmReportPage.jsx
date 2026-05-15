import { useParams, Navigate } from 'react-router-dom';
import { RcmReportShell, TrendPeriodChart } from './RcmReportShell';
import { getReportDefinition } from './rcmReportDefinitions';

export function RcmReportPage() {
  const { reportSlug } = useParams();
  const def = getReportDefinition(reportSlug);

  if (!def) {
    return <Navigate to="/404" replace />;
  }

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
      columns={def.columns}
      rows={def.rows}
      summaryCards={def.summaryCards || []}
      breakdown={def.breakdown}
      numericFooterKeys={def.numericFooterKeys || []}
      showPdfExport={def.showPdfExport}
      helpRule={def.helpRule}
      footNote={def.footNote}
      beforeTable={beforeTable}
      rowClickPath={def.rowClickPath === undefined ? '/rcm/claims' : def.rowClickPath}
      emptyMessage="No rows in sample data for this report."
    />
  );
}
