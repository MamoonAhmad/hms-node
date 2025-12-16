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

const appointmentTypes = ['New', 'Follow-up', 'Televisit'];
const appointmentStatuses = [
  'Scheduled',
  'Checked-In',
  'In Progress',
  'Completed',
  'Cancelled',
  'No-Show',
  'Rescheduled',
];

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const initialFormData = {
  patientId: '',
  appointmentDate: '',
  appointmentTime: '',
  duration: 30,
  appointmentType: '',
  visitReason: '',
  department: '',
  provider: '',
  status: 'Scheduled',
  notes: '',
};

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  patients = [],
  onSubmit,
  isLoading,
  initialDate = '',
  initialTime = '',
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isEditing = !!appointment;

  useEffect(() => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId || '',
        appointmentDate: appointment.appointmentDate
          ? appointment.appointmentDate.split('T')[0]
          : '',
        appointmentTime: appointment.appointmentTime || '',
        duration: appointment.duration || 30,
        appointmentType: appointment.appointmentType || '',
        visitReason: appointment.visitReason || '',
        department: appointment.department || '',
        provider: appointment.provider || '',
        status: appointment.status || 'Scheduled',
        notes: appointment.notes || '',
      });
    } else {
      // Pre-fill date and time if provided (from timeline click)
      setFormData({
        ...initialFormData,
        appointmentDate: initialDate || '',
        appointmentTime: initialTime || '',
      });
    }
    setErrors({});
  }, [appointment, open, initialDate, initialTime]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.patientId) newErrors.patientId = 'Patient is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Time is required';
    if (!formData.appointmentType) newErrors.appointmentType = 'Type is required';

    // Validate time format
    if (formData.appointmentTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.appointmentTime)) {
      newErrors.appointmentTime = 'Invalid time format (use HH:MM)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      patientId: formData.patientId,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      duration: parseInt(formData.duration, 10) || 30,
      appointmentType: formData.appointmentType,
      visitReason: formData.visitReason || null,
      department: formData.department || null,
      provider: formData.provider || null,
      status: formData.status || 'Scheduled',
      notes: formData.notes || null,
    };

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Appointment' : 'Schedule New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient *</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => handleChange('patientId', value)}
              disabled={isEditing}
            >
              <SelectTrigger className={errors.patientId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.mrn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patientId && (
              <p className="text-xs text-destructive">{errors.patientId}</p>
            )}
          </div>

          {/* Date, Time, and Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Date *</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleChange('appointmentDate', e.target.value)}
                className={errors.appointmentDate ? 'border-destructive' : ''}
              />
              {errors.appointmentDate && (
                <p className="text-xs text-destructive">{errors.appointmentDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Time *</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => handleChange('appointmentTime', e.target.value)}
                className={errors.appointmentTime ? 'border-destructive' : ''}
              />
              {errors.appointmentTime && (
                <p className="text-xs text-destructive">{errors.appointmentTime}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => handleChange('duration', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentType">Appointment Type *</Label>
              <Select
                value={formData.appointmentType}
                onValueChange={(value) => handleChange('appointmentType', value)}
              >
                <SelectTrigger className={errors.appointmentType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.appointmentType && (
                <p className="text-xs text-destructive">{errors.appointmentType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department and Provider */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department / Specialty</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="e.g., General Medicine"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider / Physician</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                placeholder="e.g., Dr. Jane Smith"
              />
            </div>
          </div>

          {/* Visit Reason */}
          <div className="space-y-2">
            <Label htmlFor="visitReason">Visit Reason / Chief Complaint</Label>
            <Textarea
              id="visitReason"
              value={formData.visitReason}
              onChange={(e) => handleChange('visitReason', e.target.value)}
              placeholder="Describe the reason for the visit..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : isEditing
                ? 'Update Appointment'
                : 'Schedule Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
