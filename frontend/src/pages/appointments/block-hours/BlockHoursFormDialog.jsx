import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { providerBlockHoursStore } from './providerBlockHoursMock';

const emptyForm = () => ({
  providerId: '',
  days: [],
  startTime: '09:00',
  endTime: '10:00',
  effectiveStartDate: new Date().toISOString().split('T')[0],
  effectiveEndDate: '',
  reason: '',
  status: 'Active',
});

export function BlockHoursFormDialog({ open, onOpenChange, block, onSubmit, isLoading }) {
  const [providers, setProviders] = useState([]);
  const [daysOptions, setDaysOptions] = useState([]);

  const [providerSearch, setProviderSearch] = useState('');
  const [providerOpen, setProviderOpen] = useState(false);
  const providerRef = useRef(null);

  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const isEditing = !!block;

  useEffect(() => {
    if (!open) return;
    setProviderOpen(false);
    providerBlockHoursStore.getProviders(false).then(setProviders);
    providerBlockHoursStore.getDaysOptions().then(setDaysOptions);

    if (block) {
      setFormData({
        providerId: String(block.providerId),
        days: block.days || [],
        startTime: block.startTime || '09:00',
        endTime: block.endTime || '10:00',
        effectiveStartDate: block.effectiveStartDate || new Date().toISOString().split('T')[0],
        effectiveEndDate: block.effectiveEndDate || '',
        reason: block.reason || '',
        status: block.status || 'Active',
      });
      setProviderSearch(block.providerName || '');
    } else {
      setFormData(emptyForm());
      setProviderSearch('');
    }
    setErrors({});
  }, [open, block]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!open) return;
      providerBlockHoursStore.getProviders(false).then((list) => {
        const q = (providerSearch || '').toLowerCase().trim();
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
    setFormData((prev) => ({ ...prev, providerId: String(p.id) }));
    setProviderSearch(p.name || '');
    setProviderOpen(false);
    if (errors.providerId) setErrors((prev) => ({ ...prev, providerId: null }));
  };

  const validate = async () => {
    const newErrors = {};
    if (!formData.providerId) newErrors.providerId = 'Provider is required';
    if (!formData.effectiveStartDate) newErrors.effectiveStartDate = 'Start date is required';
    if (formData.effectiveEndDate && formData.effectiveEndDate < formData.effectiveStartDate) {
      newErrors.effectiveEndDate = 'End date must be on or after start date';
    }
    if (!formData.days?.length) newErrors.days = 'At least one day is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    const startM = parseInt(formData.startTime?.replace(':', '') || '0', 10);
    const endM = parseInt(formData.endTime?.replace(':', '') || '0', 10);
    if (formData.startTime && formData.endTime && startM >= endM) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    const within = await providerBlockHoursStore.validateWithinSchedule({
      providerId: formData.providerId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      days: formData.days,
      effectiveStartDate: formData.effectiveStartDate,
      effectiveEndDate: formData.effectiveEndDate || null,
    });
    if (!within) {
      setErrors((prev) => ({
        ...prev,
        withinSchedule:
          'Block hours must be within the provider’s existing schedule (days, time, and date range).',
      }));
      return false;
    }

    const overlap = await providerBlockHoursStore.checkOverlap({
      providerId: formData.providerId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      days: formData.days,
      effectiveStartDate: formData.effectiveStartDate,
      effectiveEndDate: formData.effectiveEndDate || null,
      excludeBlockId: isEditing ? block.id : null,
    });
    if (overlap) {
      setErrors((prev) => ({ ...prev, overlap: 'This would overlap with an existing block for this provider.' }));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validate())) return;
    onSubmit({
      ...formData,
      effectiveEndDate: formData.effectiveEndDate || null,
      reason: String(formData.reason || '').trim(),
    });
  };

  const daysMultiSelectOptions = daysOptions.map((d) => ({ value: d.value, label: d.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Block Hours' : 'Add Block Hours'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                      if (!e.target.value) setFormData((prev) => ({ ...prev, providerId: '' }));
                    }}
                    onClick={() => setProviderOpen(true)}
                    placeholder="Select provider..."
                    className={errors.providerId ? 'border-destructive pr-9' : 'pr-9'}
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
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.effectiveStartDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effectiveStartDate: e.target.value }))}
                  className={errors.effectiveStartDate ? 'border-destructive' : ''}
                />
                {errors.effectiveStartDate && <p className="text-xs text-destructive">{errors.effectiveStartDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.effectiveEndDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effectiveEndDate: e.target.value }))}
                  className={errors.effectiveEndDate ? 'border-destructive' : ''}
                />
                {errors.effectiveEndDate && <p className="text-xs text-destructive">{errors.effectiveEndDate}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Block Setup</h3>

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
              <Label>Reason</Label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Optional"
                className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Status</h3>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
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

          {errors.withinSchedule && <p className="text-sm text-destructive">{errors.withinSchedule}</p>}
          {errors.overlap && <p className="text-sm text-destructive">{errors.overlap}</p>}

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Block' : 'Add Block'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

