import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { patientApi } from '@/services/api';
import {
  formatGenderLabel,
  formatPatientDisplayName,
  formatDateTime,
} from '@/components/patients/listing/patientListUtils';
import { formatProviderListName } from '@/lib/appointmentUtils';

function formatAppointmentDateTime(encounter) {
  if (!encounter?.appointmentDate) return '—';
  const datePart = new Date(encounter.appointmentDate);
  if (Number.isNaN(datePart.getTime())) return '—';
  if (encounter.appointmentTime) {
    const [hours, minutes] = String(encounter.appointmentTime).split(':');
    if (hours !== undefined) {
      datePart.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
    }
  }
  return formatDateTime(datePart);
}

export function PatientEncountersPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [patientRes, encountersRes] = await Promise.all([
        patientApi.getById(patientId),
        patientApi.getEncounters(patientId),
      ]);
      setPatient(patientRes?.data || null);
      setEncounters(Array.isArray(encountersRes?.data) ? encountersRes.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load encounters');
      setPatient(null);
      setEncounters([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patientName = useMemo(() => formatPatientDisplayName(patient), [patient]);
  const patientGender = useMemo(() => formatGenderLabel(patient?.gender), [patient]);
  const patientMrn = patient?.mrn || '—';

  const handleRowClick = (encounter) => {
    const query = encounter?.id ? `?appointmentId=${encodeURIComponent(encounter.id)}` : '';
    navigate(`/patient-dashboard/${patientId}${query}`);
  };

  return (
    <div className="ehr-page">
      <PageHeader
        title="Patient Encounters"
        description={patient ? `${patientName} · MRN ${patientMrn}` : 'Encounter history'}
        breadcrumbs={
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => navigate('/patients')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Patients
            </Button>
            <span>/ Encounters</span>
          </span>
        }
      />

      <div className="content-panel overflow-hidden">
        {error && (
          <p className="p-4 text-sm text-destructive border-b">{error}</p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Encounter Number</TableHead>
              <TableHead>Patient MRN</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Provider Name</TableHead>
              <TableHead>Appointment Date and Time</TableHead>
              <TableHead>Visit Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Loading encounters...
                </TableCell>
              </TableRow>
            ) : encounters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No encounters found for this patient.
                </TableCell>
              </TableRow>
            ) : (
              encounters.map((encounter) => (
                <TableRow
                  key={encounter.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(encounter)}
                >
                  <TableCell className="font-mono text-sm">
                    {encounter.encounterNumber || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {encounter.patient?.mrn || patientMrn}
                  </TableCell>
                  <TableCell>
                    {formatPatientDisplayName(encounter.patient) || patientName}
                  </TableCell>
                  <TableCell>
                    {formatGenderLabel(encounter.patient?.gender) || patientGender}
                  </TableCell>
                  <TableCell>
                    {formatProviderListName(encounter.providerRef) || encounter.provider || '—'}
                  </TableCell>
                  <TableCell>{formatAppointmentDateTime(encounter)}</TableCell>
                  <TableCell>{encounter.status || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
