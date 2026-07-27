import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartTabShell, EmptyState, SimpleTable, StatusBadge, TableCell } from './_shared';
import { formatDateTime } from '../patientChartHelpers';

export function OrdersSection({ orders, searchTerm }) {
  const categories = useMemo(() => {
    const set = new Set((orders || []).map((o) => o.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [orders]);
  const [category, setCategory] = useState('All');

  const rows = useMemo(() => {
    let data = orders || [];
    if (category !== 'All') data = data.filter((o) => o.category === category);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      data = data.filter((o) =>
        [o.procedureName, o.orderName, o.category, o.status, o.orderedBy]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(t)),
      );
    }
    return data;
  }, [orders, category, searchTerm]);

  return (
    <ChartTabShell title="Orders" description="All orders placed for this patient across categories.">
      {categories.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => setCategory(c)}>
              {c}
            </Button>
          ))}
        </div>
      )}

      <SimpleTable
        columns={[
          { label: 'Order' },
          { label: 'Category' },
          { label: 'Order date' },
          { label: 'Ordered by' },
          { label: 'Priority' },
          { label: 'Status' },
        ]}
        rows={rows}
        empty={<EmptyState icon={ClipboardList} title="No orders found." />}
        renderRow={(o) => (
          <>
            <TableCell className="font-medium">{o.procedureName || o.orderName}</TableCell>
            <TableCell>{o.category || '—'}</TableCell>
            <TableCell>{formatDateTime(o.orderDateTime || o.orderedDate)}</TableCell>
            <TableCell>{o.orderedBy || '—'}</TableCell>
            <TableCell>{o.priority || 'Routine'}</TableCell>
            <TableCell><StatusBadge status={o.status} /></TableCell>
          </>
        )}
      />
    </ChartTabShell>
  );
}
