import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePatientChart } from './PatientChartContext';

export function PatientResultsTab() {
  const { orders } = usePatientChart();

  const { pending, resulted } = useMemo(() => {
    const labs = orders.filter((o) => o.category === 'Lab');
    return {
      pending: labs.filter((o) => o.status === 'Scheduled'),
      resulted: labs.filter((o) => o.status === 'Completed'),
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Results review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Lab and diagnostic results linked to orders for this patient.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pending</CardTitle>
          <Badge variant="secondary">{pending.length}</Badge>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending results.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.procedureName}</TableCell>
                    <TableCell>{new Date(o.orderDateTime).toLocaleDateString()}</TableCell>
                    <TableCell><Badge>{o.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resulted</CardTitle>
        </CardHeader>
        <CardContent>
          {resulted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed lab orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {resulted.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.procedureName}</TableCell>
                    <TableCell>{new Date(o.orderDateTime).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">Acknowledge</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
