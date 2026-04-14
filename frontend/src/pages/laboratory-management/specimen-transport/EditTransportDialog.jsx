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
import { labApi } from '@/services/api';

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toISOString().slice(0, 16);
}

export function EditTransportDialog({ open, onOpenChange, labTest, onSaved }) {
  const [formData, setFormData] = useState({
    originLocation: '',
    originDepartment: '',
    destinationLab: '',
    batchNumber: '',
    transportTimestamp: '',
    transportBy: '',
    transportCondition: '',
    transportPriority: 'Routine',
    transportCarrier: '',
    trackingNumber: '',
    containerType: '',
    transportTemperature: '',
    transportStatus: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labTest) {
      setFormData({
        originLocation: labTest.originLocation || '',
        originDepartment: labTest.originDepartment || '',
        destinationLab: labTest.destinationLab || '',
        batchNumber: labTest.batchNumber || '',
        transportTimestamp: labTest.transportTimestamp ? formatDateTime(labTest.transportTimestamp) : '',
        transportBy: labTest.transportStaff || labTest.transportBy || '',
        transportCondition: labTest.transportCondition || '',
        transportPriority: labTest.transportPriority || 'Routine',
        transportCarrier: labTest.transportCarrier || '',
        trackingNumber: labTest.trackingNumber || '',
        containerType: labTest.containerType || '',
        transportTemperature: labTest.transportTemperature || '',
        transportStatus: labTest.transportStatus || '',
      });
    }
  }, [labTest]);

  const handleSave = async () => {
    if (!labTest?.id) return;
    if (!formData.originLocation || !formData.originDepartment || !formData.destinationLab || !formData.transportCondition) {
      alert('Please fill in required fields: Origin Location, Origin Department, Destination Lab, Transport Condition');
      return;
    }
    setSaving(true);
    try {
      await labApi.updateLabTest(labTest.id, {
        originLocation: formData.originLocation,
        originDepartment: formData.originDepartment,
        destinationLab: formData.destinationLab,
        batchNumber: formData.batchNumber,
        transportTimestamp: formData.transportTimestamp ? new Date(formData.transportTimestamp).toISOString() : null,
        transportStaff: formData.transportBy,
        transportCondition: formData.transportCondition,
        transportPriority: formData.transportPriority,
        transportCarrier: formData.transportCarrier,
        trackingNumber: formData.trackingNumber,
        containerType: formData.containerType,
        transportTemperature: formData.transportTemperature,
        transportStatus: formData.transportStatus || (formData.transportTimestamp ? 'Completed' : ''),
      });
      onSaved?.();
      onOpenChange?.(false);
    } catch (e) {
      alert(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Specimen Transport</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Test Name</Label>
              <Input value={labTest.testName || ''} readOnly className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Test ID</Label>
              <Input value={labTest.testId || ''} readOnly className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Created At</Label>
              <Input value={labTest.createdAt ? new Date(labTest.createdAt).toLocaleString() : ''} readOnly className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Specimen Status</Label>
              <Input value={labTest.specimenStatus || ''} readOnly className="bg-background" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Transport Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin Location *</Label>
                <Input value={formData.originLocation} onChange={(e) => setFormData((f) => ({ ...f, originLocation: e.target.value }))} placeholder="e.g., ICU" />
              </div>
              <div className="space-y-2">
                <Label>Origin Department *</Label>
                <Input value={formData.originDepartment} onChange={(e) => setFormData((f) => ({ ...f, originDepartment: e.target.value }))} placeholder="e.g., Emergency Medicine" />
              </div>
              <div className="space-y-2">
                <Label>Destination Lab *</Label>
                <Select value={formData.destinationLab} onValueChange={(v) => setFormData((f) => ({ ...f, destinationLab: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select destination lab" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Laboratory">Main Laboratory</SelectItem>
                    <SelectItem value="Microbiology Lab">Microbiology Lab</SelectItem>
                    <SelectItem value="Pathology Lab">Pathology Lab</SelectItem>
                    <SelectItem value="Chemistry Lab">Chemistry Lab</SelectItem>
                    <SelectItem value="Hematology Lab">Hematology Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={formData.batchNumber} onChange={(e) => setFormData((f) => ({ ...f, batchNumber: e.target.value }))} placeholder="e.g., BATCH-20260120-1233-375" />
              </div>
              <div className="space-y-2">
                <Label>Transport Timestamp</Label>
                <Input type="datetime-local" value={formData.transportTimestamp} onChange={(e) => setFormData((f) => ({ ...f, transportTimestamp: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Transport by (Transport Staff)</Label>
                <Input value={formData.transportBy} onChange={(e) => setFormData((f) => ({ ...f, transportBy: e.target.value }))} placeholder="e.g., Phares Asif" />
              </div>
              <div className="space-y-2">
                <Label>Transport Condition *</Label>
                <Select value={formData.transportCondition} onValueChange={(v) => setFormData((f) => ({ ...f, transportCondition: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select transport condition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frozen (-20°C)">Frozen (-20°C)</SelectItem>
                    <SelectItem value="Frozen (-80°C)">Frozen (-80°C)</SelectItem>
                    <SelectItem value="Refrigerated (2-8°C)">Refrigerated (2-8°C)</SelectItem>
                    <SelectItem value="Room Temperature">Room Temperature</SelectItem>
                    <SelectItem value="Warm (37°C)">Warm (37°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transport Priority</Label>
                <Select value={formData.transportPriority} onValueChange={(v) => setFormData((f) => ({ ...f, transportPriority: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Stat">Stat</SelectItem>
                    <SelectItem value="ASAP">ASAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transport Status</Label>
                <Select value={formData.transportStatus || '_'} onValueChange={(v) => setFormData((f) => ({ ...f, transportStatus: v === '_' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">—</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transport Carrier</Label>
                <Select value={formData.transportCarrier} onValueChange={(v) => setFormData((f) => ({ ...f, transportCarrier: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lab Staff">Lab Staff</SelectItem>
                    <SelectItem value="Nursing Staff">Nursing Staff</SelectItem>
                    <SelectItem value="Courier Service">Courier Service</SelectItem>
                    <SelectItem value="Automated System">Automated System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input value={formData.trackingNumber} onChange={(e) => setFormData((f) => ({ ...f, trackingNumber: e.target.value }))} placeholder="e.g., TRK-1768894418076-0645" />
              </div>
              <div className="space-y-2">
                <Label>Container Type</Label>
                <Select value={formData.containerType} onValueChange={(v) => setFormData((f) => ({ ...f, containerType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select container type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Tube">Standard Tube</SelectItem>
                    <SelectItem value="Vacutainer">Vacutainer</SelectItem>
                    <SelectItem value="Sterile Container">Sterile Container</SelectItem>
                    <SelectItem value="Cryovial">Cryovial</SelectItem>
                    <SelectItem value="Culture Bottle">Culture Bottle</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transport Temperature</Label>
                <Input value={formData.transportTemperature} onChange={(e) => setFormData((f) => ({ ...f, transportTemperature: e.target.value }))} placeholder="e.g., -20°C" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
