import { useState, useRef, useEffect } from 'react';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function formatDateLabel(iso) {
  if (!iso) return '';
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function buildRangeLabel(dateFrom, dateTo, placeholder) {
  if (!dateFrom && !dateTo) return placeholder;
  if (dateFrom && dateTo) return `${formatDateLabel(dateFrom)} – ${formatDateLabel(dateTo)}`;
  if (dateFrom) return `From ${formatDateLabel(dateFrom)}`;
  return `To ${formatDateLabel(dateTo)}`;
}

/**
 * Single trigger that opens a panel with From / To date inputs.
 */
export function DateRangePicker({
  dateFrom = '',
  dateTo = '',
  onChange,
  placeholder = 'Select date range',
  className,
  id,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const displayLabel = buildRangeLabel(dateFrom, dateTo, placeholder);
  const hasValue = Boolean(dateFrom || dateTo);

  const update = (patch) => {
    onChange?.({
      dateFrom: patch.dateFrom !== undefined ? patch.dateFrom : dateFrom,
      dateTo: patch.dateTo !== undefined ? patch.dateTo : dateTo,
    });
  };

  const handleClear = () => {
    onChange?.({ dateFrom: '', dateTo: '' });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full justify-between font-normal h-8 px-2.5"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={cn('truncate text-left', !hasValue && 'text-muted-foreground')}>
          {displayLabel}
        </span>
        <span className="flex items-center gap-1 shrink-0 text-muted-foreground">
          <CalendarRange className="h-4 w-4" />
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </span>
      </Button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[300px] rounded-md border bg-popover text-popover-foreground shadow-md p-4"
          role="dialog"
          aria-label="Date range"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${id || 'date'}-from`} className="text-xs font-medium text-muted-foreground">
                From
              </Label>
              <Input
                id={`${id || 'date'}-from`}
                type="date"
                value={dateFrom}
                onChange={(e) => update({ dateFrom: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id || 'date'}-to`} className="text-xs font-medium text-muted-foreground">
                To
              </Label>
              <Input
                id={`${id || 'date'}-to`}
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => update({ dateTo: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
            <Button type="button" size="sm" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
