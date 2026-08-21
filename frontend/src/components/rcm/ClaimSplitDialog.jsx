import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ClaimSplitDialog({ open, onOpenChange, charges = [], onSplit, loading }) {
  const [selected, setSelected] = useState(() => new Set());

  const rows = useMemo(() => (charges || []).filter((c) => c.id), [charges]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Split claim</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Select charge lines to move into a new draft claim. The original claim keeps the remaining lines.
          </p>
          <div className="max-h-64 space-y-1 overflow-auto rounded-md border">
            {rows.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">Save the claim before splitting charge lines.</p>
            ) : (
              rows.map((row, idx) => (
                <label key={row.id} className="flex items-center gap-2 border-b px-3 py-1.5 last:border-b-0 hover:bg-muted/50">
                  <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggle(row.id)} />
                  <span className="text-sm">
                    Line {idx + 1}: {row.procedure || 'No procedure'} · {row.from || 'No DOS'} · ${Number(row.amount || 0).toFixed(2)}
                  </span>
                </label>
              ))
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            size="sm"
            disabled={loading || selected.size === 0}
            onClick={() => onSplit(Array.from(selected))}
          >
            {loading ? 'Splitting…' : 'Split selected lines'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
