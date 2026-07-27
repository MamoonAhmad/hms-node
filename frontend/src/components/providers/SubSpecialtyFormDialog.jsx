import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialFormData = {
  specialtyId: '',
  name: '',
  code: '',
  isActive: true,
};

export function SubSpecialtyFormDialog({
  open,
  onOpenChange,
  subSpecialty,
  specialties = [],
  mode = 'create',
  isLoading,
  onSubmit,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const readOnly = mode === 'view';
  const isEditing = mode === 'edit';

  const title = useMemo(() => {
    if (mode === 'view') return 'View Sub Speciality';
    if (mode === 'edit') return 'Edit Sub Speciality';
    return 'Add Sub Speciality';
  }, [mode]);

  const submitLabel = isEditing ? 'Save Updates' : 'Save';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (subSpecialty) {
      const sid = subSpecialty.specialtyId ?? subSpecialty.specialty?.id;
      setFormData({
        specialtyId: sid != null ? String(sid) : '',
        name: subSpecialty.name || '',
        code: subSpecialty.code || '',
        isActive: subSpecialty.isActive !== false,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [open, subSpecialty]);

  const validate = () => {
    const next = {};
    if (!String(formData.specialtyId || '').trim()) next.specialtyId = 'Speciality is required';
    if (!String(formData.name || '').trim()) next.name = 'Sub speciality name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return onOpenChange(false);
    if (!validate()) return;
    onSubmit({
      specialtyId: formData.specialtyId,
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

        <form onSubmit={handleSubmit} className="ehr-form space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Speciality *</Label>
              <Select
                value={formData.specialtyId}
                onValueChange={(v) => setFormData((p) => ({ ...p, specialtyId: v }))}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger className={errors.specialtyId ? 'border-destructive' : ''} disabled={readOnly || isLoading}>
                  <SelectValue placeholder="Select speciality" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialtyId && <p className="text-xs text-destructive">{errors.specialtyId}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="subName">Sub speciality name *</Label>
              <Input
                id="subName"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                disabled={readOnly || isLoading}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="subCode">Sub speciality code</Label>
              <Input
                id="subCode"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                disabled={readOnly || isLoading}
              />
            </div>

            <div className="flex items-center gap-2 col-span-2">
              <Checkbox
                id="subActive"
                checked={!!formData.isActive}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: Boolean(v) }))}
                disabled={readOnly || isLoading}
              />
              <Label htmlFor="subActive">Active</Label>
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

