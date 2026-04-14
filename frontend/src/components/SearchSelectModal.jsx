import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

/**
 * Reusable modal for searching and selecting an item from a list.
 * @param {boolean} open - Whether the modal is open
 * @param {function} onOpenChange - (open: boolean) => void
 * @param {string} title - Modal title
 * @param {string} searchPlaceholder - Placeholder for search input
 * @param {function} fetchResults - (search: string) => Promise<Array> - returns list of items
 * @param {function} getItemLabel - (item) => string - primary display label
 * @param {function} [getItemSecondaryLabel] - (item) => string - optional secondary line (e.g. ID)
 * @param {function} onSelect - (item) => void - called when user selects an item
 */
export function SearchSelectModal({
  open,
  onOpenChange,
  title,
  searchPlaceholder = 'Search...',
  fetchResults,
  getItemLabel,
  getItemSecondaryLabel,
  onSelect,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadResults = useCallback(async () => {
    const fetch = fetchResults || (async () => []);
    setLoading(true);
    try {
      const data = await fetch(searchTerm);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setResults(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [fetchResults, searchTerm]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(loadResults, 300);
    return () => clearTimeout(timer);
  }, [open, searchTerm, loadResults]);

  const handleSelect = (item) => {
    onSelect?.(item);
    onOpenChange?.(false);
    setSearchTerm('');
    setResults([]);
  };

  const handleOpenChange = (next) => {
    if (!next) {
      setSearchTerm('');
      setResults([]);
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-[800px] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="border rounded-md max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              <ul className="divide-y">
                {results.map((item, idx) => (
                  <li key={item?.id ?? idx}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-muted/80 transition-colors"
                      onClick={() => handleSelect(item)}
                    >
                      <span className="font-medium block">
                        {typeof getItemLabel === 'function' ? (() => {
                          try {
                            return getItemLabel(item) ?? '';
                          } catch (e) {
                            return String(item?.id ?? item?.code ?? item?.name ?? '');
                          }
                        })() : ''}
                      </span>
                      {getItemSecondaryLabel && typeof getItemSecondaryLabel === 'function' && (
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {(() => {
                            try {
                              return getItemSecondaryLabel(item) ?? '';
                            } catch (e) {
                              return '';
                            }
                          })()}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
