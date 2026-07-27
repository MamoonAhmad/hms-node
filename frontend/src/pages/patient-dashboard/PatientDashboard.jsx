import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
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
  Hand,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  LogOut,
  Microscope,
  MoreHorizontal,
  Pill,
  Receipt,
  ScanFace,
  Share2,
  ShieldCheck,
  Stethoscope,
  Syringe,
  TestTube2,
  UserCircle,
  Wind,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PatientChartProvider, usePatientChart } from './PatientChartContext';
import { PatientChartHeader } from './components/PatientChartHeader';
import { PatientChartEncounterBar } from './components/PatientChartEncounterBar';
import { PatientChartStoryboard } from './components/PatientChartStoryboard';
import { PatientSummaryTab } from './PatientSummaryTab';
import { PatientIntakeTab } from './PatientIntakeTab';
import { PatientGrowthChartTab } from './PatientGrowthChartTab';
import { PatientChronicConditionsTab } from './PatientChronicConditionsTab';
import { PatientProblemsTab } from './PatientProblemsTab';
import { NotesTab } from './NotesTab';
import { PatientCheckoutTab } from './PatientCheckoutTab';
import { PatientChargeCaptureTab } from './PatientChargeCaptureTab';
import { PatientProfileTab } from './PatientProfileTab';
import { PatientOrderEntryTab } from './PatientOrderEntryTab';
import { PatientMedicationsTab } from './PatientMedicationsTab';
import { PatientEmarTab } from './PatientEmarTab';
import { PatientReferralsTab } from './referrals/PatientReferralsTab';
import { PatientDocumentsTab } from './PatientDocumentsTab';
import { PatientResultsTab } from './PatientResultsTab';
import { PatientCareGapsTab } from './care-gaps/PatientCareGapsTab';
import { countOpenCareGaps, loadCareGapOverrides } from './care-gaps/careGapUtils';
import { PatientWomensHealthTab } from './womens-health/PatientWomensHealthTab';
import { PatientOrthopedicsMskTab } from './orthopedics-msk/PatientOrthopedicsMskTab';
import { PatientDermatologyTab } from './dermatology/PatientDermatologyTab';
import { PatientOphthalmologyTab } from './ophthalmology/PatientOphthalmologyTab';
import { PatientPulmonologyTab } from './pulmonology/PatientPulmonologyTab';
import { PatientNeurologyTab } from './neurology/PatientNeurologyTab';
import { PatientPsychiatryTab } from './psychiatry/PatientPsychiatryTab';
import { PatientRheumatologyTab } from './rheumatology/PatientRheumatologyTab';
import { PatientEntTab } from './ent/PatientEntTab';
import { showEntTab } from './ent/entUtils';
import { PatientEndocrinologyTab } from './endocrinology/PatientEndocrinologyTab';
import { PatientGastroenterologyTab } from './gastroenterology/PatientGastroenterologyTab';
import { showGastroenterologyTab } from './gastroenterology/gastroenterologyAccess';
import { PatientUrologyTab } from './urology/PatientUrologyTab';
import { PatientNephrologyTab } from './nephrology/PatientNephrologyTab';
import { PatientOncologyHematologyTab } from './oncology-hematology/PatientOncologyHematologyTab';
import { PatientPmrPtTab } from './pmr-pt/PatientPmrPtTab';
import {
  resolveEncounterDepartmentSlug,
  shouldShowSpecialtyChartTab,
  showAllChartTabsForPatient,
  showGrowthChartForEncounter,
} from './encounterTabVisibility';

/** First N chart tabs stay visible; the rest open from the "…" overflow menu. */
const VISIBLE_TAB_COUNT = 10;

const ENT_TAB = { id: 'ent', label: 'ENT', icon: Ear };
const GI_TAB = { id: 'gastroenterology', label: 'Gastroenterology', icon: Stethoscope };

/** Always-visible clinical chart tabs (not specialty workspaces). */
const CORE_TAB_DEFS = [
  { id: 'patient-summary', label: 'Summary', icon: LayoutDashboard },
  { id: 'intake', label: 'Intake', icon: ClipboardCheck },
  { id: 'chronic-conditions', label: 'Chronic Conditions', icon: Activity },
  { id: 'problems', label: 'Problems', icon: AlertCircle },
  { id: 'care-gaps', label: 'Care Gaps', icon: ShieldCheck, countKey: 'dueCareGaps' },
  { id: 'notes', label: 'Notes', icon: FileText, dirtyKey: true },
  { id: 'orders', label: 'Orders', icon: ClipboardList, countKey: 'pendingOrders' },
  { id: 'medications', label: 'Medications', icon: Pill, countKey: 'draftMedications' },
  { id: 'emar', label: 'eMAR', icon: Syringe, countKey: 'pendingEmar' },
  { id: 'referrals', label: 'Referrals', icon: Share2, countKey: 'pendingReferrals' },
  { id: 'results', label: 'Results', icon: TestTube2, countKey: 'pendingResults' },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'patient-checkout', label: 'Checkout', icon: LogOut },
  { id: 'charge-capture', label: 'Coding', icon: Receipt },
  { id: 'patient-profile', label: 'Profile', icon: UserCircle },
];

