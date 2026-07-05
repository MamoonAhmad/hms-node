import { useState, useCallback, useEffect } from 'react';
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
import { PatientChartProvider, usePatientChart } from './PatientChartContext';
import { PatientChartHeader } from './components/PatientChartHeader';
import { PatientChartEncounterBar } from './components/PatientChartEncounterBar';
import { PatientChartStoryboard } from './components/PatientChartStoryboard';
import { PatientSummaryTab } from './PatientSummaryTab';
import { PatientIntakeTab } from './PatientIntakeTab';
import { SOAPNotesTab } from './SOAPNotesTab';
import { PatientCheckoutTab } from './PatientCheckoutTab';
import { PatientProfileTab } from './PatientProfileTab';
import { PatientOrderEntryTab } from './PatientOrderEntryTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { PatientResultsTab } from './PatientResultsTab';

const TAB_DEFS = [
  { id: 'patient-summary', label: 'Summary' },
  { id: 'intake', label: 'Intake' },
  { id: 'notes', label: 'SOAP Notes', dirtyKey: true },
  { id: 'orders', label: 'Orders', countKey: 'pendingOrders' },
  { id: 'prescriptions', label: 'Rx' },
  { id: 'results', label: 'Results', countKey: 'pendingResults' },
  { id: 'patient-checkout', label: 'Checkout' },
  { id: 'patient-profile', label: 'Profile' },
];

const STORYBOARD_TABS = new Set(['notes', 'orders', 'prescriptions', 'results', 'patient-checkout']);

function PatientDashboardContent() {
  const {
    patientId,
    tabCounts,
    notesDirty,
    setNotesDirty,
    appointmentId,
  } = usePatientChart();

  const [activeTab, setActiveTab] = useState('patient-summary');
  const [pendingTab, setPendingTab] = useState(null);
  const [storyboardOpen, setStoryboardOpen] = useState(true);

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

  const requestTabChange = useCallback(
    (tabId) => {
      if (tabId === activeTab) return;
      if (notesDirty && activeTab === 'notes') {
        setPendingTab(tabId);
        return;
      }
      setActiveTab(tabId);
    },
    [activeTab, notesDirty],
  );

  const confirmTabChange = () => {
    if (pendingTab) {
      setNotesDirty(false);
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  return (
    <div className="patient-chart flex min-h-[calc(100vh-3.5rem)] flex-col">
      <Tabs
        value={activeTab}
        onValueChange={requestTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="patient-chart-chrome shrink-0 border-b border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <PatientChartHeader />
          <PatientChartEncounterBar />

          <div className="border-t border-border bg-muted/40 px-3 py-2 sm:px-4">
            <TabsList className="h-auto w-full min-w-0 justify-start gap-1 overflow-x-auto rounded-lg border-0 bg-transparent p-0 shadow-none">
              {TAB_DEFS.map((tab) => {
                const count = tab.countKey ? tabCounts[tab.countKey] : 0;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'h-9 shrink-0 flex-none rounded-lg px-3.5 py-2 text-sm font-semibold normal-case tracking-normal',
                      'data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm',
                      tab.dirtyKey && notesDirty && 'ring-2 ring-amber-400/50',
                    )}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1.5 inline-flex min-w-[1.125rem] justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 bg-background">
          {showStoryboard && (
            <PatientChartStoryboard
              open={storyboardOpen}
              onOpenChange={setStoryboardOpen}
              onNavigateTab={requestTabChange}
            />
          )}

          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
              <TabsContent value="patient-summary" className="mt-0 focus-visible:outline-none">
                <PatientSummaryTab />
              </TabsContent>

              <TabsContent value="intake" className="mt-0 focus-visible:outline-none">
                <PatientIntakeTab />
              </TabsContent>

              <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
                <SOAPNotesTab onDirtyChange={setNotesDirty} />
              </TabsContent>

              <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
                <PatientOrderEntryTab patientId={patientId} appointmentId={appointmentId} />
              </TabsContent>

              <TabsContent value="prescriptions" className="mt-0 focus-visible:outline-none">
                <PrescriptionsTab />
              </TabsContent>

              <TabsContent value="results" className="mt-0 focus-visible:outline-none">
                <PatientResultsTab />
              </TabsContent>

              <TabsContent value="patient-checkout" className="mt-0 focus-visible:outline-none">
                <PatientCheckoutTab />
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
              You have unsaved SOAP note changes. Leave without saving?
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
