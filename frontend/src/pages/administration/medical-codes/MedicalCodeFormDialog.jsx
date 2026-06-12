import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { HCPCS_LEVEL_OPTIONS } from '@/pages/administration/medical-codes/medicalCodesAdminConfig';

const DIAGNOSIS_TYPE_FIELD_OPTIONS = [
  { value: 'primary', label: 'Primary / principal' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'external', label: 'External cause' },
  { value: 'manifestation', label: 'Manifestation' },
];

function normalizeIcdCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function MedicalCodeFormDialog({
  open,
  onOpenChange,
  config,
  record,
  readOnly = false,
  onSubmit,
  isLoading,
}) {
  const isEditing = !!record?.id;
  const [formData, setFormData] = useState(config.emptyForm());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setFormData(record ? config.rowToForm(record) : config.emptyForm());
    setErrors({});
  }, [record, open, config]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.code?.trim()) {
      newErrors.code = `${config.codeLabel} is required`;
    }
    if (config.formFields === 'hcpcs' && !formData.shortDescription?.trim()) {
      newErrors.shortDescription = 'Short description is required';
    }
    if (config.formFields === 'diagnosis' && !formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    if (config.formFields === 'diagnosis' && formData.code?.trim()) {
      const icd = normalizeIcdCode(formData.code);
      if (!/^[A-TV-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,7})?$/.test(icd)) {
        newErrors.code = 'Enter a valid ICD-10-CM format (e.g. J06.9, E11.9, S72.001A)';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    if (config.formFields === 'hcpcs') {
      onSubmit({
        code: formData.code.trim().toUpperCase(),
        shortDescription: formData.shortDescription.trim(),
        longDescription: formData.longDescription?.trim() || '',
        category: formData.category || '',
        codeLevel:
          formData.codeLevel ||
          (config.inferCodeLevel ? config.inferCodeLevel(formData.code) : 'national'),
        modifier: formData.modifier?.trim().toUpperCase() || '',
        defaultUnits: String(formData.defaultUnits || '1').trim(),
        revenueCode: formData.revenueCode?.trim() || '',
        billable: formData.billable,
        internalNotes: formData.internalNotes?.trim() || '',
        isActive: formData.isActive,
      });
      return;
    }

    onSubmit({
      code: normalizeIcdCode(formData.code),
      description: formData.description.trim(),
      category: formData.category || '',
      codeType: formData.codeType || 'primary',
      chronic: formData.chronic === true,
      billablePrimary: formData.billablePrimary,
      internalNotes: formData.internalNotes?.trim() || '',
      isActive: formData.isActive,
      effectiveFrom: formData.effectiveFrom || '',
      effectiveTo: formData.effectiveTo || '',
    });
  };

  const title = readOnly
    ? `View ${config.title.replace(/ Codes$/, ' Code')}`
    : isEditing
      ? `Edit ${config.title.replace(/ Codes$/, ' Code')}`
      : config.addLabel;

  const hcpcsLevelFieldOptions = HCPCS_LEVEL_OPTIONS.filter((o) => o.value !== 'all');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">{config.codeLabel} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder={config.formFields === 'hcpcs' ? '99213 or J1885' : 'J06.9'}
                disabled={readOnly || isLoading}
                className={`font-mono ${errors.code ? 'border-destructive' : ''}`}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>

            {config.formFields === 'hcpcs' ? (
              <div className="space-y-2">
                <Label htmlFor="codeLevel">Code level</Label>
                <Select
                  value={formData.codeLevel || 'national'}
                  onValueChange={(v) => handleChange('codeLevel', v)}
                  disabled={readOnly || isLoading}
                >
                  <SelectTrigger id="codeLevel">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {hcpcsLevelFieldOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="codeType">Diagnosis use type</Label>
                <Select
                  value={formData.codeType || 'primary'}
                  onValueChange={(v) => handleChange('codeType', v)}
                  disabled={readOnly || isLoading}
                >
                  <SelectTrigger id="codeType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_TYPE_FIELD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {config.formFields === 'hcpcs' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short description *</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  disabled={readOnly || isLoading}
                  className={errors.shortDescription ? 'border-destructive' : ''}
                />
                {errors.shortDescription && (
                  <p className="text-xs text-destructive">{errors.shortDescription}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="longDescription">Long description</Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) => handleChange('longDescription', e.target.value)}
                  disabled={readOnly || isLoading}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || 'none'}
                    onValueChange={(v) => handleChange('category', v === 'none' ? '' : v)}
                    disabled={readOnly || isLoading}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {config.categoryFieldOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modifier">Modifier</Label>
                  <Input
                    id="modifier"
                    value={formData.modifier}
                    onChange={(e) => handleChange('modifier', e.target.value)}
                    placeholder="26, TC, 59"
                    disabled={readOnly || isLoading}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultUnits">Default units</Label>
                  <Input
                    id="defaultUnits"
                    value={formData.defaultUnits}
                    onChange={(e) => handleChange('defaultUnits', e.target.value)}
                    disabled={readOnly || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenueCode">Revenue code</Label>
                  <Input
                    id="revenueCode"
                    value={formData.revenueCode}
                    onChange={(e) => handleChange('revenueCode', e.target.value)}
                    placeholder="0510"
                    disabled={readOnly || isLoading}
                    className="font-mono"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="billable"
                      checked={formData.billable}
                      onCheckedChange={(checked) => handleChange('billable', checked === true)}
                      disabled={readOnly || isLoading}
                    />
                    <Label htmlFor="billable" className="cursor-pointer font-normal">
                      Billable
                    </Label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={readOnly || isLoading}
                  rows={3}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">ICD-10 chapter</Label>
                <Select
                  value={formData.category || 'none'}
                  onValueChange={(v) => handleChange('category', v === 'none' ? '' : v)}
                  disabled={readOnly || isLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {config.categoryFieldOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="effectiveFrom">Effective from</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                    disabled={readOnly || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveTo">Effective to</Label>
                  <Input
                    id="effectiveTo"
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(e) => handleChange('effectiveTo', e.target.value)}
                    disabled={readOnly || isLoading}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="chronic"
                    checked={formData.chronic}
                    onCheckedChange={(checked) => handleChange('chronic', checked === true)}
                    disabled={readOnly || isLoading}
                  />
                  <Label htmlFor="chronic" className="cursor-pointer font-normal">
                    Chronic condition
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="billablePrimary"
                    checked={formData.billablePrimary}
                    onCheckedChange={(checked) =>
                      handleChange('billablePrimary', checked === true)
                    }
                    disabled={readOnly || isLoading}
                  />
                  <Label htmlFor="billablePrimary" className="cursor-pointer font-normal">
                    Billable as primary
                  </Label>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="internalNotes">
              {config.formFields === 'hcpcs' ? 'Internal / billing notes' : 'Coding notes'}
            </Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) => handleChange('internalNotes', e.target.value)}
              disabled={readOnly || isLoading}
              rows={2}
              placeholder="Payer rules, documentation tips, or pairing guidance..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked === true)}
              disabled={readOnly || isLoading}
            />
            <Label htmlFor="isActive" className="cursor-pointer font-normal">
              Active (available for selection in the EHR)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
