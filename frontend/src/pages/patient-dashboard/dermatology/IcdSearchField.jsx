import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { cn } from '@/lib/utils';

export function IcdSearchField({
  value = '',
  code = '',
  onSelect,
  placeholder = 'Search ICD-10…',
  className,
}) {
  const [query, setQuery] = useState(value || (code ? String(code) : ''));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || (code ? String(code) : ''));
  }, [value, code]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const runSearch = useCallback(async (term) => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await diagnosisCodeApi.getAll({ search: q, limit: 12, page: 1 });
      setResults((res.data || []).filter((item) => item.isActive !== false));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (next) => {
    setQuery(next);
    setOpen(true);
    onSelect?.({ id: '', code: '', description: '', display: next });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(next), 300);
  };

  const handlePick = (item) => {
    const display = `${item.code} — ${item.description}`;
    setQuery(display);
    setOpen(false);
    setResults([]);
    onSelect?.({
      id: item.id,
      code: item.code,
      description: item.description,
      display,
    });
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full flex-col rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => handlePick(item)}
              >
                <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                <span className="text-foreground">{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
