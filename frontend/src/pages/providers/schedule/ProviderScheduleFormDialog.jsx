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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { appointmentTypeApi, locationApi, providerScheduleApi } from '@/services/api';
import {
  DAYS_OPTIONS,
  scheduleToForm,
} from '@/lib/providerScheduleUtils';

const emptyForm = () => ({
  providerId: '',
  specialty: '',
  subSpecialty: '',
  days: [],
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
  appointmentTypeIds: [],
  maxAppointmentsPerSlot: 1,
  overBooking: 0,
  locationIds: [],
  effectiveStartDate: new Date().toISOString().split('T')[0],
  effectiveEndDate: '',
  endOnEffectiveDate: false,
  status: 'Active',
  teleconsultationAllowed: false,
});

export function ProviderScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  providers = [],
  readOnly = false,
  onSubmit,
  isLoading,
}) {
  const [locationsOptions, setLocationsOptions] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const isEditing = !!schedule && !readOnly;

  useEffect(() => {
    if (!open) return;

    appointmentTypeApi.getActive().then((res) => {
      setAppointmentTypes(
        (res.data || []).map((t) => ({ value: t.id, label: t.name })),
      );
    }).catch(() => setAppointmentTypes([]));

    locationApi.getActive().then((res) => {
      setLocationsOptions(
        (res.data || []).map((l) => ({ value: l.id, label: l.name })),
      );
    }).catch(() => setLocationsOptions([]));

    if (schedule) {
      setFormData(scheduleToForm(schedule) || emptyForm());
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [open, schedule]);

  const activeProviders = providers.filter((p) => p.isActive !== false);
  const providerOptions = (readOnly || isEditing ? providers : activeProviders).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const handleProviderChange = (providerId) => {
    const provider = providers.find((p) => p.id === providerId);
    setFormData((prev) => ({
      ...prev,
      providerId,
      specialty: provider?.specialty || '',
      subSpecialty: provider?.subSpecialty || '',
    }));
    if (errors.providerId) setErrors((prev) => ({ ...prev, providerId: null }));
  };

  const validate = async () => {
    const newErrors = {};
    if (!formData.providerId) newErrors.providerId = 'Provider is required';
    if (!formData.days?.length) newErrors.days = 'At least one day is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    const startParts = (formData.startTime || '').split(':').map(Number);
    const endParts = (formData.endTime || '').split(':').map(Number);
    const startM = startParts[0] * 60 + (startParts[1] || 0);
    const endM = endParts[0] * 60 + (endParts[1] || 0);
    if (formData.startTime && formData.endTime && startM >= endM) {
      newErrors.endTime = 'End time must be later than start time';
    }

    const slotDuration = Number(formData.slotDuration);
    if (!slotDuration || !Number.isInteger(slotDuration) || slotDuration < 1) {
      newErrors.slotDuration = 'Slot duration is required';
    }

    if (!formData.appointmentTypeIds?.length) {
      newErrors.appointmentTypeIds = 'Select at least one appointment type';
    }

    const max = Number(formData.maxAppointmentsPerSlot);
    if (!Number.isInteger(max) || max < 1) {
      newErrors.maxAppointmentsPerSlot = 'Must be a positive integer';
    }

    const ob = Number(formData.overBooking);
    if (!Number.isInteger(ob) || ob < 0) {
      newErrors.overBooking = 'Must be a non-negative integer';
    }

    if (!formData.effectiveStartDate) {
      newErrors.effectiveStartDate = 'Effective start date is required';
    }

    if (formData.endOnEffectiveDate && !formData.effectiveEndDate) {
      newErrors.effectiveEndDate = 'Effective end date is required when End Schedule is selected';
    }

    if (
      formData.effectiveEndDate &&
      formData.effectiveStartDate &&
      formData.effectiveEndDate <= formData.effectiveStartDate
    ) {
      newErrors.effectiveEndDate = 'Effective end date must be after effective start date';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    try {
      const overlapRes = await providerScheduleApi.checkOverlap({
        providerId: formData.providerId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        days: formData.days,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate || null,
        excludeScheduleId: isEditing ? schedule.id : undefined,
      });
      if (overlapRes.data?.overlap) {
        setErrors((prev) => ({
          ...prev,
          overlap: 'This would overlap with an existing schedule for this provider.',
        }));
        return false;
      }
    } catch {
      /* overlap check failure should not block if network issue — server validates on save */
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!(await validate())) return;
    onSubmit(formData);
  };

  const disabled = readOnly;

  const title = readOnly ? 'View Schedule' : isEditing ? 'Edit Schedule' : 'Add Schedule';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[900px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Provider</h3>
            <div className="space-y-2">
              <Label>Provider *</Label>
              <Select
                value={formData.providerId || undefined}
                onValueChange={handleProviderChange}
                disabled={disabled}
              >
                <SelectTrigger className={errors.providerId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.providerId && <p className="text-xs text-destructive">{errors.providerId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Start Date *</Label>
                <Input
                  type="date"
                  value={formData.effectiveStartDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effectiveStartDate: e.target.value }))}
                  className={errors.effectiveStartDate ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.effectiveStartDate && (
                  <p className="text-xs text-destructive">{errors.effectiveStartDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Effective End Date</Label>
                <Input
                  type="date"
                  value={formData.effectiveEndDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effectiveEndDate: e.target.value }))}
                  className={errors.effectiveEndDate ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.effectiveEndDate && (
                  <p className="text-xs text-destructive">{errors.effectiveEndDate}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="endOnEffectiveDate"
                checked={formData.endOnEffectiveDate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, endOnEffectiveDate: !!checked }))
                }
                disabled={disabled}
              />
              <Label htmlFor="endOnEffectiveDate" className="font-normal cursor-pointer">
                End schedule on effective end date
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input value={formData.specialty} readOnly disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Sub-Specialty</Label>
                <Input value={formData.subSpecialty} readOnly disabled className="bg-muted" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Availability</h3>
            <div className="space-y-2">
              <Label>Days *</Label>
              <MultiSelect
                options={DAYS_OPTIONS}
                value={formData.days}
                onChange={(v) => {
                  setFormData((prev) => ({ ...prev, days: v }));
                  if (errors.days) setErrors((prev) => ({ ...prev, days: null }));
                }}
                placeholder="Select days"
                showSelectAll
                selectAllLabel="All days"
                className={errors.days ? 'border-destructive' : ''}
                disabled={disabled}
              />
              {errors.days && <p className="text-xs text-destructive">{errors.days}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                  className={errors.startTime ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                  className={errors.endTime ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (minutes) *</Label>
              <Input
                type="number"
                min={1}
                value={formData.slotDuration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slotDuration: parseInt(e.target.value, 10) || '' }))
                }
                className={errors.slotDuration ? 'border-destructive' : ''}
                disabled={disabled}
              />
              {errors.slotDuration && <p className="text-xs text-destructive">{errors.slotDuration}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Appointment Type(s) *</Label>
                <MultiSelect
                  options={appointmentTypes}
                  value={formData.appointmentTypeIds}
                  onChange={(v) => {
                    setFormData((prev) => ({ ...prev, appointmentTypeIds: v }));
                    if (errors.appointmentTypeIds) setErrors((prev) => ({ ...prev, appointmentTypeIds: null }));
                  }}
                  placeholder="Select appointment type(s)"
                  searchable
                  showSelectAll
                  selectAllLabel="Select all appointment types"
                  className={errors.appointmentTypeIds ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.appointmentTypeIds && (
                  <p className="text-xs text-destructive">{errors.appointmentTypeIds}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Max Appointments per Slot *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxAppointmentsPerSlot}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxAppointmentsPerSlot: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  className={errors.maxAppointmentsPerSlot ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.maxAppointmentsPerSlot && (
                  <p className="text-xs text-destructive">{errors.maxAppointmentsPerSlot}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Over Booking</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.overBooking}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, overBooking: parseInt(e.target.value, 10) || 0 }))
                  }
                  className={errors.overBooking ? 'border-destructive' : ''}
                  disabled={disabled}
                />
                {errors.overBooking && <p className="text-xs text-destructive">{errors.overBooking}</p>}
              </div>
              <div className="space-y-2">
                <Label>Location(s)</Label>
                <MultiSelect
                  options={locationsOptions}
                  value={formData.locationIds}
                  onChange={(v) => setFormData((prev) => ({ ...prev, locationIds: v }))}
                  placeholder="Select location(s)"
                  searchable
                  showSelectAll
                  selectAllLabel="Select all locations"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Schedule Status</h3>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {errors.overlap && <p className="text-sm text-destructive">{errors.overlap}</p>}

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Schedule' : 'Add Schedule'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
