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
import { MultiSelect } from '@/components/ui/multi-select';
import { departmentApi, procedureCategoryApi } from '@/services/api';

const emptyForm = () => ({
  procedureDescription: '',
  genericDescription: '',
  procedureCategoryIds: [],
  departmentId: '',
  cptCode: '',
  revenueCode: '',
  mod1: '',
  mod2: '',
  mod3: '',
  mod4: '',
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
        procedureDescription: procedure.procedureDescription || '',
        genericDescription: procedure.genericDescription || '',
        procedureCategoryIds: procedure.procedureCategoryIds || procedure.categories?.map((c) => c.id) || [],
        departmentId: procedure.departmentId || '',
        cptCode: procedure.cptCode || '',
        revenueCode: procedure.revenueCode || '',
        mod1: procedure.mod1 || '',
        mod2: procedure.mod2 || '',
        mod3: procedure.mod3 || '',
        mod4: procedure.mod4 || '',
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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      procedureDescription: formData.procedureDescription.trim(),
      genericDescription: formData.genericDescription.trim() || null,
      departmentId: formData.departmentId || null,
      cptCode: formData.cptCode.trim() || null,
      revenueCode: formData.revenueCode.trim() || null,
      mod1: formData.mod1.trim() || null,
      mod2: formData.mod2.trim() || null,
      mod3: formData.mod3.trim() || null,
      mod4: formData.mod4.trim() || null,
    });
  };

  const title = isView ? 'View Procedure' : isEdit ? 'Edit Procedure' : 'Add Procedure';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedureDescription">Procedure Description *</Label>
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
                <Label htmlFor="genericDescription">Generic Description</Label>
                <Input
                  id="genericDescription"
                  value={formData.genericDescription}
                  onChange={(e) => handleChange('genericDescription', e.target.value)}
                  placeholder="Enter generic description"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedureCategoryIds">Procedure Category *</Label>
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
                <Label htmlFor="departmentId">Procedure Department</Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cptCode">Procedure / CPT Code</Label>
                <Input
                  id="cptCode"
                  value={formData.cptCode}
                  onChange={(e) => handleChange('cptCode', e.target.value)}
                  placeholder="Enter CPT code"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueCode">Revenue Code</Label>
                <Input
                  id="revenueCode"
                  value={formData.revenueCode}
                  onChange={(e) => handleChange('revenueCode', e.target.value)}
                  placeholder="Enter revenue code"
                  disabled={readOnly || isLoading}
                  readOnly={readOnly}
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
                    onChange={(e) => handleChange(mod, e.target.value)}
                    placeholder={`Mod ${index + 1}`}
                    disabled={readOnly || isLoading}
                    readOnly={readOnly}
                  />
                </div>
              ))}
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
