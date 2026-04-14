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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ExternalLabFormDialog({ open, onOpenChange, lab, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    labName: '',
    contactNumber: '',
    address: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (lab) {
        setFormData({
          labName: lab.labName ?? '',
          contactNumber: lab.contactNumber ?? '',
          address: lab.address ?? '',
          status: lab.status ?? 'active',
        });
      } else {
        setFormData({ labName: '', contactNumber: '', address: '', status: 'active' });
      }
      setErrors({});
    }
  }, [open, lab]);

  const validate = () => {
    const newErrors = {};
    if (!formData.labName?.trim()) newErrors.labName = 'Lab name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-md">
        <DialogHeader>
          <DialogTitle>{lab ? 'Edit Lab' : 'Add Lab'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="labName">Lab Name *</Label>
            <Input
              id="labName"
              value={formData.labName}
              onChange={(e) => setFormData((prev) => ({ ...prev, labName: e.target.value }))}
              className={errors.labName ? 'border-destructive' : ''}
            />
            {errors.labName && <p className="text-xs text-destructive">{errors.labName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
