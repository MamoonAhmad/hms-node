import { NurseAssessmentWorkspace } from './NurseAssessmentWorkspace';

export function NurseDashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Patient&apos;s Nurse Assessment</h1>
        <p className="text-muted-foreground">Manage nurse assessment details</p>
      </div>
      <NurseAssessmentWorkspace />
    </div>
  );
}
