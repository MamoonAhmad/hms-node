import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function EntityLookupField({
  label,
  required = false,
  value,
  displayValue,
  onSelect,
  onClear,
  searcher,
  placeholder = 'Search…',
  error,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const handle = setTimeout(async () => {
      setLoading(true);
      setSearchError('');
      try {
        const rows = await searcher(query.trim());
        setResults(rows || []);
      } catch (err) {
        setResults([]);
        setSearchError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, query, searcher, retryTick]);

  const handlePick = (item) => {
    onSelect?.(item);
    setOpen(false);
    setQuery('');
  };

  const title = `Select ${String(label || '').replace(/\s*\*$/, '')}`;

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="flex items-center gap-1">
        <Input
          value={displayValue || ''}
          readOnly
          placeholder={placeholder}
          disabled={disabled}
          className={cn('flex-1', error && 'border-destructive')}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          title={title}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>
        {value && onClear ? (
          <Button type="button" variant="ghost" size="icon-sm" title="Clear" disabled={disabled} onClick={onClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="pl-7"
              />
            </div>
            <div className="max-h-64 overflow-auto rounded-md border bg-card">
              {loading ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">Searching…</p>
              ) : searchError ? (
                <div className="space-y-2 px-3 py-3">
                  <p className="text-xs text-destructive">{searchError}</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => setRetryTick((n) => n + 1)}>
                    Retry
                  </Button>
                </div>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">No records found</p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 border-b px-3 py-1.5 text-left last:border-b-0 hover:bg-muted"
                    onClick={() => handlePick(item)}
                  >
                    <span className="text-sm font-medium leading-5">{item.label}</span>
                    {(item.lines || []).filter(Boolean).map((line) => (
                      <span key={line} className="text-[11px] leading-4 text-muted-foreground">{line}</span>
                    ))}
                  </button>
                ))
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
