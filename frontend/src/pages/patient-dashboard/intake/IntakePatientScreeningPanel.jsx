import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Brain,
  Heart,
  Pill,
  SlidersHorizontal,
  UtensilsCrossed,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FallRiskSection } from '@/pages/nurses/nurse-dashboard/safety/FallRiskSection';
import { SuicideAssessmentSection } from '@/pages/nurses/nurse-dashboard/safety/SuicideAssessmentSection';
import { HungerScreeningSection } from '@/pages/nurses/nurse-dashboard/safety/HungerScreeningSection';
import { PHQ9Section } from '@/pages/nurses/nurse-dashboard/safety/PHQ9Section';
import { DAST10Section } from '@/pages/nurses/nurse-dashboard/safety/DAST10Section';
import { GAD7Section } from '@/pages/nurses/nurse-dashboard/safety/GAD7Section';
import { NIHStrokeScaleSection } from '@/pages/nurses/nurse-dashboard/safety/NIHStrokeScaleSection';
import { PainAssessmentSection } from '@/pages/nurses/nurse-dashboard/safety/PainAssessmentSection';

const SCREENING_ITEMS = [
  { id: 'fall-risk', name: 'Fall Risk', icon: Activity, component: <FallRiskSection /> },
  { id: 'suicide', name: 'Suicide Assessment', icon: AlertCircle, component: <SuicideAssessmentSection /> },
  { id: 'hunger', name: 'Hunger Screening', icon: UtensilsCrossed, component: <HungerScreeningSection /> },
  { id: 'phq9', name: 'PHQ-9 Depression Screening', icon: Heart, component: <PHQ9Section /> },
  { id: 'dast10', name: 'Drug Abuse Screening (DAST-10)', icon: Pill, component: <DAST10Section /> },
  { id: 'gad7', name: 'GAD-7 (Anxiety and Severity)', icon: Brain, component: <GAD7Section /> },
  { id: 'nih-stroke', name: 'NIH Stroke Scale', icon: Activity, component: <NIHStrokeScaleSection /> },
  { id: 'pain', name: 'Pain Assessment', icon: SlidersHorizontal, component: <PainAssessmentSection /> },
];

export function IntakePatientScreeningPanel() {
  const [openAccordions, setOpenAccordions] = useState([]);

  return (
    <Accordion
      type="multiple"
      value={openAccordions}
      onValueChange={setOpenAccordions}
      className="w-full space-y-1"
    >
      {SCREENING_ITEMS.map(({ id, name, icon: Icon, component }) => (
        <AccordionItem key={id} value={id} className="rounded-lg border bg-card px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2 font-semibold">
              {Icon && (
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              {name}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">{component}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
