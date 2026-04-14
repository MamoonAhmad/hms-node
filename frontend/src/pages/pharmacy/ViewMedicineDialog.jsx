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

export function ViewMedicineDialog({ open, onOpenChange, medicine }) {
  if (!medicine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Medicine</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label className="text-muted-foreground">Medication Name</Label><Input value={medicine.medicationName || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">EMR ID</Label><Input value={medicine.emrId || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">Generic</Label><Input value={medicine.genericName || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">NDC #</Label><Input value={medicine.ndc || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">Drug Type</Label><Input value={medicine.drugType || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">Unit of Purchase</Label><Input value={medicine.unitOfPurchase || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">Quantity</Label><Input value={medicine.quantity ?? ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">Last Inventory Date</Label><Input value={medicine.lastInventoryDate || ''} readOnly className="bg-muted" /></div>
          <div><Label className="text-muted-foreground">Current Quantity</Label><Input value={medicine.currentQuantity ?? ''} readOnly className="bg-muted" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
