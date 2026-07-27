import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RADIOLOGY_MODALITY_OPTIONS } from '@/components/radiology/radiologyStudyConstants';

const emptyForm = () => ({
  name: '',
  code: '',
  modality: '',
  bodyPart: '',
  isActive: true,
});

function rowToForm(study) {
  return {
    name: study?.name || '',
    code: study?.code || '',
    modality: study?.modality || '',
    bodyPart: study?.bodyPart || '',
    isActive: study?.isActive !== false,
  };
}

export function RadiologyStudyFormDialog({
  open,
  onOpenChange,
  study,
  onSubmit,
  isLoading = false,
  mode = 'create',
}) {
  const [form, setForm] = useState(emptyForm());
  const readOnly = mode === 'view';

  useEffect(() => {
    if (open) {
      setForm(study ? rowToForm(study) : emptyForm());
    }
  }, [open, study]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim(),
      modality: form.modality,
      bodyPart: form.bodyPart.trim() || null,
      isActive: form.isActive,
    });
  };

  const title =
    mode === 'create'
      ? 'Add Radiology Study'
      : mode === 'edit'
        ? 'Edit Radiology Study'
        : 'Radiology Study Details';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Read-only view of radiology study configuration.'
              : 'Configure radiology study details for use in patient orders.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="radiology-name">Radiology Name</Label>
            <Input
              id="radiology-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={readOnly || isLoading}
              required={!readOnly}
              placeholder="e.g. Chest X-Ray"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-code">Radiology Code</Label>
            <Input
              id="radiology-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              disabled={readOnly || isLoading}
              required={!readOnly}
              placeholder="e.g. XR-CHEST"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-modality">Modality</Label>
            <Select
              value={form.modality || undefined}
              onValueChange={(value) => setForm((f) => ({ ...f, modality: value }))}
              disabled={readOnly || isLoading}
            >
              <SelectTrigger id="radiology-modality" aria-label="Modality">
                <SelectValue placeholder="Select modality" />
              </SelectTrigger>
              <SelectContent>
                {RADIOLOGY_MODALITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-body-part">Body Part</Label>
            <Input
              id="radiology-body-part"
              value={form.bodyPart}
              onChange={(e) => setForm((f) => ({ ...f, bodyPart: e.target.value }))}
              disabled={readOnly || isLoading}
              placeholder="e.g. Chest"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="radiology-status"
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v === true }))}
              disabled={readOnly || isLoading}
            />
            <Label htmlFor="radiology-status" className="font-normal">
              Active
            </Label>
          </div>
          {!readOnly && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !form.name.trim() ||
                  !form.code.trim() ||
                  !form.modality
                }
              >
                {isLoading ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
              </Button>
            </DialogFooter>
          )}
          {readOnly && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
