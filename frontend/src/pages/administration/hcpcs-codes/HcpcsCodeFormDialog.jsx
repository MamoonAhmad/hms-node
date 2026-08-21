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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HCPCS_CATEGORIES,
  COVERAGE_STATUSES,
  UNIT_TYPES,
  isValidHcpcs,
  isValidRevenueCode,
  isValidModifier,
  datesInOrder,
} from '@/lib/codeCatalog';
import { PlaceOfServiceSelect } from '@/components/rcm/PlaceOfServiceSelect';

const emptyForm = () => ({
  code: '',
  shortDescription: '',
  description: '',
  category: '',
  isActive: true,
  isBillable: true,
  coverageStatus: 'covered',
  ndcRequired: false,
  defaultModifier: '',
  revenueCode: '',
  unitPrice: '',
  unitType: 'unit',
  placeOfService: '11',
  codingNotes: '',
  effectiveDate: '',
  expiryDate: '',
});

export function HcpcsCodeFormDialog({ open, onOpenChange, record, mode = 'create', onSubmit, isLoading }) {
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;

    if (record) {
      setFormData({
        ...emptyForm(),
        code: record.code || '',
        shortDescription: record.shortDescription || '',
        description: record.description || '',
        category: record.category || '',
        isActive: record.isActive !== false,
        isBillable: record.isBillable !== false,
        coverageStatus: record.coverageStatus || 'covered',
        ndcRequired: !!record.ndcRequired,
        defaultModifier: record.defaultModifier || '',
        revenueCode: record.revenueCode || '',
        unitPrice: record.unitPrice != null ? String(record.unitPrice) : '',
        unitType: record.unitType || 'unit',
        placeOfService: record.placeOfService || '11',
        codingNotes: record.codingNotes || '',
        effectiveDate: record.effectiveDate || '',
        expiryDate: record.expiryDate || '',
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [record, open, mode]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const newErrors = {};
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    else if (!isValidHcpcs(formData.code)) newErrors.code = 'Use HCPCS Level II format (e.g. J1885)';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!isValidRevenueCode(formData.revenueCode)) newErrors.revenueCode = 'Revenue code must be 3 or 4 digits';
    if (!isValidModifier(formData.defaultModifier)) newErrors.defaultModifier = 'Modifier must be 2 characters';
    if (!datesInOrder(formData.effectiveDate, formData.expiryDate)) {
      newErrors.expiryDate = 'Expiry date cannot be before effective date';
    }
    if (formData.unitPrice !== '' && Number(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      code: formData.code.trim().toUpperCase(),
      shortDescription: formData.shortDescription.trim() || null,
      description: formData.description.trim(),
      category: formData.category || formData.code.trim().charAt(0).toUpperCase(),
      isActive: !!formData.isActive,
      isBillable: !!formData.isBillable,
      coverageStatus: formData.coverageStatus,
      ndcRequired: !!formData.ndcRequired,
      defaultModifier: formData.defaultModifier.trim().toUpperCase() || null,
      revenueCode: formData.revenueCode.trim() || null,
      unitPrice: formData.unitPrice === '' ? null : Number(formData.unitPrice),
      unitType: formData.unitType || null,
      placeOfService: formData.placeOfService.trim() || null,
      codingNotes: formData.codingNotes.trim() || null,
      effectiveDate: formData.effectiveDate || null,
      expiryDate: formData.expiryDate || null,
    });
  };

  const title = isView ? 'View HCPCS Code' : isEdit ? 'Edit HCPCS Code' : 'Add HCPCS Code';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hcpcsCode">HCPCS Code *</Label>
              <Input
                id="hcpcsCode"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="e.g. J1885"
                className={`font-mono ${errors.code ? 'border-destructive' : ''}`}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hcpcsCategory">Category</Label>
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => handleChange('category', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="hcpcsCategory">
                  <SelectValue placeholder="Auto from first letter" />
                </SelectTrigger>
                <SelectContent>
                  {HCPCS_CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hcpcsShort">Short description</Label>
            <Input
              id="hcpcsShort"
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              placeholder="Claim-friendly short text"
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hcpcsDescription">Long description *</Label>
            <Textarea
              id="hcpcsDescription"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Official HCPCS description"
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Coverage</Label>
              <Select
                value={formData.coverageStatus}
                onValueChange={(value) => handleChange('coverageStatus', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVERAGE_STATUSES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hcpcsRevenue">Revenue code</Label>
              <Input
                id="hcpcsRevenue"
                value={formData.revenueCode}
                onChange={(e) => handleChange('revenueCode', e.target.value)}
                placeholder="0636"
                className={errors.revenueCode ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.revenueCode && <p className="text-xs text-destructive">{errors.revenueCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hcpcsMod">Default modifier</Label>
              <Input
                id="hcpcsMod"
                value={formData.defaultModifier}
                onChange={(e) => handleChange('defaultModifier', e.target.value.toUpperCase())}
                placeholder="JW"
                maxLength={2}
                className={errors.defaultModifier ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.defaultModifier && <p className="text-xs text-destructive">{errors.defaultModifier}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hcpcsPrice">Unit price</Label>
              <Input
                id="hcpcsPrice"
                value={formData.unitPrice}
                onChange={(e) => handleChange('unitPrice', e.target.value)}
                placeholder="0.00"
                className={errors.unitPrice ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice}</p>}
            </div>
            <div className="space-y-2">
              <Label>Unit type</Label>
              <Select
                value={formData.unitType || undefined}
                onValueChange={(value) => handleChange('unitType', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hcpcsPos">Place of service</Label>
              <PlaceOfServiceSelect
                value={formData.placeOfService}
                onValueChange={(v) => handleChange('placeOfService', v)}
                placeholder="Select POS"
                disabled={readOnly || isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleChange('effectiveDate', e.target.value)}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Termination date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                className={errors.expiryDate ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', !!checked)}
                disabled={readOnly || isLoading}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.isBillable}
                onCheckedChange={(checked) => handleChange('isBillable', !!checked)}
                disabled={readOnly || isLoading}
              />
              Billable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.ndcRequired}
                onCheckedChange={(checked) => handleChange('ndcRequired', !!checked)}
                disabled={readOnly || isLoading}
              />
              NDC required
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hcpcsNotes">Coding notes</Label>
            <Textarea
              id="hcpcsNotes"
              value={formData.codingNotes}
              onChange={(e) => handleChange('codingNotes', e.target.value)}
              placeholder="Coverage, units, NDC, or payer-specific guidance"
              rows={3}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>

          <DialogFooter className="gap-2">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
