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

const CATEGORY_OPTIONS = [
  'Evaluation & Management',
  'Laboratory',
  'Radiology',
  'Surgery',
  'Medicine',
  'Therapy',
  'Supplies',
  'Other',
];

const emptyForm = () => ({
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
  isActive: true,
});

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function ChargeMasterFormDialog({
  open,
  onOpenChange,
  charge,
  mode = 'create',
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;
    if (charge) {
      setFormData({
        cptCode: charge.cptCode || '',
        description: charge.description || '',
        revenueCode: charge.revenueCode || '',
        priceEffectiveDate: toDateInput(charge.priceEffectiveDate),
        cptEffectiveDate: toDateInput(charge.cptEffectiveDate),
        standardAmount:
          charge.standardAmount != null && charge.standardAmount !== ''
            ? String(charge.standardAmount)
            : '',
        totalRevenue:
          charge.totalRevenue != null && charge.totalRevenue !== ''
            ? String(charge.totalRevenue)
            : '',
        totalVolume:
          charge.totalVolume != null && charge.totalVolume !== ''
            ? String(charge.totalVolume)
            : '',
        percentageIncreased: charge.percentageIncreased?.toString() || '0',
        category: charge.category || '',
        genericDepartment: charge.genericDepartment || '',
        discountPercent: charge.discountPercent?.toString() || '0',
        location: charge.location || '',
        payer: charge.payer || '',
        isActive: charge.isActive !== false,
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [charge, open, mode]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleNumericChange = (field, value) => {
    if (readOnly) return;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleChange(field, value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const newErrors = {};
    if (!formData.cptCode.trim()) newErrors.cptCode = 'CPT Code is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.revenueCode.trim()) newErrors.revenueCode = 'Revenue Code is required';
    if (!formData.priceEffectiveDate) {
      newErrors.priceEffectiveDate = 'Price Effective Date is required';
    }
    if (!formData.standardAmount || Number(formData.standardAmount) <= 0) {
      newErrors.standardAmount = 'Standard Amount is required and must be greater than 0';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      cptCode: formData.cptCode.trim(),
      description: formData.description.trim(),
      revenueCode: formData.revenueCode.trim(),
      priceEffectiveDate: formData.priceEffectiveDate,
      cptEffectiveDate: formData.cptEffectiveDate || null,
      standardAmount: Number(formData.standardAmount),
      totalRevenue: formData.totalRevenue ? Number(formData.totalRevenue) : null,
      totalVolume: formData.totalVolume ? Number(formData.totalVolume) : null,
      percentageIncreased: Number(formData.percentageIncreased || 0),
      category: formData.category.trim() || null,
      genericDepartment: formData.genericDepartment.trim() || null,
      discountPercent: Number(formData.discountPercent || 0),
      location: formData.location.trim(),
      payer: formData.payer.trim() || null,
      isActive: !!formData.isActive,
    });
  };

  const title = isView
    ? 'View Charge Master'
    : isEdit
      ? 'Edit Charge Master'
      : 'Add Charge Master';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[720px] max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cptCode">CPT Code *</Label>
                <Input
                  id="cptCode"
                  value={formData.cptCode}
                  onChange={(e) => handleChange('cptCode', e.target.value)}
                  className={`font-mono ${errors.cptCode ? 'border-destructive' : ''}`}
                  placeholder="e.g. 99213"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.cptCode ? (
                  <p className="text-xs text-destructive">{errors.cptCode}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueCode">Revenue Code *</Label>
                <Input
                  id="revenueCode"
                  value={formData.revenueCode}
                  onChange={(e) => handleChange('revenueCode', e.target.value)}
                  className={`font-mono ${errors.revenueCode ? 'border-destructive' : ''}`}
                  placeholder="e.g. 0510"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.revenueCode ? (
                  <p className="text-xs text-destructive">{errors.revenueCode}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={errors.description ? 'border-destructive' : ''}
                placeholder="Service / charge description"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.description ? (
                <p className="text-xs text-destructive">{errors.description}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location / Facility *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={errors.location ? 'border-destructive' : ''}
                  placeholder="e.g. Main Facility"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.location ? (
                  <p className="text-xs text-destructive">{errors.location}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericDepartment">Department</Label>
                <Input
                  id="genericDepartment"
                  value={formData.genericDepartment}
                  onChange={(e) => handleChange('genericDepartment', e.target.value)}
                  placeholder="e.g. Outpatient Clinic"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                {readOnly ? (
                  <Input value={formData.category || '—'} disabled readOnly />
                ) : (
                  <Select
                    value={formData.category || 'none'}
                    onValueChange={(v) => handleChange('category', v === 'none' ? '' : v)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select</SelectItem>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer">Payer</Label>
                <Input
                  id="payer"
                  value={formData.payer}
                  onChange={(e) => handleChange('payer', e.target.value)}
                  placeholder="e.g. Self Pay / Medicare / Commercial"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceEffectiveDate">Price Effective Date *</Label>
                <Input
                  id="priceEffectiveDate"
                  type="date"
                  value={formData.priceEffectiveDate}
                  onChange={(e) => handleChange('priceEffectiveDate', e.target.value)}
                  className={errors.priceEffectiveDate ? 'border-destructive' : ''}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.priceEffectiveDate ? (
                  <p className="text-xs text-destructive">{errors.priceEffectiveDate}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cptEffectiveDate">CPT Effective Date</Label>
                <Input
                  id="cptEffectiveDate"
                  type="date"
                  value={formData.cptEffectiveDate}
                  onChange={(e) => handleChange('cptEffectiveDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardAmount">Standard Amount *</Label>
                <Input
                  id="standardAmount"
                  type="text"
                  value={formData.standardAmount}
                  onChange={(e) => handleNumericChange('standardAmount', e.target.value)}
                  className={errors.standardAmount ? 'border-destructive' : ''}
                  placeholder="0.00"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.standardAmount ? (
                  <p className="text-xs text-destructive">{errors.standardAmount}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input
                  id="discountPercent"
                  type="text"
                  value={formData.discountPercent}
                  onChange={(e) => handleNumericChange('discountPercent', e.target.value)}
                  placeholder="0"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentageIncreased">% Increased</Label>
                <Input
                  id="percentageIncreased"
                  type="text"
                  value={formData.percentageIncreased}
                  onChange={(e) => handleNumericChange('percentageIncreased', e.target.value)}
                  placeholder="0"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalRevenue">Total Revenue</Label>
                <Input
                  id="totalRevenue"
                  type="text"
                  value={formData.totalRevenue}
                  onChange={(e) => handleNumericChange('totalRevenue', e.target.value)}
                  placeholder="0.00"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalVolume">Total Volume</Label>
                <Input
                  id="totalVolume"
                  type="text"
                  value={formData.totalVolume}
                  onChange={(e) => handleNumericChange('totalVolume', e.target.value)}
                  placeholder="0"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="isActive"
                checked={!!formData.isActive}
                onCheckedChange={(c) => handleChange('isActive', !!c)}
                disabled={readOnly || isLoading}
              />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {isView ? 'Close' : 'Cancel'}
            </Button>
            {!isView ? (
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
