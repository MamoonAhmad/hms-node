import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddMedicationDialog({ open, onOpenChange, form, onFormChange, onSave }) {
  const handleChange = (field, value) => {
    onFormChange((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="medication-type">Medication Type</Label>
            <Input
              id="medication-type"
              placeholder="Medication Type"
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medication-name">Medication Name</Label>
            <Input
              id="medication-name"
              placeholder="Search and select medication..."
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medication-reason">Reason for Taking</Label>
            <Input
              id="medication-reason"
              placeholder="Medical condition or symptom"
              value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medication-dosage">Dosage</Label>
            <Input
              id="medication-dosage"
              placeholder="e.g., 10mg, 500mcg"
              value={form.dosage}
              onChange={(e) => handleChange('dosage', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medication-frequency">Frequency</Label>
            <Input
              id="medication-frequency"
              placeholder="Frequency"
              value={form.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medication-start">Start Date</Label>
            <Input
              id="medication-start"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Medication
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


