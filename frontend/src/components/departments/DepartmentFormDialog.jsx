import { useState, useEffect, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { locationApi } from '@/services/api';

const initialFormData = {
  departmentName: '',
  departmentCode: '',
  departmentType: '__none__',
  status: 'active',
  description: '',
  locationId: '__none__',
  facilityName: '',
  building: '',
  floor: '',
  roomNumber: '',
  address: '',
  city: '',
  state: '',
  zip: '',
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
  departmentHead: '',
  assignedProviders: [],
  assignedNurses: [],
  defaultBillingProvider: '',
  costCenter: '',
  revenueCode: '',
  acceptsInsurance: false,
};

const emptyOperatingDays = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

export function DepartmentFormDialog({ open, onOpenChange, department, onSubmit, isLoading, mode = 'create', onDelete }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const readOnly = isViewing;

  const fetchLocationsForSelect = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await locationApi.getActive();
      setLocations(res.data || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchLocationsForSelect();
  }, [open, fetchLocationsForSelect]);

  useEffect(() => {
    if (department) {
      const locId = department.locationId || department.location?.id;
      setFormData({
        departmentName: department.departmentName || '',
        departmentCode: department.departmentCode || '',
        departmentType:
          department.departmentType != null && String(department.departmentType).trim() !== ''
            ? department.departmentType
            : '__none__',
        status:
          department.status && String(department.status).toLowerCase() === 'inactive' ? 'inactive' : 'active',
        description: department.description || '',
        locationId: locId ? String(locId) : '__none__',
        facilityName: department.facilityName || '',
        building: department.building || '',
        floor: department.floor || '',
        roomNumber: department.roomNumber || '',
        address: department.address || '',
        city: department.city || '',
        state: department.state || '',
        zip: department.zip || '',
        supportsAppointments: !!department.supportsAppointments,
        supportsWalkIns: !!department.supportsWalkIns,
        defaultAppointmentDuration:
          department.defaultAppointmentDuration != null ? String(department.defaultAppointmentDuration) : '',
        operatingDays:
          typeof department.operatingDays === 'object' && department.operatingDays
            ? { ...emptyOperatingDays, ...department.operatingDays }
            : { ...emptyOperatingDays },
        startTime: department.startTime || '',
        endTime: department.endTime || '',
        departmentHead: department.departmentHead || '',
        assignedProviders: Array.isArray(department.assignedProviders) ? department.assignedProviders : [],
        assignedNurses: Array.isArray(department.assignedNurses) ? department.assignedNurses : [],
        defaultBillingProvider: department.defaultBillingProvider || '',
        costCenter: department.costCenter || '',
        revenueCode: department.revenueCode || '',
        acceptsInsurance: !!department.acceptsInsurance,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [department, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!String(formData.departmentName || '').trim()) newErrors.departmentName = 'Department name is required';
    if (!String(formData.departmentCode || '').trim()) newErrors.departmentCode = 'Department code is required';
    if (!formData.status) newErrors.status = 'Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    if (!validate()) {
      return;
    }

    const submitData = {
      departmentName: String(formData.departmentName || '').trim(),
      departmentCode: String(formData.departmentCode || '').trim(),
      departmentType: formData.departmentType === '__none__' ? null : String(formData.departmentType).trim() || null,
      status: formData.status === 'inactive' ? 'inactive' : 'active',
      description: formData.description ? String(formData.description).trim() : null,
      locationId: formData.locationId === '__none__' ? null : formData.locationId,
      facilityName: formData.facilityName ? String(formData.facilityName).trim() : null,
      building: formData.building ? String(formData.building).trim() : null,
      floor: formData.floor ? String(formData.floor).trim() : null,
      roomNumber: formData.roomNumber ? String(formData.roomNumber).trim() : null,
      address: formData.address ? String(formData.address).trim() : null,
      city: formData.city ? String(formData.city).trim() : null,
      state: formData.state ? String(formData.state).trim() : null,
      zip: formData.zip ? String(formData.zip).trim() : null,
      supportsAppointments: !!formData.supportsAppointments,
      supportsWalkIns: !!formData.supportsWalkIns,
      defaultAppointmentDuration:
        formData.defaultAppointmentDuration === '' || formData.defaultAppointmentDuration == null
          ? null
          : parseInt(String(formData.defaultAppointmentDuration), 10),
      operatingDays: formData.operatingDays,
      startTime: formData.startTime ? String(formData.startTime).trim() : null,
      endTime: formData.endTime ? String(formData.endTime).trim() : null,
      departmentHead: formData.departmentHead ? String(formData.departmentHead).trim() : null,
      assignedProviders: Array.isArray(formData.assignedProviders) ? formData.assignedProviders : [],
      assignedNurses: Array.isArray(formData.assignedNurses) ? formData.assignedNurses : [],
      defaultBillingProvider: formData.defaultBillingProvider
        ? String(formData.defaultBillingProvider).trim()
        : null,
      costCenter: formData.costCenter ? String(formData.costCenter).trim() : null,
      revenueCode: formData.revenueCode ? String(formData.revenueCode).trim() : null,
      acceptsInsurance: !!formData.acceptsInsurance,
    };

    if (
      submitData.defaultAppointmentDuration != null &&
      (Number.isNaN(submitData.defaultAppointmentDuration) || submitData.defaultAppointmentDuration < 1)
    ) {
      submitData.defaultAppointmentDuration = null;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewing ? 'View Department' : isEditing ? 'Edit Department' : 'Add New Department'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-6">
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
                      disabled={readOnly || isLoading}
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
                      disabled={readOnly || isLoading}
                    />
                    {errors.departmentCode && (
                      <p className="text-xs text-destructive">{errors.departmentCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentType">Department type</Label>
                    <Select
                      value={formData.departmentType || '__none__'}
                      onValueChange={(value) => handleChange('departmentType', value)}
                      disabled={readOnly || isLoading}
                    >
                      <SelectTrigger className="w-full" disabled={readOnly || isLoading}>
                        <SelectValue placeholder="Select type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        <SelectItem value="Specialty">Specialty</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Administrative">Administrative</SelectItem>
                        <SelectItem value="Inpatient">Inpatient</SelectItem>
                        <SelectItem value="Outpatient">Outpatient</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                      disabled={readOnly || isLoading}
                    >
                      <SelectTrigger className={`w-full ${errors.status ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Linked facility location</Label>
                    <Select
                      value={formData.locationId || '__none__'}
                      onValueChange={(value) => handleChange('locationId', value)}
                      disabled={readOnly || isLoading || loadingLocations}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={loadingLocations ? 'Loading locations…' : 'Optional — link to a location'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No linked location</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={String(loc.id)}>
                            {[loc.name, loc.city, loc.state].filter(Boolean).join(' · ') || loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Optional link to a tenant location.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    disabled={readOnly || isLoading}
                  />
                </div>
              </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <div className="flex w-full sm:w-auto items-center gap-2 justify-end">
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onDelete}
                    className="text-destructive hover:text-destructive"
                    aria-label="Delete"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? 'Saving...' : isEditing ? 'Save Updates' : 'Create Department'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
