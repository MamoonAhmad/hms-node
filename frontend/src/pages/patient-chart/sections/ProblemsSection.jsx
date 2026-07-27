import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { ChartTabShell, EmptyState, SectionCard, SimpleTable, StatusBadge, TableCell } from './_shared';
import { formatDate } from '../patientChartHelpers';

function bucketFor(problem) {
  const s = (problem.status || problem.clinicalStatus || '').toLowerCase();
  if (s.includes('resolved')) return 'Resolved';
  if (s.includes('inactive')) return 'Inactive';
  if (problem.chronic || s.includes('chronic')) return 'Chronic';
  return 'Active';
}

const BUCKETS = ['Active', 'Chronic', 'Resolved', 'Inactive'];

export function ProblemsSection({ summary }) {
  const problems = summary?.problems || [];
  const grouped = useMemo(() => {
    const g = { Active: [], Chronic: [], Resolved: [], Inactive: [] };
    problems.forEach((p) => g[bucketFor(p)].push(p));
    return g;
  }, [problems]);

  return (
    <ChartTabShell title="Problems" description="Diagnosis and problem list grouped by clinical status.">
      {problems.length ? (
        <div className="space-y-4">
          {BUCKETS.map((bucket) =>
            grouped[bucket].length ? (
              <SectionCard
                key={bucket}
                title={`${bucket} Problems`}
                icon={AlertCircle}
                accent={bucket === 'Active' ? 'info' : 'default'}
                actions={<span className="text-xs text-muted-foreground">{grouped[bucket].length}</span>}
              >
                <SimpleTable
                  columns={[
                    { label: 'Code' },
                    { label: 'Description' },
                    { label: 'Onset' },
                    { label: 'Resolved' },
                    { label: 'Clinical status' },
                    { label: 'Verification' },
                    { label: 'Status' },
                  ]}
                  rows={grouped[bucket]}
                  renderRow={(p) => (
                    <>
                      <TableCell className="font-mono text-xs">{p.icd10Code || p.problemCode || '—'}</TableCell>
                      <TableCell className="font-medium">{p.diagnosisDescription || p.problemDescription}</TableCell>
                      <TableCell>{formatDate(p.onsetDate)}</TableCell>
                      <TableCell>{formatDate(p.resolvedDate)}</TableCell>
                      <TableCell>{p.clinicalStatus || '—'}</TableCell>
                      <TableCell>{p.verificationStatus || p.verification || '—'}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                    </>
                  )}
                />
              </SectionCard>
            ) : null,
          )}
        </div>
      ) : (
        <EmptyState icon={AlertCircle} title="No problems recorded." />
      )}
    </ChartTabShell>
  );
}
