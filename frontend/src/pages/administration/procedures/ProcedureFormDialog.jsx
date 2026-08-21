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
import { MultiSelect } from '@/components/ui/multi-select';
import { departmentApi, procedureCategoryApi } from '@/services/api';
import {
  CPT_CODE_TYPES,
  GLOBAL_PERIODS,
  GENDER_RESTRICTIONS,
  isValidCpt,
  isValidHcpcs,
  isValidRevenueCode,
  isValidModifier,
  datesInOrder,
} from '@/lib/codeCatalog';
import { PlaceOfServiceSelect } from '@/components/rcm/PlaceOfServiceSelect';

const emptyForm = () => ({
  procedureDescription: '',
  genericDescription: '',
  procedureCategoryIds: [],
  departmentId: '',
  cptCode: '',
  codeType: 'CPT',
  revenueCode: '',
  mod1: '',
  mod2: '',
  mod3: '',
  mod4: '',
  unitPrice: '',
  placeOfService: '11',
  isBillable: true,
  isActive: true,
  globalPeriod: 'XXX',
  workRvu: '',
  facilityRvu: '',
  nonFacilityRvu: '',
  isAddOn: false,
  bilateralIndicator: false,
  genderRestriction: 'none',
  ageMin: '',
  ageMax: '',
  effectiveDate: '',
  expiryDate: '',
  codingNotes: '',
});

