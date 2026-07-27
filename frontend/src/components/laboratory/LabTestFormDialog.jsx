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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LAB_TEST_CATEGORIES, SPECIMEN_TYPES } from '@/lib/labConstants';

const initialFormData = {
  name: '',
  code: '',
  category: '',
  specimenType: '',
  isActive: true,
};

function auditUserLabel(user) {
  if (!user) return '—';
  return user.name || user.email || '—';
}

function formatAuditDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function LabTestFormDialog({
  open,
  onOpenChange,
  labTest,
  onSubmit,
  isLoading,
  mode = 'create',
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const readOnly = isViewing;

  useEffect(() => {
    if (labTest) {
      setFormData({
        name: labTest.name || '',
        code: labTest.code || '',
        category: labTest.category || '',
        specimenType: labTest.specimenType || '',
        isActive: labTest.isActive !== undefined ? labTest.isActive : true,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [labTest, open]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Lab name is required';
    if (!formData.code.trim()) newErrors.code = 'Lab code is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.specimenType) newErrors.specimenType = 'Specimen type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: formData.category,
      specimenType: formData.specimenType,
      isActive: formData.isActive,
    });
  };

  const title =
    isViewing ? 'View Laboratory Test' : isEditing ? 'Edit Laboratory Test' : 'Add Laboratory Test';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[640px] max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lab-name">Lab Name *</Label>
              <Input
                id="lab-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Complete Blood Count"
                className={errors.name ? 'border-destructive' : ''}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-code">Lab Code *</Label>
              <Input
                id="lab-code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="CBC"
                className={`uppercase ${errors.code ? 'border-destructive' : ''}`}
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lab-category">Category *</Label>
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => handleChange('category', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="lab-category" className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {LAB_TEST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-specimen">Specimen Type *</Label>
              <Select
                value={formData.specimenType || undefined}
                onValueChange={(value) => handleChange('specimenType', value)}
                disabled={readOnly || isLoading}
              >
                <SelectTrigger id="lab-specimen" className={errors.specimenType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select specimen type" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIMEN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specimenType && (
                <p className="text-xs text-destructive">{errors.specimenType}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lab-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
              disabled={readOnly || isLoading}
            />
            <Label htmlFor="lab-isActive" className={readOnly ? '' : 'cursor-pointer'}>
              Active
            </Label>
          </div>

          {readOnly && labTest && (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Audit trail</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="text-sm font-medium">{auditUserLabel(labTest.creator)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Created Date &amp; Time</Label>
                  <p className="text-sm font-medium">{formatAuditDate(labTest.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Updated By</Label>
                  <p className="text-sm font-medium">{auditUserLabel(labTest.updater)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Updated Date &amp; Time</Label>
                  <p className="text-sm font-medium">{formatAuditDate(labTest.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
