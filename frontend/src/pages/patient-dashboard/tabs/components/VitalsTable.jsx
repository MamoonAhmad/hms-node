import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function VitalsTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No vitals recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Taken By</TableHead>
                <TableHead>Taken At</TableHead>
                <TableHead>BP</TableHead>
                <TableHead>Pulse</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Height</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Pain Assessment</TableHead>
                <TableHead>Glucose</TableHead>
                <TableHead>O₂ Saturation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((vital) => (
                <TableRow key={vital.id}>
                  <TableCell>{vital.takenBy}</TableCell>
                  <TableCell>{new Date(vital.takenAt).toLocaleString()}</TableCell>
                  <TableCell>{vital.bp}</TableCell>
                  <TableCell>{vital.pulse}</TableCell>
                  <TableCell>{vital.temperature}</TableCell>
                  <TableCell>{vital.weight}</TableCell>
                  <TableCell>{vital.height}</TableCell>
                  <TableCell>{vital.bloodGroup}</TableCell>
                  <TableCell>{vital.painAssessment}</TableCell>
                  <TableCell>{vital.glucose}</TableCell>
                  <TableCell>{vital.o2Saturation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