export function ProcedureFormDialog({ open, onOpenChange, procedure, mode = 'create', onSubmit, isLoading }) {
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [catRes, deptRes] = await Promise.all([
          procedureCategoryApi.getAll({ limit: 500 }),
          departmentApi.getAll({ limit: 500, status: 'active' }),
        ]);
        setCategories(catRes.data || []);
        setDepartments(deptRes.data || []);
      } catch {
        setCategories([]);
        setDepartments([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (procedure) {
      setFormData({
        ...emptyForm(),
        procedureDescription: procedure.procedureDescription || '',
        genericDescription: procedure.genericDescription || '',
        procedureCategoryIds: procedure.procedureCategoryIds || procedure.categories?.map((c) => c.id) || [],
        departmentId: procedure.departmentId || '',
        cptCode: procedure.cptCode || '',
        codeType: procedure.codeType || 'CPT',
        revenueCode: procedure.revenueCode || '',
        mod1: procedure.mod1 || '',
        mod2: procedure.mod2 || '',
        mod3: procedure.mod3 || '',
        mod4: procedure.mod4 || '',
        unitPrice: procedure.unitPrice != null ? String(procedure.unitPrice) : '',
        placeOfService: procedure.placeOfService || '11',
        isBillable: procedure.isBillable !== false,
        isActive: procedure.isActive !== false,
        globalPeriod: procedure.globalPeriod || 'XXX',
        workRvu: procedure.workRvu != null ? String(procedure.workRvu) : '',
        facilityRvu: procedure.facilityRvu != null ? String(procedure.facilityRvu) : '',
        nonFacilityRvu: procedure.nonFacilityRvu != null ? String(procedure.nonFacilityRvu) : '',
        isAddOn: !!procedure.isAddOn,
        bilateralIndicator: !!procedure.bilateralIndicator,
        genderRestriction: procedure.genderRestriction || 'none',
        ageMin: procedure.ageMin != null ? String(procedure.ageMin) : '',
        ageMax: procedure.ageMax != null ? String(procedure.ageMax) : '',
        effectiveDate: procedure.effectiveDate || '',
        expiryDate: procedure.expiryDate || '',
        codingNotes: procedure.codingNotes || '',
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [procedure, open, mode]);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name || c.categoryName,
  }));

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const newErrors = {};
    if (!formData.procedureDescription.trim()) {
      newErrors.procedureDescription = 'Procedure description is required';
    }
    if (!formData.procedureCategoryIds.length) {
      newErrors.procedureCategoryIds = 'At least one procedure category is required';
    }
    if (formData.cptCode) {
      if (formData.codeType === 'CPT' && !isValidCpt(formData.cptCode) && !isValidHcpcs(formData.cptCode)) {
        newErrors.cptCode = 'CPT codes must be 5 digits';
      }
      if (formData.codeType === 'HCPCS' && !isValidHcpcs(formData.cptCode) && !isValidCpt(formData.cptCode)) {
        newErrors.cptCode = 'HCPCS codes must be a letter plus 4 digits';
      }
    }
    if (!isValidRevenueCode(formData.revenueCode)) newErrors.revenueCode = 'Revenue code must be 3 or 4 digits';
    ['mod1', 'mod2', 'mod3', 'mod4'].forEach((mod) => {
      if (!isValidModifier(formData[mod])) newErrors[mod] = '2 characters';
    });
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
      procedureDescription: formData.procedureDescription.trim(),
      genericDescription: formData.genericDescription.trim() || null,
      procedureCategoryIds: formData.procedureCategoryIds,
      departmentId: formData.departmentId || null,
      cptCode: formData.cptCode.trim().toUpperCase() || null,
      codeType: formData.codeType,
      revenueCode: formData.revenueCode.trim() || null,
      mod1: formData.mod1.trim().toUpperCase() || null,
      mod2: formData.mod2.trim().toUpperCase() || null,
      mod3: formData.mod3.trim().toUpperCase() || null,
      mod4: formData.mod4.trim().toUpperCase() || null,
      unitPrice: formData.unitPrice === '' ? null : Number(formData.unitPrice),
      placeOfService: formData.placeOfService.trim() || '11',
      isBillable: !!formData.isBillable,
      isActive: !!formData.isActive,
      globalPeriod: formData.globalPeriod || null,
      workRvu: formData.workRvu === '' ? null : Number(formData.workRvu),
      facilityRvu: formData.facilityRvu === '' ? null : Number(formData.facilityRvu),
      nonFacilityRvu: formData.nonFacilityRvu === '' ? null : Number(formData.nonFacilityRvu),
      isAddOn: !!formData.isAddOn,
      bilateralIndicator: !!formData.bilateralIndicator,
      genderRestriction: formData.genderRestriction || null,
      ageMin: formData.ageMin === '' ? null : Number(formData.ageMin),
      ageMax: formData.ageMax === '' ? null : Number(formData.ageMax),
      effectiveDate: formData.effectiveDate || null,
      expiryDate: formData.expiryDate || null,
      codingNotes: formData.codingNotes.trim() || null,
    });
  };

  const title = isView ? 'View Procedure Code' : isEdit ? 'Edit Procedure Code' : 'Add Procedure Code';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedureDescription">Procedure description *</Label>
                <Input
                  id="procedureDescription"
                  value={formData.procedureDescription}
                  onChange={(e) => handleChange('procedureDescription', e.target.value)}
                  className={errors.procedureDescription ? 'border-destructive' : ''}
                  placeholder="Enter procedure description"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.procedureDescription && (
                  <p className="text-xs text-destructive">{errors.procedureDescription}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericDescription">Short / generic description</Label>
                <Input
                  id="genericDescription"
                  value={formData.genericDescription}
                  onChange={(e) => handleChange('genericDescription', e.target.value)}
                  placeholder="Enter short description"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedureCategoryIds">Procedure category *</Label>
                {readOnly ? (
                  <Input
                    value={
                      procedure?.categoryName ||
                      procedure?.categories?.map((c) => c.name).join(', ') ||
                      '—'
                    }
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                ) : (
                  <MultiSelect
                    id="procedureCategoryIds"
                    options={categoryOptions}
                    value={formData.procedureCategoryIds}
                    onChange={(value) => handleChange('procedureCategoryIds', value)}
                    placeholder={loadingOptions ? 'Loading categories...' : 'Select categories'}
                    searchable
                    searchPlaceholder="Search categories..."
                    className={errors.procedureCategoryIds ? 'border-destructive rounded-md' : ''}
                  />
                )}
                {errors.procedureCategoryIds && (
                  <p className="text-xs text-destructive">{errors.procedureCategoryIds}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                {readOnly ? (
                  <Input
                    value={procedure?.procedureDepartment || procedure?.department?.departmentName || '—'}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.departmentId || undefined}
                    onValueChange={(value) => handleChange('departmentId', value)}
                    disabled={loadingOptions || isLoading}
                  >
                    <SelectTrigger id="departmentId">
                      <SelectValue placeholder={loadingOptions ? 'Loading departments...' : 'Select department'} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Code type</Label>
                <Select
                  value={formData.codeType}
                  onValueChange={(value) => handleChange('codeType', value)}
                  disabled={readOnly || isLoading}
                >
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
                <Label htmlFor="cptCode">Procedure / CPT / HCPCS</Label>
                <Input
                  id="cptCode"
                  value={formData.cptCode}
                  onChange={(e) => handleChange('cptCode', e.target.value.toUpperCase())}
                  placeholder="99213 or G0439"
                  className={`font-mono ${errors.cptCode ? 'border-destructive' : ''}`}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.cptCode && <p className="text-xs text-destructive">{errors.cptCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueCode">Revenue code</Label>
                <Input
                  id="revenueCode"
                  value={formData.revenueCode}
                  onChange={(e) => handleChange('revenueCode', e.target.value)}
                  placeholder="0510"
                  className={errors.revenueCode ? 'border-destructive' : ''}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
                {errors.revenueCode && <p className="text-xs text-destructive">{errors.revenueCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['mod1', 'mod2', 'mod3', 'mod4'].map((mod, index) => (
                <div key={mod} className="space-y-2">
                  <Label htmlFor={mod}>Mod {index + 1}</Label>
                  <Input
                    id={mod}
                    value={formData[mod]}
                    onChange={(e) => handleChange(mod, e.target.value.toUpperCase())}
                    placeholder={`Mod ${index + 1}`}
                    maxLength={2}
                    className={errors[mod] ? 'border-destructive' : ''}
                    disabled={readOnly || isLoading}
                    readOnly={readOnly}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Standard charge</Label>
                <Input
                  id="unitPrice"
                  value={formData.unitPrice}
                  onChange={(e) => handleChange('unitPrice', e.target.value)}
                  placeholder="0.00"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placeOfService">Place of service</Label>
                <PlaceOfServiceSelect
                  value={formData.placeOfService}
                  onValueChange={(v) => handleChange('placeOfService', v)}
                  placeholder="Select POS"
                  disabled={readOnly || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Global period</Label>
                <Select
                  value={formData.globalPeriod || undefined}
                  onValueChange={(value) => handleChange('globalPeriod', value)}
                  disabled={readOnly || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GLOBAL_PERIODS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workRvu">Work RVU</Label>
                <Input
                  id="workRvu"
                  value={formData.workRvu}
                  onChange={(e) => handleChange('workRvu', e.target.value)}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityRvu">Facility RVU</Label>
                <Input
                  id="facilityRvu"
                  value={formData.facilityRvu}
                  onChange={(e) => handleChange('facilityRvu', e.target.value)}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nonFacilityRvu">Non-facility RVU</Label>
                <Input
                  id="nonFacilityRvu"
                  value={formData.nonFacilityRvu}
                  onChange={(e) => handleChange('nonFacilityRvu', e.target.value)}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <Label htmlFor="ageMin">Minimum age</Label>
                <Input
                  id="ageMin"
                  type="number"
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
                  value={formData.ageMax}
                  onChange={(e) => handleChange('ageMax', e.target.value)}
                  className={errors.ageMax ? 'border-destructive' : ''}
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  checked={formData.isAddOn}
                  onCheckedChange={(checked) => handleChange('isAddOn', !!checked)}
                  disabled={readOnly || isLoading}
                />
                Add-on code
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.bilateralIndicator}
                  onCheckedChange={(checked) => handleChange('bilateralIndicator', !!checked)}
                  disabled={readOnly || isLoading}
                />
                Bilateral
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codingNotes">Coding notes</Label>
              <Textarea
                id="codingNotes"
                value={formData.codingNotes}
                onChange={(e) => handleChange('codingNotes', e.target.value)}
                placeholder="NCCI, global period, or payer-specific guidance"
                rows={3}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
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
