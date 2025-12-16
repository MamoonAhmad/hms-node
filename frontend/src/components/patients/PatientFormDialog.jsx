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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  contactNumber: '',
  email: '',
  address: '',
  insuranceProvider: '',
  policyNumber: '',
  copay: '',
  deductible: '',
  primaryCarePhysician: '',
};

export function PatientFormDialog({ open, onOpenChange, patient, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isEditing = !!patient;

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        middleName: patient.middleName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        gender: patient.gender || '',
        contactNumber: patient.contactNumber || '',
        email: patient.email || '',
        address: patient.address || '',
        insuranceProvider: patient.insuranceProvider || '',
        policyNumber: patient.policyNumber || '',
        copay: patient.copay || '',
        deductible: patient.deductible || '',
        primaryCarePhysician: patient.primaryCarePhysician || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [patient, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = { ...formData };
    
    // Convert empty strings to null for optional fields
    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === '') {
        submitData[key] = null;
      }
    });

    // Convert numeric fields
    if (submitData.copay) submitData.copay = parseFloat(submitData.copay);
    if (submitData.deductible) submitData.deductible = parseFloat(submitData.deductible);

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleChange('middleName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* DOB and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
              >
                <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                className={errors.contactNumber ? 'border-destructive' : ''}
              />
              {errors.contactNumber && (
                <p className="text-xs text-destructive">{errors.contactNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
            />
          </div>

          {/* Insurance Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Input
                id="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={(e) => handleChange('insuranceProvider', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => handleChange('policyNumber', e.target.value)}
              />
            </div>
          </div>

          {/* Copay and Deductible */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="copay">Copay ($)</Label>
              <Input
                id="copay"
                type="number"
                step="0.01"
                min="0"
                value={formData.copay}
                onChange={(e) => handleChange('copay', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deductible">Deductible ($)</Label>
              <Input
                id="deductible"
                type="number"
                step="0.01"
                min="0"
                value={formData.deductible}
                onChange={(e) => handleChange('deductible', e.target.value)}
              />
            </div>
          </div>

          {/* Primary Care Physician */}
          <div className="space-y-2">
            <Label htmlFor="primaryCarePhysician">Primary Care Physician</Label>
            <Input
              id="primaryCarePhysician"
              value={formData.primaryCarePhysician}
              onChange={(e) => handleChange('primaryCarePhysician', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Patient' : 'Create Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


