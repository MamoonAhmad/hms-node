import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PatientDashboard } from '@/pages/patient-dashboard/PatientDashboard';
import { DepartmentEncountersList } from './DepartmentEncountersList';
import { DepartmentEncounterDashboard } from './specialty/DepartmentEncounterDashboard';
import { getSpecialtyEncounterConfig } from './specialty/specialtyEncounterConfig';
import {
  departmentEncounterMenuLabel,
  getDepartmentBySlug,
} from './departmentEncounterDepartments';

/** Specialty workspaces use full dynamic department tabs. */
const SPECIALTY_DASHBOARD_SLUGS = new Set([
  'internal-medicine',
  'pediatrics',
  'ob-gyn',
  'cardiology',
  'orthopedics',
  'dermatology',
  'ophthalmology',
  'ent',
  'gastroenterology',
  'endocrinology',
  'pulmonology',
  'nephrology',
  'neurology',
  'psychiatry',
  'rheumatology',
  'oncology-hematology',
  'pmr-pt',
]);

export function DepartmentEncounterDetailPage() {
  const { departmentSlug, patientId } = useParams();
  const department = getDepartmentBySlug(departmentSlug);

  if (!department) {
    return (
      <div className="space-y-4 p-5 lg:p-7">
        <h1 className="text-2xl font-bold text-foreground">Department not found</h1>
        <p className="text-muted-foreground">
          No encounter detail page is configured for this department.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!patientId) {
    return <DepartmentEncountersList department={department} />;
  }

  const useSpecialtyDashboard =
    SPECIALTY_DASHBOARD_SLUGS.has(departmentSlug) ||
    Boolean(getSpecialtyEncounterConfig(departmentSlug));

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div className="sr-only">{departmentEncounterMenuLabel(department.name)}</div>
      {useSpecialtyDashboard ? <DepartmentEncounterDashboard /> : <PatientDashboard />}
    </div>
  );
}
