import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MENU_Z = 110;

function positionMenu(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  const menuHeight = menu?.offsetHeight || 280;
  const menuWidth = Math.max(rect.width, menu?.offsetWidth || 240);
  const gap = 4;

  let top = rect.bottom + gap;
  if (top + menuHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - menuHeight - gap);
  }

  let left = rect.left;
  if (left + menuWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - menuWidth - 8);
  }

  return { top, left, width: rect.width, minWidth: 240 };
}

/**
 * Multi-select dropdown. Optional search and "Select all" (applies to options visible after search filter).
 * Menu is portaled to avoid clipping inside overflow-hidden panels.
 */
export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  className,
  id,
  searchable = false,
  showSelectAll = false,
  searchPlaceholder = 'Search...',
  selectAllLabel = 'Select all',
  emptySearchMessage = 'No matches',
  error = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, minWidth: 240 });
  const [ready, setReady] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return undefined;
    }

    const update = () => {
      if (!triggerRef.current) return;
      setCoords(positionMenu(triggerRef.current, menuRef.current));
      setReady(true);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, options.length, search, showSelectAll, searchable]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current?.contains(event.target)
        || menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (opt) =>
        String(opt.label).toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
    );
  }, [options, search, searchable]);

  const filteredValues = useMemo(() => new Set(filteredOptions.map((o) => o.value)), [filteredOptions]);

  const allFilteredSelected =
    filteredOptions.length > 0 && filteredOptions.every((o) => value.includes(o.value));
  const someFilteredSelected = filteredOptions.some((o) => value.includes(o.value));

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleSelectAllFiltered = () => {
    if (filteredOptions.length === 0) return;
    if (allFilteredSelected) {
      onChange(value.filter((v) => !filteredValues.has(v)));
    } else {
      const next = new Set(value);
      filteredOptions.forEach((o) => next.add(o.value));
      onChange([...next]);
    }
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label)
    .join(', ');

  const selectAllChecked = allFilteredSelected
    ? true
    : someFilteredSelected
      ? 'indeterminate'
      : false;

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            minWidth: coords.minWidth,
            zIndex: MENU_Z,
            visibility: ready ? 'visible' : 'hidden',
          }}
          className="rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
          role="listbox"
        >
          {searchable && (
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
            {showSelectAll && filteredOptions.length > 0 && (
              <label className="mb-1 flex cursor-pointer items-center gap-2.5 rounded-md border-b border-border px-2 py-2 text-sm font-medium hover:bg-muted/60">
                <Checkbox checked={selectAllChecked} onCheckedChange={handleSelectAllFiltered} />
                <span>{selectAllLabel}</span>
              </label>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {options.length === 0 ? 'No options available' : emptySearchMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    onCheckedChange={() => toggleOption(option.value)}
                  />
                  <span className="flex-1 leading-snug">{option.label}</span>
                </label>
              ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={cn('relative', className)}>
      <Button
        ref={triggerRef}
        id={id}
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn('h-8 w-full justify-between font-normal', error && 'border-destructive')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn('truncate text-left', value.length === 0 && 'text-muted-foreground')}>
          {value.length === 0
            ? placeholder
            : value.length === options.length && options.length > 0
              ? `All selected (${value.length})`
              : `${value.length} selected${
                  selectedLabels ? `: ${selectedLabels.substring(0, 40)}${selectedLabels.length > 40 ? '…' : ''}` : ''
                }`}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </Button>
      {menu}
    </div>
  );
}
