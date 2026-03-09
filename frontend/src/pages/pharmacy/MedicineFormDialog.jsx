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

export function MedicineFormDialog({ open, onOpenChange, medicine, isAdd, onSave }) {
  const [form, setForm] = useState({
    medicationName: '',
    emrId: '',
    genericName: '',
    ndc: '',
    drugType: '',
    unitOfPurchase: '',
    quantity: '',
    lastInventoryDate: '',
    currentQuantity: '',
  });

  useEffect(() => {
    if (medicine) {
      setForm({
        medicationName: medicine.medicationName || '',
        emrId: medicine.emrId || '',
        genericName: medicine.genericName || '',
        ndc: medicine.ndc || '',
        drugType: medicine.drugType || '',
        unitOfPurchase: medicine.unitOfPurchase || '',
        quantity: String(medicine.quantity ?? ''),
        lastInventoryDate: medicine.lastInventoryDate || '',
        currentQuantity: String(medicine.currentQuantity ?? ''),
      });
    } else {
      setForm({
        medicationName: '',
        emrId: '',
        genericName: '',
        ndc: '',
        drugType: '',
        unitOfPurchase: '',
        quantity: '',
        lastInventoryDate: '',
        currentQuantity: '',
      });
    }
  }, [medicine, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.medicationName?.trim()) {
      alert('Medication Name is required.');
      return;
    }
    const payload = {
      ...form,
      quantity: form.quantity === '' ? 0 : Number(form.quantity),
      currentQuantity: form.currentQuantity === '' ? 0 : Number(form.currentQuantity),
    };
    if (medicine) payload.id = medicine.id;
    onSave?.(payload);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAdd ? 'Add Medicine' : 'Edit Medicine'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Medication Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.medicationName}
              onChange={(e) => setForm((f) => ({ ...f, medicationName: e.target.value }))}
              placeholder="e.g. Lidocaine 1%"
            />
          </div>
          <div>
            <Label>EMR ID</Label>
            <Input
              value={form.emrId}
              onChange={(e) => setForm((f) => ({ ...f, emrId: e.target.value }))}
              placeholder="Enter EMR ID"
            />
          </div>
          <div>
            <Label>Generic</Label>
            <Input
              value={form.genericName}
              onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))}
              placeholder="Enter Generic Name"
            />
          </div>
          <div>
            <Label>NDC #</Label>
            <Input
              value={form.ndc}
              onChange={(e) => setForm((f) => ({ ...f, ndc: e.target.value }))}
              placeholder="Enter NDC #"
            />
          </div>
          <div>
            <Label>Drug Type</Label>
            <Input
              value={form.drugType}
              onChange={(e) => setForm((f) => ({ ...f, drugType: e.target.value }))}
              placeholder="Enter Drug Type"
            />
          </div>
          <div>
            <Label>Unit of Purchase</Label>
            <Input
              value={form.unitOfPurchase}
              onChange={(e) => setForm((f) => ({ ...f, unitOfPurchase: e.target.value }))}
              placeholder="Enter Unit of Purchase"
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="Enter Quantity"
            />
          </div>
          <div>
            <Label>Last Inventory Date</Label>
            <Input
              type="date"
              value={form.lastInventoryDate}
              onChange={(e) => setForm((f) => ({ ...f, lastInventoryDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>Current Quantity</Label>
            <Input
              type="number"
              min={0}
              value={form.currentQuantity}
              onChange={(e) => setForm((f) => ({ ...f, currentQuantity: e.target.value }))}
              placeholder="Enter Current Quantity"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
            <Button type="submit">{isAdd ? 'Save' : 'Save updates'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
