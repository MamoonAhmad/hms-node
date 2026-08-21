import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import {
  Filter,
  Plus,
  CheckCircle,
  List,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rcmApi } from '@/services/api';

export function FollowUpManagementPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [findInTable, setFindInTable] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rcmApi.listFollowUps({ search: findInTable || undefined, limit: 200 });
      setRows(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [findInTable]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filteredList = useMemo(() => {
    let list = [...rows];
    const term = (findInTable || '').toLowerCase().trim();
    if (term) {
      list = list.filter(
        (r) =>
          r.claimNumber?.toLowerCase().includes(term) ||
          r.patientName?.toLowerCase().includes(term) ||
          r.currentPayer?.toLowerCase().includes(term) ||
          r.status?.toLowerCase().includes(term) ||
          r.lastNote?.toLowerCase().includes(term)
      );
    }
    if (sortDir === 'desc') list = [...list].reverse();
    return list;
  }, [rows, findInTable, sortDir]);

  const totalFiltered = filteredList.length;
  const totalBalance = useMemo(
    () => filteredList.reduce((sum, r) => sum + (Number(r.balance) || 0), 0),
    [filteredList]
  );
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === pageData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageData.map((r) => r.id)));
  }, [selectedIds.size, pageData]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const completeSelected = async () => {
    for (const id of selectedIds) {
      try {
        await rcmApi.completeFollowUp(id);
      } catch (err) {
        console.error(err);
      }
    }
    setSelectedIds(new Set());
    load();
  };

  return (
    <div className="space-y-0 p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-foreground">Follow Up Management</h1>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowFilters((v) => !v)}>
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button size="sm" className="gap-1" asChild>
          <Link to="/rcm/claims">
            <Plus className="h-4 w-4" /> Open claims
          </Link>
        </Button>
        <Button size="sm" className="gap-1" disabled={!selectedIds.size} onClick={completeSelected}>
          <CheckCircle className="h-4 w-4" /> Complete selected
        </Button>
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link to="/rcm/claim-tracker">
            <List className="h-4 w-4" /> Claim tracker
          </Link>
        </Button>
        <div className="ml-auto flex min-w-[180px] flex-1 items-center gap-1">
          <Input
            placeholder="Find in table"
            value={findInTable}
            onChange={(e) => setFindInTable(e.target.value)}
            className="h-8 max-w-[200px]"
          />
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setSortDir('asc')}
              className={cn('p-0.5', sortDir === 'asc' && 'text-primary')}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSortDir('desc')}
              className={cn('p-0.5', sortDir === 'desc' && 'text-primary')}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mt-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          Live worklist from denials, appeals, and encounter follow-up tasks. Total open balance: $
          {totalBalance.toFixed(2)}
        </div>
      )}

      <div className="mt-3">
        <DataTable
          hideToolbar
          columns={[
            {
              key: '_select',
              label: '',
              className: 'w-10',
              cellClassName: 'w-10',
              render: (row) => (
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={() => toggleSelect(row.id)}
                />
              ),
            },
            {
              key: 'alerts',
              label: 'Alerts',
              className: 'w-12',
              render: (row) =>
                row.hasAlert ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : null,
            },
            { key: 'claimNumber', label: 'Claim #' },
            { key: 'patientName', label: 'Patient Name' },
            { key: 'dos', label: 'DOS' },
            { key: 'currentPayer', label: 'Current Payer' },
            { key: 'lastBilledDate', label: 'Last Billed' },
            {
              key: 'balance',
              label: 'Balance',
              render: (row) => `$${Number(row.balance || 0).toFixed(2)}`,
            },
            { key: 'claimFollowUpDate', label: 'Follow Up Date' },
            { key: 'lastNote', label: 'Last Note' },
            { key: 'lastNoteDate', label: 'Note Date' },
            { key: 'lastNoteUser', label: 'Note User' },
            { key: 'status', label: 'Status' },
            { key: 'claimType', label: 'Claim Type' },
            { key: 'lastClaimStatus', label: 'Last Claim St' },
            { key: 'taskDueDate', label: 'Task Due' },
          ]}
          data={pageData}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalFiltered} task(s) · ${totalBalance.toFixed(2)} ·{' '}
          <button type="button" className="text-primary underline" onClick={toggleSelectAll}>
            toggle select page
          </button>
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span>Page {page}</span>
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
