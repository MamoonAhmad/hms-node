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
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { appointmentTypeApi, locationApi, providerScheduleApi } from '@/services/api';
import {
  DAYS_OPTIONS,
  BREAK_APPLIES_TO_OPTIONS,
  scheduleToForm,
  getProviderDepartmentOptions,
  filterActiveAppointmentTypeIds,
  resolveDefaultDepartmentId,
} from '@/lib/providerScheduleUtils';

const emptyForm = () => ({
  providerId: '',
  departmentId: '',
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
  breakHoursEnabled: false,
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  breakAppliesTo: 'all',
  breakDays: [],
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
  editingScheduleId,
  providers = [],
  readOnly = false,
  onSubmit,
  isLoading,
}) {
  const [locationsOptions, setLocationsOptions] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [inactiveTypesRemoved, setInactiveTypesRemoved] = useState(false);

  const isEditing = !!(editingScheduleId || (schedule?.id && !readOnly));
  const scheduleId = editingScheduleId || schedule?.id;

  const selectedProvider = providers.find((p) => p.id === formData.providerId);
  const departmentOptions = getProviderDepartmentOptions(selectedProvider);

  const handleProviderChange = (providerId) => {
    const provider = providers.find((p) => p.id === providerId);
    const deptOptions = getProviderDepartmentOptions(provider);
    const departmentId = deptOptions[0]?.value || '';
    setFormData((prev) => ({
      ...prev,
      providerId,
      departmentId,
      specialty: provider?.specialty || '',
      subSpecialty: provider?.subSpecialty || '',
    }));
    setErrors((prev) => ({
      ...prev,
      providerId: null,
      departmentId: departmentId ? null : prev.departmentId,
    }));
  };

  const departmentDisplay = (() => {
    const fromOptions = departmentOptions.find((d) => d.value === formData.departmentId)?.label;
    if (fromOptions) return fromOptions;
    if (formData.departmentName) return formData.departmentName;
    if (formData.departmentId && formData.providerDepartments?.length) {
      const match = formData.providerDepartments.find((d) => d.id === formData.departmentId);
      if (match?.name || match?.departmentName) {
        return match.name || match.departmentName;
      }
    }
    if (formData.providerId) return 'No department assigned';
    return '';
  })();

  // Load dropdown options when the dialog opens (does not reset form values).
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    Promise.all([appointmentTypeApi.getActive(), locationApi.getActive()])
      .then(([typesRes, locRes]) => {
        if (cancelled) return;
        setAppointmentTypes((typesRes.data || []).map((t) => ({ value: t.id, label: t.name })));
        setLocationsOptions((locRes.data || []).map((l) => ({ value: l.id, label: l.name })));
      })
      .catch(() => {
        if (cancelled) return;
        setAppointmentTypes([]);
        setLocationsOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Initialize form only when the dialog opens or the edited schedule changes.
  // Do not re-run on providers/options updates — that was wiping selected days.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const initForm = async () => {
      setErrors({});
      setInactiveTypesRemoved(false);

      if (!schedule?.id) {
        setFormData(emptyForm());
        return;
      }

      let scheduleSource = schedule;
      if (isEditing || readOnly) {
        try {
          const res = await providerScheduleApi.getById(schedule.id);
          scheduleSource = res.data || schedule;
        } catch {
          scheduleSource = schedule;
        }
      }
      if (cancelled) return;

      const baseForm = scheduleToForm(scheduleSource) || emptyForm();
      const selectedProvider = providers.find((p) => p.id === baseForm.providerId);
      const departmentId = resolveDefaultDepartmentId(scheduleSource, selectedProvider);

      // Keep appointment type IDs as-is here; filter against active options once they load.
      setFormData({ ...baseForm, departmentId });
    };

    initForm();

    return () => {
      cancelled = true;
    };
    // Intentionally omit providers/appointmentTypes — backfill below handles late loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open/schedule identity
  }, [open, schedule?.id, isEditing, readOnly]);

  // When providers finish loading after form init, backfill department/specialty for the selected provider.
  useEffect(() => {
    if (!open || !formData.providerId || !providers.length) return;
    const provider = providers.find((p) => p.id === formData.providerId);
    if (!provider) return;
    const deptOptions = getProviderDepartmentOptions(provider);
    setFormData((prev) => {
      const nextDepartmentId =
        prev.departmentId && deptOptions.some((d) => d.value === prev.departmentId)
          ? prev.departmentId
          : deptOptions[0]?.value || prev.departmentId || '';
      const nextSpecialty = provider.specialty || prev.specialty || '';
      const nextSubSpecialty = provider.subSpecialty || prev.subSpecialty || '';
      if (
        nextDepartmentId === prev.departmentId &&
        nextSpecialty === prev.specialty &&
        nextSubSpecialty === prev.subSpecialty
      ) {
        return prev;
      }
      return {
        ...prev,
        departmentId: nextDepartmentId,
        specialty: nextSpecialty,
        subSpecialty: nextSubSpecialty,
      };
    });
  }, [open, providers, formData.providerId]);

  // Filter out inactive appointment types once the active list is available (edit only).
  useEffect(() => {
    if (!open || readOnly || !appointmentTypes.length) return;
    if (!(isEditing || schedule?.id)) return;

    setFormData((prev) => {
      const { appointmentTypeIds, removedInactiveCount } = filterActiveAppointmentTypeIds(
        prev.appointmentTypeIds,
        appointmentTypes,
      );
      if (removedInactiveCount > 0) setInactiveTypesRemoved(true);
      if (
        appointmentTypeIds.length === (prev.appointmentTypeIds || []).length &&
        appointmentTypeIds.every((id, i) => id === prev.appointmentTypeIds[i])
      ) {
        return prev;
      }
      return { ...prev, appointmentTypeIds };
    });
  }, [open, readOnly, isEditing, schedule?.id, appointmentTypes]);

  const activeProviders = providers.filter((p) => p.isActive !== false);
  const providerOptions = (readOnly || isEditing ? providers : activeProviders).map((p) => ({
    value: p.id,
    label: p.npi ? `${p.name} (${p.npi})` : p.name,
  }));

  const validate = async (data) => {
    const newErrors = {};
    if (!data.providerId) newErrors.providerId = 'Provider is required';
    if (!data.departmentId) {
      newErrors.departmentId = data.providerId
        ? 'Selected provider has no department assigned'
        : 'Department is required';
    }
    if (!data.days?.length) newErrors.days = 'At least one day is required';
    if (!data.startTime) newErrors.startTime = 'Start time is required';
    if (!data.endTime) newErrors.endTime = 'End time is required';

    const startParts = (data.startTime || '').split(':').map(Number);
    const endParts = (data.endTime || '').split(':').map(Number);
    const startM = startParts[0] * 60 + (startParts[1] || 0);
    const endM = endParts[0] * 60 + (endParts[1] || 0);
    if (data.startTime && data.endTime && startM >= endM) {
      newErrors.endTime = 'End time must be later than start time';
    }

    if (!data.appointmentTypeIds?.length) {
      newErrors.appointmentTypeIds = 'Select at least one appointment type';
    }

    const max = Number(data.maxAppointmentsPerSlot);
    if (!Number.isInteger(max) || max < 1) {
      newErrors.maxAppointmentsPerSlot = 'Must be a positive integer';
    }

    const ob = Number(data.overBooking);
    if (!Number.isInteger(ob) || ob < 0) {
      newErrors.overBooking = 'Must be a non-negative integer';
    }

    if (!data.effectiveStartDate) {
      newErrors.effectiveStartDate = 'Effective start date is required';
    }

    if (data.endOnEffectiveDate && !data.effectiveEndDate) {
      newErrors.effectiveEndDate = 'Effective end date is required when End Schedule is selected';
    }

    if (
      data.effectiveEndDate &&
      data.effectiveStartDate &&
      data.effectiveEndDate <= data.effectiveStartDate
    ) {
      newErrors.effectiveEndDate = 'Effective end date must be after effective start date';
    }

    if (data.breakHoursEnabled) {
      if (!data.breakStartTime) newErrors.breakStartTime = 'Break start time is required';
      if (!data.breakEndTime) newErrors.breakEndTime = 'Break end time is required';
      if (!data.breakAppliesTo) newErrors.breakAppliesTo = 'Select how break hours apply';
      if (
        data.breakAppliesTo !== 'all' &&
        !data.breakDays?.length
      ) {
        newErrors.breakDays = 'Select at least one day for break hours';
      }
      const breakStartParts = (data.breakStartTime || '').split(':').map(Number);
      const breakEndParts = (data.breakEndTime || '').split(':').map(Number);
      const breakStartM = breakStartParts[0] * 60 + (breakStartParts[1] || 0);
      const breakEndM = breakEndParts[0] * 60 + (breakEndParts[1] || 0);
      if (data.breakStartTime && data.breakEndTime && breakStartM >= breakEndM) {
        newErrors.breakEndTime = 'Break end time must be later than break start time';
      }
      if (
        data.breakStartTime &&
        data.breakEndTime &&
        (breakStartM < startM || breakEndM > endM)
      ) {
        newErrors.breakEndTime = 'Break hours must fall within schedule working hours';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    try {
      const overlapRes = await providerScheduleApi.checkOverlap({
        providerId: data.providerId,
        departmentId: data.departmentId,
        startTime: data.startTime,
        endTime: data.endTime,
        days: data.days,
        effectiveStartDate: data.effectiveStartDate,
        effectiveEndDate: data.effectiveEndDate || null,
        excludeScheduleId: isEditing ? scheduleId : undefined,
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
    // Snapshot so async overlap check / re-renders cannot submit a wiped form.
    const snapshot = {
      ...formData,
      days: Array.isArray(formData.days) ? [...formData.days] : [],
      appointmentTypeIds: Array.isArray(formData.appointmentTypeIds)
        ? [...formData.appointmentTypeIds]
        : [],
      locationIds: Array.isArray(formData.locationIds) ? [...formData.locationIds] : [],
      breakDays: Array.isArray(formData.breakDays) ? [...formData.breakDays] : [],
    };
    if (!(await validate(snapshot))) return;
    onSubmit(snapshot);
  };

  const disabled = readOnly;

  const title = readOnly ? 'View Schedule' : isEditing ? 'Edit Schedule' : 'Add Schedule';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="ehr-form space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Provider</h3>
            <div className="space-y-2">
              <Label>Provider *</Label>
              <SearchableSelect
                value={formData.providerId || undefined}
                onValueChange={handleProviderChange}
                options={providerOptions}
                placeholder="Search provider..."
                disabled={disabled}
                triggerClassName={errors.providerId ? 'border-destructive' : ''}
              />
              {errors.providerId && <p className="text-xs text-destructive">{errors.providerId}</p>}
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input
                value={departmentDisplay}
                placeholder="Select provider first"
                readOnly
                disabled
                className={`bg-muted ${errors.departmentId ? 'border-destructive' : ''}`}
              />
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId}</p>}
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
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Break Hours</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="breakHoursEnabled"
                checked={formData.breakHoursEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, breakHoursEnabled: !!checked }))
                }
                disabled={disabled}
              />
              <Label htmlFor="breakHoursEnabled" className="font-normal cursor-pointer">
                Enable break hours
              </Label>
            </div>
            {formData.breakHoursEnabled && (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Break Start Time *</Label>
                    <Input
                      type="time"
                      value={formData.breakStartTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, breakStartTime: e.target.value }))}
                      className={errors.breakStartTime ? 'border-destructive' : ''}
                      disabled={disabled}
                    />
                    {errors.breakStartTime && (
                      <p className="text-xs text-destructive">{errors.breakStartTime}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Break End Time *</Label>
                    <Input
                      type="time"
                      value={formData.breakEndTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, breakEndTime: e.target.value }))}
                      className={errors.breakEndTime ? 'border-destructive' : ''}
                      disabled={disabled}
                    />
                    {errors.breakEndTime && (
                      <p className="text-xs text-destructive">{errors.breakEndTime}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Applies To *</Label>
                  <Select
                    value={formData.breakAppliesTo}
                    onValueChange={(breakAppliesTo) =>
                      setFormData((prev) => ({
                        ...prev,
                        breakAppliesTo,
                        breakDays:
                          breakAppliesTo === 'single' && prev.breakDays.length > 1
                            ? [prev.breakDays[0]]
                            : prev.breakDays,
                      }))
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className={errors.breakAppliesTo ? 'border-destructive' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BREAK_APPLIES_TO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.breakAppliesTo && (
                    <p className="text-xs text-destructive">{errors.breakAppliesTo}</p>
                  )}
                </div>
                {formData.breakAppliesTo !== 'all' && (
                  <div className="space-y-2">
                    <Label>Day Selection *</Label>
                    <MultiSelect
                      options={DAYS_OPTIONS.filter((d) => formData.days.includes(d.value))}
                      value={formData.breakDays}
                      onChange={(breakDays) => {
                        const nextDays =
                          formData.breakAppliesTo === 'single'
                            ? breakDays.slice(-1)
                            : breakDays;
                        setFormData((prev) => ({ ...prev, breakDays: nextDays }));
                        if (errors.breakDays) setErrors((prev) => ({ ...prev, breakDays: null }));
                      }}
                      placeholder="Select break days"
                      className={errors.breakDays ? 'border-destructive' : ''}
                      disabled={disabled || !formData.days.length}
                    />
                    {errors.breakDays && <p className="text-xs text-destructive">{errors.breakDays}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Appointment Details</h3>
            {inactiveTypesRemoved && !readOnly && (
              <p className="text-sm text-amber-700 dark:text-amber-400 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                One or more previously assigned appointment types are no longer active. Please select
                at least one active appointment type before saving.
              </p>
            )}
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
