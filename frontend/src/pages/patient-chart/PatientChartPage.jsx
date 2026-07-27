import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatPatientName } from '@/pages/patient-dashboard/patientChartUtils';
import { PatientChartProvider, usePatientChartData } from './PatientChartContext';
import { ChartBreadcrumb } from './components/ChartBreadcrumb';
import { ChartPatientHeader } from './components/ChartPatientHeader';
import { ChartSafetyAlerts } from './components/ChartSafetyAlerts';
import { ChartQuickActions } from './components/ChartQuickActions';
import { ChartSidebar } from './components/ChartSidebar';
import { ChartSummaryPanel } from './components/ChartSummaryPanel';
import { ChartErrorState, LoadingSkeleton, PatientNotFound } from './components/ChartStates';
import { CHART_SECTIONS, DEFAULT_SECTION, VALID_SECTION_IDS } from './patientChartConfig';
import { renderSection } from './sections';

function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-lg">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PatientChartInner() {
  const { patientId, patient, summary, appointments, orders, loading, error, refresh, counts, permissions } =
    usePatientChartData();

  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(() =>
    sectionFromUrl && VALID_SECTION_IDS.has(sectionFromUrl) ? sectionFromUrl : DEFAULT_SECTION,
  );
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (sectionFromUrl && VALID_SECTION_IDS.has(sectionFromUrl) && sectionFromUrl !== activeSection) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl, activeSection]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const openSection = useCallback(
    (sectionId) => {
      if (!VALID_SECTION_IDS.has(sectionId)) return;
      setActiveSection(sectionId);
      const next = new URLSearchParams(searchParams);
      if (sectionId === DEFAULT_SECTION) next.delete('section');
      else next.set('section', sectionId);
      setSearchParams(next, { replace: true });
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
    },
    [searchParams, setSearchParams],
  );

  const patientName = patient ? formatPatientName(patient) : '';
  const visits = useMemo(
    () => ({
      upcoming: summary?.upcomingVisit || null,
      last: summary?.lastVisit || null,
    }),
    [summary],
  );

  const sectionProps = useMemo(
    () => ({
      patient,
      summary,
      appointments,
      orders,
      patientId,
      permissions,
      onOpenSection: openSection,
    }),
    [patient, summary, appointments, orders, patientId, permissions, openSection],
  );

  if (loading && !patient) {
    return (
      <div className="p-6 sm:p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !patient) {
    const notFound = /not found/i.test(error);
    return (
      <div className="p-6 sm:p-8">
        {notFound ? <PatientNotFound /> : <ChartErrorState message={error} onRetry={refresh} />}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 sm:p-8">
        <PatientNotFound />
      </div>
    );
  }

  return (
    <div className="patient-chart-page flex min-h-[calc(100vh-3.5rem)] flex-col bg-muted/30">
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <ChartBreadcrumb patientName={patientName} />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={refresh}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <ChartPatientHeader
        patient={patient}
        summary={summary}
        visits={visits}
        onRefresh={refresh}
        onPrint={() => window.print()}
      />

      <ChartSafetyAlerts
        patient={patient}
        summary={summary}
        onOpenAllergies={() => openSection('allergies')}
      />

      <ChartQuickActions patient={patient} onNavigateSection={openSection} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-card py-5 print:hidden lg:block">
          <div className="mb-4 px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigate</p>
            <p className="text-sm font-semibold text-foreground">Chart sections</p>
          </div>
          <ChartSidebar activeSection={activeSection} onSelect={openSection} counts={counts} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card px-4 py-3 print:hidden lg:hidden">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Section
            </label>
            <Select value={activeSection} onValueChange={openSection}>
              <SelectTrigger className="h-8 bg-background">
                <SelectValue placeholder="Choose section" />
              </SelectTrigger>
              <SelectContent>
                {CHART_SECTIONS.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {renderSection(activeSection, sectionProps)}
          </div>
        </main>

        <ChartSummaryPanel
          summary={summary}
          orders={orders}
          collapsed={panelCollapsed}
          onToggle={() => setPanelCollapsed((v) => !v)}
          onOpenSection={openSection}
        />
      </div>

      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  );
}

export function PatientChartPage() {
  const { patientId } = useParams();
  return (
    <PatientChartProvider patientId={patientId}>
      <PatientChartInner />
    </PatientChartProvider>
  );
}
