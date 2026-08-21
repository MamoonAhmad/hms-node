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
import { permissionHeaderApi } from '@/services/api';

export function PermissionFormDialog({ open, onOpenChange, permission, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    permissionName: '',
    permissionHeaderId: '',
    url: '',
  });
  const [errors, setErrors] = useState({});
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (open) {
      fetchHeaders();
      if (permission) {
        setFormData({
          name: permission.name || '',
          permissionName: permission.permissionName || '',
          permissionHeaderId: permission.permissionHeaderId || permission.headerId || permission.permissionHeader?.id || '',
          url: permission.url || '',
        });
      } else {
        setFormData({
          name: '',
          permissionName: '',
          permissionHeaderId: '',
          url: '',
        });
      }
      setErrors({});
    }
  }, [permission, open]);

  const fetchHeaders = async () => {
    try {
      const response = await permissionHeaderApi.getAll();
      setHeaders(response.data || response || []);
    } catch (err) {
      console.error('Error fetching permission headers:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.permissionName.trim()) {
      newErrors.permissionName = 'Permission name is required';
    }
    if (!formData.permissionHeaderId) {
      newErrors.permissionHeaderId = 'Permission header is required';
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
            {permission ? 'Edit Permission' : 'Add Permission'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
                placeholder="Enter name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissionName">Permission Name *</Label>
              <Input
                id="permissionName"
                value={formData.permissionName}
                onChange={(e) => handleChange('permissionName', e.target.value)}
                className={errors.permissionName ? 'border-destructive' : ''}
                placeholder="Enter permission name"
              />
              {errors.permissionName && (
                <p className="text-xs text-destructive">{errors.permissionName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissionHeaderId">Permission Header *</Label>
              <Select
                value={formData.permissionHeaderId}
                onValueChange={(value) => handleChange('permissionHeaderId', value)}
              >
                <SelectTrigger className={errors.permissionHeaderId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select permission header" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header.id} value={header.id}>
                      {header.name || header.permissionHeaderName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.permissionHeaderId && (
                <p className="text-xs text-destructive">{errors.permissionHeaderId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="Enter URL"
              />
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


