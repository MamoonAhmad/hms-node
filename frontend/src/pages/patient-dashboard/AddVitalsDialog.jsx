import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VitalsForm, getDefaultVitalsData } from '@/pages/nurses/nurse-dashboard/vitals/VitalsForm';

export function AddVitalsDialog({ open, onOpenChange, onSave }) {
  const [data, setData] = useState(getDefaultVitalsData());

  const handleSave = () => {
    const timestamp = new Date().toISOString();
    onSave?.({ ...data, id: Date.now(), recordedAt: timestamp });
    setData(getDefaultVitalsData());
    onOpenChange?.(false);
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) setData(getDefaultVitalsData());
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vitals</DialogTitle>
        </DialogHeader>
        <VitalsForm data={data} onChange={setData} showTimestamp />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Vitals</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
