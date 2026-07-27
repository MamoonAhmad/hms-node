import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Ear,
  Eye,
  FileText,
  FlaskConical,
  FolderOpen,
  Gauge,
  Hand,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mic,
  Microscope,
  Pill,
  Receipt,
  Scan,
  ScanEye,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  TestTube2,
  Thermometer,
  UserCircle,
  Wind,
  ArrowLeft,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PatientChartProvider, usePatientChart } from '@/pages/patient-dashboard/PatientChartContext';
import { PatientChartHeader } from '@/pages/patient-dashboard/components/PatientChartHeader';
import { PatientChartEncounterBar } from '@/pages/patient-dashboard/components/PatientChartEncounterBar';
import { PatientChartStoryboard } from '@/pages/patient-dashboard/components/PatientChartStoryboard';
import { PatientSummaryTab } from '@/pages/patient-dashboard/PatientSummaryTab';
import { PatientIntakeTab } from '@/pages/patient-dashboard/PatientIntakeTab';
import { PatientGrowthChartTab } from '@/pages/patient-dashboard/PatientGrowthChartTab';
import { PatientProblemsTab } from '@/pages/patient-dashboard/PatientProblemsTab';
import { PatientCareGapsTab } from '@/pages/patient-dashboard/care-gaps/PatientCareGapsTab';
import { countOpenCareGaps, loadCareGapOverrides } from '@/pages/patient-dashboard/care-gaps/careGapUtils';
import { NotesTab } from '@/pages/patient-dashboard/NotesTab';
import { PatientCheckoutTab } from '@/pages/patient-dashboard/PatientCheckoutTab';
import { PatientChargeCaptureTab } from '@/pages/patient-dashboard/PatientChargeCaptureTab';
import { PatientProfileTab } from '@/pages/patient-dashboard/PatientProfileTab';
import { PatientOrderEntryTab } from '@/pages/patient-dashboard/PatientOrderEntryTab';
import { PatientMedicationsTab } from '@/pages/patient-dashboard/PatientMedicationsTab';
import { PatientDocumentsTab } from '@/pages/patient-dashboard/PatientDocumentsTab';
import { PatientResultsTab } from '@/pages/patient-dashboard/PatientResultsTab';
import { showGrowthChartForEncounter } from '@/pages/patient-dashboard/encounterTabVisibility';
import { departmentEncounterHref, getDepartmentBySlug } from '../departmentEncounterDepartments';
import {
  buildDepartmentTabDefs,
  getSpecialtyEncounterConfig,
  getSpecialtyTabDef,
} from './specialtyEncounterConfig';
import { SpecialtyEncounterProvider, useSpecialtyEncounter } from './SpecialtyEncounterContext';
import { SpecialtyOverviewTab } from './SpecialtyOverviewTab';
import { SpecialtyWorkspaceTab } from './SpecialtyWorkspaceTab';
import { PatientDermatologyTab } from '@/pages/patient-dashboard/dermatology/PatientDermatologyTab';
import { PatientEntTab } from '@/pages/patient-dashboard/ent/PatientEntTab';
import { PatientGastroenterologyTab } from '@/pages/patient-dashboard/gastroenterology/PatientGastroenterologyTab';
import { PatientNeurologyTab } from '@/pages/patient-dashboard/neurology/PatientNeurologyTab';
import { PatientPsychiatryTab } from '@/pages/patient-dashboard/psychiatry/PatientPsychiatryTab';
import { PatientPulmonologyTab } from '@/pages/patient-dashboard/pulmonology/PatientPulmonologyTab';
import { PatientNephrologyTab } from '@/pages/patient-dashboard/nephrology/PatientNephrologyTab';
import { PatientOncologyHematologyTab } from '@/pages/patient-dashboard/oncology-hematology/PatientOncologyHematologyTab';
import { PatientRheumatologyTab } from '@/pages/patient-dashboard/rheumatology/PatientRheumatologyTab';
import { PatientPmrPtTab } from '@/pages/patient-dashboard/pmr-pt/PatientPmrPtTab';

const ICON_MAP = {
  Activity,
  AlertCircle,
  Baby,
  Bone,
  Brain,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Ear,
  Eye,
  FileText,
  FlaskConical,
  FolderOpen,
  Gauge,
  Hand,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mic,
  Microscope,
  Pill,
  Receipt,
  Scan,
  ScanEye,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  TestTube2,
  Thermometer,
  UserCircle,
  Wind,
};

const CORE_ICON_BY_TAB = {
  intake: ClipboardCheck,
  problems: AlertCircle,
  'care-gaps': ShieldCheck,
  notes: FileText,
  orders: ClipboardList,
  medications: Pill,
  results: TestTube2,
  documents: FolderOpen,
  'patient-checkout': LogOut,
  'charge-capture': Receipt,
  'patient-profile': UserCircle,
  'growth-chart': LineChart,
  'patient-summary': LayoutDashboard,
  'pmr-pt': Activity,
};

