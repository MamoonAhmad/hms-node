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
import { Checkbox } from '@/components/ui/checkbox';
import { permissionApi } from '@/services/api';

const initialFormData = {
  name: '',
  description: '',
  isActive: true,
  permissionIds: [],
};

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const isEditing = !!role;

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      setLoadingPermissions(true);
      try {
        const response = await permissionApi.getAll({ limit: 100 });
        setPermissions(response.data);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (open) {
      fetchPermissions();
    }
  }, [open]);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        isActive: role.isActive !== undefined ? role.isActive : true,
        permissionIds: role.permissions?.map(p => p.permission.id) || [],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [role, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const permissionIds = prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId];
      return { ...prev, permissionIds };
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Role name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      isActive: formData.isActive,
      permissionIds: formData.permissionIds,
    };

    onSubmit(submitData);
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Role' : 'Add Role'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Administrator"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Full system access"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            {loadingPermissions ? (
              <div className="text-sm text-muted-foreground">Loading permissions...</div>
            ) : (
              <div className="border rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No permissions available</div>
                ) : (
                  Object.keys(groupedPermissions).sort().map((resource) => (
                    <div key={resource} className="space-y-2">
                      <div className="font-medium text-sm capitalize">{resource}</div>
                      <div className="grid grid-cols-2 gap-2 ml-4">
                        {groupedPermissions[resource].map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={formData.permissionIds.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                            />
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {permission.action}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Selected {formData.permissionIds.length} permission(s)
            </p>
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

