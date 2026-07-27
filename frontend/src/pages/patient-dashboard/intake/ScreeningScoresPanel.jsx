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
import { intakeApi } from '@/services/api/intake.api';
import { SCREENING_LABELS } from '../intake/intakeConstants';

export function ScreeningScoresPanel({ patientId, encounterId, isSampleChart }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId || isSampleChart) {
      setScores([]);
      return;
    }
    setLoading(true);
    intakeApi
      .getBundle(patientId, { encounterId })
      .then((res) => {
        // Records come newest-first; keep only the latest version per screening.
        const seen = new Set();
        const records = (res.data?.records || [])
          .filter((r) => r.sectionType?.startsWith('screening_'))
          .filter((r) => {
            if (seen.has(r.sectionType)) return false;
            seen.add(r.sectionType);
            return true;
          });
        setScores(records);
      })
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [patientId, encounterId, isSampleChart]);

  if (isSampleChart) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Screening Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a live patient to view saved screening scores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Screening Scores</CardTitle>
        <p className="text-sm text-muted-foreground">Scores saved from the Intake → Patient Screening tab.</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading screening scores...</p>
        ) : scores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No screening scores recorded for this encounter.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Screening</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {SCREENING_LABELS[r.sectionType] || r.sectionType}
                  </TableCell>
                  <TableCell>{r.score ?? '—'}</TableCell>
                  <TableCell>{r.createdByName || '—'}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
