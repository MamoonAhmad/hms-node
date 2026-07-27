import {
  Activity,
  AlertCircle,
  UtensilsCrossed,
  Heart,
  Pill,
  Brain,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FallRiskSection,
  definition as fallRiskDefinition,
} from '@/pages/nurses/nurse-dashboard/safety/FallRiskSection';
import {
  SuicideAssessmentSection,
  definition as suicideDefinition,
} from '@/pages/nurses/nurse-dashboard/safety/SuicideAssessmentSection';
import {
  HungerScreeningSection,
  definition as hungerDefinition,
} from '@/pages/nurses/nurse-dashboard/safety/HungerScreeningSection';
import {
  PHQ9Section,
  definition as phq9Definition,
} from '@/pages/nurses/nurse-dashboard/safety/PHQ9Section';
import {
  DAST10Section,
  definition as dast10Definition,
} from '@/pages/nurses/nurse-dashboard/safety/DAST10Section';
import {
  GAD7Section,
  definition as gad7Definition,
} from '@/pages/nurses/nurse-dashboard/safety/GAD7Section';
import {
  NIHStrokeScaleSection,
  definition as nihStrokeDefinition,
} from '@/pages/nurses/nurse-dashboard/safety/NIHStrokeScaleSection';
import {
  PainAssessmentSection,
  definition as painDefinition,
} from '@/pages/nurses/nurse-dashboard/safety/PainAssessmentSection';

// Ordered list of the screenings shown on the Intake → Patient Screening tab.
// Each entry pairs a scoring `definition` (single source of truth for questions,
// scoring, result interpretation and validation) with its presentational Component.
export const SCREENINGS = [
  { id: 'fall-risk', icon: Activity, Component: FallRiskSection, definition: fallRiskDefinition },
  { id: 'suicide', icon: AlertCircle, Component: SuicideAssessmentSection, definition: suicideDefinition },
  { id: 'hunger', icon: UtensilsCrossed, Component: HungerScreeningSection, definition: hungerDefinition },
  { id: 'phq9', icon: Heart, Component: PHQ9Section, definition: phq9Definition },
  { id: 'dast10', icon: Pill, Component: DAST10Section, definition: dast10Definition },
  { id: 'gad7', icon: Brain, Component: GAD7Section, definition: gad7Definition },
  { id: 'nih-stroke', icon: Activity, Component: NIHStrokeScaleSection, definition: nihStrokeDefinition },
  { id: 'pain', icon: SlidersHorizontal, Component: PainAssessmentSection, definition: painDefinition },
];
