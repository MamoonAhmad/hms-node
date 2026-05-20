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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tenantApi } from '@/services/api';

const initialFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
  phone: '',
  tenantId: '',
  isActive: true,
  hasOnsiteLab: true,
  hasOnsitePharmacy: true,
  hasOnsiteRadiology: true,
};

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const isEditing = !!location;

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      setLoadingTenants(true);
      try {
        const response = await tenantApi.getAll({ limit: 100, isActive: true });
        setTenants(response.data);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      } finally {
        setLoadingTenants(false);
      }
    };

    if (open) {
      fetchTenants();
    }
  }, [open]);

  useEffect(() => {
    if (location) {
      const tid = location.tenantId ?? location.tenant?.id;
      setFormData({
        name: location.name || '',
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        phone: location.phone || '',
        tenantId: tid != null ? String(tid) : '',
        isActive: location.isActive !== undefined ? location.isActive : true,
        hasOnsiteLab: location.hasOnsiteLab !== undefined ? location.hasOnsiteLab : true,
        hasOnsitePharmacy: location.hasOnsitePharmacy !== undefined ? location.hasOnsitePharmacy : true,
        hasOnsiteRadiology: location.hasOnsiteRadiology !== undefined ? location.hasOnsiteRadiology : true,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [location, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Location name is required';
    if (!formData.tenantId) newErrors.tenantId = 'Tenant is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      name: formData.name.trim(),
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      country: formData.country.trim() || null,
      phone: formData.phone.trim() || null,
      tenantId: formData.tenantId,
      isActive: formData.isActive,
      hasOnsiteLab: formData.hasOnsiteLab,
      hasOnsitePharmacy: formData.hasOnsitePharmacy,
      hasOnsiteRadiology: formData.hasOnsiteRadiology,
    };

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Location' : 'Add Location'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Main Hospital Campus"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) => handleChange('tenantId', value)}
              >
                <SelectTrigger className={errors.tenantId ? 'border-destructive' : ''}>
                  <SelectValue placeholder={loadingTenants ? "Loading..." : "Select tenant"} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={String(tenant.id)}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && (
                <p className="text-xs text-destructive">{errors.tenantId}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Medical Center Drive"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Boston"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="Massachusetts"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="USA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Facility (order routing)</p>
            <p className="text-xs text-muted-foreground">
              When unchecked, orders for this department are sent externally only.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOnsiteLab"
                  checked={formData.hasOnsiteLab}
                  onCheckedChange={(checked) => handleChange('hasOnsiteLab', !!checked)}
                />
                <Label htmlFor="hasOnsiteLab" className="cursor-pointer text-sm">
                  Has onsite laboratory
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOnsitePharmacy"
                  checked={formData.hasOnsitePharmacy}
                  onCheckedChange={(checked) => handleChange('hasOnsitePharmacy', !!checked)}
                />
                <Label htmlFor="hasOnsitePharmacy" className="cursor-pointer text-sm">
                  Has onsite pharmacy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOnsiteRadiology"
                  checked={formData.hasOnsiteRadiology}
                  onCheckedChange={(checked) => handleChange('hasOnsiteRadiology', !!checked)}
                />
                <Label htmlFor="hasOnsiteRadiology" className="cursor-pointer text-sm">
                  Has onsite radiology
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

