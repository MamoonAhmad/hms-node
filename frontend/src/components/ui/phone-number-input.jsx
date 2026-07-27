import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PHONE_COUNTRY,
  countryCodeToFlag,
  formatNationalPhoneInput,
  getCountryOptions,
  parseStoredPhoneNumber,
  toE164Candidate,
} from '@/lib/phoneNumberUtils';

export function PhoneNumberInput({
  id: idProp,
  value = '',
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  disabled = false,
  className,
  inputClassName,
  placeholder,
  error,
  'aria-invalid': ariaInvalid,
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listId = `${inputId}-country-list`;

  const countries = useMemo(() => getCountryOptions(), []);
  const containerRef = useRef(null);
  const lastEmittedRef = useRef(value);

  const [country, setCountry] = useState(
    () => parseStoredPhoneNumber(value, defaultCountry).country,
  );
  const [nationalInput, setNationalInput] = useState(
    () => parseStoredPhoneNumber(value, defaultCountry).nationalInput,
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const syncFromValue = useCallback(
    (storedValue) => {
      const parsed = parseStoredPhoneNumber(storedValue, defaultCountry);
      setCountry(parsed.country);
      setNationalInput(parsed.nationalInput);
    },
    [defaultCountry],
  );

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    syncFromValue(value);
  }, [value, syncFromValue]);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === country) ?? countries.find((c) => c.code === defaultCountry),
    [countries, country, defaultCountry],
  );

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.callingCode.includes(q.replace(/^\+/, '')),
    );
  }, [countries, countrySearch]);

  const emitChange = useCallback(
    (nextNational, nextCountry) => {
      const next = toE164Candidate(nextNational, nextCountry);
      lastEmittedRef.current = next;
      onChange?.(next);
    },
    [onChange],
  );

  const handleNationalChange = (e) => {
    const raw = e.target.value;
    const formatted = formatNationalPhoneInput(raw, country);
    setNationalInput(formatted);
    emitChange(formatted, country);
  };

  const handleCountrySelect = (code) => {
    setCountry(code);
    setCountryOpen(false);
    setCountrySearch('');
    const formatted = formatNationalPhoneInput(nationalInput, code);
    setNationalInput(formatted);
    emitChange(formatted, code);
  };

  useEffect(() => {
    if (!countryOpen) return undefined;

    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setCountryOpen(false);
        setCountrySearch('');
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCountryOpen(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [countryOpen]);

  const invalid = ariaInvalid ?? !!error;

  return (
    <div className={cn('space-y-1', className)}>
      <div ref={containerRef} className="flex gap-0">
        <div className="relative shrink-0">
          <button
            type="button"
            disabled={disabled}
            aria-expanded={countryOpen}
            aria-haspopup="listbox"
            aria-controls={countryOpen ? listId : undefined}
            className={cn(
              'flex h-8 items-center gap-1 rounded-l-md border border-r-0 border-gray-300 bg-white px-1.5 text-[13px] text-black transition-[border-color,box-shadow]',
              'hover:border-gray-400 focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-[3px] focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
              invalid && 'border-destructive aria-invalid:border-destructive',
            )}
            onClick={() => !disabled && setCountryOpen((open) => !open)}
          >
            <span className="text-sm leading-none" aria-hidden>
              {countryCodeToFlag(country)}
            </span>
            <span className="text-muted-foreground tabular-nums">+{selectedCountry?.callingCode}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>

          {countryOpen && (
            <div
              id={listId}
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card shadow-lg"
            >
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="h-9 w-full rounded-md border border-gray-300 bg-white py-1 pl-8 pr-2 text-sm text-black placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-[3px]"
                    autoFocus
                  />
                </div>
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {filteredCountries.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">No countries found</li>
                ) : (
                  filteredCountries.map((c) => (
                    <li key={c.code} role="option" aria-selected={c.code === country}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                          c.code === country && 'bg-muted/80 font-medium',
                        )}
                        onClick={() => handleCountrySelect(c.code)}
                      >
                        <span className="text-base leading-none">{countryCodeToFlag(c.code)}</span>
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">+{c.callingCode}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <Input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={nationalInput}
          onChange={handleNationalChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={cn('rounded-l-none', inputClassName)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
