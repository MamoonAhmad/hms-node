import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntake } from './IntakeContext';
import { ChiefComplaintHpiSection } from './sections/ChiefComplaintHpiSection';
import { VitalsIntakeSection } from './sections/VitalsIntakeSection';
import { AllergiesIntakeSection } from './sections/AllergiesIntakeSection';
import { MedicationReconciliationSection } from './sections/MedicationReconciliationSection';
import { ROSIntakeSection } from './sections/ROSIntakeSection';
import { MedicationHistoryIntakeSection } from './sections/MedicationHistoryIntakeSection';
import { ImmunizationIntakeSection } from './sections/ImmunizationIntakeSection';
import { SurgicalHistorySection } from './sections/SurgicalHistorySection';
import { SocialHistoryIntakeSection } from './sections/SocialHistoryIntakeSection';
import { FamilyHistorySection } from './sections/FamilyHistorySection';
import { MenstrualAssessmentSection } from './sections/MenstrualAssessmentSection';
import { HospitalEdVisitSection } from './sections/HospitalEdVisitSection';
import { IntakeSignatureSection } from './sections/IntakeSignatureSection';
import { SCREENINGS } from './screeningDefinitions';
import { ScreeningAccordionItem } from './components/ScreeningAccordionItem';
import { IntakeSectionJumpSelect } from './components/IntakeSectionNav';
import { ChartTabShell } from '../components/chart-ui';

export function IntakeWorkspace({
  embedded = true,
  mode = 'nurse-assessment',
  onModeChange,
}) {
  const { loading, error } = useIntake();

  if (loading) {
    return (
      <ChartTabShell title="Intake" description="Nurse assessment and patient screening for this encounter.">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading intake data…</span>
        </div>
      </ChartTabShell>
    );
  }

  return (
    <ChartTabShell
      title="Intake"
      description="Complete nurse assessment and patient screening forms for this encounter."
      error={error}
      className={embedded ? 'space-y-4' : undefined}
    >
      <Tabs value={mode} onValueChange={onModeChange} className="w-full">
        <TabsList className={cn('grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1', embedded ? 'max-w-full' : 'max-w-xl')}>
          <TabsTrigger value="nurse-assessment" className="rounded-lg data-[state=active]:shadow-sm">
            Nurse Assessment
          </TabsTrigger>
          <TabsTrigger value="patient-screening" className="rounded-lg data-[state=active]:shadow-sm">
            Patient Screening
          </TabsTrigger>
        </TabsList>

        <IntakeSectionJumpSelect mode={mode} className="mt-4" />

        <TabsContent value="nurse-assessment" className="mt-6 space-y-6">
          <ChiefComplaintHpiSection />
          <VitalsIntakeSection />
          <AllergiesIntakeSection />
          <MedicationReconciliationSection />
          <ROSIntakeSection />
          <MedicationHistoryIntakeSection />
          <ImmunizationIntakeSection />
          <SurgicalHistorySection />
          <SocialHistoryIntakeSection />
          <FamilyHistorySection />
          <MenstrualAssessmentSection />
          <HospitalEdVisitSection />
          <IntakeSignatureSection />
        </TabsContent>

        <TabsContent value="patient-screening" className="mt-6">
          <Accordion type="multiple" className="w-full space-y-2">
            {SCREENINGS.map((item) => (
              <ScreeningAccordionItem key={item.id} item={item} />
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>
    </ChartTabShell>
  );
}
