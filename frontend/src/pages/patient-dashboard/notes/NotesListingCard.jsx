import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, FileText } from 'lucide-react';

export function NotesListingCard({
  title,
  notes,
  emptyMessage,
  onEdit,
  onAddendum,
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>{note.date || '—'}</TableCell>
                  <TableCell>{note.provider || '—'}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                    {note.summary || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        note.status === 'locked'
                          ? 'bg-green-50 text-green-800'
                          : note.status === 'signed'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-amber-50 text-amber-800'
                      }
                    >
                      {note.status === 'locked'
                        ? 'Signed & Locked'
                        : note.status === 'signed'
                          ? 'Signed'
                          : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {note.status === 'draft' ? (
                      <Button variant="ghost" size="sm" onClick={() => onEdit?.(note)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onAddendum?.(note)}>
                        <FileText className="mr-1 h-4 w-4" />
                        Add addendum
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
