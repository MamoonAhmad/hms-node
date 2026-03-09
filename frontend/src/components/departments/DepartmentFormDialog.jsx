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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';

const initialFormData = {
  // Basic Information
  departmentName: '',
  departmentCode: '',
  status: 'active',
  description: '',
  // Location / Facility
  facilityName: '',
  building: '',
  floor: '',
  roomNumber: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  // Operational Settings
  supportsAppointments: false,
  supportsWalkIns: false,
  defaultAppointmentDuration: '',
  operatingDays: {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  },
  startTime: '',
  endTime: '',
  // Staff & Provider Assignment
  departmentHead: '',
  assignedProviders: [],
  assignedNurses: [],
  // Billing & Insurance
  defaultBillingProvider: '',
  costCenter: '',
  revenueCode: '',
  acceptsInsurance: false,
};

export function DepartmentFormDialog({ open, onOpenChange, department, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [providers, setProviders] = useState([]); // Mock providers list

  const isEditing = !!department;

  useEffect(() => {
    // Mock providers - replace with actual API call
    setProviders([
      { id: 1, name: 'Dr. John Smith' },
      { id: 2, name: 'Dr. Sarah Johnson' },
      { id: 3, name: 'Dr. Michael Brown' },
    ]);
  }, []);

  useEffect(() => {
    if (department) {
      setFormData({
        departmentName: department.departmentName || '',
        departmentCode: department.departmentCode || '',
        status: department.status || 'active',
        description: department.description || '',
        facilityName: department.facilityName || '',
        building: department.building || '',
        floor: department.floor || '',
        roomNumber: department.roomNumber || '',
        address: department.address || '',
        city: department.city || '',
        state: department.state || '',
        zip: department.zip || '',
        supportsAppointments: department.supportsAppointments || false,
        supportsWalkIns: department.supportsWalkIns || false,
        defaultAppointmentDuration: department.defaultAppointmentDuration || '',
        operatingDays: department.operatingDays || {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
        startTime: department.startTime || '',
        endTime: department.endTime || '',
        departmentHead: department.departmentHead || '',
        assignedProviders: department.assignedProviders || [],
        assignedNurses: department.assignedNurses || [],
        defaultBillingProvider: department.defaultBillingProvider || '',
        costCenter: department.costCenter || '',
        revenueCode: department.revenueCode || '',
        acceptsInsurance: department.acceptsInsurance || false,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setActiveTab('basic');
  }, [department, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleOperatingDayChange = (day, checked) => {
    setFormData((prev) => ({
      ...prev,
      operatingDays: {
        ...prev.operatingDays,
        [day]: checked,
      },
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.departmentName.trim()) newErrors.departmentName = 'Department name is required';
    if (!formData.departmentCode.trim()) newErrors.departmentCode = 'Department code is required';
    if (!formData.facilityName.trim()) newErrors.facilityName = 'Facility name is required';
    if (!formData.status) newErrors.status = 'Status is required';
    
    // Department code uniqueness (would be checked on backend)
    
    // Appointment times required if supports appointments
    if (formData.supportsAppointments) {
      if (!formData.startTime) newErrors.startTime = 'Start time is required when appointments are supported';
      if (!formData.endTime) newErrors.endTime = 'End time is required when appointments are supported';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab('basic');
      return;
    }

    const submitData = { ...formData };
    
    // Convert empty strings to null
    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === '') {
        submitData[key] = null;
      }
    });

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* TAB 1: Basic Information */}
            <TabsContent value="basic" className="space-y-6 mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departmentName">Department Name *</Label>
                    <Input
                      id="departmentName"
                      value={formData.departmentName}
                      onChange={(e) => handleChange('departmentName', e.target.value)}
                      className={errors.departmentName ? 'border-destructive' : ''}
                    />
                    {errors.departmentName && (
                      <p className="text-xs text-destructive">{errors.departmentName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentCode">Department Code *</Label>
                    <Input
                      id="departmentCode"
                      value={formData.departmentCode}
                      onChange={(e) => handleChange('departmentCode', e.target.value)}
                      className={errors.departmentCode ? 'border-destructive' : ''}
                    />
                    {errors.departmentCode && (
                      <p className="text-xs text-destructive">{errors.departmentCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.status ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-xs text-destructive">{errors.status}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

