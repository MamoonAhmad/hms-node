import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { intakeApi } from '@/services/api';
import { SCREENING_TYPES } from '@/pages/patient-dashboard/intake/intakeConstants';
import { usePatientChart } from './PatientChartContext';

export function ScreeningScoresSection() {
  const { patientId, appointmentId, isSampleChart } = usePatientChart();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId || isSampleChart) return;
    let cancelled = false;
    setLoading(true);
    intakeApi
      .getScreenings(patientId, { appointmentId: appointmentId || undefined })
      .then((res) => {
        if (!cancelled) setRows(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, appointmentId, isSampleChart]);

  if (isSampleChart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screening scores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Screening scores from intake will appear here for live patient charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestByType = Object.keys(SCREENING_TYPES).reduce((acc, type) => {
    const match = rows.find((r) => r.screeningType === type);
    if (match) acc[type] = match;
    return acc;
  }, {});

  const displayRows = Object.values(latestByType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Screening scores</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading screening scores…</p>
        ) : displayRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No screening scores saved from intake yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Screening</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Recorded by</TableHead>
                  <TableHead>Date / time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{SCREENING_TYPES[row.screeningType] || row.screeningType}</TableCell>
                    <TableCell>
                      {row.score != null
                        ? `${row.score}${row.maxScore != null ? ` / ${row.maxScore}` : ''}`
                        : '—'}
                    </TableCell>
                    <TableCell>{row.createdByName || '—'}</TableCell>
                    <TableCell>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
