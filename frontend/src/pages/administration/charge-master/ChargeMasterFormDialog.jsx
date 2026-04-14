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

export function ChargeMasterFormDialog({ open, onOpenChange, charge, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    cptCode: '',
    description: '',
    revenueCode: '',
    priceEffectiveDate: '',
    cptEffectiveDate: '',
    standardAmount: '',
    totalRevenue: '',
    totalVolume: '',
    percentageIncreased: '0',
    category: '',
    genericDepartment: '',
    discountPercent: '0',
    location: '',
    payer: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (charge && open) {
      setFormData({
        cptCode: charge.cptCode || '',
        description: charge.description || '',
        revenueCode: charge.revenueCode || '',
        priceEffectiveDate: charge.priceEffectiveDate
          ? new Date(charge.priceEffectiveDate).toISOString().split('T')[0]
          : '',
        cptEffectiveDate: charge.cptEffectiveDate
          ? new Date(charge.cptEffectiveDate).toISOString().split('T')[0]
          : '',
        standardAmount: charge.standardAmount || '',
        totalRevenue: charge.totalRevenue || '',
        totalVolume: charge.totalVolume || '',
        percentageIncreased: charge.percentageIncreased?.toString() || '0',
        category: charge.category || '',
        genericDepartment: charge.genericDepartment || '',
        discountPercent: charge.discountPercent?.toString() || '0',
        location: charge.location || '',
        payer: charge.payer || '',
      });
    } else {
      setFormData({
        cptCode: '',
        description: '',
        revenueCode: '',
        priceEffectiveDate: '',
        cptEffectiveDate: '',
        standardAmount: '',
        totalRevenue: '',
        totalVolume: '',
        percentageIncreased: '0',
        category: '',
        genericDepartment: '',
        discountPercent: '0',
        location: '',
        payer: '',
      });
    }
    setErrors({});
  }, [charge, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleNumericChange = (field, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleChange(field, value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.cptCode.trim()) {
      newErrors.cptCode = 'CPT Code is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.revenueCode.trim()) {
      newErrors.revenueCode = 'Revenue Code is required';
    }
    if (!formData.priceEffectiveDate) {
      newErrors.priceEffectiveDate = 'Price Effective Date is required';
    }
    if (!formData.standardAmount || Number(formData.standardAmount) <= 0) {
      newErrors.standardAmount = 'Standard Amount is required and must be greater than 0';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      standardAmount: Number(formData.standardAmount),
      totalRevenue: formData.totalRevenue ? Number(formData.totalRevenue) : null,
      totalVolume: formData.totalVolume ? Number(formData.totalVolume) : null,
      percentageIncreased: Number(formData.percentageIncreased),
      discountPercent: Number(formData.discountPercent),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {charge ? 'Edit Charge' : 'Add Charge'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cptCode">CPT Code *</Label>
                <Input
                  id="cptCode"
                  value={formData.cptCode}
                  onChange={(e) => handleChange('cptCode', e.target.value)}
                  className={errors.cptCode ? 'border-destructive' : ''}
                  placeholder="Enter CPT code"
                />
                {errors.cptCode && (
                  <p className="text-xs text-destructive">{errors.cptCode}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={errors.description ? 'border-destructive' : ''}
                  placeholder="Enter description"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenueCode">Revenue Code *</Label>
                <Input
                  id="revenueCode"
                  value={formData.revenueCode}
                  onChange={(e) => handleChange('revenueCode', e.target.value)}
                  className={errors.revenueCode ? 'border-destructive' : ''}
                  placeholder="Enter revenue code"
                />
                {errors.revenueCode && (
                  <p className="text-xs text-destructive">{errors.revenueCode}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={errors.location ? 'border-destructive' : ''}
                  placeholder="Enter location"
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceEffectiveDate">Price Effective Date *</Label>
                <Input
                  id="priceEffectiveDate"
                  type="date"
                  value={formData.priceEffectiveDate}
                  onChange={(e) => handleChange('priceEffectiveDate', e.target.value)}
                  className={errors.priceEffectiveDate ? 'border-destructive' : ''}
                />
                {errors.priceEffectiveDate && (
                  <p className="text-xs text-destructive">{errors.priceEffectiveDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cptEffectiveDate">CPT Effective Date</Label>
                <Input
                  id="cptEffectiveDate"
                  type="date"
                  value={formData.cptEffectiveDate}
                  onChange={(e) => handleChange('cptEffectiveDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardAmount">Standard Amount *</Label>
                <Input
                  id="standardAmount"
                  type="text"
                  value={formData.standardAmount}
                  onChange={(e) => handleNumericChange('standardAmount', e.target.value)}
                  className={errors.standardAmount ? 'border-destructive' : ''}
                  placeholder="0.00"
                />
                {errors.standardAmount && (
                  <p className="text-xs text-destructive">{errors.standardAmount}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalRevenue">Total Revenue</Label>
                <Input
                  id="totalRevenue"
                  type="text"
                  value={formData.totalRevenue}
                  onChange={(e) => handleNumericChange('totalRevenue', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalVolume">Total Volume</Label>
                <Input
                  id="totalVolume"
                  type="text"
                  value={formData.totalVolume}
                  onChange={(e) => handleNumericChange('totalVolume', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentageIncreased">Percentage Increased</Label>
                <Input
                  id="percentageIncreased"
                  type="text"
                  value={formData.percentageIncreased}
                  onChange={(e) => handleNumericChange('percentageIncreased', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="Enter category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericDepartment">Generic Department</Label>
                <Input
                  id="genericDepartment"
                  value={formData.genericDepartment}
                  onChange={(e) => handleChange('genericDepartment', e.target.value)}
                  placeholder="Enter department"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input
                  id="discountPercent"
                  type="text"
                  value={formData.discountPercent}
                  onChange={(e) => handleNumericChange('discountPercent', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer">Payer</Label>
                <Input
                  id="payer"
                  value={formData.payer}
                  onChange={(e) => handleChange('payer', e.target.value)}
                  placeholder="Enter payer"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Close
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


