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
// Mock categories - static data only
const mockCategories = [
  { id: 1, name: 'Office Visits' },
  { id: 2, name: 'Laboratory' },
  { id: 3, name: 'Radiology' },
  { id: 4, name: 'Surgery' },
];

export function ProcedureFormDialog({ open, onOpenChange, procedure, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    procedureDescription: '',
    genericDescription: '',
    procedureCategoryId: '',
    procedureDepartment: '',
    cptCode: '',
    revenueCode: '',
    mod1: '',
    mod2: '',
    mod3: '',
    mod4: '',
  });
  const [errors, setErrors] = useState({});
  const [categories] = useState(mockCategories);

  useEffect(() => {
    if (open) {
      if (procedure) {
        setFormData({
          procedureDescription: procedure.procedureDescription || procedure.procedureName || '',
          genericDescription: procedure.genericDescription || procedure.genericName || '',
          procedureCategoryId: procedure.procedureCategoryId || procedure.categoryId || procedure.category?.id || '',
          procedureDepartment: procedure.procedureDepartment || procedure.department || '',
          cptCode: procedure.cptCode || procedure.procedureCode || '',
          revenueCode: procedure.revenueCode || '',
          mod1: procedure.mod1 || '',
          mod2: procedure.mod2 || '',
          mod3: procedure.mod3 || '',
          mod4: procedure.mod4 || '',
        });
      } else {
        setFormData({
          procedureDescription: '',
          genericDescription: '',
          procedureCategoryId: '',
          procedureDepartment: '',
          cptCode: '',
          revenueCode: '',
          mod1: '',
          mod2: '',
          mod3: '',
          mod4: '',
        });
      }
      setErrors({});
    }
  }, [procedure, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.procedureDescription.trim()) {
      newErrors.procedureDescription = 'Procedure description is required';
    }
    if (!formData.procedureCategoryId) {
      newErrors.procedureCategoryId = 'Procedure category is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {procedure ? 'Edit Procedure' : 'Add Procedure'}
          </DialogTitle>
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedureCategoryId">Procedure Category *</Label>
                <Select
                  value={formData.procedureCategoryId}
                  onValueChange={(value) => handleChange('procedureCategoryId', value)}
                >
                  <SelectTrigger className={errors.procedureCategoryId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name || category.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.procedureCategoryId && (
                  <p className="text-xs text-destructive">{errors.procedureCategoryId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedureDepartment">Procedure Department</Label>
                <Input
                  id="procedureDepartment"
                  value={formData.procedureDepartment}
                  onChange={(e) => handleChange('procedureDepartment', e.target.value)}
                  placeholder="Enter department"
                />
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueCode">Revenue Code</Label>
                <Input
                  id="revenueCode"
                  value={formData.revenueCode}
                  onChange={(e) => handleChange('revenueCode', e.target.value)}
                  placeholder="Enter revenue code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mod1">Mod 1</Label>
                <Input
                  id="mod1"
                  value={formData.mod1}
                  onChange={(e) => handleChange('mod1', e.target.value)}
                  placeholder="Mod 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mod2">Mod 2</Label>
                <Input
                  id="mod2"
                  value={formData.mod2}
                  onChange={(e) => handleChange('mod2', e.target.value)}
                  placeholder="Mod 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mod3">Mod 3</Label>
                <Input
                  id="mod3"
                  value={formData.mod3}
                  onChange={(e) => handleChange('mod3', e.target.value)}
                  placeholder="Mod 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mod4">Mod 4</Label>
                <Input
                  id="mod4"
                  value={formData.mod4}
                  onChange={(e) => handleChange('mod4', e.target.value)}
                  placeholder="Mod 4"
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


