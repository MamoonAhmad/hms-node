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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VACCINE_ROUTE_OPTIONS } from '@/services/api/vaccine.api';

const emptyForm = () => ({
  vaccineName: '',
  vaccineCode: '',
  manufacturer: '',
  route: '',
  status: 'Active',
});

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function VaccineFormDialog({ open, onOpenChange, record, mode = 'create', onSubmit, isLoading }) {
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  useEffect(() => {
    if (!open) return;

    if (record) {
      setFormData({
        vaccineName: record.vaccineName || '',
        vaccineCode: record.vaccineCode || '',
        manufacturer: record.manufacturer || '',
        route: record.route || '',
        status: record.status || 'Active',
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [record, open, mode]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const newErrors = {};
    if (!formData.vaccineName.trim()) newErrors.vaccineName = 'Vaccine Name is required';
    if (!formData.vaccineCode.trim()) newErrors.vaccineCode = 'Vaccine Code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      vaccineName: formData.vaccineName.trim(),
      vaccineCode: formData.vaccineCode.trim(),
      manufacturer: formData.manufacturer.trim() || null,
      route: formData.route || null,
      status: formData.status || 'Active',
    });
  };

  const title = isView
    ? 'View Immunization / Vaccine'
    : isEdit
      ? 'Edit Immunization / Vaccine'
      : 'Add Immunization / Vaccine';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[520px] max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccineName">Vaccine Name *</Label>
            <Input
              id="vaccineName"
              value={formData.vaccineName}
              onChange={(e) => handleChange('vaccineName', e.target.value)}
              placeholder="e.g. Influenza vaccine, quadrivalent"
              className={errors.vaccineName ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.vaccineName && <p className="text-xs text-destructive">{errors.vaccineName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccineCode">Vaccine Code *</Label>
            <Input
              id="vaccineCode"
              value={formData.vaccineCode}
              onChange={(e) => handleChange('vaccineCode', e.target.value)}
              placeholder="e.g. FLU-QIV"
              className={errors.vaccineCode ? 'border-destructive' : ''}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
            {errors.vaccineCode && <p className="text-xs text-destructive">{errors.vaccineCode}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={formData.manufacturer}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
              disabled={readOnly || isLoading}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route">Route</Label>
            <Select
              value={formData.route || 'none'}
              onValueChange={(v) => handleChange('route', v === 'none' ? '' : v)}
              disabled={readOnly || isLoading}
            >
              <SelectTrigger id="route">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select route</SelectItem>
                {VACCINE_ROUTE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => handleChange('status', v)}
              disabled={readOnly || isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isView && record && (
            <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p>{record.createdByName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created Date &amp; Time</p>
                <p>{formatDateTime(record.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated By</p>
                <p>{record.updatedByName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated Date &amp; Time</p>
                <p>{formatDateTime(record.updatedAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
