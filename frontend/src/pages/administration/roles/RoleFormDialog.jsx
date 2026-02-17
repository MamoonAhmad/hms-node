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
import { permissionHeaderApi } from '@/services/api';

export function RoleFormDialog({ open, onOpenChange, role, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    roleName: '',
    permissions: {}, // { permissionId: { add, edit, delete, view, all } }
  });
  const [errors, setErrors] = useState({});
  const [permissionHeaders, setPermissionHeaders] = useState([]);

  useEffect(() => {
    if (open) {
      fetchPermissionHeaders();
      if (role) {
        setFormData({
          roleName: role.name || role.roleName || '',
          permissions: role.permissions || {},
        });
      } else {
        setFormData({
          roleName: '',
          permissions: {},
        });
      }
      setErrors({});
    }
  }, [role, open]);

  const fetchPermissionHeaders = async () => {
    try {
      const response = await permissionHeaderApi.getAllWithPermissions();
      const headers = response.data || response || [];
      setPermissionHeaders(headers);
      
      // Initialize permissions structure if new role
      if (!role && headers.length > 0) {
        const initialPermissions = {};
        headers.forEach((header) => {
          header.permissions?.forEach((perm) => {
            initialPermissions[perm.id] = {
              add: false,
              edit: false,
              delete: false,
              view: false,
              all: false,
            };
          });
        });
        setFormData((prev) => ({ ...prev, permissions: initialPermissions }));
      }
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

  const togglePermission = (permissionId, action, checked) => {
    setFormData((prev) => {
      const newPermissions = { ...prev.permissions };
      if (!newPermissions[permissionId]) {
        newPermissions[permissionId] = { add: false, edit: false, delete: false, view: false, all: false };
      }
      
      if (action === 'all') {
        newPermissions[permissionId] = {
          add: checked,
          edit: checked,
          delete: checked,
          view: checked,
          all: checked,
        };
      } else {
        newPermissions[permissionId][action] = checked;
        // If all individual actions are checked, check "all"
        if (action !== 'all') {
          const individualActions = ['add', 'edit', 'delete', 'view'];
          const allChecked = individualActions.every((a) => 
            a === action ? checked : newPermissions[permissionId][a]
          );
          newPermissions[permissionId].all = allChecked;
        }
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const hasPermission = (permissionId, action) => {
    return formData.permissions[permissionId]?.[action] || false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.roleName.trim()) {
      newErrors.roleName = 'Role name is required';
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
            {role ? 'Edit Role' : 'Add Role'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={formData.roleName}
                onChange={(e) => handleChange('roleName', e.target.value)}
                className={errors.roleName ? 'border-destructive' : ''}
                placeholder="Enter role name"
              />
              {errors.roleName && (
                <p className="text-xs text-destructive">{errors.roleName}</p>
              )}
            </div>

            {/* Permission Assignment Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Permission Assignment</h3>
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {permissionHeaders.map((header) => (
                  <div key={header.id} className="space-y-3">
                    <h4 className="font-medium text-sm border-b pb-1">
                      {header.name || header.permissionHeaderName}
                    </h4>
                    <div className="space-y-2 pl-4">
                      {header.permissions?.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center gap-4 p-2 hover:bg-muted rounded"
                        >
                          <span className="text-sm w-48 font-medium">
                            {permission.name || permission.permissionName}
                          </span>
                          <div className="flex gap-4">
                            {['Add', 'Edit', 'Delete', 'View', 'All'].map((action) => (
                              <div key={action} className="flex items-center space-x-1">
                                <Checkbox
                                  checked={hasPermission(permission.id, action.toLowerCase())}
                                  onCheckedChange={(checked) =>
                                    togglePermission(permission.id, action.toLowerCase(), checked)
                                  }
                                />
                                <label className="text-xs cursor-pointer">{action}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
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


