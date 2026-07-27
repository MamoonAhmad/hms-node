import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartTabShell, EmptyState, SimpleTable, StatusBadge, TableCell } from './_shared';
import { formatDate } from '../patientChartHelpers';
import { CANONICAL_APPOINTMENT_STATUSES, normalizeAppointmentStatus } from '@/lib/appointmentStatusWorkflow';

const STATUS_FILTERS = ['All', ...CANONICAL_APPOINTMENT_STATUSES];

export function AppointmentsSection({ patient, appointments, searchTerm }) {
  const [status, setStatus] = useState('All');

  const rows = useMemo(() => {
    let data = appointments || [];
    if (status !== 'All') {
      data = data.filter((a) => normalizeAppointmentStatus(a.status) === status);
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      data = data.filter((a) =>
        [a.provider, a.appointmentType, a.visitReason, a.department, a.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(t)),
      );
    }
    return data;
  }, [appointments, status, searchTerm]);

  return (
    <ChartTabShell
      title="Appointments"
      description="Past, current, and future appointments for this patient."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to={`/appointments/patient/${patient.id}`}>Appointment History</Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            className="h-7"
            onClick={() => setStatus(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <SimpleTable
        columns={[
          { label: 'Date' },
          { label: 'Time' },
          { label: 'Provider' },
          { label: 'Department' },
          { label: 'Type' },
          { label: 'Reason' },
          { label: 'Status' },
        ]}
        rows={rows}
        empty={<EmptyState icon={CalendarClock} title="No appointments found." />}
        renderRow={(a) => (
          <>
            <TableCell>{formatDate(a.appointmentDate)}</TableCell>
            <TableCell>{a.appointmentTime || '—'}</TableCell>
            <TableCell>{a.provider || '—'}</TableCell>
            <TableCell>{a.department || '—'}</TableCell>
            <TableCell>{a.appointmentType || '—'}</TableCell>
            <TableCell className="max-w-xs truncate">{a.visitReason || '—'}</TableCell>
            <TableCell><StatusBadge status={normalizeAppointmentStatus(a.status)} /></TableCell>
          </>
        )}
      />
    </ChartTabShell>
  );
}