/** Specialty workspaces — shown only when department / age / gender rules match. */
const SPECIALTY_TAB_DEFS = [
  { id: 'womens-health', label: "Women's Health / OB-GYN", icon: Heart },
  { id: 'orthopedics-msk', label: 'Orthopedics / MSK', icon: Bone },
  { id: 'dermatology', label: 'Dermatology', icon: ScanFace },
  { id: 'ophthalmology', label: 'Ophthalmology', icon: Eye },
  { id: 'neurology', label: 'Neurology', icon: Brain },
  { id: 'psychiatry', label: 'Psychiatry / Behavioral Health', icon: Brain },
  { id: 'endocrinology', label: 'Endocrinology', icon: Droplets },
  { id: 'pulmonology', label: 'Pulmonology', icon: Wind },
  { id: 'rheumatology', label: 'Rheumatology', icon: Hand },
  { id: 'oncology-hematology', label: 'Oncology / Hematology', icon: Microscope },
  { id: 'urology', label: 'Urology', icon: FlaskConical },
  { id: 'nephrology', label: 'Nephrology', icon: HeartPulse },
  { id: 'pmr-pt', label: 'PM&R / PT', icon: Activity },
];

const GROWTH_CHART_TAB = { id: 'growth-chart', label: 'Growth Chart', icon: LineChart };

