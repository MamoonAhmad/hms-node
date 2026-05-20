import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const initialFormData = {
  name: '',
  code: '',
  isActive: true,
};

export function SpecialtyFormDialog({ open, onOpenChange, specialty, mode = 'create', isLoading, onSubmit }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const readOnly = mode === 'view';
  const isEditing = mode === 'edit';

  const title = useMemo(() => {
    if (mode === 'view') return 'View Speciality';
    if (mode === 'edit') return 'Edit Speciality';
    return 'Add Speciality';
  }, [mode]);

  const submitLabel = isEditing ? 'Save Updates' : 'Save';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (specialty) {
      setFormData({
        name: specialty.name || '',
        code: specialty.code || '',
        isActive: specialty.isActive !== false,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [open, specialty]);

  const validate = () => {
    const next = {};
    if (!String(formData.name || '').trim()) next.name = 'Speciality name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return onOpenChange(false);
    if (!validate()) return;
    onSubmit({
      name: String(formData.name || '').trim(),
      code: String(formData.code || '').trim() || null,
      isActive: Boolean(formData.isActive),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="specialtyName">Speciality name *</Label>
              <Input
                id="specialtyName"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                disabled={readOnly || isLoading}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="specialtyCode">Speciality code</Label>
              <Input
                id="specialtyCode"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                disabled={readOnly || isLoading}
              />
            </div>

            <div className="flex items-center gap-2 col-span-2">
              <Checkbox
                id="specialtyActive"
                checked={!!formData.isActive}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: Boolean(v) }))}
                disabled={readOnly || isLoading}
              />
              <Label htmlFor="specialtyActive">Active</Label>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : submitLabel}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

