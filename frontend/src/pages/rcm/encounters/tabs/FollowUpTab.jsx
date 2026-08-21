import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export function FollowUpTab() {
  const { encounter, addFollowUpNote, saving } = useRcmEncounter();
  const [form, setForm] = useState({
    note: '',
    nextAction: '',
    dueDate: '',
    assignee: '',
  });

  if (!encounter) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.note.trim()) return;
    await addFollowUpNote({
      note: form.note.trim(),
      nextAction: form.nextAction || null,
      dueDate: form.dueDate || null,
      assignee: form.assignee || null,
    });
    setForm({ note: '', nextAction: '', dueDate: '', assignee: '' });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Follow-up / audit</h2>
        <p className="text-sm text-muted-foreground">
          Billing follow-up notes and audit trail for this encounter.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add follow-up note</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Note</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Next action</Label>
              <Input
                value={form.nextAction}
                onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                placeholder="Call payer / resubmit / appeal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Input
                value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add note
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Follow-up notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Next action</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(encounter.followUpNotes || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No follow-up notes yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    encounter.followUpNotes.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDate(n.createdAt)}
                          <div className="text-muted-foreground">{n.createdBy}</div>
                        </TableCell>
                        <TableCell className="max-w-[220px] text-sm">{n.note}</TableCell>
                        <TableCell>{n.nextAction || '—'}</TableCell>
                        <TableCell>{formatDate(n.dueDate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Audit trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(encounter.auditTrail || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No audit events.
                      </TableCell>
                    </TableRow>
                  ) : (
                    encounter.auditTrail.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDate(a.createdAt)}</TableCell>
                        <TableCell>{a.action}</TableCell>
                        <TableCell>{a.userName}</TableCell>
                        <TableCell className="text-muted-foreground">{a.details || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
