import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChartTabShell, EmptyState, SectionCard, StatusBadge } from '@/pages/patient-dashboard/components/chart-ui';
import { orDash } from '../patientChartHelpers';

export { ChartTabShell, EmptyState, SectionCard, StatusBadge };

export function Field({ label, value, className, mono }) {
  return (
    <div className={cn('min-w-0 space-y-1 rounded-xl bg-muted/30 px-3.5 py-3', className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('truncate text-sm font-medium text-foreground', mono && 'font-mono')}>{orDash(value)}</dd>
    </div>
  );
}

export function KeyValueGrid({ children, columns = 2, className }) {
  const cols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];
  return <dl className={cn('grid gap-3', cols, className)}>{children}</dl>;
}

export function SimpleTable({ columns, rows, renderRow, empty, keyField = 'id' }) {
  if (!rows?.length) {
    return typeof empty === 'string' ? <EmptyState title={empty} /> : empty;
  }
  return (
    <div className="chart-table-wrap overflow-x-auto">
      <Table>
        <TableHeader sticky>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key || c.label} className={c.className}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={row[keyField] ?? i}>{renderRow(row, i)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