function ChartTabOverflowMenu({ tabs, activeTab, tabCounts, notesDirty, onSelect }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const activeInOverflow = tabs.some((t) => t.id === activeTab);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (tabId) => {
    setOpen(false);
    onSelect?.(tabId);
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        className={cn(
          'chart-tab-trigger flex-none normal-case tracking-normal',
          activeInOverflow && 'bg-card text-primary shadow-sm',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More chart tabs"
        title="More tabs"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="sr-only">More</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 max-h-[min(24rem,70vh)] w-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.countKey ? tabCounts[tab.countKey] : 0;
            const isActive = tab.id === activeTab;
            return (
              <Button
                key={tab.id}
                type="button"
                role="menuitem"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-auto w-full justify-start gap-2 px-2 py-2 font-medium',
                  isActive && 'bg-primary/10 text-primary',
                  tab.dirtyKey && notesDirty && 'ring-2 ring-amber-400/60 ring-offset-1',
                )}
                onClick={() => handleSelect(tab.id)}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />}
                <span className="min-w-0 flex-1 truncate text-left">{tab.label}</span>
                {count > 0 && (
                  <span
                    className="inline-flex min-w-[1.125rem] justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-4 text-white"
                    aria-label={`${count} pending`}
                  >
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STORYBOARD_TABS = new Set(['notes', 'orders', 'medications', 'emar', 'referrals', 'results', 'patient-checkout', 'charge-capture']);

function buildTabDefs(patient, { user, appointment, chartSummary, departmentSlug } = {}) {
  const resolvedDepartmentSlug = resolveEncounterDepartmentSlug({
    departmentSlug,
    appointment,
    chartSummary,
  });
  const deptForGates = resolvedDepartmentSlug || departmentSlug;
  const showAllTabs = showAllChartTabsForPatient(patient);

  const visibilityCtx = {
    patient,
    departmentSlug,
    resolvedDepartmentSlug,
  };

  // Core first: Summary → Intake → (optional Growth) → Chronic → Problems → specialty → rest of core
  const defs = [
    CORE_TAB_DEFS[0], // summary
    CORE_TAB_DEFS[1], // intake
  ];

  if (showAllTabs || showGrowthChartForEncounter(patient, resolvedDepartmentSlug)) {
    defs.push(GROWTH_CHART_TAB);
  }

  defs.push(CORE_TAB_DEFS[2], CORE_TAB_DEFS[3]); // chronic-conditions, problems

  for (const tab of SPECIALTY_TAB_DEFS) {
    if (shouldShowSpecialtyChartTab(tab.id, visibilityCtx)) {
      defs.push(tab);
    }
  }

  // ENT / GI: department route, matching specialty, or Sample Patient (all-tabs demo)
  if (
    showAllTabs ||
    showEntTab({ appointment, chartSummary, departmentSlug: deptForGates })
  ) {
    defs.push(ENT_TAB);
  }
  if (
    showAllTabs ||
    showGastroenterologyTab({
      user,
      appointment,
      chartSummary,
      departmentSlug: deptForGates,
    })
  ) {
    defs.push(GI_TAB);
  }

  // Remaining shared clinical tabs
  defs.push(...CORE_TAB_DEFS.slice(4));

  return defs;
}

function PatientDashboardContent() {
  const { user } = useAuth();
  const {
    patientId,
    patient,
    tabCounts,
    notesDirty,
    setNotesDirty,
    appointmentId,
    appointment,
    chartSummary,
  } = usePatientChart();
  const { departmentSlug } = useParams();

  const tabDefs = useMemo(
    () => buildTabDefs(patient, { user, appointment, chartSummary, departmentSlug }),
    [patient, user, appointment, chartSummary, departmentSlug],
  );
  const visibleTabs = useMemo(() => tabDefs.slice(0, VISIBLE_TAB_COUNT), [tabDefs]);
  const overflowTabs = useMemo(() => tabDefs.slice(VISIBLE_TAB_COUNT), [tabDefs]);
  const validTabIds = useMemo(() => new Set(tabDefs.map((t) => t.id)), [tabDefs]);
  const entVisible = validTabIds.has('ent');
  const giVisible = validTabIds.has('gastroenterology');
  const womensHealthVisible = validTabIds.has('womens-health');
  const growthChartVisible = validTabIds.has('growth-chart');

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() =>
    tabFromUrl &&
    [
      ...CORE_TAB_DEFS.map((t) => t.id),
      ...SPECIALTY_TAB_DEFS.map((t) => t.id),
      'growth-chart',
      'ent',
      'gastroenterology',
    ].includes(tabFromUrl)
      ? tabFromUrl
      : 'patient-summary',
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

  // Drop onto Summary when the active tab is hidden by dept / age / gender rules.
  useEffect(() => {
    if (!activeTab || validTabIds.has(activeTab)) return;
    setActiveTab('patient-summary');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tab');
    setSearchParams(nextParams, { replace: true });
  }, [activeTab, validTabIds, searchParams, setSearchParams]);

  const requestTabChange = useCallback(
    (tabId) => {
      if (tabId === activeTab) return;
      if (notesDirty && activeTab === 'notes') {
        setPendingTab(tabId);
        return;
      }
      setActiveTab(tabId);
      const nextParams = new URLSearchParams(searchParams);
      if (tabId === 'patient-summary') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', tabId);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [activeTab, notesDirty, searchParams, setSearchParams],
  );

  const confirmTabChange = () => {
    if (pendingTab) {
      setNotesDirty(false);
      setActiveTab(pendingTab);
      const nextParams = new URLSearchParams(searchParams);
      if (pendingTab === 'patient-summary') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', pendingTab);
      }
      setSearchParams(nextParams, { replace: true });
      setPendingTab(null);
    }
  };

  return (
    <div className="patient-chart flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <Tabs
        value={activeTab}
        onValueChange={requestTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="patient-chart-chrome shrink-0 border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <PatientChartHeader />
          <PatientChartEncounterBar />

          <div className="border-t border-border/80 bg-muted/30 px-3 py-2.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-1">
              <TabsList className="chart-tab-nav h-auto min-w-0 flex-1 justify-start overflow-x-auto border-0 bg-transparent p-0 shadow-none">
                {visibleTabs.map((tab) => {
                  const count = tab.countKey ? displayTabCounts[tab.countKey] : 0;
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'chart-tab-trigger flex-none normal-case tracking-normal',
                        tab.dirtyKey && notesDirty && 'ring-2 ring-amber-400/60 ring-offset-1',
                      )}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'ml-0.5 inline-flex min-w-[1.125rem] justify-center rounded-full px-1.5 text-[10px] font-bold leading-4',
                            'bg-amber-500 text-white',
                          )}
                          aria-label={`${count} pending`}
                        >
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
                {/* Keep overflow tabs registered with Radix Tabs while hidden from the bar. */}
                {overflowTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="hidden" tabIndex={-1} />
                ))}
              </TabsList>
              {overflowTabs.length > 0 && (
                <ChartTabOverflowMenu
                  tabs={overflowTabs}
                  activeTab={activeTab}
                  tabCounts={displayTabCounts}
                  notesDirty={notesDirty}
                  onSelect={requestTabChange}
                />
              )}
            </div>
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
              <TabsContent value="patient-summary" className="mt-0 focus-visible:outline-none">
                <PatientSummaryTab />
              </TabsContent>

              {growthChartVisible && (
                <TabsContent value="growth-chart" className="mt-0 focus-visible:outline-none">
                  <PatientGrowthChartTab />
                </TabsContent>
              )}

              <TabsContent value="chronic-conditions" className="mt-0 focus-visible:outline-none">
                <PatientChronicConditionsTab />
              </TabsContent>

              <TabsContent value="problems" className="mt-0 focus-visible:outline-none">
                <PatientProblemsTab />
              </TabsContent>

              {womensHealthVisible && (
                <TabsContent value="womens-health" className="mt-0 focus-visible:outline-none">
                  <PatientWomensHealthTab />
                </TabsContent>
              )}

              {validTabIds.has('orthopedics-msk') && (
                <TabsContent value="orthopedics-msk" className="mt-0 focus-visible:outline-none">
                  <PatientOrthopedicsMskTab />
                </TabsContent>
              )}

              {validTabIds.has('dermatology') && (
                <TabsContent value="dermatology" className="mt-0 focus-visible:outline-none">
                  <PatientDermatologyTab />
                </TabsContent>
              )}

              {validTabIds.has('ophthalmology') && (
                <TabsContent value="ophthalmology" className="mt-0 focus-visible:outline-none">
                  <PatientOphthalmologyTab />
                </TabsContent>
              )}

              {validTabIds.has('neurology') && (
                <TabsContent value="neurology" className="mt-0 focus-visible:outline-none">
                  <PatientNeurologyTab />
                </TabsContent>
              )}

              {validTabIds.has('psychiatry') && (
                <TabsContent value="psychiatry" className="mt-0 focus-visible:outline-none">
                  <PatientPsychiatryTab />
                </TabsContent>
              )}

              {validTabIds.has('endocrinology') && (
                <TabsContent value="endocrinology" className="mt-0 focus-visible:outline-none">
                  <PatientEndocrinologyTab />
                </TabsContent>
              )}

              {validTabIds.has('pulmonology') && (
                <TabsContent value="pulmonology" className="mt-0 focus-visible:outline-none">
                  <PatientPulmonologyTab />
                </TabsContent>
              )}

              {validTabIds.has('rheumatology') && (
                <TabsContent value="rheumatology" className="mt-0 focus-visible:outline-none">
                  <PatientRheumatologyTab />
                </TabsContent>
              )}

              {validTabIds.has('oncology-hematology') && (
                <TabsContent value="oncology-hematology" className="mt-0 focus-visible:outline-none">
                  <PatientOncologyHematologyTab />
                </TabsContent>
              )}

              {validTabIds.has('urology') && (
                <TabsContent value="urology" className="mt-0 focus-visible:outline-none">
                  <PatientUrologyTab />
                </TabsContent>
              )}

              {validTabIds.has('pmr-pt') && (
                <TabsContent value="pmr-pt" className="mt-0 focus-visible:outline-none">
                  <PatientPmrPtTab />
                </TabsContent>
              )}

              {validTabIds.has('nephrology') && (
                <TabsContent value="nephrology" className="mt-0 focus-visible:outline-none">
                  <PatientNephrologyTab />
                </TabsContent>
              )}

              {entVisible && (
                <TabsContent value="ent" className="mt-0 focus-visible:outline-none">
                  <PatientEntTab />
                </TabsContent>
              )}

              {giVisible && (
                <TabsContent value="gastroenterology" className="mt-0 focus-visible:outline-none">
                  <PatientGastroenterologyTab />
                </TabsContent>
              )}

              <TabsContent value="care-gaps" className="mt-0 focus-visible:outline-none">
                <PatientCareGapsTab />
              </TabsContent>

              <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
                <NotesTab onDirtyChange={setNotesDirty} />
              </TabsContent>

              <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
                <PatientOrderEntryTab patientId={patientId} appointmentId={appointmentId} />
              </TabsContent>

              <TabsContent value="medications" className="mt-0 focus-visible:outline-none">
                <PatientMedicationsTab />
              </TabsContent>

              <TabsContent value="emar" className="mt-0 focus-visible:outline-none">
                <PatientEmarTab />
              </TabsContent>

              <TabsContent value="referrals" className="mt-0 focus-visible:outline-none">
                <PatientReferralsTab />
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
            <Button variant="outline" onClick={() => setPendingTab(null)}>Stay</Button>
            <Button variant="destructive" onClick={confirmTabChange}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PatientDashboard() {
  return (
    <PatientChartProvider>
      <PatientDashboardContent />
    </PatientChartProvider>
  );
}
