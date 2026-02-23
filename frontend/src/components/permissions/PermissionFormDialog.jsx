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

const initialFormData = {
  name: '',
  description: '',
  resource: '',
  action: '',
};

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isEditing = !!permission;

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name || '',
        description: permission.description || '',
        resource: permission.resource || '',
        action: permission.action || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [permission, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-generate name when resource and action change
    if (field === 'resource' || field === 'action') {
      const newResource = field === 'resource' ? value : formData.resource;
      const newAction = field === 'action' ? value : formData.action;
      if (newResource && newAction) {
        setFormData((prev) => ({ ...prev, name: `${newResource}.${newAction}` }));
      }
    }
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Permission name is required';
    if (!formData.resource.trim()) newErrors.resource = 'Resource is required';
    if (!formData.action.trim()) newErrors.action = 'Action is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      resource: formData.resource.trim().toLowerCase(),
      action: formData.action.trim().toLowerCase(),
    };

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Permission' : 'Add Permission'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource *</Label>
              <Input
                id="resource"
                value={formData.resource}
                onChange={(e) => handleChange('resource', e.target.value)}
                placeholder="patient"
                className={errors.resource ? 'border-destructive' : ''}
              />
              {errors.resource && (
                <p className="text-xs text-destructive">{errors.resource}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Input
                id="action"
                value={formData.action}
                onChange={(e) => handleChange('action', e.target.value)}
                placeholder="read"
                className={errors.action ? 'border-destructive' : ''}
              />
              {errors.action && (
                <p className="text-xs text-destructive">{errors.action}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Permission Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="patient.read"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Auto-generated from resource and action
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Allows reading patient data"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

