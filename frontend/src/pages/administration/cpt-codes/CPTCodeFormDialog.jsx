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

const initial = {
  code: '',
  description: '',
  isActive: true,
};

export function CPTCodeFormDialog({ open, onOpenChange, cptCode, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cptCode && open) {
      setFormData({
        code: cptCode.code || '',
        description: cptCode.description || '',
        isActive: cptCode.isActive !== false,
      });
    } else if (open) {
      setFormData(initial);
    }
    setErrors({});
  }, [cptCode, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.code?.trim()) newErrors.code = 'CPT Code is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({
      code: formData.code.trim(),
      description: formData.description?.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cptCode ? 'Edit CPT Code' : 'Add CPT Code'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">CPT Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g. 99213"
              className={errors.code ? 'border-destructive' : ''}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Procedure description"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(c) => handleChange('isActive', !!c)}
            />
            <Label htmlFor="isActive" className="font-normal">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : cptCode ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
