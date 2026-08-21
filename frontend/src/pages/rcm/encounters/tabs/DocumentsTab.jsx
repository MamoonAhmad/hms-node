import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRcmEncounter } from '../RcmEncounterContext';
import { formatDate } from '../rcmEncounterConstants';

export function DocumentsTab() {
  const { encounter } = useRcmEncounter();
  if (!encounter) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Documents / attachments</h2>
        <p className="text-sm text-muted-foreground">
          Billing attachments such as AOB, authorizations, and supporting docs.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">On file</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(encounter.documents || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No documents attached to this patient/encounter yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  encounter.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>{doc.fileName || '—'}</TableCell>
                      <TableCell>{doc.uploadedBy || '—'}</TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
