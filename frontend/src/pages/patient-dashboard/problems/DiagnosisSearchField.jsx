import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { diagnosisCodeApi } from '@/services/api';
import { cn } from '@/lib/utils';

export function DiagnosisSearchField({ value, onSelect, disabled, error }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value?.description) {
      setQuery(`${value.code ? `${value.code} — ` : ''}${value.description}`);
    }
  }, [value?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await diagnosisCodeApi.getAll({ search: query, limit: 25, page: 1 });
        setResults(res.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onSelect?.({
      diagnosisId: item.id,
      icd10Code: item.code,
      diagnosisDescription: item.description,
    });
    setQuery(`${item.code} — ${item.description}`);
    setOpen(false);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>Search ICD-10-CM Diagnoses or Symptoms</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ICD-10-CM diagnoses or symptoms..."
          value={query}
          disabled={disabled}
          className={cn('pl-9', error && 'border-destructive')}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) {
              onSelect?.({ diagnosisId: '', icd10Code: '', diagnosisDescription: '' });
            }
          }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No matching diagnoses.</p>
            ) : (
              <ul className="divide-y">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => handleSelect(item)}
                    >
                      <span className="font-medium">{item.code}</span>
                      <span className="text-muted-foreground"> — {item.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
