import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import {
  POS_CATEGORIES,
  emptyPlaceOfServiceForm,
  normalizePosCode,
} from '@/lib/placeOfServiceConstants';
import { datesInOrder } from '@/lib/codeCatalog';

export function PlaceOfServiceFormDialog({
  open,
  onOpenChange,
  record,
  mode = 'create',
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(emptyPlaceOfServiceForm());
  const [errors, setErrors] = useState({});

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;
  const codeLocked = isEdit && record?.cmsStandard;

  useEffect(() => {
    if (!open) return;

    if (record) {
      setFormData({
        ...emptyPlaceOfServiceForm(),
        code: record.code || '',
        name: record.name || '',
        description: record.description || '',
        category: record.category || '',
        cmsStandard: !!record.cmsStandard,
        isActive: record.isActive !== false,
        isBillable: record.isBillable !== false,
        isDefault: !!record.isDefault,
        effectiveDate: record.effectiveDate || '',
        expiryDate: record.expiryDate || '',
        sortOrder: record.sortOrder != null ? String(record.sortOrder) : '',
        codingNotes: record.codingNotes || '',
      });
    } else {
      setFormData(emptyPlaceOfServiceForm());
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
    const code = normalizePosCode(formData.code);
    if (!code) newErrors.code = 'POS code is required';
    else if (!/^\d{2}$/.test(code) || parseInt(code, 10) < 1) {
      newErrors.code = 'Use a 2-digit CMS code (01–99)';
    }
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!datesInOrder(formData.effectiveDate, formData.expiryDate)) {
      newErrors.expiryDate = 'Expiry date cannot be before effective date';
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    onSubmit?.({
      code,
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category || null,
      cmsStandard: formData.cmsStandard,
      isActive: formData.isActive,
      isBillable: formData.isBillable,
      isDefault: formData.isDefault,
      effectiveDate: formData.effectiveDate || null,
      expiryDate: formData.expiryDate || null,
      sortOrder: formData.sortOrder === '' ? null : Number(formData.sortOrder),
      codingNotes: formData.codingNotes.trim() || null,
    });
  };

  const title = isView
    ? 'View Place of Service'
    : isEdit
      ? 'Edit Place of Service'
      : 'Add Place of Service';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="posCode">POS code *</Label>
                <Input
                  id="posCode"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  onBlur={() => handleChange('code', normalizePosCode(formData.code))}
                  placeholder="11"
                  disabled={readOnly || codeLocked || isLoading}
                  readOnly={readOnly || codeLocked}
                  className={errors.code ? 'border-destructive' : ''}
                />
                {codeLocked && (
                  <p className="text-xs text-muted-foreground">CMS standard code cannot be changed.</p>
                )}
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="posName">Name *</Label>
                <Input
                  id="posName"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Office"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posDescription">Description *</Label>
              <Textarea
                id="posDescription"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Full CMS place of service description"
                rows={2}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <SearchableSelect
                  value={formData.category || undefined}
                  onValueChange={(v) => handleChange('category', v)}
                  options={POS_CATEGORIES}
                  placeholder="Select category"
                  disabled={readOnly || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => handleChange('sortOrder', e.target.value)}
                  placeholder="11"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="posActive"
                  checked={formData.isActive}
                  onCheckedChange={(c) => handleChange('isActive', !!c)}
                  disabled={readOnly || isLoading}
                />
                <Label htmlFor="posActive" className="font-normal">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="posBillable"
                  checked={formData.isBillable}
                  onCheckedChange={(c) => handleChange('isBillable', !!c)}
                  disabled={readOnly || isLoading}
                />
                <Label htmlFor="posBillable" className="font-normal">Billable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="posDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(c) => handleChange('isDefault', !!c)}
                  disabled={readOnly || isLoading}
                />
                <Label htmlFor="posDefault" className="font-normal">Facility default</Label>
              </div>
              {!record?.cmsStandard && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="posCmsStandard"
                    checked={formData.cmsStandard}
                    onCheckedChange={(c) => handleChange('cmsStandard', !!c)}
                    disabled={readOnly || isLoading || isEdit}
                  />
                  <Label htmlFor="posCmsStandard" className="font-normal">CMS standard</Label>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="expiryDate">Expiry date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                  className={errors.expiryDate ? 'border-destructive' : ''}
                />
                {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codingNotes">Coding notes</Label>
              <Textarea
                id="codingNotes"
                value={formData.codingNotes}
                onChange={(e) => handleChange('codingNotes', e.target.value)}
                placeholder="Internal billing notes (not printed on claim)"
                rows={2}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Save'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
