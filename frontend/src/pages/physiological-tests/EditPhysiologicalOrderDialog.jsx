import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Routine', 'Urgent', 'Stat'];
const TEST_TYPES = ['EKG', 'Pulmonary Function', 'Cardiac Stress', 'Neurological', 'Other'];

export function EditPhysiologicalOrderDialog({ open, onOpenChange, order, patient, onSave }) {
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [orderingProvider, setOrderingProvider] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && order) {
      setTestName(order.testName || '');
      setTestType(order.testType || '');
      setDepartment(order.department || '');
      setStatus(order.status || 'Pending');
      setPriority(order.priority || 'Routine');
      setOrderingProvider(order.orderingProvider || '');
      const od = order.orderDateTime ? order.orderDateTime.slice(0, 10) : '';
      setOrderDate(od);
      setNotes(order.notes || '');
    }
  }, [open, order]);

  const handleSave = () => {
    if (!order?.id) return;
    if (!testName.trim()) return;

    setSaving(true);
    const payload = {
      testName: testName.trim(),
      testType: testType || order.testType,
      department: department.trim() || order.department,
      status: status || order.status,
      priority: priority || order.priority,
      orderingProvider: orderingProvider.trim() || order.orderingProvider,
      orderDateTime: orderDate ? new Date(orderDate).toISOString() : order.orderDateTime,
      notes: notes.trim() || undefined,
      lastUpdatedAt: new Date().toISOString(),
    };
    onSave?.({ ...order, ...payload });
    setSaving(false);
    onOpenChange?.(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit physiological test order (onsite)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium text-muted-foreground">Order ID: {order.id}</div>
            {patient && <div className="mt-0.5">{patient.name} · MRN: {patient.mrn}</div>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Test name *</Label>
              <Input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. 12-Lead EKG"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Test type</Label>
              <Select value={testType || '_'} onValueChange={(v) => setTestType(v === '_' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select type</SelectItem>
                  {TEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Cardiology"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status || '_'} onValueChange={(v) => setStatus(v === '_' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority || '_'} onValueChange={(v) => setPriority(v === '_' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order date</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Ordering provider</Label>
              <Input
                value={orderingProvider}
                onChange={(e) => setOrderingProvider(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Clinical notes or instructions"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !testName.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
