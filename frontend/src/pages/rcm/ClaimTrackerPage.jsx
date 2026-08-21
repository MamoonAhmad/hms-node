import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import {
  X,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  List,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rcmApi } from '@/services/api';

const GROUP_BY_OPTIONS = [
  { value: 'none', label: '(No Selection)' },
  { value: 'payer', label: 'Payer' },
  { value: 'status', label: 'Status' },
  { value: 'provider', label: 'Provider' },
  { value: 'dos', label: 'Date of Service' },
];

const PAGE_SIZES = [10, 25, 50];

export function ClaimTrackerPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [findInTable, setFindInTable] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [sortDir, setSortDir] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rcmApi.listClaims({ limit: 200, search: findInTable || undefined });
      setClaims(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [findInTable]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filteredClaims = useMemo(() => {
    let list = [...claims];
    const term = (findInTable || '').toLowerCase().trim();
    if (term) {
      list = list.filter(
        (c) =>
          c.claimNumber?.toLowerCase().includes(term) ||
          c.patientName?.toLowerCase().includes(term) ||
          c.patientId?.includes(term) ||
          c.payer?.toLowerCase().includes(term) ||
          c.provider?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [claims, findInTable]);

  const totalFiltered = filteredClaims.length;
  const pageClaims = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, page, pageSize]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns = [
    {
      key: '_select',
      label: '',
      className: 'w-10',
      render: (row) => (
        <Checkbox
          checked={selectedIds.has(row.id)}
          onCheckedChange={() => toggleSelect(row.id)}
        />
      ),
    },
    {
      key: '_expand',
      label: '',
      className: 'w-10',
      render: (row) => (
        <button type="button" onClick={() => toggleExpand(row.id)} className="p-1">
          {expandedIds.has(row.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    { key: 'claimNumber', label: 'Claim # / TCN' },
    { key: 'dos', label: 'DOS' },
    { key: 'patientName', label: 'Patient' },
    {
      key: 'claimAmount',
      label: 'Claim Amount',
      render: (row) => `$${Number(row.claimAmount || 0).toFixed(2)}`,
    },
    { key: 'payer', label: 'Payer' },
    { key: 'provider', label: 'Provider' },
    { key: 'currentClaimStatus', label: 'Status' },
    { key: 'taskAssign', label: 'Task Assign' },
    { key: 'taskDueDate', label: 'Task Due' },
    { key: 'taskStatus', label: 'Task Status' },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Claim Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Live claim status from the billing engine (TCN, payer, follow-up tasks).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/rcm/claims">
              <List className="mr-1.5 h-4 w-4" />
              Claims listing
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Find in table…"
          value={findInTable}
          onChange={(e) => setFindInTable(e.target.value)}
          className="max-w-xs"
        />
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
          {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
          <FolderOpen className="mr-1.5 h-4 w-4" />
          Filters
        </Button>
        {findInTable && (
          <Button variant="ghost" size="icon" onClick={() => setFindInTable('')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <p className="text-sm text-muted-foreground">
          Showing {totalFiltered} claim(s). Data is live from `/api/rcm/claims`.
        </p>
      )}

      <DataTable hideToolbar columns={columns} data={pageClaims} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} · {totalFiltered} rows
        </span>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * pageSize >= totalFiltered}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
