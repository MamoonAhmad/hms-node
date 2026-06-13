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

const emptyForm = () => ({
  code: '',
  description: '',
  effectiveDate: '',
  expiryDate: '',
});

export function HcpcsCodeFormDialog({ open, onOpenChange, record, mode = 'create', onSubmit, isLoading }) {
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;

    if (record) {
      setFormData({
        code: record.code || '',
        description: record.description || '',
        effectiveDate: record.effectiveDate || '',
        expiryDate: record.expiryDate || '',
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [record, open, mode]);

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
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      code: formData.code.trim(),
      description: formData.description.trim(),
      effectiveDate: formData.effectiveDate || null,
      expiryDate: formData.expiryDate || null,
    });
  };

  const title = isView ? 'View HCPCS Code' : isEdit ? 'Edit HCPCS Code' : 'Add HCPCS Code';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[520px] max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hcpcsCode">Code *</Label>
            <Input
              id="hcpcsCode"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g. 99213 or J1885"
              className={errors.code ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hcpcsDescription">Description *</Label>
            <Textarea
              id="hcpcsDescription"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter description"
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                disabled={readOnly || isLoading}
                readOnly={readOnly}
              />
            </div>
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
