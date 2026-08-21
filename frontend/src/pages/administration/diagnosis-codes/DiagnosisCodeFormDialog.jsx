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
  ICD10_CHAPTERS,
  LATERALITY_VALUES,
  GENDER_RESTRICTIONS,
  isValidIcd10,
  normalizeIcd10,
  datesInOrder,
} from '@/lib/codeCatalog';

const emptyForm = () => ({
  code: '',
  shortDescription: '',
  description: '',
  chapter: '',
  isBillable: true,
  laterality: 'none',
  genderRestriction: 'none',
  ageMin: '',
  ageMax: '',
  hccCategory: '',
  isUnspecified: false,
  effectiveDate: '',
  expiryDate: '',
  isActive: true,
  codingNotes: '',
});

export function DiagnosisCodeFormDialog({ open, onOpenChange, record, mode = 'create', onSubmit, isLoading }) {
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
        chapter: record.chapter || '',
        isBillable: record.isBillable !== false,
        laterality: record.laterality || 'none',
        genderRestriction: record.genderRestriction || 'none',
        ageMin: record.ageMin != null ? String(record.ageMin) : '',
        ageMax: record.ageMax != null ? String(record.ageMax) : '',
        hccCategory: record.hccCategory || '',
        isUnspecified: !!record.isUnspecified,
        effectiveDate: record.effectiveDate || '',
        expiryDate: record.expiryDate || '',
        isActive: record.isActive !== false,
        codingNotes: record.codingNotes || '',
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
    const code = normalizeIcd10(formData.code);
    if (!code) newErrors.code = 'ICD code is required';
    else if (!isValidIcd10(code)) newErrors.code = 'Use ICD-10-CM format (e.g. E11.9)';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!datesInOrder(formData.effectiveDate, formData.expiryDate)) {
      newErrors.expiryDate = 'Expiry date cannot be before effective date';
    }
    if (formData.ageMin !== '' && formData.ageMax !== '' && Number(formData.ageMax) < Number(formData.ageMin)) {
      newErrors.ageMax = 'Maximum age cannot be less than minimum age';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      code,
      shortDescription: formData.shortDescription.trim() || null,
      description: formData.description.trim(),
      chapter: formData.chapter || null,
      isBillable: !!formData.isBillable,
      laterality: formData.laterality || null,
      genderRestriction: formData.genderRestriction || null,
      ageMin: formData.ageMin === '' ? null : Number(formData.ageMin),
      ageMax: formData.ageMax === '' ? null : Number(formData.ageMax),
      hccCategory: formData.hccCategory.trim() || null,
      isUnspecified: !!formData.isUnspecified,
      effectiveDate: formData.effectiveDate || null,
      expiryDate: formData.expiryDate || null,
      isActive: !!formData.isActive,
      codingNotes: formData.codingNotes.trim() || null,
    });
  };

  const title = isView ? 'View Diagnosis Code' : isEdit ? 'Edit Diagnosis Code' : 'Add Diagnosis Code';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="icdCode">ICD-10-CM code *</Label>
              <Input
                id="icdCode"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="e.g. E11.9"
                className={`font-mono ${errors.code ? 'border-destructive' : ''}`}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select
                value={formData.chapter || undefined}
                onValueChange={(value) => handleChange('chapter', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ICD chapter" />
                </SelectTrigger>
                <SelectContent>
                  {ICD10_CHAPTERS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icdShort">Short description</Label>
            <Input
              id="icdShort"
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              placeholder="Claim-friendly short text"
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Long description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Official ICD-10-CM description"
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Laterality</Label>
              <Select
                value={formData.laterality || 'none'}
                onValueChange={(value) => handleChange('laterality', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LATERALITY_VALUES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender restriction</Label>
              <Select
                value={formData.genderRestriction || 'none'}
                onValueChange={(value) => handleChange('genderRestriction', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_RESTRICTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hccCategory">HCC category</Label>
              <Input
                id="hccCategory"
                value={formData.hccCategory}
                onChange={(e) => handleChange('hccCategory', e.target.value)}
                placeholder="e.g. 19"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ageMin">Minimum age</Label>
              <Input
                id="ageMin"
                type="number"
                min={0}
                max={150}
                value={formData.ageMin}
                onChange={(e) => handleChange('ageMin', e.target.value)}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageMax">Maximum age</Label>
              <Input
                id="ageMax"
                type="number"
                min={0}
                max={150}
                value={formData.ageMax}
                onChange={(e) => handleChange('ageMax', e.target.value)}
                className={errors.ageMax ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.ageMax && <p className="text-xs text-destructive">{errors.ageMax}</p>}
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
              Billable (not a header code)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formData.isUnspecified}
                onCheckedChange={(checked) => handleChange('isUnspecified', !!checked)}
                disabled={readOnly || isLoading}
              />
              Unspecified
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="codingNotes">Coding notes</Label>
            <Textarea
              id="codingNotes"
              value={formData.codingNotes}
              onChange={(e) => handleChange('codingNotes', e.target.value)}
              placeholder="Excludes notes, laterality rules, or payer guidance"
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
