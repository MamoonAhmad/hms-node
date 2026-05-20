import { useState, useEffect, useRef } from 'react';
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
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { providerSchedulesStore } from './providerSchedulesMock';

const emptyForm = () => ({
  providerId: '',
  specialty: '',
  subSpecialty: '',
  days: [],
  sameTimeForAllDays: true,
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
  appointmentType: 'Both',
  maxAppointmentsPerSlot: 1,
  overBooking: 0,
  locations: [],
  teleconsultationAllowed: false,
  effectiveStartDate: new Date().toISOString().split('T')[0],
  effectiveEndDate: '',
  status: 'Active',
});

export function ProviderScheduleFormDialog({ open, onOpenChange, schedule, onSubmit, isLoading }) {
  const [providers, setProviders] = useState([]);
  const [locationsOptions, setLocationsOptions] = useState([]);
  const [daysOptions, setDaysOptions] = useState([]);
  const [slotDurations, setSlotDurations] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerOpen, setProviderOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const providerRef = useRef(null);

  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const isEditing = !!schedule;

  useEffect(() => {
    if (open) {
      setProviderOpen(false);
      providerSchedulesStore.getDaysOptions().then(setDaysOptions);
      providerSchedulesStore.getSlotDurations().then(setSlotDurations);
      providerSchedulesStore.getAppointmentTypes().then(setAppointmentTypes);
      providerSchedulesStore.getLocations().then(setLocationsOptions);
      if (schedule) {
        setFormData({
          providerId: String(schedule.providerId),
          specialty: schedule.specialty || '',
          subSpecialty: schedule.subSpecialty || '',
          days: schedule.days || [],
          sameTimeForAllDays: schedule.sameTimeForAllDays !== false,
          startTime: schedule.startTime || '09:00',
          endTime: schedule.endTime || '17:00',
          slotDuration: schedule.slotDuration || 30,
          appointmentType: schedule.appointmentType || 'Both',
          maxAppointmentsPerSlot: schedule.maxAppointmentsPerSlot ?? 1,
          overBooking: schedule.overBooking ?? 0,
          locations: schedule.locations || [],
          teleconsultationAllowed: !!schedule.teleconsultationAllowed,
          effectiveStartDate: schedule.effectiveStartDate || new Date().toISOString().split('T')[0],
          effectiveEndDate: schedule.effectiveEndDate || '',
          status: schedule.status || 'Active',
        });
        const prov = providers.find((p) => p.id === schedule.providerId) || {
          id: schedule.providerId,
          name: schedule.providerName,
        };
        setSelectedProvider(prov);
        setProviderSearch(schedule.providerName || '');
      } else {
        setFormData(emptyForm());
        setSelectedProvider(null);
        setProviderSearch('');
      }
      setErrors({});
    }
  }, [open, schedule]);

  useEffect(() => {
    if (!open) return;
    providerSchedulesStore.getProviders(false).then(setProviders);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!open) return;
      providerSchedulesStore.getProviders(false).then((list) => {
        const q = (providerSearch || '').toLowerCase();
        const filtered = q
          ? list.filter(
              (p) =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.specialty || '').toLowerCase().includes(q)
            )
          : list;
        setProviders(filtered);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [open, providerSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (providerRef.current && !providerRef.current.contains(e.target)) setProviderOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProviderSelect = (p) => {
    setSelectedProvider(p);
    setFormData((prev) => ({
      ...prev,
      providerId: String(p.id),
      specialty: p.specialty || '',
      subSpecialty: p.subSpecialty || '',
    }));
    setProviderSearch(p.name || '');
    setProviderOpen(false);
    if (errors.providerId) setErrors((prev) => ({ ...prev, providerId: null }));
  };

  const validate = async () => {
    const newErrors = {};
    if (!formData.providerId) newErrors.providerId = 'Provider is required';
    if (!formData.days?.length) newErrors.days = 'At least one day is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    const startM = parseInt(formData.startTime?.replace(':', '') || '0', 10);
    const endM = parseInt(formData.endTime?.replace(':', '') || '0', 10);
    if (formData.startTime && formData.endTime && startM >= endM) {
      newErrors.endTime = 'End time must be after start time';
    }
    if (!formData.slotDuration) newErrors.slotDuration = 'Slot duration is required';
    if (!formData.appointmentType) newErrors.appointmentType = 'Appointment type is required';
    const max = formData.maxAppointmentsPerSlot;
    if (max == null || max < 1 || !Number.isInteger(Number(max))) {
      newErrors.maxAppointmentsPerSlot = 'Must be a positive integer';
    }
    const ob = formData.overBooking;
    if (ob == null || ob < 0 || !Number.isInteger(Number(ob))) {
      newErrors.overBooking = 'Must be a non-negative integer';
    }
    if (!formData.effectiveStartDate) newErrors.effectiveStartDate = 'Effective start date is required';
    if (formData.effectiveEndDate && formData.effectiveStartDate && formData.effectiveEndDate < formData.effectiveStartDate) {
      newErrors.effectiveEndDate = 'End date must be on or after start date';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    const overlap = await providerSchedulesStore.checkOverlap({
      providerId: formData.providerId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      days: formData.days,
      effectiveStartDate: formData.effectiveStartDate,
      effectiveEndDate: formData.effectiveEndDate || null,
      excludeScheduleId: isEditing ? schedule.id : null,
    });
    if (overlap) {
      setErrors((prev) => ({ ...prev, overlap: 'This would overlap with an existing schedule for this provider.' }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validate())) return;
    const payload = {
      ...formData,
      days: formData.days,
      effectiveEndDate: formData.effectiveEndDate || null,
      overBooking: Number(formData.overBooking) || 0,
      locations: formData.locations || [],
    };
    onSubmit(payload);
  };

  const daysMultiSelectOptions = daysOptions.map((d) => ({ value: d.value, label: d.label }));
  const locationMultiSelectOptions = locationsOptions.map((l) => ({ value: l.value, label: l.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Provider</h3>
            <div className="space-y-2">
              <Label>Provider *</Label>
              <div className="relative" ref={providerRef}>
                <div className="relative">
                  <Input
                    value={providerSearch}
                    onChange={(e) => {
                      setProviderSearch(e.target.value);
                      setProviderOpen(true);
                      if (!e.target.value) {
                        setSelectedProvider(null);
                        setFormData((prev) => ({ ...prev, providerId: '', specialty: '', subSpecialty: '' }));
                      }
                    }}
                    onClick={() => setProviderOpen(true)}
                    placeholder="Select provider..."
                    className={errors.providerId ? 'border-destructive pr-9' : 'pr-9'}
                    readOnly={false}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setProviderOpen((v) => !v)}
                    aria-label="Toggle provider list"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${providerOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {providerOpen && (
                  <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover py-1 shadow-md max-h-48 overflow-auto">
                    {providers.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-muted-foreground">No providers found</li>
                    ) : (
                      providers.map((p) => (
                        <li
                          key={p.id}
                          role="button"
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => handleProviderSelect(p)}
                        >
                          {p.name} {p.specialty ? `(${p.specialty})` : ''}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
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
                />
                {errors.effectiveStartDate && <p className="text-xs text-destructive">{errors.effectiveStartDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>Effective End Date</Label>
                <Input
                  type="date"
                  value={formData.effectiveEndDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effectiveEndDate: e.target.value }))}
                  className={errors.effectiveEndDate ? 'border-destructive' : ''}
                />
                {errors.effectiveEndDate && <p className="text-xs text-destructive">{errors.effectiveEndDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialty *</Label>
                <Input value={formData.specialty} readOnly disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Sub-Specialty</Label>
                <Input value={formData.subSpecialty} readOnly disabled className="bg-muted" />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Availability</h3>
            <div className="space-y-2">
              <Label>Days *</Label>
              <MultiSelect
                options={daysMultiSelectOptions}
                value={formData.days}
                onChange={(v) => {
                  setFormData((prev) => ({ ...prev, days: v }));
                  if (errors.days) setErrors((prev) => ({ ...prev, days: null }));
                }}
                placeholder="Select days"
                showSelectAll
                selectAllLabel="Select all days"
                className={errors.days ? 'border-destructive' : ''}
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
                />
                {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (minutes) *</Label>
              <Select
                value={String(formData.slotDuration)}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, slotDuration: Number(v) }))}
              >
                <SelectTrigger className={errors.slotDuration ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {slotDurations.map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} mins</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Appointment Type *</Label>
                <Select
                  value={formData.appointmentType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, appointmentType: v }))}
                >
                  <SelectTrigger className={errors.appointmentType ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.appointmentType && <p className="text-xs text-destructive">{errors.appointmentType}</p>}
              </div>
              <div className="space-y-2">
                <Label>Max Appointments per Slot *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxAppointmentsPerSlot}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxAppointmentsPerSlot: parseInt(e.target.value, 10) || 1 }))}
                  className={errors.maxAppointmentsPerSlot ? 'border-destructive' : ''}
                />
                {errors.maxAppointmentsPerSlot && <p className="text-xs text-destructive">{errors.maxAppointmentsPerSlot}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Over booking</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.overBooking}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, overBooking: parseInt(e.target.value, 10) || 0 }))
                  }
                  className={errors.overBooking ? 'border-destructive' : ''}
                />
                {errors.overBooking && <p className="text-xs text-destructive">{errors.overBooking}</p>}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <MultiSelect
                  options={locationMultiSelectOptions}
                  value={formData.locations}
                  onChange={(v) => setFormData((prev) => ({ ...prev, locations: v }))}
                  placeholder="Select location(s)"
                  searchable
                  showSelectAll
                  selectAllLabel="Select all locations"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teleconsultation"
                checked={formData.teleconsultationAllowed}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, teleconsultationAllowed: !!checked }))}
              />
              <Label htmlFor="teleconsultation" className="font-normal cursor-pointer">Teleconsultation allowed</Label>
            </div>
          </div>

          {/* Schedule Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Schedule Status</h3>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
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

          {errors.overlap && (
            <p className="text-sm text-destructive">{errors.overlap}</p>
          )}

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Schedule' : 'Add Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
