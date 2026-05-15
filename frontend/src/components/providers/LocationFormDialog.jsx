import { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Deactive', label: 'Deactive' },
];

export function LocationFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  mode = 'create', // create | edit | view
  location,
  departments = [],
}) {
  const isView = mode === 'view';
  const title = useMemo(() => {
    if (mode === 'edit') return 'Edit Location';
    if (mode === 'view') return 'View Location';
    return 'Add Location';
  }, [mode]);

  const [departmentId, setDepartmentId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    if (!open) return;
    setDepartmentId(location?.departmentId ? String(location.departmentId) : '');
    setLocationName(location?.locationName || '');
    setStatus(location?.status || 'Active');
  }, [open, location]);

  const canSave = Boolean(departmentId) && Boolean(locationName.trim()) && Boolean(status);

  const handleSave = async () => {
    if (isView) {
      onOpenChange(false);
      return;
    }
    if (!canSave) return;
    await onSubmit({
      departmentId: Number(departmentId),
      departmentName: departments.find((d) => String(d.id) === String(departmentId))?.departmentName || '',
      locationName: locationName.trim(),
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <Label>Select Department</Label>
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              disabled={isView || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location Name</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter location name"
              disabled={isView || isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={isView || isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || (!isView && !canSave)}
          >
            {isView ? 'Close' : isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

