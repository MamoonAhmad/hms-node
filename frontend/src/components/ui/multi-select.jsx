import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Multi-select dropdown. Optional search and "Select all" (applies to options visible after search filter).
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
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between font-normal"
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
      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border bg-popover text-popover-foreground shadow-md"
          role="listbox"
        >
          {searchable && (
            <div className="border-b p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted border-b border-border mb-1">
                <Checkbox checked={selectAllChecked} onCheckedChange={handleSelectAllFiltered} />
                <span>{selectAllLabel}</span>
              </label>
            )}
            {filteredOptions.length === 0 ? (
              <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                {options.length === 0 ? 'No options available' : emptySearchMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
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
        </div>
      )}
    </div>
  );
}
