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
  disabled = false,
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

  const normalizedValue = useMemo(
    () => (Array.isArray(value) ? value.map((v) => String(v)) : []),
    [value],
  );
  const valueSet = useMemo(() => new Set(normalizedValue), [normalizedValue]);

  const filteredValues = useMemo(
    () => new Set(filteredOptions.map((o) => String(o.value))),
    [filteredOptions],
  );

  const allFilteredSelected =
    filteredOptions.length > 0 && filteredOptions.every((o) => valueSet.has(String(o.value)));
  const someFilteredSelected = filteredOptions.some((o) => valueSet.has(String(o.value)));

  const toggleOption = (optionValue) => {
    const key = String(optionValue);
    const newValue = valueSet.has(key)
      ? normalizedValue.filter((v) => v !== key)
      : [...normalizedValue, key];
    onChange(newValue);
  };

  const handleSelectAllFiltered = () => {
    if (filteredOptions.length === 0) return;
    if (allFilteredSelected) {
      onChange(normalizedValue.filter((v) => !filteredValues.has(v)));
    } else {
      const next = new Set(normalizedValue);
      filteredOptions.forEach((o) => next.add(String(o.value)));
      onChange([...next]);
    }
  };

  const selectedLabels = options
    .filter((opt) => valueSet.has(String(opt.value)))
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
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="h-8 w-full justify-between px-2.5 text-[13px] font-normal"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn('truncate text-left', normalizedValue.length === 0 && 'text-muted-foreground')}>
          {normalizedValue.length === 0
            ? placeholder
            : normalizedValue.length === options.length && options.length > 0
              ? `All selected (${normalizedValue.length})`
              : `${normalizedValue.length} selected${
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
                    checked={valueSet.has(String(option.value))}
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
