import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Debounce a value. Returns the value after delay ms of no changes.
 */
function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * DataTable – reusable table with search, page size, and pagination.
 *
 * Controlled component: parent owns data, total, page, pageSize, search and fetches when needed.
 *
 * @param {Object} props
 * @param {Array<{ key: string, label: string, render?: (row) => ReactNode, align?: 'left'|'right'|'center', className?: string }>} props.columns - Column definitions
 * @param {Array<Object>} props.data - Current page rows
 * @param {number} props.total - Total number of records (after search/filters)
 * @param {number} props.page - Current page (1-based)
 * @param {number} props.pageSize - Records per page
 * @param {string} props.searchValue - Current search keyword
 * @param {boolean} [props.isLoading] - Show loading state
 * @param { (keyword: string) => void } props.onSearch - Called when search changes (debounced)
 * @param { (page: number) => void } props.onPageChange - Called when page changes
 * @param { (pageSize: number) => void } props.onPageSizeChange - Called when page size changes
 * @param { (row: Object) => string|number } [props.getRowId] - Row key (default: row.id)
 * @param {ReactNode} [props.actions] - Render prop (row) => actions cell content
 * @param {string} [props.searchPlaceholder] - Search input placeholder
 * @param {string} [props.emptyMessage] - Message when no data
 * @param {number[]} [props.pageSizeOptions] - Options for records per page
 * @param {number} [props.searchDebounceMs] - Debounce delay for search
 * @param {string} [props.className] - Extra class for wrapper
 * @param {boolean} [props.hideToolbar] - If true, hide search and rows-per-page toolbar (use custom bar above)
 *
 * @example
 * // Server-side (parent fetches when page, pageSize, or search change):
 * const [data, setData] = useState([]);
 * const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
 * const [search, setSearch] = useState('');
 * useEffect(() => {
 *   fetchData({ page: pagination.page, limit: pagination.limit, search }).then((res) => {
 *     setData(res.data);
 *     setPagination((p) => ({ ...p, ...res.pagination }));
 *   });
 * }, [pagination.page, pagination.limit, search]);
 * <DataTable
 *   columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }]}
 *   data={data}
 *   total={pagination.total}
 *   page={pagination.page}
 *   pageSize={pagination.limit}
 *   searchValue={search}
 *   onSearch={(q) => { setSearch(q); setPagination((p) => ({ ...p, page: 1 })); }}
 *   onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
 *   onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
 *   isLoading={loading}
 * />
 */
export function DataTable({
  columns,
  data,
  total,
  page,
  pageSize,
  searchValue,
  isLoading = false,
  onSearch,
  onPageChange,
  onPageSizeChange,
  getRowId = (row) => row.id,
  actions,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found',
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  searchDebounceMs = DEFAULT_DEBOUNCE_MS,
  className,
  hideToolbar = false,
}) {
  const [localSearch, setLocalSearch] = useState(searchValue ?? '');
  const debouncedSearch = useDebouncedValue(localSearch, searchDebounceMs);

  // Sync local search when controlled searchValue changes (e.g. clear from parent)
  useEffect(() => {
    setLocalSearch(searchValue ?? '');
  }, [searchValue]);

  // Notify parent when debounced search differs from controlled value (avoids redundant fetch on mount)
  useEffect(() => {
    if (!hideToolbar && debouncedSearch !== (searchValue ?? '')) {
      onSearch?.(debouncedSearch);
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps -- only when debounced value changes

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  const handlePageSizeChange = (value) => {
    const nextSize = Number(value);
    onPageSizeChange(nextSize);
    onPageChange(1);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar: search + page size (optional) */}
      {!hideToolbar && (
        <div className="content-panel ehr-table-toolbar flex flex-col gap-4 rounded-t-lg border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search table"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
              aria-label="Rows per page"
            >
              <SelectTrigger className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="content-panel overflow-visible rounded-t-none border-t-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[1%] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div
                      className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                      aria-hidden
                    />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.cellClassName
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="overflow-visible text-right">{actions(row)}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div
          className="flex flex-col gap-3 border-t border-border/70 bg-muted/25 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          role="navigation"
          aria-label="Table pagination"
        >
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {start} to {end} of {total} record{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-[100px] text-center text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage >= totalPages || total === 0}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