const STORYBOARD_TABS = new Set([
  'notes',
  'orders',
  'medications',
  'results',
  'patient-checkout',
  'charge-capture',
]);

function resolveIcon(tab) {
  if (tab.icon && ICON_MAP[tab.icon]) return ICON_MAP[tab.icon];
  return CORE_ICON_BY_TAB[tab.id] || Stethoscope;
}

function CompactSpecialtyBanner({ department, onNavigateTab }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <Stethoscope className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="truncate text-sm font-semibold text-foreground">
          {department.name} specialty encounter
        </p>
        <Badge variant="secondary" className="font-normal">
          Dynamic tabs
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={departmentEncounterHref(department.slug)}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Back to list
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onNavigateTab('specialty-overview')}>
          Overview
        </Button>
        <Button type="button" size="sm" onClick={() => onNavigateTab('notes')}>
          Notes
        </Button>
      </div>
    </div>
  );
}

function DepartmentEncounterDashboardContent() {
  const { departmentSlug } = useParams();
  const department = getDepartmentBySlug(departmentSlug);
  const specialtyConfig = getSpecialtyEncounterConfig(departmentSlug);
  const {
    patientId,
    patient,
    tabCounts,
    notesDirty,
    setNotesDirty,
    appointmentId,
  } = usePatientChart();
  const { checkProgress } = useSpecialtyEncounter();

  const includeGrowth = showGrowthChartForEncounter(patient, departmentSlug);

  const tabDefs = useMemo(
    () =>
      buildDepartmentTabDefs(departmentSlug, {
        includeGrowthChart: includeGrowth,
        patient,
      }),
    [departmentSlug, includeGrowth, patient],
  );
  const validTabIds = useMemo(() => new Set(tabDefs.map((t) => t.id)), [tabDefs]);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = specialtyConfig?.defaultTab || 'specialty-overview';

  const [activeTab, setActiveTab] = useState(() =>
    tabFromUrl && (tabFromUrl === 'growth-chart' || tabDefs.some((t) => t.id === tabFromUrl))
      ? tabFromUrl
      : defaultTab,
  );
  const [pendingTab, setPendingTab] = useState(null);
  const [storyboardOpen, setStoryboardOpen] = useState(true);

  const [careGapsTick, setCareGapsTick] = useState(0);
  useEffect(() => {
    const onUpdate = () => setCareGapsTick((n) => n + 1);
    window.addEventListener('hms:care-gaps-updated', onUpdate);
    return () => window.removeEventListener('hms:care-gaps-updated', onUpdate);
  }, []);

  const dueCareGaps = useMemo(() => {
    if (!patient) return 0;
    const overrides = loadCareGapOverrides(patientId, appointmentId);
    return countOpenCareGaps(patient, overrides);
  }, [patient, patientId, appointmentId, activeTab, careGapsTick]);

  const displayTabCounts = useMemo(
    () => ({ ...tabCounts, dueCareGaps }),
    [tabCounts, dueCareGaps],
  );

  const showStoryboard = STORYBOARD_TABS.has(activeTab);

  useEffect(() => {
    if (!notesDirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [notesDirty]);

  useEffect(() => {
    if (tabFromUrl && validTabIds.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab, validTabIds]);

  useEffect(() => {
    if (activeTab && !validTabIds.has(activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, validTabIds, defaultTab]);

  const requestTabChange = useCallback(
    (tabId) => {
      if (tabId === activeTab) return;
      if (notesDirty && activeTab === 'notes') {
        setPendingTab(tabId);
        return;
      }
      setActiveTab(tabId);
      const nextParams = new URLSearchParams(searchParams);
      if (tabId === defaultTab) {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', tabId);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [activeTab, notesDirty, searchParams, setSearchParams, defaultTab],
  );

  const confirmTabChange = () => {
    if (!pendingTab) return;
    setNotesDirty(false);
    setActiveTab(pendingTab);
    const nextParams = new URLSearchParams(searchParams);
    if (pendingTab === defaultTab) {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', pendingTab);
    }
    setSearchParams(nextParams, { replace: true });
    setPendingTab(null);
  };

  if (!department) return null;

  const specialtyWorkspaceTabs = tabDefs.filter(
    (t) => t.kind === 'specialty' && t.id !== 'specialty-overview' && t.sections,
  );
  const customSpecialtyTabs = tabDefs.filter((t) => t.kind === 'custom');

  return (
    <div className="patient-chart flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <CompactSpecialtyBanner department={department} onNavigateTab={requestTabChange} />

      <Tabs
        value={activeTab}
        onValueChange={requestTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="patient-chart-chrome shrink-0 border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <PatientChartHeader />
          <PatientChartEncounterBar />

          <div className="border-t border-border/80 bg-muted/30 px-3 py-2.5 sm:px-5">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-normal">
                {specialtyConfig?.accentLabel || department.name}
              </Badge>
              <span>
                Checklist {checkProgress.done}/{checkProgress.total}
              </span>
            </div>
            <TabsList className="chart-tab-nav h-auto w-full min-w-0 justify-start border-0 bg-transparent p-0 shadow-none">
              {tabDefs.map((tab) => {
                const count = tab.countKey ? displayTabCounts[tab.countKey] : 0;
                const Icon = resolveIcon(tab);
                const isSpecialty = tab.kind === 'specialty' || tab.kind === 'custom';
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'chart-tab-trigger flex-none normal-case tracking-normal',
                      isSpecialty && 'border-b-2 border-transparent data-[state=active]:border-primary',
                      tab.dirtyKey && notesDirty && 'ring-2 ring-amber-400/60 ring-offset-1',
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    {count > 0 && (
                      <span
                        className="ml-0.5 inline-flex min-w-[1.125rem] justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-4 text-white"
                        aria-label={`${count} pending`}
                      >
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {showStoryboard && (
            <PatientChartStoryboard
              open={storyboardOpen}
              onOpenChange={setStoryboardOpen}
              onNavigateTab={requestTabChange}
            />
          )}

          <TabsContent
            value="intake"
            className="mt-0 flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden focus-visible:outline-none data-[state=inactive]:hidden"
          >
            <PatientIntakeTab />
          </TabsContent>

          <div
            className={cn(
              'min-w-0 flex-1 overflow-y-auto bg-background',
              activeTab === 'intake' && 'hidden',
            )}
          >
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
              <TabsContent value="specialty-overview" className="mt-0 focus-visible:outline-none">
                <SpecialtyOverviewTab onNavigateTab={requestTabChange} />
              </TabsContent>

              {specialtyWorkspaceTabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="mt-0 focus-visible:outline-none"
                >
                  <SpecialtyWorkspaceTab
                    tabDef={getSpecialtyTabDef(departmentSlug, tab.id) || tab}
                    onNavigateTab={requestTabChange}
                  />
                </TabsContent>
              ))}

              {customSpecialtyTabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="mt-0 focus-visible:outline-none"
                >
                  {tab.component === 'dermatology' ? <PatientDermatologyTab /> : null}
                  {tab.component === 'ent' ? <PatientEntTab /> : null}
                  {tab.component === 'gastroenterology' ? <PatientGastroenterologyTab /> : null}
                  {tab.component === 'neurology' ? <PatientNeurologyTab /> : null}
                  {tab.component === 'psychiatry' ? <PatientPsychiatryTab /> : null}
                  {tab.component === 'pulmonology' ? <PatientPulmonologyTab /> : null}
                  {tab.component === 'nephrology' ? <PatientNephrologyTab /> : null}
                  {tab.component === 'rheumatology' ? <PatientRheumatologyTab /> : null}
                  {tab.component === 'oncology-hematology' ? (
                    <PatientOncologyHematologyTab />
                  ) : null}
                  {tab.component === 'pmr-pt' ? <PatientPmrPtTab /> : null}
                </TabsContent>
              ))}

              <TabsContent value="patient-summary" className="mt-0 focus-visible:outline-none">
                <PatientSummaryTab />
              </TabsContent>

              {includeGrowth && (
                <TabsContent value="growth-chart" className="mt-0 focus-visible:outline-none">
                  <PatientGrowthChartTab />
                </TabsContent>
              )}

              <TabsContent value="problems" className="mt-0 focus-visible:outline-none">
                <PatientProblemsTab />
              </TabsContent>

              <TabsContent value="care-gaps" className="mt-0 focus-visible:outline-none">
                <PatientCareGapsTab />
              </TabsContent>

              <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
                <NotesTab onDirtyChange={setNotesDirty} />
              </TabsContent>

              <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
                <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {department.name} order entry
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shared order entry with specialty common orders available from Overview.
                  </p>
                </div>
                <PatientOrderEntryTab patientId={patientId} appointmentId={appointmentId} />
              </TabsContent>

              <TabsContent value="medications" className="mt-0 focus-visible:outline-none">
                <PatientMedicationsTab />
              </TabsContent>

              <TabsContent value="results" className="mt-0 focus-visible:outline-none">
                <PatientResultsTab />
              </TabsContent>

              <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
                <PatientDocumentsTab />
              </TabsContent>

              <TabsContent value="patient-checkout" className="mt-0 focus-visible:outline-none">
                <PatientCheckoutTab />
              </TabsContent>

              <TabsContent value="charge-capture" className="mt-0 focus-visible:outline-none">
                <PatientChargeCaptureTab />
              </TabsContent>

              <TabsContent value="patient-profile" className="mt-0 focus-visible:outline-none">
                <PatientProfileTab />
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>

      <Dialog open={!!pendingTab} onOpenChange={(o) => !o && setPendingTab(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved note changes. Leave without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingTab(null)}>
              Stay
            </Button>
            <Button variant="destructive" onClick={confirmTabChange}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function DepartmentEncounterDashboard() {
  return (
    <PatientChartProvider>
      <SpecialtyEncounterProvider>
        <DepartmentEncounterDashboardContent />
      </SpecialtyEncounterProvider>
    </PatientChartProvider>
  );
}
