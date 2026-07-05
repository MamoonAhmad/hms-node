import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientChart } from '@/pages/patient-dashboard/tabs/PatientChart';

export function PatientChartPage() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={appointmentId ? `/encounters-work-list` : '/patients'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Patient Chart</h1>
          {appointmentId && (
            <p className="text-sm text-muted-foreground">Encounter {appointmentId}</p>
          )}
        </div>
        <Button variant="default" size="sm" className="ml-auto" asChild>
          <Link to={`/patient-dashboard/${patientId}${appointmentId ? `?appointmentId=${appointmentId}` : ''}`}>
            Open workspace
          </Link>
        </Button>
      </div>
      <PatientChart patientId={patientId} />
    </div>
  );
}
