import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Edit3,
  Eye,
  FileCheck2,
  MessageSquarePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cn } from '@/lib/utils';
import { SectionCard, RowActionMenu, StatusBadge, EmptyState } from '../components/chart-ui';
import { LAB_STATUS_OPTIONS } from './womensHealthConstants';
import { TextSelect } from './WomensHealthFields';

const CATEGORY_ORDER = [
  'First Prenatal Labs',
  'Second Trimester',
  'Third Trimester',
  'Genetic Testing',
];

function todayInput() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function statusTone(status) {
  if (!status) return 'muted';
  if (status === 'Abnormal') return 'danger';
  if (status === 'Reviewed' || status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'muted';
  if (status === 'In Progress' || status === 'Collected') return 'info';
  return 'warning';
}

export function PrenatalLabsTracker({ rows, onChange, onOpenOrders }) {
  const [filter, setFilter] = useState('all');
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [noteRow, setNoteRow] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const grouped = useMemo(() => {
    const map = new Map(CATEGORY_ORDER.map((c) => [c, []]));
    rows.forEach((row) => {
      const key = row.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return [...map.entries()].filter(([, list]) => list.length);
  }, [rows]);

  const updateRow = (id, patch) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleAction = (actionId, row) => {
    if (actionId === 'view') {
      setViewRow(row);
      return;
    }
    if (actionId === 'order') {
      updateRow(row.id, {
        status: row.status && row.status !== 'Cancelled' ? row.status : 'Ordered',
        orderedDate: row.orderedDate || todayInput(),
      });
      onOpenOrders?.();
      return;
    }
    if (actionId === 'edit') {
      setEditRow({ ...row });
      return;
    }
    if (actionId === 'reviewed') {
      updateRow(row.id, {
        status: 'Reviewed',
        resultDate: row.resultDate || todayInput(),
      });
      return;
    }
    if (actionId === 'note') {
      setNoteRow(row);
      setNoteDraft(row.notes || '');
    }
  };

  const saveEdit = () => {
    if (!editRow) return;
    updateRow(editRow.id, editRow);
    setEditRow(null);
  };

  const saveNote = () => {
    if (!noteRow) return;
    updateRow(noteRow.id, { notes: noteDraft });
    setNoteRow(null);
    setNoteDraft('');
  };

  const visibleGrouped = grouped
    .map(([category, list]) => [
      category,
      list.filter((row) => {
        if (filter === 'all') return true;
        if (filter === 'open') {
          return !row.status || !['Completed', 'Reviewed', 'Cancelled'].includes(row.status);
        }
        if (filter === 'abnormal') return row.status === 'Abnormal';
        return row.status === filter;
      }),
    ])
    .filter(([, list]) => list.length);

  const openCount = rows.filter(
    (r) => !r.status || !['Completed', 'Reviewed', 'Cancelled'].includes(r.status),
  ).length;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Prenatal Labs Tracker"
        description="Track pregnancy-related labs across trimesters — order, collect, review, and document results."
        accent="info"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {openCount} open
            </Badge>
            {onOpenOrders && (
              <Button type="button" variant="outline" size="sm" onClick={onOpenOrders}>
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                Orders
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'Ordered', label: 'Ordered' },
            { id: 'Completed', label: 'Completed' },
            { id: 'Reviewed', label: 'Reviewed' },
            { id: 'abnormal', label: 'Abnormal' },
          ].map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={filter === f.id ? 'default' : 'outline'}
              className="h-7"
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {!visibleGrouped.length ? (
          <EmptyState
            icon={ClipboardList}
            title="No labs match this filter"
            description="Change the filter or order a prenatal lab."
          />
        ) : (
          visibleGrouped.map(([category, list]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Test Name</TableHead>
                      <TableHead>Trimester</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Result Date</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Normal Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.testName}</TableCell>
                        <TableCell className="text-muted-foreground">{row.trimester}</TableCell>
                        <TableCell>{row.orderedDate || '—'}</TableCell>
                        <TableCell>{row.collectedDate || '—'}</TableCell>
                        <TableCell>{row.resultDate || '—'}</TableCell>
                        <TableCell>{row.result || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{row.normalRange || '—'}</TableCell>
                        <TableCell>
                          {row.status ? (
                            <StatusBadge
                              status={row.status}
                              className={cn(
                                statusTone(row.status) === 'danger' && 'status-soft-danger',
                                statusTone(row.status) === 'success' && 'status-soft-success',
                                statusTone(row.status) === 'warning' && 'status-soft-warning',
                                statusTone(row.status) === 'info' && 'status-soft-info',
                                statusTone(row.status) === 'muted' && 'status-soft-muted',
                              )}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{row.provider || '—'}</TableCell>
                        <TableCell className="max-w-[140px] truncate text-muted-foreground">
                          {row.notes || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActionMenu
                            label={`Actions for ${row.testName}`}
                            items={[
                              { id: 'view', label: 'View Result', icon: Eye },
                              { id: 'order', label: 'Order Test', icon: ClipboardList },
                              { id: 'edit', label: 'Edit', icon: Edit3 },
                              { id: 'reviewed', label: 'Mark Reviewed', icon: FileCheck2 },
                              { id: 'note', label: 'Add Note', icon: MessageSquarePlus },
                            ]}
                            onSelect={(id) => handleAction(id, row)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </SectionCard>

      <Dialog open={Boolean(editRow)} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit lab — {editRow?.testName}</DialogTitle>
            <DialogDescription>Update dates, result, status, and provider for this prenatal lab.</DialogDescription>
          </DialogHeader>
          {editRow && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ordered Date</Label>
                <Input
                  type="date"
                  value={editRow.orderedDate || ''}
                  onChange={(e) => setEditRow({ ...editRow, orderedDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Collected Date</Label>
                <Input
                  type="date"
                  value={editRow.collectedDate || ''}
                  onChange={(e) => setEditRow({ ...editRow, collectedDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Result Date</Label>
                <Input
                  type="date"
                  value={editRow.resultDate || ''}
                  onChange={(e) => setEditRow({ ...editRow, resultDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <TextSelect
                  value={editRow.status}
                  onChange={(v) => setEditRow({ ...editRow, status: v })}
                  options={LAB_STATUS_OPTIONS}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Result</Label>
                <Input
                  value={editRow.result || ''}
                  onChange={(e) => setEditRow({ ...editRow, result: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Normal Range</Label>
                <Input
                  value={editRow.normalRange || ''}
                  onChange={(e) => setEditRow({ ...editRow, normalRange: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Input
                  value={editRow.provider || ''}
                  onChange={(e) => setEditRow({ ...editRow, provider: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={editRow.notes || ''}
                  onChange={(e) => setEditRow({ ...editRow, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewRow)} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewRow?.testName}</DialogTitle>
            <DialogDescription>Prenatal lab result summary</DialogDescription>
          </DialogHeader>
          {viewRow && (
            <dl className="grid gap-2 text-sm">
              {[
                ['Status', viewRow.status || '—'],
                ['Result', viewRow.result || '—'],
                ['Normal range', viewRow.normalRange || '—'],
                ['Ordered', viewRow.orderedDate || '—'],
                ['Collected', viewRow.collectedDate || '—'],
                ['Result date', viewRow.resultDate || '—'],
                ['Provider', viewRow.provider || '—'],
                ['Notes', viewRow.notes || '—'],
              ].map(([label, val]) => (
                <div key={label} className="grid grid-cols-[8rem_1fr] gap-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{val}</dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditRow({ ...viewRow });
                setViewRow(null);
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noteRow)} onOpenChange={(o) => !o && setNoteRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add note — {noteRow?.testName}</DialogTitle>
            <DialogDescription>Clinical note for this prenatal lab row.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNoteRow(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveNote}>
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
