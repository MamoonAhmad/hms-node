import { useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_BY_OPTIONS = [
  { value: 'none', label: '(No Selection)' },
  { value: 'payer', label: 'Payer' },
  { value: 'status', label: 'Status' },
  { value: 'provider', label: 'Provider' },
  { value: 'dos', label: 'Date of Service' },
];

const PAGE_SIZES = [10, 25, 50];

// Mock data matching CollaborateMD Claim Tracker: Claim #/TCN, DOS/Status Date, Patient/Status, Claim Amount, Payer, Payer ID, Provider, Submitter, Current Claim Status, Task Assign, Task Due D., TCN w/Prefix, Task Status
const MOCK_CLAIMS = [
  {
    id: 'trk-001',
    claimNumber: '290107831',
    tcn: '290107831',
    dos: '02/18/2026',
    statusDate: '02/18/2026',
    patientName: 'TT, TEST',
    patientId: '69344986',
    claimAmount: 250.0,
    billedAmount: 250.0,
    payer: '',
    payerId: '',
    provider: 'CAROLINA, FUTURE',
    submitter: '',
    currentClaimStatus: 'ON HOLD',
    taskAssign: '',
    taskDueDate: '',
    tcnWithPrefix: '290107831',
    taskStatus: '',
  },
  {
    id: 'trk-002',
    claimNumber: '171724863',
    tcn: '171724863',
    dos: '02/15/2026',
    statusDate: '02/20/2026',
    patientName: 'Alexis, Prince',
    patientId: '69344987',
    claimAmount: 185.0,
    billedAmount: 185.0,
    payer: 'Medicare',
    payerId: 'MC001',
    provider: 'CAROLINA, FUTURE',
    submitter: 'Office',
    currentClaimStatus: 'SUBMITTED',
    taskAssign: 'Sarah J.',
    taskDueDate: '03/01/2026',
    tcnWithPrefix: 'MC171724863',
    taskStatus: 'Pending',
  },
  {
    id: 'trk-003',
    claimNumber: '290107832',
    tcn: '290107832',
    dos: '02/10/2026',
    statusDate: '02/12/2026',
    patientName: 'Smith, Jane',
    patientId: '69344988',
    claimAmount: 420.0,
    billedAmount: 420.0,
    payer: 'Aetna',
    payerId: 'AET-123',
    provider: 'CAROLINA, FUTURE',
    submitter: 'Office',
    currentClaimStatus: 'IN REVIEW',
    taskAssign: '',
    taskDueDate: '',
    tcnWithPrefix: 'AET290107832',
    taskStatus: '',
  },
  {
    id: 'trk-004',
    claimNumber: '290107833',
    tcn: '290107833',
    dos: '02/05/2026',
    statusDate: '02/06/2026',
    patientName: 'Doe, John',
    patientId: '69344989',
    claimAmount: 150.0,
    billedAmount: 150.0,
    payer: 'Blue Cross',
    payerId: 'BCBS-456',
    provider: 'CAROLINA, FUTURE',
    submitter: 'Office',
    currentClaimStatus: 'PAID',
    taskAssign: '',
    taskDueDate: '',
    tcnWithPrefix: 'BCBS290107833',
    taskStatus: 'Completed',
  },
];

export function ClaimTrackerPage() {
  const [claims, setClaims] = useState(MOCK_CLAIMS);
  const [findInTable, setFindInTable] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [sortDir, setSortDir] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === pageClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageClaims.map((c) => c.id)));
    }
  }, [selectedIds.size, pageClaims]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-0 p-4 sm:p-6">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-foreground">Claim Tracker</h1>
      </div>

      {/* Action bar - CollaborateMD style */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <Button size="sm" className="gap-1">
          <X className="h-4 w-4" />
          Mark as Fixed
        </Button>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1">
          <List className="h-4 w-4" />
          Task Options
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm">
          Close
        </Button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-primary hover:underline ml-2"
        >
          View Applied Filters
        </button>
        <div className="flex-1 min-w-[180px] flex items-center gap-1 ml-auto">
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
              aria-label="Sort ascending"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSortDir('desc')}
              className={cn('p-0.5', sortDir === 'desc' && 'text-primary')}
              aria-label="Sort descending"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Applied filters panel (collapsible) */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          No filters applied. Use filter options to narrow results.
        </div>
      )}

      {/* Claims table */}
      <div className="mt-3">
        <DataTable
          hideToolbar
          columns={[
            {
              key: '_expand',
              label: '',
              className: 'w-8',
              cellClassName: 'w-8',
              render: (row) => {
                const expanded = expandedIds.has(row.id);
                return (
                  <button
                    type="button"
                    onClick={() => toggleExpand(row.id)}
                    className="p-0.5 text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <FolderOpen className="h-4 w-4 opacity-70" />
                  </button>
                );
              },
            },
            {
              key: '_select',
              label: '',
              className: 'w-10',
              cellClassName: 'w-10',
              render: (row) => (
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={() => toggleSelect(row.id)}
                  aria-label={`Select ${row.claimNumber}`}
                />
              ),
            },
            {
              key: 'claimNumber',
              label: 'Claim # / TCN',
              cellClassName: 'font-mono text-sm',
              render: (row) => (
                <Link
                  to={`/rcm/cms-1500?claimId=${row.claimNumber}`}
                  className="text-primary hover:underline"
                >
                  {row.claimNumber}
                </Link>
              ),
            },
            {
              key: 'dos',
              label: 'DOS / Status Date',
              cellClassName: 'text-sm',
              render: (row) => (
                <span>
                  {row.dos}
                  {row.statusDate && row.statusDate !== row.dos && ` / ${row.statusDate}`}
                </span>
              ),
            },
            {
              key: 'patientName',
              label: 'Patient / Status',
              render: (row) => (
                <Link
                  to={`/patient-dashboard/${row.patientId}`}
                  className="text-primary hover:underline"
                >
                  {row.patientName} (#{row.patientId})
                </Link>
              ),
            },
            {
              key: 'claimAmount',
              label: 'Claim Amount / Billed Amount',
              align: 'right',
              render: (row) => `$${Number(row.claimAmount || row.billedAmount).toFixed(2)}`,
            },
            { key: 'payer', label: 'Payer', cellClassName: 'text-sm' },
            { key: 'payerId', label: 'Payer ID', cellClassName: 'font-mono text-xs' },
            { key: 'provider', label: 'Provider', cellClassName: 'text-sm' },
            { key: 'submitter', label: 'Submitter', cellClassName: 'text-sm' },
            {
              key: 'currentClaimStatus',
              label: 'Current Claim Status',
              cellClassName: 'font-medium',
              render: (row) => (
                <span className="text-sm">{row.currentClaimStatus || '—'}</span>
              ),
            },
            { key: 'taskAssign', label: 'Task Assign', cellClassName: 'text-sm' },
            { key: 'taskDueDate', label: 'Task Due D.', cellClassName: 'text-sm' },
            {
              key: 'tcnWithPrefix',
              label: 'TCN w/Prefix',
              cellClassName: 'font-mono text-xs',
            },
            { key: 'taskStatus', label: 'Task Status', cellClassName: 'text-sm' },
          ]}
          data={pageClaims}
          total={totalFiltered}
          page={page}
          pageSize={pageSize}
          searchValue={findInTable}
          onSearch={setFindInTable}
          onPageChange={setPage}
          onPageSizeChange={(limit) => {
            setPageSize(limit);
            setPage(1);
          }}
          getRowId={(row) => row.id}
          searchPlaceholder="Find in table"
          emptyMessage="No claims match your search."
          pageSizeOptions={PAGE_SIZES}
        />
      </div>
    </div>
  );
}
