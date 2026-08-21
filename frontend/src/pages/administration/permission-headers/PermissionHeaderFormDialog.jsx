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

export function PermissionHeaderFormDialog({ open, onOpenChange, header, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({ permissionHeaderName: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (header && open) {
      setFormData({ permissionHeaderName: header.name || header.permissionHeaderName || '' });
    } else {
      setFormData({ permissionHeaderName: '' });
    }
    setErrors({});
  }, [header, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.permissionHeaderName.trim()) {
      newErrors.permissionHeaderName = 'Permission header name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {header ? 'Edit Permission Header' : 'Add Permission Header'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permissionHeaderName">Permission Header Name *</Label>
              <Input
                id="permissionHeaderName"
                value={formData.permissionHeaderName}
                onChange={(e) => handleChange('permissionHeaderName', e.target.value)}
                className={errors.permissionHeaderName ? 'border-destructive' : ''}
                placeholder="Enter permission header name"
              />
              {errors.permissionHeaderName && (
                <p className="text-xs text-destructive">{errors.permissionHeaderName}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


