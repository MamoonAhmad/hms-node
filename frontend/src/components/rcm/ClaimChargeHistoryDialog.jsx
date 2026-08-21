import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ClaimChargeHistoryDialog({ open, onOpenChange, rows = [], loading, error, onRetry }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Charge history</DialogTitle>
        </DialogHeader>
        <DialogBody>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading charge history…</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-xs text-destructive">{error}</p>
            {onRetry && <Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No charge history recorded yet.</p>
        ) : (
          <div className="max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Charge line</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">{row.changedAt ? new Date(row.changedAt).toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-xs">{row.changedBy || '—'}</TableCell>
                    <TableCell className="text-xs">{row.chargeLine}</TableCell>
                    <TableCell className="text-xs capitalize">{row.action}</TableCell>
                    <TableCell className="text-xs">{row.fieldName || '—'}</TableCell>
                    <TableCell className="max-w-[12rem] truncate text-xs" title={row.oldValue || ''}>{row.oldValue || '—'}</TableCell>
                    <TableCell className="max-w-[12rem] truncate text-xs" title={row.newValue || ''}>{row.newValue || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
