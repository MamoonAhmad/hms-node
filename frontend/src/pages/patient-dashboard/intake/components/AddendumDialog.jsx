import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function AddendumHistoryDialog({ open, onOpenChange, record, title = 'Addendum History' }) {
  if (!record) return null;

  const rows = [
    {
      label: 'Original',
      by: record.createdByName,
      at: record.createdAt,
      notes: record.notes,
    },
    ...(record.addendums || []).map((a, i) => ({
      label: `Addendum ${i + 1}`,
      by: a.createdByName,
      at: a.createdAt,
      notes: a.notes,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>{row.by || '—'}</TableCell>
                <TableCell>{formatDateTime(row.at)}</TableCell>
                <TableCell className="max-w-xs truncate">{row.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddendumFormDialog({
  open,
  onOpenChange,
  onSave,
  saving,
  children,
  title = 'Add Addendum',
}) {
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    await onSave({ notes });
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {children}
          <div className="space-y-2">
            <Label htmlFor="addendum-notes">Addendum Notes</Label>
            <Textarea
              id="addendum-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for addendum..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSave}>
            Save Addendum
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
