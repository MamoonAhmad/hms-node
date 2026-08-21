import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { diagnosisCodeApi, hcpcsCodeApi, procedureApi, chargeMasterApi } from '@/services/api';
import { cn } from '@/lib/utils';

const MENU_Z = 110;

function positionDropdown(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  const menuWidth = Math.max(menu?.offsetWidth || 0, rect.width, 288);
  const menuHeight = menu?.offsetHeight || 256;
  const gap = 4;

  let top = rect.bottom + gap;
  let left = rect.left;

  if (top + menuHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - menuHeight - gap);
  }
  if (left + menuWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - menuWidth - 8);
  }
  if (left < 8) left = 8;

  return { top, left, width: menuWidth };
}

const SEARCHERS = {
  diagnosis: async (q) => {
    const res = await diagnosisCodeApi.getAll({ search: q, lookup: true, limit: 20, page: 1 });
    return (res.data || []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      extra: row.chapter,
      raw: row,
    }));
  },
  hcpcs: async (q) => {
    const res = await hcpcsCodeApi.getAll({ search: q, lookup: true, limit: 20, page: 1 });
    return (res.data || []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      extra: row.unitPrice != null ? `$${Number(row.unitPrice).toFixed(2)}` : row.category,
      raw: row,
    }));
  },
  procedure: async (q) => {
    const res = await procedureApi.getAll({ search: q, lookup: true, limit: 20, page: 1 });
    return (res.data || []).map((row) => ({
      id: row.id,
      code: row.cptCode,
      description: row.procedureDescription,
      extra: row.unitPrice != null ? `$${Number(row.unitPrice).toFixed(2)}` : row.categoryName,
      raw: row,
    }));
  },
  charge: async (q) => {
    const res = await chargeMasterApi.search(q, 20);
    const rows = res.data || res || [];
    return rows.map((row) => ({
      id: row.id,
      code: row.code || row.cptCode || row.hcpcsCode,
      description: row.description,
      extra: row.unitCharge != null ? `$${Number(row.unitCharge).toFixed(2)}` : row.codeType,
      raw: row,
    }));
  },
};

export function CodeLookupField({
  catalog = 'diagnosis',
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search code or description',
  disabled = false,
  className,
  inputClassName,
}) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 288 });
  const [menuReady, setMenuReady] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuReady(false);
      return undefined;
    }

    const update = () => {
      if (!inputRef.current || !menuRef.current) return;
      setCoords(positionDropdown(inputRef.current, menuRef.current));
      setMenuReady(true);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, results, loading]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (
        wrapRef.current?.contains(e.target)
        || menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await SEARCHERS[catalog](query.trim());
        setResults(rows);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [catalog, query, open]);

  const handleType = (next) => {
    setQuery(next);
    onChange?.(next);
    setOpen(true);
  };

  const handlePick = (item) => {
    setQuery(item.code || '');
    onChange?.(item.code || '');
    onSelect?.(item);
    setOpen(false);
  };

  const dropdown = open ? (
    <div
      ref={menuRef}
      className={cn(
        'fixed max-h-64 overflow-auto rounded-md border bg-popover shadow-md',
        !menuReady && 'opacity-0',
      )}
      style={{
        zIndex: MENU_Z,
        top: coords.top,
        left: coords.left,
        width: coords.width,
      }}
    >
      {loading ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">Searching catalog…</p>
      ) : results.length === 0 ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {query.trim() ? 'No matching catalog codes' : 'Type to search the catalog'}
        </p>
      ) : (
        results.map((item) => (
          <button
            key={`${item.id}-${item.code}`}
            type="button"
            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-accent"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handlePick(item)}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold">{item.code}</span>
              {item.extra ? <span className="text-[11px] text-muted-foreground">{item.extra}</span> : null}
            </span>
            <span className="line-clamp-2 text-xs text-muted-foreground">{item.description}</span>
          </button>
        ))
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('font-mono text-xs', inputClassName)}
        autoComplete="off"
      />
      {typeof document !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
