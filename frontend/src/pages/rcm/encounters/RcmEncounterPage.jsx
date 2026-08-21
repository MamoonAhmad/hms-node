import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { RcmEncounterProvider, useRcmEncounter } from './RcmEncounterContext';
import { RcmEncounterHeader } from './components/RcmEncounterHeader';
import { RcmEncounterStatusBar } from './components/RcmEncounterStatusBar';
import { RCM_ENCOUNTER_TABS } from './rcmEncounterConstants';
import { SummaryTab } from './tabs/SummaryTab';
import { DemographicsTab } from './tabs/DemographicsTab';
import { CoverageTab } from './tabs/CoverageTab';
import { DiagnosesTab } from './tabs/DiagnosesTab';
import { ChargesTab } from './tabs/ChargesTab';
import { ClaimTab } from './tabs/ClaimTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { FollowUpTab } from './tabs/FollowUpTab';

function RcmEncounterContent() {
  const { loading, error, encounter } = useRcmEncounter();
  const [activeTab, setActiveTab] = useState('summary');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading RCM encounter…
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-8 text-center">
        <h1 className="text-xl font-semibold">Unable to open encounter</h1>
        <p className="text-sm text-destructive">{error || 'Encounter not found'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <RcmEncounterHeader />
          <RcmEncounterStatusBar />
          <div className="border-t border-border bg-muted/40 px-3 py-2 sm:px-4">
            <TabsList className="h-auto w-full min-w-0 justify-start gap-1 overflow-x-auto rounded-lg border-0 bg-transparent p-0 shadow-none">
              {RCM_ENCOUNTER_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'h-9 shrink-0 flex-none rounded-lg px-3.5 py-2 text-sm font-semibold normal-case tracking-normal',
                    'data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm',
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            <TabsContent value="summary" className="mt-0 focus-visible:outline-none">
              <SummaryTab />
            </TabsContent>
            <TabsContent value="demographics" className="mt-0 focus-visible:outline-none">
              <DemographicsTab />
            </TabsContent>
            <TabsContent value="coverage" className="mt-0 focus-visible:outline-none">
              <CoverageTab />
            </TabsContent>
            <TabsContent value="diagnoses" className="mt-0 focus-visible:outline-none">
              <DiagnosesTab />
            </TabsContent>
            <TabsContent value="charges" className="mt-0 focus-visible:outline-none">
              <ChargesTab />
            </TabsContent>
            <TabsContent value="claim" className="mt-0 focus-visible:outline-none">
              <ClaimTab />
            </TabsContent>
            <TabsContent value="payments" className="mt-0 focus-visible:outline-none">
              <PaymentsTab />
            </TabsContent>
            <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
              <DocumentsTab />
            </TabsContent>
            <TabsContent value="follow-up" className="mt-0 focus-visible:outline-none">
              <FollowUpTab />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

export function RcmEncounterPage() {
  return (
    <RcmEncounterProvider>
      <RcmEncounterContent />
    </RcmEncounterProvider>
  );
}
