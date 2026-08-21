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

const initialFormData = {
  name: '',
  code: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  website: '',
  isActive: true,
};

function auditUserLabel(user) {
  if (!user) return '—';
  return user.name || user.email || '—';
}

function formatAuditDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function InsuranceProviderFormDialog({
  open,
  onOpenChange,
  provider,
  onSubmit,
  isLoading,
  mode = 'create',
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const readOnly = isViewing;

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        code: provider.code || '',
        phone: provider.phone || '',
        email: provider.email || '',
        address: provider.address || '',
        city: provider.city || '',
        state: provider.state || '',
        zip: provider.zip || '',
        website: provider.website || '',
        isActive: provider.isActive !== undefined ? provider.isActive : true,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [provider, open]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Payer name is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Invalid URL format (must start with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    const submitData = {
      name: formData.name.trim(),
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      zip: formData.zip.trim() || null,
      website: formData.website.trim() || null,
      isActive: formData.isActive,
    };

    onSubmit(submitData);
  };

  const title =
    isViewing ? 'View Payer' : isEditing ? 'Edit Payer' : 'Add Payer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {provider?.id && (
            <div className="space-y-2">
              <Label htmlFor="payerId">Payer ID</Label>
              <Input id="payerId" value={provider.id} disabled readOnly />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Payer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Blue Cross Blue Shield"
                className={errors.name ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="BCBS"
                className="uppercase"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (800) 555-0123"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@insurance.com"
                className={errors.email ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.insurance.com"
              className={errors.website ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.website && (
              <p className="text-xs text-destructive">{errors.website}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Insurance Ave, Suite 100"
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="ST"
                maxLength={50}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                placeholder="12345"
                maxLength={20}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
              disabled={readOnly || isLoading}
            />
            <Label htmlFor="isActive" className={readOnly ? '' : 'cursor-pointer'}>
              Active
            </Label>
          </div>

          {readOnly && (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Deletion audit</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Deleted By</Label>
                  <p className="text-sm font-medium">{auditUserLabel(provider?.deleter)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Deleted At</Label>
                  <p className="text-sm font-medium">{formatAuditDate(provider?.deletedAt)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
