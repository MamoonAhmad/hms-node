import { NurseAssessmentWorkspace } from '@/pages/nurses/nurse-dashboard/NurseAssessmentWorkspace';
import { IntakeProvider } from './intake/IntakeContext';

export function PatientIntakeTab() {
  return (
    <IntakeProvider>
      <NurseAssessmentWorkspace embedded idPrefix="intake-" />
    </IntakeProvider>
  );
}
