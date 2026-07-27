import { AlertTriangle } from 'lucide-react';
import { ChartTabShell, EmptyState, SimpleTable, StatusBadge, TableCell } from './_shared';
import { formatDate, isHighSeverity } from '../patientChartHelpers';

export function AllergiesSection({ summary }) {
  const allergies = summary?.allergies || [];
  const nkda = summary?.noKnownDrugAllergies;

  return (
    <ChartTabShell title="Allergies" description="All recorded allergy and intolerance information.">
      {nkda && !allergies.length ? (
        <EmptyState icon={AlertTriangle} title="No Known Allergies" description="This patient is documented as having no known allergies (NKDA)." />
      ) : (
        <SimpleTable
          columns={[
            { label: 'Allergen' },
            { label: 'Type' },
            { label: 'Reaction' },
            { label: 'Severity' },
            { label: 'Onset' },
            { label: 'Status' },
            { label: 'Comment' },
          ]}
          rows={allergies}
          empty={<EmptyState icon={AlertTriangle} title="Allergy status not reviewed." description="No allergies have been recorded or reviewed for this patient." />}
          renderRow={(a) => (
            <>
              <TableCell className="font-medium">{a.allergenName}</TableCell>
              <TableCell>{a.allergyType || a.type || '—'}</TableCell>
              <TableCell>{a.reaction || '—'}</TableCell>
              <TableCell>
                <span className={isHighSeverity(a.severity) ? 'font-semibold text-red-600 dark:text-red-400' : ''}>
                  {a.severity || '—'}
                </span>
              </TableCell>
              <TableCell>{formatDate(a.onsetDate)}</TableCell>
              <TableCell><StatusBadge status={a.status} /></TableCell>
              <TableCell className="max-w-xs truncate">{a.comment || '—'}</TableCell>
            </>
          )}
        />
      )}
    </ChartTabShell>
  );
}
