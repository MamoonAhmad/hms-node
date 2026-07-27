import { IntakeProvider } from './intake/IntakeContext';
import { GrowthChartWorkspace } from './growth-chart/GrowthChartWorkspace';

export function PatientGrowthChartTab() {
  return (
    <IntakeProvider>
      <GrowthChartWorkspace />
    </IntakeProvider>
  );
}
