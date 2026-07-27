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
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  STRENGTH_UNITS,
  DOSAGE_FORMS,
  ROUTES,
  CONTROLLED_SCHEDULES,
  FREQUENCIES,
  DURATION_UNITS,
  MEDICATION_CATEGORIES,
  emptyMedicineForm,
} from './medicineConstants';

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function MedicineFormDialog({
  open,
  onOpenChange,
  record,
  mode = 'create',
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(emptyMedicineForm());
  const [errors, setErrors] = useState({});
  const [submitIntent, setSubmitIntent] = useState('save');

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;
    if (record) {
      setFormData({
        name: record.name || '',
        genericName: record.genericName || '',
        brandName: record.brandName || '',
        code: record.code || '',
        ndc: record.ndc || '',
        strength: record.strength || '',
        strengthUnit: record.strengthUnit || '',
        dosageForm: record.dosageForm || '',
        route: Array.isArray(record.route) ? record.route : [],
        medicationClass: record.medicationClass || '',
        manufacturer: record.manufacturer || '',
        isControlledSubstance: !!record.isControlledSubstance,
        controlledSubstanceSchedule: record.controlledSubstanceSchedule || '',
        prescriptionRequired: record.prescriptionRequired !== false,
        defaultFrequency: record.defaultFrequency || '',
        defaultDose: record.defaultDose || '',
        defaultDoseUnit: record.defaultDoseUnit || '',
        defaultDuration: record.defaultDuration ?? '',
        durationUnit: record.durationUnit || '',
        defaultQuantity: record.defaultQuantity ?? '',
        refillAllowed: record.refillAllowed !== false,
        maximumRefills: record.maximumRefills ?? '',
        description: record.description || '',
        instructions: record.instructions || '',
        effectiveDate: toDateInput(record.effectiveDate),
        expiryDate: toDateInput(record.expiryDate),
        isActive: record.isActive !== false,
      });
    } else {
      setFormData(emptyMedicineForm());
    }
    setErrors({});
    setSubmitIntent('save');
  }, [record, open, mode]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'isControlledSubstance' && !value) {
        next.controlledSubstanceSchedule = '';
      }
      if (field === 'defaultDuration' && (value === '' || value == null)) {
        next.durationUnit = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Medication Name is required';
    if (!formData.genericName.trim()) newErrors.genericName = 'Generic Name is required';
    if (!String(formData.strength).trim()) newErrors.strength = 'Strength is required';
    if (!formData.strengthUnit) newErrors.strengthUnit = 'Strength Unit is required';
    if (!formData.dosageForm) newErrors.dosageForm = 'Dosage Form is required';
    if (!formData.route?.length) newErrors.route = 'At least one Route is required';

    const numericFields = [
      ['strength', formData.strength],
      ['defaultDose', formData.defaultDose],
      ['defaultDuration', formData.defaultDuration],
      ['defaultQuantity', formData.defaultQuantity],
      ['maximumRefills', formData.maximumRefills],
    ];
    numericFields.forEach(([key, value]) => {
      if (value === '' || value == null) return;
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) {
        newErrors[key] = 'Must be a non-negative number';
      }
    });

    if (formData.isControlledSubstance && !formData.controlledSubstanceSchedule) {
      newErrors.controlledSubstanceSchedule =
        'Controlled Substance Schedule is required when Controlled Substance is Yes';
    }
    if (
      formData.defaultDuration !== '' &&
      formData.defaultDuration != null &&
      !formData.durationUnit
    ) {
      newErrors.durationUnit = 'Duration Unit is required when Default Duration is entered';
    }
    if (formData.effectiveDate && formData.expiryDate && formData.expiryDate < formData.effectiveDate) {
      newErrors.expiryDate = 'Expiry Date must not be earlier than Effective Date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    genericName: formData.genericName.trim(),
    brandName: formData.brandName.trim() || null,
    code: formData.code.trim() || null,
    ndc: formData.ndc.trim() || null,
    strength: String(formData.strength).trim(),
    strengthUnit: formData.strengthUnit,
    dosageForm: formData.dosageForm,
    route: formData.route,
    medicationClass: formData.medicationClass || null,
    manufacturer: formData.manufacturer.trim() || null,
    isControlledSubstance: !!formData.isControlledSubstance,
    controlledSubstanceSchedule: formData.isControlledSubstance
      ? formData.controlledSubstanceSchedule || null
      : null,
    prescriptionRequired: !!formData.prescriptionRequired,
    defaultFrequency: formData.defaultFrequency || null,
    defaultDose: formData.defaultDose !== '' ? String(formData.defaultDose).trim() : null,
    defaultDoseUnit: formData.defaultDoseUnit || null,
    defaultDuration:
      formData.defaultDuration === '' || formData.defaultDuration == null
        ? null
        : Number(formData.defaultDuration),
    durationUnit: formData.durationUnit || null,
    defaultQuantity:
      formData.defaultQuantity === '' || formData.defaultQuantity == null
        ? null
        : Number(formData.defaultQuantity),
    refillAllowed: !!formData.refillAllowed,
    maximumRefills:
      formData.maximumRefills === '' || formData.maximumRefills == null
        ? null
        : Number(formData.maximumRefills),
    description: formData.description.trim() || null,
    instructions: formData.instructions.trim() || null,
    effectiveDate: formData.effectiveDate || null,
    expiryDate: formData.expiryDate || null,
    isActive: !!formData.isActive,
  });

  const handleSubmit = (e, intent = 'save') => {
    e?.preventDefault?.();
    if (readOnly) return;
    if (!validate()) return;
    setSubmitIntent(intent);
    onSubmit(buildPayload(), { intent });
  };

  const title = isView
    ? 'View Medication'
    : isEdit
      ? 'Edit Medication'
      : 'Add Medication';

  const routeOptions = ROUTES.map((r) => ({ value: r, label: r }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[640px] max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Amoxicillin"
                className={errors.name ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genericName">Generic Name *</Label>
              <Input
                id="genericName"
                value={formData.genericName}
                onChange={(e) => handleChange('genericName', e.target.value)}
                placeholder="e.g. Amoxicillin"
                className={errors.genericName ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.genericName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => handleChange('brandName', e.target.value)}
                placeholder="e.g. Amoxil"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Medication Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Auto-generated if left blank"
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ndc">NDC Code</Label>
              <Input
                id="ndc"
                value={formData.ndc}
                onChange={(e) => handleChange('ndc', e.target.value)}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Strength *</Label>
              <Input
                id="strength"
                value={formData.strength}
                onChange={(e) => handleChange('strength', e.target.value)}
                placeholder="e.g. 500"
                className={errors.strength ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.strength} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengthUnit">Strength Unit *</Label>
              <Select
                value={formData.strengthUnit || 'none'}
                onValueChange={(v) => handleChange('strengthUnit', v === 'none' ? '' : v)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="strengthUnit" className={errors.strengthUnit ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select unit</SelectItem>
                  {STRENGTH_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.strengthUnit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosageForm">Dosage Form *</Label>
              <Select
                value={formData.dosageForm || 'none'}
                onValueChange={(v) => handleChange('dosageForm', v === 'none' ? '' : v)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="dosageForm" className={errors.dosageForm ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select form</SelectItem>
                  {DOSAGE_FORMS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.dosageForm} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Route *</Label>
              <div className={readOnly || isLoading ? 'pointer-events-none opacity-60' : undefined}>
                <MultiSelect
                  options={routeOptions}
                  value={formData.route}
                  onChange={(v) => handleChange('route', v)}
                  placeholder="Select routes"
                  searchable
                />
              </div>
              <FieldError message={errors.route} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicationClass">Medication Category</Label>
              <Select
                value={formData.medicationClass || 'none'}
                onValueChange={(v) => handleChange('medicationClass', v === 'none' ? '' : v)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="medicationClass">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select category</SelectItem>
                  {MEDICATION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                id="isControlledSubstance"
                checked={formData.isControlledSubstance}
                onCheckedChange={(checked) => handleChange('isControlledSubstance', !!checked)}
                disabled={readOnly || isLoading}
              />
              <Label htmlFor="isControlledSubstance" className="cursor-pointer">
                Controlled Substance *
              </Label>
            </div>
            {formData.isControlledSubstance && (
              <div className="space-y-2">
                <Label htmlFor="controlledSubstanceSchedule">Controlled Substance Schedule *</Label>
                <Select
                  value={formData.controlledSubstanceSchedule || 'none'}
                  onValueChange={(v) =>
                    handleChange('controlledSubstanceSchedule', v === 'none' ? '' : v)
                  }
                  disabled={readOnly || isLoading}
                >
                  <SelectTrigger
                    id="controlledSubstanceSchedule"
                    className={errors.controlledSubstanceSchedule ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select schedule</SelectItem>
                    {CONTROLLED_SCHEDULES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.controlledSubstanceSchedule} />
              </div>
            )}
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                id="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onCheckedChange={(checked) => handleChange('prescriptionRequired', !!checked)}
                disabled={readOnly || isLoading}
              />
              <Label htmlFor="prescriptionRequired" className="cursor-pointer">
                Prescription Required *
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                id="refillAllowed"
                checked={formData.refillAllowed}
                onCheckedChange={(checked) => handleChange('refillAllowed', !!checked)}
                disabled={readOnly || isLoading}
              />
              <Label htmlFor="refillAllowed" className="cursor-pointer">
                Refill Allowed *
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultFrequency">Default Frequency</Label>
              <Select
                value={formData.defaultFrequency || 'none'}
                onValueChange={(v) => handleChange('defaultFrequency', v === 'none' ? '' : v)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="defaultFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select frequency</SelectItem>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDose">Default Dose</Label>
              <Input
                id="defaultDose"
                value={formData.defaultDose}
                onChange={(e) => handleChange('defaultDose', e.target.value)}
                className={errors.defaultDose ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.defaultDose} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDoseUnit">Default Dose Unit</Label>
              <Select
                value={formData.defaultDoseUnit || 'none'}
                onValueChange={(v) => handleChange('defaultDoseUnit', v === 'none' ? '' : v)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="defaultDoseUnit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select unit</SelectItem>
                  {STRENGTH_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Default Duration</Label>
              <Input
                id="defaultDuration"
                type="number"
                min="0"
                value={formData.defaultDuration}
                onChange={(e) => handleChange('defaultDuration', e.target.value)}
                className={errors.defaultDuration ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.defaultDuration} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationUnit">
                Duration Unit{formData.defaultDuration !== '' && formData.defaultDuration != null ? ' *' : ''}
              </Label>
              <Select
                value={formData.durationUnit || 'none'}
                onValueChange={(v) => handleChange('durationUnit', v === 'none' ? '' : v)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger
                  id="durationUnit"
                  className={errors.durationUnit ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select unit</SelectItem>
                  {DURATION_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.durationUnit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultQuantity">Default Quantity</Label>
              <Input
                id="defaultQuantity"
                type="number"
                min="0"
                value={formData.defaultQuantity}
                onChange={(e) => handleChange('defaultQuantity', e.target.value)}
                className={errors.defaultQuantity ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.defaultQuantity} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maximumRefills">Maximum Refills</Label>
              <Input
                id="maximumRefills"
                type="number"
                min="0"
                value={formData.maximumRefills}
                onChange={(e) => handleChange('maximumRefills', e.target.value)}
                className={errors.maximumRefills ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.maximumRefills} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
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
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                min={formData.effectiveDate || undefined}
                className={errors.expiryDate ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              <FieldError message={errors.expiryDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.isActive ? 'Active' : 'Inactive'}
                onValueChange={(v) => handleChange('isActive', v === 'Active')}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Medication Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions or Notes</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
              rows={3}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>

          {isView && record && (
            <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p>{record.createdByName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created Date &amp; Time</p>
                <p>{formatDateTime(record.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated By</p>
                <p>{record.updatedByName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated Date &amp; Time</p>
                <p>{formatDateTime(record.updatedAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {isView ? 'Close' : 'Cancel'}
            </Button>
            {!isView && (
              <>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading}
                    onClick={(e) => handleSubmit(e, 'saveAndAdd')}
                  >
                    {isLoading && submitIntent === 'saveAndAdd' ? 'Saving...' : 'Save and Add Another'}
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading && submitIntent === 'save'
                    ? 'Saving...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
