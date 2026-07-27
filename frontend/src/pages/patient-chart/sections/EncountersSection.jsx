import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartTabShell, EmptyState, SimpleTable, StatusBadge, TableCell } from './_shared';
import { formatDate } from '../patientChartHelpers';

export function EncountersSection({ patient, appointments, searchTerm }) {
  const rows = useMemo(() => {
    let data = appointments || [];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      data = data.filter((a) =>
        [a.encounterNumber, a.provider, a.appointmentType, a.visitReason, a.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(t)),
      );
    }
    return data;
  }, [appointments, searchTerm]);

  return (
    <ChartTabShell
      title="Encounters"
      description="All clinical encounters. Signed documentation is read-only except through an addendum."
    >
      <SimpleTable
        columns={[
          { label: 'Encounter #' },
          { label: 'Date' },
          { label: 'Time' },
          { label: 'Type' },
          { label: 'Provider' },
          { label: 'Chief complaint' },
          { label: 'Status' },
          { label: 'Actions' },
        ]}
        rows={rows}
        empty={<EmptyState icon={Stethoscope} title="No encounters found." />}
        renderRow={(a) => (
          <>
            <TableCell className="font-mono text-xs">{a.encounterNumber || '—'}</TableCell>
            <TableCell>{formatDate(a.appointmentDate)}</TableCell>
            <TableCell>{a.appointmentTime || '—'}</TableCell>
            <TableCell>{a.appointmentType || '—'}</TableCell>
            <TableCell>{a.provider || '—'}</TableCell>
            <TableCell className="max-w-xs truncate">{a.visitReason || '—'}</TableCell>
            <TableCell><StatusBadge status={a.status} /></TableCell>
            <TableCell>
              <Button variant="outline" size="sm" className="h-7" asChild>
                <Link to={`/patient-dashboard/${patient.id}?appointmentId=${a.id}`}>Open</Link>
              </Button>
            </TableCell>
          </>
        )}
      />
    </ChartTabShell>
  );
}
