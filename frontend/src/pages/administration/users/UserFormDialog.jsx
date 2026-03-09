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
import { MultiSelect } from '@/components/ui/multi-select';
import { roleApi, permissionHeaderApi } from '@/services/api';

export function UserFormDialog({ open, onOpenChange, user, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleInitials: '',
    email: '',
    username: '',
    phoneNumber: '',
    roleIds: [],
    providerOrgIds: [],
    providerIndIds: [],
    payerIds: [],
    permissions: {}, // { permissionId: { add, edit, delete, view, all } }
  });
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [providers, setProviders] = useState([]); // Mock for now
  const [payers, setPayers] = useState([]); // Mock for now
  const [permissionHeaders, setPermissionHeaders] = useState([]);

  useEffect(() => {
    if (open) {
      fetchInitialData();
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          middleInitials: user.middleInitials || '',
          email: user.email || user.emailId || '',
          username: user.username || '',
          phoneNumber: user.phoneNumber || user.phone || '',
          roleIds: user.roles?.map((r) => r.id || r) || [],
          providerOrgIds: user.providerOrgIds || user.providersOrg || [],
          providerIndIds: user.providerIndIds || user.providersInd || [],
          payerIds: user.payerIds || user.payers || [],
          permissions: user.permissions || {},
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          middleInitials: '',
          email: '',
          username: '',
          phoneNumber: '',
          roleIds: [],
          providerOrgIds: [],
          providerIndIds: [],
          payerIds: [],
          permissions: {},
        });
      }
      setErrors({});
    }
  }, [user, open]);

  const fetchInitialData = async () => {
    try {
      const [rolesResponse, headersResponse] = await Promise.all([
        roleApi.getAll(),
        permissionHeaderApi.getAllWithPermissions(),
      ]);
      setRoles(rolesResponse.data || rolesResponse || []);
      
      const headers = headersResponse.data || headersResponse || [];
      setPermissionHeaders(headers);
      
      // Initialize permissions structure if new user
      if (!user && headers.length > 0) {
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
      console.error('Error fetching initial data:', err);
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name || role.roleName,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Edit User' : 'Add User'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-destructive' : ''}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleInitials">Middle Initials</Label>
                <Input
                  id="middleInitials"
                  value={formData.middleInitials}
                  onChange={(e) => handleChange('middleInitials', e.target.value)}
                  placeholder="MI"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-destructive' : ''}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email ID *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={errors.username ? 'border-destructive' : ''}
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roles</Label>
                <MultiSelect
                  options={roleOptions}
                  value={formData.roleIds}
                  onChange={(value) => handleChange('roleIds', value)}
                  placeholder="Select roles"
                />
              </div>
              <div className="space-y-2">
                <Label>Providers (ORG)</Label>
                <MultiSelect
                  options={[]} // TODO: Fetch providers
                  value={formData.providerOrgIds}
                  onChange={(value) => handleChange('providerOrgIds', value)}
                  placeholder="Select providers (ORG)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Providers (IND)</Label>
                <MultiSelect
                  options={[]} // TODO: Fetch providers
                  value={formData.providerIndIds}
                  onChange={(value) => handleChange('providerIndIds', value)}
                  placeholder="Select providers (IND)"
                />
              </div>
              <div className="space-y-2">
                <Label>Payers</Label>
                <MultiSelect
                  options={[]} // TODO: Fetch payers
                  value={formData.payerIds}
                  onChange={(value) => handleChange('payerIds', value)}
                  placeholder="Select payers"
                />
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Permissions</h3>
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
              Close
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


