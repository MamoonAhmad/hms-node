import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Text field with a searchable dropdown opened via the lookup (Search) icon.
 * `loadOptions(query)` should return `{ value, label, subLabel?, raw? }[]`.
 */
export function EntityLookupField({
  label,
  value,
  onChange,
  onSelect,
  loadOptions,
  icon: Icon,
  placeholder = 'Search...',
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || typeof loadOptions !== 'function') return undefined;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const rows = await loadOptions(query);
        if (!cancelled) setOptions(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(run, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [open, query, loadOptions]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const handlePick = (opt) => {
    const labelText = opt.label || '';
    onChange?.(labelText);
    onSelect?.(opt);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative space-y-2', className)}>
      {label ? <Label className="text-sm">{label}</Label> : null}
      <div className="flex gap-1">
        <Input
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Lookup"
          disabled={disabled || typeof loadOptions !== 'function'}
          onClick={() => setOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
        </Button>
        {Icon ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Lookup"
            disabled={disabled || typeof loadOptions !== 'function'}
            onClick={() => setOpen(true)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b">
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-8"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading…</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handlePick(opt)}
                >
                  <div className="font-medium">{opt.label}</div>
                  {opt.subLabel ? (
                    <div className="text-xs text-muted-foreground">{opt.subLabel}</div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
