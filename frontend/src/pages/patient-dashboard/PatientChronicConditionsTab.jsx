import { IntakeProvider } from './intake/IntakeContext';
import { ChronicConditionsSection } from './intake/sections/ChronicConditionsSection';
import { ChartTabShell } from './components/chart-ui';
import { usePatientChart } from './PatientChartContext';

function ChronicConditionsWorkspace() {
  const { patient, loading, error, refreshChart } = usePatientChart();
  const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');

  return (
    <ChartTabShell
      eyebrow="Clinical"
      title="Chronic Conditions"
      description={
        name
          ? `Manage chronic disease templates and encounter documentation for ${name}.`
          : 'Manage chronic disease templates and encounter documentation.'
      }
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
    >
      <ChronicConditionsSection />
    </ChartTabShell>
  );
}

export function PatientChronicConditionsTab() {
  return (
    <IntakeProvider>
      <ChronicConditionsWorkspace />
    </IntakeProvider>
  );
}
