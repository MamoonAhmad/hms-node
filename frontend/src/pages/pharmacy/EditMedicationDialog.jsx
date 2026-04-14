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

const PRIORITIES = ['Routine', 'Urgent', 'Critical'];
const ROUTES = ['Oral', 'Injection', 'IV', 'Topical', 'Inhalation', 'Other'];
const FORMS = ['Tablet', 'Capsule', 'Liquid', 'Cream', 'Inhaler', 'Injection', 'Other'];

export function EditMedicationDialog({ open, onOpenChange, medication, onSave }) {
  const [form, setForm] = useState({
    medicationName: '',
    drugProduct: '',
    dosage: '',
    action: '',
    quantity: '',
    form: '',
    route: '',
    priorityLevel: 'Routine',
    frequency: '',
    description: '',
    comment: '',
  });

  useEffect(() => {
    if (medication) {
      setForm({
        medicationName: medication.medicationName || '',
        drugProduct: medication.drugProduct || '',
        dosage: medication.dosage || '',
        action: medication.action || '',
        quantity: medication.quantity || '',
        form: medication.form || '',
        route: medication.route || '',
        priorityLevel: medication.priority || 'Routine',
        frequency: medication.frequency || '',
        description: medication.description || '',
        comment: medication.comment || '',
      });
    }
  }, [medication]);

  const handleSave = () => {
    onSave?.({ ...medication, ...form, priority: form.priorityLevel });
    onOpenChange?.(false);
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Medication</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Medication Name</Label>
            <Input value={form.medicationName} onChange={(e) => setForm((f) => ({ ...f, medicationName: e.target.value }))} />
          </div>
          <div>
            <Label>Drug Product</Label>
            <Input value={form.drugProduct} onChange={(e) => setForm((f) => ({ ...f, drugProduct: e.target.value }))} />
          </div>
          <div>
            <Label>Dosage</Label>
            <Input value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
          </div>
          <div>
            <Label>Action</Label>
            <Input value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div>
            <Label>Form</Label>
            <Select value={form.form} onValueChange={(v) => setForm((f) => ({ ...f, form: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {FORMS.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Route</Label>
            <Select value={form.route} onValueChange={(v) => setForm((f) => ({ ...f, route: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {ROUTES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority Level</Label>
            <Select value={form.priorityLevel} onValueChange={(v) => setForm((f) => ({ ...f, priorityLevel: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Frequency</Label>
            <Input value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Comment</Label>
            <Textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
