import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AllergiesTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allergies</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No allergies recorded</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Allergy Type</TableHead>
                <TableHead>Allergy Name</TableHead>
                <TableHead>Onset Date</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reaction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Taken By</TableHead>
                <TableHead>Taken At</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((allergy) => (
                <TableRow key={allergy.id}>
                  <TableCell>{allergy.allergyType}</TableCell>
                  <TableCell>{allergy.allergyName}</TableCell>
                  <TableCell>{new Date(allergy.onsetDate).toLocaleDateString()}</TableCell>
                  <TableCell>{allergy.severity}</TableCell>
                  <TableCell>{allergy.reaction}</TableCell>
                  <TableCell>
                    <Badge variant={allergy.status === 'Active' ? 'default' : 'secondary'}>
                      {allergy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{allergy.takenBy}</TableCell>
                  <TableCell>{new Date(allergy.takenAt).toLocaleString()}</TableCell>
                  <TableCell>{allergy.endDate ? new Date(allergy.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


