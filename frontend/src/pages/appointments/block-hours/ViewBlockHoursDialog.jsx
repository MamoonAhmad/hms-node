import { useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { providerBlockHoursStore } from './providerBlockHoursMock';

const readOnlyClass = 'bg-muted cursor-default';

export function ViewBlockHoursDialog({ open, onOpenChange, block }) {
  const [daysOptions, setDaysOptions] = useState([]);

  useEffect(() => {
    if (!open) return;
    providerBlockHoursStore.getDaysOptions().then(setDaysOptions);
  }, [open]);

  if (!block) return null;

  const daysMultiSelectOptions = daysOptions.map((d) => ({ value: d.value, label: d.label }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Block Hours Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Provider</h3>

            <div className="space-y-2">
              <Label>Provider *</Label>
              <Input
                value={block.providerName || ''}
                disabled
                readOnly
                className={readOnlyClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={block.effectiveStartDate || ''}
                  disabled
                  readOnly
                  className={readOnlyClass}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={block.effectiveEndDate || ''}
                  disabled
                  readOnly
                  className={readOnlyClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Block Setup</h3>

            <div className="space-y-2">
              <Label>Days *</Label>
              <div className="pointer-events-none opacity-90">
                <MultiSelect
                  options={daysMultiSelectOptions}
                  value={block.days || []}
                  onChange={() => {}}
                  placeholder="Select days"
                  showSelectAll
                  selectAllLabel="Select all days"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={block.startTime || ''}
                  disabled
                  readOnly
                  className={readOnlyClass}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={block.endTime || ''}
                  disabled
                  readOnly
                  className={readOnlyClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <textarea
                value={block.reason || ''}
                disabled
                readOnly
                placeholder="Optional"
                className={cn(
                  'min-h-[88px] w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background',
                  readOnlyClass,
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Status</h3>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={block.status || 'Active'} disabled>
                <SelectTrigger className={readOnlyClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
