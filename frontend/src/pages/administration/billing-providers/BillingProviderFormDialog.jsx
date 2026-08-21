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
import { Checkbox } from '@/components/ui/checkbox';

const initial = {
  name: '',
  code: '',
  npi: '',
  taxId: '',
  address: '',
  isActive: true,
};

export function BillingProviderFormDialog({ open, onOpenChange, billingProvider, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (billingProvider && open) {
      setFormData({
        name: billingProvider.name || '',
        code: billingProvider.code || '',
        npi: billingProvider.npi || '',
        taxId: billingProvider.taxId || '',
        address: billingProvider.address || '',
        isActive: billingProvider.isActive !== false,
      });
    } else if (open) {
      setFormData(initial);
    }
    setErrors({});
  }, [billingProvider, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({
      name: formData.name.trim(),
      code: formData.code?.trim() || undefined,
      npi: formData.npi?.trim() || undefined,
      taxId: formData.taxId?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{billingProvider ? 'Edit Billing Provider' : 'Add Billing Provider'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Provider name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Short code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npi">NPI</Label>
            <Input
              id="npi"
              value={formData.npi}
              onChange={(e) => handleChange('npi', e.target.value)}
              placeholder="National Provider Identifier"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              placeholder="Tax ID / EIN"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Address"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(c) => handleChange('isActive', !!c)}
            />
            <Label htmlFor="isActive" className="font-normal">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : billingProvider ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
