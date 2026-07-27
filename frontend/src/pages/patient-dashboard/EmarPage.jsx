import { useParams, useSearchParams } from 'react-router-dom';
import { PatientChartProvider } from './PatientChartContext';
import { PatientEmarTab } from './PatientEmarTab';
import { PatientChartHeader } from './components/PatientChartHeader';
import { PatientChartEncounterBar } from './components/PatientChartEncounterBar';

function EmarPageContent() {
  return (
    <div className="patient-chart flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="patient-chart-chrome shrink-0 border-b border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <PatientChartHeader />
        <PatientChartEncounterBar />
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <PatientEmarTab />
        </div>
      </div>
    </div>
  );
}

export function EmarPage() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  return (
    <PatientChartProvider key={`${patientId}-${appointmentId || ''}`}>
      <EmarPageContent />
    </PatientChartProvider>
  );
}
