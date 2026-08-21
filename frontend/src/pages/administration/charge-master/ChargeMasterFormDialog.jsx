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
import { departmentApi } from '@/services/api';
import {
  CPT_CODE_TYPES,
  isValidCpt,
  isValidHcpcs,
  isValidRevenueCode,
  isValidModifier,
  datesInOrder,
} from '@/lib/codeCatalog';
import { PlaceOfServiceSelect } from '@/components/rcm/PlaceOfServiceSelect';

const emptyForm = () => ({
  chargeCode: '',
  cptCode: '',
  codeType: 'CPT',
  description: '',
  revenueCode: '',
  standardAmount: '',
  cashPrice: '',
  cost: '',
  discountPercent: '0',
  priceEffectiveDate: '',
  priceExpiryDate: '',
  cptEffectiveDate: '',
  location: '',
  departmentId: '',
  payer: '',
  placeOfService: '11',
  defaultUnits: '1',
  ndcCode: '',
  taxable: false,
  isActive: true,
  isBillable: true,
  mod1: '',
  mod2: '',
  mod3: '',
  mod4: '',
});

export function ChargeMasterFormDialog({ open, onOpenChange, charge, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!open) return;
    departmentApi
      .getAll({ limit: 500, status: 'active' })
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, [open]);

  useEffect(() => {
    if (charge && open) {
      setFormData({
        ...emptyForm(),
        chargeCode: charge.chargeCode || '',
        cptCode: charge.cptCode || '',
        codeType: charge.codeType || 'CPT',
        description: charge.description || '',
        revenueCode: charge.revenueCode || '',
        standardAmount: charge.standardAmount != null ? String(charge.standardAmount) : '',
        cashPrice: charge.cashPrice != null ? String(charge.cashPrice) : '',
        cost: charge.cost != null ? String(charge.cost) : '',
        discountPercent: charge.discountPercent != null ? String(charge.discountPercent) : '0',
        priceEffectiveDate: charge.priceEffectiveDate || '',
        priceExpiryDate: charge.priceExpiryDate || '',
        cptEffectiveDate: charge.cptEffectiveDate || charge.effectiveDate || '',
        location: charge.location || '',
        departmentId: charge.departmentId || '',
        payer: charge.payer || charge.payerName || '',
        placeOfService: charge.placeOfService || '11',
        defaultUnits: charge.defaultUnits != null ? String(charge.defaultUnits) : '1',
        ndcCode: charge.ndcCode || '',
        taxable: !!charge.taxable,
        isActive: charge.isActive !== false,
        isBillable: charge.isBillable !== false,
        mod1: charge.mod1 || '',
        mod2: charge.mod2 || '',
        mod3: charge.mod3 || '',
        mod4: charge.mod4 || '',
      });
    } else if (open) {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [charge, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.cptCode.trim()) newErrors.cptCode = 'CPT or HCPCS code is required';
    else if (!isValidCpt(formData.cptCode) && !isValidHcpcs(formData.cptCode)) {
      newErrors.cptCode = 'Use a 5-digit CPT or HCPCS Level II code';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.revenueCode.trim()) newErrors.revenueCode = 'Revenue code is required';
    else if (!isValidRevenueCode(formData.revenueCode)) newErrors.revenueCode = 'Revenue code must be 3 or 4 digits';
    if (!formData.standardAmount || Number(formData.standardAmount) <= 0) {
      newErrors.standardAmount = 'Standard amount must be greater than 0';
    }
    if (formData.discountPercent !== '' && (Number(formData.discountPercent) < 0 || Number(formData.discountPercent) > 100)) {
      newErrors.discountPercent = 'Discount must be between 0 and 100';
    }
    if (!datesInOrder(formData.priceEffectiveDate, formData.priceExpiryDate)) {
      newErrors.priceExpiryDate = 'Price expiry cannot be before effective date';
    }
    ['mod1', 'mod2', 'mod3', 'mod4'].forEach((mod) => {
      if (!isValidModifier(formData[mod])) newErrors[mod] = '2 characters';
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      chargeCode: formData.chargeCode.trim() || null,
      cptCode: formData.cptCode.trim().toUpperCase(),
      codeType: formData.codeType,
      description: formData.description.trim(),
      revenueCode: formData.revenueCode.trim(),
      standardAmount: Number(formData.standardAmount),
      cashPrice: formData.cashPrice === '' ? null : Number(formData.cashPrice),
      cost: formData.cost === '' ? null : Number(formData.cost),
      discountPercent: formData.discountPercent === '' ? 0 : Number(formData.discountPercent),
      priceEffectiveDate: formData.priceEffectiveDate || null,
      priceExpiryDate: formData.priceExpiryDate || null,
      cptEffectiveDate: formData.cptEffectiveDate || null,
      location: formData.location.trim() || null,
      departmentId: formData.departmentId || null,
      payer: formData.payer.trim() || null,
      payerName: formData.payer.trim() || null,
      placeOfService: formData.placeOfService.trim() || '11',
      defaultUnits: formData.defaultUnits === '' ? 1 : Number(formData.defaultUnits),
      ndcCode: formData.ndcCode.trim() || null,
      taxable: !!formData.taxable,
      isActive: !!formData.isActive,
      isBillable: !!formData.isBillable,
      mod1: formData.mod1.trim().toUpperCase() || null,
      mod2: formData.mod2.trim().toUpperCase() || null,
      mod3: formData.mod3.trim().toUpperCase() || null,
      mod4: formData.mod4.trim().toUpperCase() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{charge ? 'Edit Charge Master Entry' : 'Add Charge Master Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chargeCode">Internal charge code</Label>
                <Input
                  id="chargeCode"
                  value={formData.chargeCode}
                  onChange={(e) => handleChange('chargeCode', e.target.value.toUpperCase())}
                  placeholder="CDM-99213"
                />
              </div>
              <div className="space-y-2">
                <Label>Code type</Label>
                <Select value={formData.codeType} onValueChange={(value) => handleChange('codeType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CPT_CODE_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cptCode">CPT / HCPCS *</Label>
                <Input
                  id="cptCode"
                  value={formData.cptCode}
                  onChange={(e) => handleChange('cptCode', e.target.value.toUpperCase())}
                  className={`font-mono ${errors.cptCode ? 'border-destructive' : ''}`}
                  placeholder="99213"
                />
                {errors.cptCode && <p className="text-xs text-destructive">{errors.cptCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueCode">Revenue code *</Label>
                <Input
                  id="revenueCode"
                  value={formData.revenueCode}
                  onChange={(e) => handleChange('revenueCode', e.target.value)}
                  className={errors.revenueCode ? 'border-destructive' : ''}
                  placeholder="0510"
                />
                {errors.revenueCode && <p className="text-xs text-destructive">{errors.revenueCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardAmount">Standard amount *</Label>
                <Input
                  id="standardAmount"
                  value={formData.standardAmount}
                  onChange={(e) => handleChange('standardAmount', e.target.value)}
                  className={errors.standardAmount ? 'border-destructive' : ''}
                  placeholder="0.00"
                />
                {errors.standardAmount && <p className="text-xs text-destructive">{errors.standardAmount}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashPrice">Cash / self-pay price</Label>
                <Input
                  id="cashPrice"
                  value={formData.cashPrice}
                  onChange={(e) => handleChange('cashPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input id="cost" value={formData.cost} onChange={(e) => handleChange('cost', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input
                  id="discountPercent"
                  value={formData.discountPercent}
                  onChange={(e) => handleChange('discountPercent', e.target.value)}
                  className={errors.discountPercent ? 'border-destructive' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceEffectiveDate">Price effective date</Label>
                <Input
                  id="priceEffectiveDate"
                  type="date"
                  value={formData.priceEffectiveDate}
                  onChange={(e) => handleChange('priceEffectiveDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceExpiryDate">Price expiry date</Label>
                <Input
                  id="priceExpiryDate"
                  type="date"
                  value={formData.priceExpiryDate}
                  onChange={(e) => handleChange('priceExpiryDate', e.target.value)}
                  className={errors.priceExpiryDate ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cptEffectiveDate">Code effective date</Label>
                <Input
                  id="cptEffectiveDate"
                  type="date"
                  value={formData.cptEffectiveDate}
                  onChange={(e) => handleChange('cptEffectiveDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Main Campus"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.departmentId || undefined}
                  onValueChange={(value) => handleChange('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer">Default payer / contract</Label>
                <Input
                  id="payer"
                  value={formData.payer}
                  onChange={(e) => handleChange('payer', e.target.value)}
                  placeholder="Standard fee schedule"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placeOfService">Place of service</Label>
                <PlaceOfServiceSelect
                  value={formData.placeOfService}
                  onValueChange={(v) => handleChange('placeOfService', v)}
                  placeholder="Select POS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultUnits">Default units</Label>
                <Input
                  id="defaultUnits"
                  value={formData.defaultUnits}
                  onChange={(e) => handleChange('defaultUnits', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ndcCode">NDC</Label>
                <Input
                  id="ndcCode"
                  value={formData.ndcCode}
                  onChange={(e) => handleChange('ndcCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['mod1', 'mod2', 'mod3', 'mod4'].map((mod, index) => (
                <div key={mod} className="space-y-2">
                  <Label htmlFor={mod}>Mod {index + 1}</Label>
                  <Input
                    id={mod}
                    value={formData[mod]}
                    maxLength={2}
                    onChange={(e) => handleChange(mod, e.target.value.toUpperCase())}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={formData.isActive} onCheckedChange={(checked) => handleChange('isActive', !!checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={formData.isBillable} onCheckedChange={(checked) => handleChange('isBillable', !!checked)} />
                Billable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={formData.taxable} onCheckedChange={(checked) => handleChange('taxable', !!checked)} />
                Taxable
              </label>
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
