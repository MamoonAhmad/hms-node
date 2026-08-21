import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRcmEncounter } from '../RcmEncounterContext';
import { formatDate, formatMoney } from '../rcmEncounterConstants';

const PAYMENT_TYPES = ['Insurance payment', 'Patient payment', 'Adjustment', 'Write-off'];

export function PaymentsTab() {
  const { encounter, addPayment, saving } = useRcmEncounter();
  const [form, setForm] = useState({
    type: 'Insurance payment',
    amount: '',
    payer: '',
    reference: '',
    notes: '',
    postedDate: new Date().toISOString().slice(0, 10),
  });

  if (!encounter) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    await addPayment({
      ...form,
      amount: Number(form.amount),
      payer: form.payer || encounter.coverage?.primaryPayer || undefined,
    });
    setForm((f) => ({ ...f, amount: '', reference: '', notes: '' }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Payments / adjustments</h2>
        <p className="text-sm text-muted-foreground">Post payments, adjustments, and write-offs.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Post payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payer</Label>
              <Input
                value={form.payer}
                onChange={(e) => setForm((f) => ({ ...f, payer: e.target.value }))}
                placeholder={encounter.coverage?.primaryPayer || 'Payer'}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reference / check #</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Posted date</Label>
              <Input
                type="date"
                value={form.postedDate}
                onChange={(e) => setForm((f) => ({ ...f, postedDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving}>
                <Plus className="mr-1.5 h-4 w-4" />
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Posted by</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(encounter.payments || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No payments posted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  encounter.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.postedDate)}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{p.payer || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{p.reference || '—'}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(p.amount)}</TableCell>
                      <TableCell>{p.postedBy || '—'}</TableCell>
                      <TableCell>{p.notes || '—'}</TableCell>
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
