import { useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from '@/pages/rcm/claimInsuranceShared';
import { placeOfServiceApi } from '@/services/api';
import { formatPosLabel, normalizePosCode } from '@/lib/placeOfServiceConstants';
import { cn } from '@/lib/utils';

let cachedOptions = null;
let cachePromise = null;

async function loadPosOptions() {
  if (cachedOptions) return cachedOptions;
  if (!cachePromise) {
    cachePromise = placeOfServiceApi
      .lookup({ limit: 500 })
      .then((res) => {
        cachedOptions = res.data || [];
        return cachedOptions;
      })
      .catch(() => {
        cachedOptions = [];
        return cachedOptions;
      })
      .finally(() => {
        cachePromise = null;
      });
  }
  return cachePromise;
}

export function invalidatePlaceOfServiceCache() {
  cachedOptions = null;
  cachePromise = null;
}

export function PlaceOfServiceSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select POS',
  className,
  triggerClassName,
  allowEmpty = false,
}) {
  const [options, setOptions] = useState(cachedOptions || []);
  const [loading, setLoading] = useState(!cachedOptions);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPosOptions()
      .then((rows) => {
        if (!cancelled) setOptions(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectOptions = useMemo(() => {
    const normalized = normalizePosCode(value);
    const mapped = (options || []).map((row) => ({
      value: row.code,
      label: row.label || formatPosLabel(row),
    }));

    if (normalized && !mapped.some((o) => o.value === normalized)) {
      mapped.unshift({
        value: normalized,
        label: `${normalized} (not in catalog)`,
      });
    }

    if (allowEmpty) {
      return [{ value: '__none__', label: 'None' }, ...mapped];
    }
    return mapped;
  }, [options, value, allowEmpty]);

  const selectValue = allowEmpty && !value ? '__none__' : normalizePosCode(value) || undefined;

  return (
    <SearchableSelect
      value={selectValue}
      onValueChange={(v) => {
        if (allowEmpty && v === '__none__') {
          onValueChange?.('');
          return;
        }
        onValueChange?.(v);
      }}
      options={selectOptions}
      placeholder={loading ? 'Loading…' : placeholder}
      disabled={disabled || loading}
      className={cn('w-full', className)}
      triggerClassName={triggerClassName}
    />
  );
}
