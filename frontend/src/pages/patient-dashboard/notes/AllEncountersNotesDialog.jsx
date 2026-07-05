import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Eye } from 'lucide-react';
import { formatNoteDate, NOTE_TYPE_LABELS } from './noteConstants';

export function AllEncountersNotesDialog({ open, onOpenChange, notes, loading, onViewNote }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes From All Encounters</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encounter Date</TableHead>
                  <TableHead>Encounter ID</TableHead>
                  <TableHead>Note Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No notes found for this patient.
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>{formatNoteDate(n.encounterDate)}</TableCell>
                      <TableCell className="font-mono text-xs">{n.encounterNumber || n.appointmentId?.slice(0, 8) || '—'}</TableCell>
                      <TableCell>{NOTE_TYPE_LABELS[n.noteType] || n.noteType}</TableCell>
                      <TableCell>{n.noteTitle || n.title}</TableCell>
                      <TableCell>{n.createdByName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={n.status === 'Signed' ? 'default' : 'secondary'}>{n.status}</Badge>
                      </TableCell>
                      <TableCell>{formatNoteDate(n.createdAt)}</TableCell>
                      <TableCell>
                        <Button type="button" size="icon" variant="ghost" onClick={() => onViewNote(n.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
