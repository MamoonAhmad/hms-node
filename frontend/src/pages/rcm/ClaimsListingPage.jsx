import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { RowActionsMenu, RowActionsMenuItem } from '@/components/ui/row-actions-menu';
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  X,
  Eye,
  Pencil,
  Send,
  Ban,
  Printer,
  Copy,
  DollarSign,
  AlertCircle,
  FileText,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rcmApi } from '@/services/api';
import { claimStatusLabel, submissionStatusLabel } from '@/lib/claimConstants';

// Status options for filter and display (use 'all' not '' for Radix Select)
const CLAIM_STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
  { value: 'denied', label: 'Denied' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CLAIM_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'original', label: 'Original' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'void', label: 'Void' },
];

const DATE_PRESETS = [
  { value: 'custom', label: 'Custom' },
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
];

const PAGE_SIZES = [25, 50, 100];

function getStatusBadgeVariant(status) {
  const map = {
    draft: 'secondary',
    ready: 'outline',
    submitted: 'default',
    accepted: 'default',
    rejected: 'destructive',
    denied: 'destructive',
    paid: 'default',
    on_hold: 'outline',
    cancelled: 'secondary',
    partial: 'outline',
    appealing: 'outline',
    voided: 'secondary',
  };
  return map[status] || 'secondary';
}

function getStatusLabel(status) {
  return claimStatusLabel(status);
}

function getDateRange(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  let start = new Date(today);
  switch (preset) {
    case 'today':
      start = new Date(today);
      break;
    case '7':
      start.setDate(start.getDate() - 7);
      break;
    case '30':
      start.setDate(start.getDate() - 30);
      break;
    case 'month':
      start.setDate(1);
      break;
    case 'lastMonth':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      break;
    default:
      return null;
  }
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export function ClaimsListingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState([]);

  // Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchDebounced, setGlobalSearchDebounced] = useState('');
  const [claimIdFilter, setClaimIdFilter] = useState('');
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [mrnFilter, setMrnFilter] = useState('');
  const [memberIdFilter, setMemberIdFilter] = useState('');
  const [datePreset, setDatePreset] = useState('30');
  const [dosFrom, setDosFrom] = useState('');
  const [dosTo, setDosTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [claimTypeFilter, setClaimTypeFilter] = useState('all');
  const [payerFilter, setPayerFilter] = useState('');

  // Table
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortColumn, setSortColumn] = useState('dateOfService');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk / confirm dialogs
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [confirmWriteOff, setConfirmWriteOff] = useState(false);
  const [confirmCollections, setConfirmCollections] = useState(false);
  const [viewingClaim, setViewingClaim] = useState(null);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rcmApi.listClaims({
        search: globalSearchDebounced || undefined,
        status: statusFilter,
        claimType: claimTypeFilter,
        payer: payerFilter || undefined,
        dosFrom: dosFrom || undefined,
        dosTo: dosTo || undefined,
        page: 1,
        limit: 200,
      });
      setClaims(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [globalSearchDebounced, statusFilter, claimTypeFilter, payerFilter, dosFrom, dosTo]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  // Debounce global search
  useEffect(() => {
    const t = setTimeout(() => setGlobalSearchDebounced(globalSearch), 300);
    return () => clearTimeout(t);
  }, [globalSearch]);

  // Apply date preset
  useEffect(() => {
    if (datePreset && datePreset !== 'custom') {
      const range = getDateRange(datePreset);
      if (range) {
        setDosFrom(range.from);
        setDosTo(range.to);
      }
    }
  }, [datePreset]);

  const filteredClaims = useMemo(() => {
    let list = [...claims];
    const term = (globalSearchDebounced || '').toLowerCase().trim();
    if (term) {
      list = list.filter(
        (c) =>
          c.claimId?.toLowerCase().includes(term) ||
          c.patientName?.toLowerCase().includes(term) ||
          c.patientMrn?.toLowerCase().includes(term) ||
          c.payer?.toLowerCase().includes(term)
      );
    }
    if (claimIdFilter.trim()) {
      const q = claimIdFilter.trim().toLowerCase();
      list = list.filter((c) => c.claimId?.toLowerCase().includes(q));
    }
    if (patientNameFilter.trim()) {
      const q = patientNameFilter.trim().toLowerCase();
      list = list.filter((c) => c.patientName?.toLowerCase().includes(q));
    }
    if (mrnFilter.trim()) {
      const q = mrnFilter.trim().toLowerCase();
      list = list.filter((c) => c.patientMrn?.toLowerCase().includes(q));
    }
    if (dosFrom) list = list.filter((c) => c.dateOfService >= dosFrom);
    if (dosTo) list = list.filter((c) => c.dateOfService <= dosTo);
    if (statusFilter && statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
    if (claimTypeFilter && claimTypeFilter !== 'all') list = list.filter((c) => c.claimType === claimTypeFilter);
    if (payerFilter.trim()) {
      const q = payerFilter.trim().toLowerCase();
      list = list.filter((c) => c.payer?.toLowerCase().includes(q));
    }
    return list;
  }, [
    claims,
    globalSearchDebounced,
    claimIdFilter,
    patientNameFilter,
    mrnFilter,
    dosFrom,
    dosTo,
    statusFilter,
    claimTypeFilter,
    payerFilter,
  ]);

  const sortedClaims = useMemo(() => {
    const list = [...filteredClaims];
    const mult = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let va = a[sortColumn];
      let vb = b[sortColumn];
      if (sortColumn === 'dateOfService' || sortColumn === 'submittedDate') {
        va = va || '';
        vb = vb || '';
        return mult * (va.localeCompare(vb) || 0);
      }
      if (sortColumn === 'totalCharge' || sortColumn === 'amountPaid' || sortColumn === 'balanceDue') {
        return mult * ((Number(va) || 0) - (Number(vb) || 0));
      }
      va = String(va ?? '').toLowerCase();
      vb = String(vb ?? '').toLowerCase();
      return mult * va.localeCompare(vb);
    });
    return list;
  }, [filteredClaims, sortColumn, sortDir]);

  const totalFiltered = sortedClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const pageClaims = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedClaims.slice(start, start + pageSize);
  }, [sortedClaims, page, pageSize]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (globalSearchDebounced.trim()) n++;
    if (claimIdFilter.trim()) n++;
    if (patientNameFilter.trim()) n++;
    if (mrnFilter.trim()) n++;
    if (memberIdFilter.trim()) n++;
    if (dosFrom || dosTo) n++;
    if (statusFilter && statusFilter !== 'all') n++;
    if (claimTypeFilter && claimTypeFilter !== 'all') n++;
    if (payerFilter.trim()) n++;
    return n;
  }, [
    globalSearchDebounced,
    claimIdFilter,
    patientNameFilter,
    mrnFilter,
    memberIdFilter,
    dosFrom,
    dosTo,
    statusFilter,
    claimTypeFilter,
    payerFilter,
  ]);

  const clearFilters = useCallback(() => {
    setGlobalSearch('');
    setGlobalSearchDebounced('');
    setClaimIdFilter('');
    setPatientNameFilter('');
    setMrnFilter('');
    setMemberIdFilter('');
    setDatePreset('custom');
    setDosFrom('');
    setDosTo('');
    setStatusFilter('all');
    setClaimTypeFilter('all');
    setPayerFilter('');
    setPage(1);
  }, []);

  const handleSort = useCallback((column) => {
    if (sortColumn === column) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortColumn(column);
      setSortDir('desc');
    }
  }, [sortColumn]);

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

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedClaims = useMemo(
    () => claims.filter((c) => selectedIds.has(c.id)),
    [claims, selectedIds]
  );

  const canSubmitSelected = selectedClaims.length > 0 && selectedClaims.every((c) => c.status === 'draft' || c.status === 'ready');
  const canVoidSelected = selectedClaims.length > 0;
  const canExportSelected = selectedClaims.length > 0;

  const handleRefresh = useCallback(() => {
    loadClaims();
  }, [loadClaims]);

  const handleExport = useCallback(() => {
    const data = selectedClaims.length ? selectedClaims : sortedClaims.slice(0, 5000);
    const headers = ['Claim ID', 'Patient', 'MRN', 'DOS', 'Payer', 'Status', 'Total', 'Paid', 'Balance'];
    const rows = data.map((c) =>
      [c.claimId, c.patientName, c.patientMrn, c.dateOfService, c.payer, getStatusLabel(c.status), c.totalCharge, c.amountPaid, c.balanceDue].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedClaims, sortedClaims]);

  const summaryStats = useMemo(() => {
    const byStatus = {};
    let totalPending = 0;
    filteredClaims.forEach((c) => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      if (c.status !== 'paid' && c.status !== 'voided') totalPending += Number(c.balanceDue) || 0;
    });
    return { byStatus, totalPending, total: filteredClaims.length };
  }, [filteredClaims]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page title and primary actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Claims</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport()}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button asChild size="sm">
            <Link to="/rcm/cms-1500">
              <Plus className="h-4 w-4" /> New claim
            </Link>
          </Button>
        </div>
      </div>

      {/* Top filter section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{activeFilterCount} filter(s) active</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Clear all
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Search (Claim ID, Patient, MRN, Payer)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search claims…"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" size="icon" title="Search">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Claim ID</Label>
              <Input
                placeholder="Claim ID"
                value={claimIdFilter}
                onChange={(e) => setClaimIdFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Patient name</Label>
              <Input
                placeholder="Last, First"
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Patient MRN / Account #</Label>
              <Input
                placeholder="MRN"
                value={mrnFilter}
                onChange={(e) => setMrnFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Member ID</Label>
              <Input
                placeholder="Subscriber ID"
                value={memberIdFilter}
                onChange={(e) => setMemberIdFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date preset</Label>
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of service from</Label>
              <Input type="date" value={dosFrom} onChange={(e) => setDosFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of service to</Label>
              <Input type="date" value={dosTo} onChange={(e) => setDosTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Claim status</Label>
              <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  {CLAIM_STATUSES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Claim type</Label>
              <Select value={claimTypeFilter || 'all'} onValueChange={setClaimTypeFilter}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  {CLAIM_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payer / Insurance</Label>
              <Input
                placeholder="Payer name"
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setPage(1)}>Apply filters</Button>
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary / quick stats */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
        <span className="font-medium">Showing {totalFiltered} claim(s)</span>
        <span className="text-muted-foreground">Pending total: ${summaryStats.totalPending.toFixed(2)}</span>
        {Object.entries(summaryStats.byStatus).map(([status, count]) => (
          <span key={status} className="text-muted-foreground">
            {getStatusLabel(status)}: {count}
          </span>
        ))}
      </div>

      {/* Claims list with DataTable */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Claims list</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-muted-foreground"
              >
                {selectedIds.size === pageClaims.length && pageClaims.length > 0
                  ? 'Clear selection'
                  : 'Select all on page'}
              </Button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
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
                    aria-label={`Select ${row.claimId}`}
                  />
                ),
              },
              {
                key: 'claimId',
                label: 'Claim ID',
                cellClassName: 'font-mono text-xs',
                render: (row) => (
                  <Link
                    to={`/rcm/cms-1500?claimId=${row.id}`}
                    className="text-primary hover:underline"
                  >
                    {row.claimNumber || row.claimId}
                  </Link>
                ),
              },
              {
                key: 'patientName',
                label: 'Patient',
                cellClassName: 'font-medium',
                render: (row) => (
                  <Link
                    to="/patients"
                    className="text-primary hover:underline"
                  >
                    {row.patientName}
                  </Link>
                ),
              },
              {
                key: 'patientMrn',
                label: 'MRN',
                cellClassName: 'font-mono text-xs text-muted-foreground',
              },
              { key: 'dateOfService', label: 'Date of Service' },
              { key: 'payer', label: 'Primary Insurance' },
              {
                key: 'renderingProvider',
                label: 'Rendering Provider',
                cellClassName: 'text-muted-foreground text-xs',
              },
              {
                key: 'billingProvider',
                label: 'Billing Provider',
                cellClassName: 'text-muted-foreground text-xs',
              },
              {
                key: 'status',
                label: 'Claim Status',
                render: (row) => (
                  <Badge
                    variant={getStatusBadgeVariant(row.status)}
                    title={row.rejectionReason || undefined}
                  >
                    {getStatusLabel(row.status)}
                  </Badge>
                ),
              },
              {
                key: 'submissionStatus',
                label: 'Submission Status',
                render: (row) => submissionStatusLabel(row.submissionStatus),
              },
              {
                key: 'totalCharge',
                label: 'Total',
                align: 'right',
                cellClassName: 'font-medium',
                render: (row) => `$${Number(row.totalCharge).toFixed(2)}`,
              },
              {
                key: 'amountPaid',
                label: 'Paid',
                align: 'right',
                render: (row) => `$${Number(row.amountPaid).toFixed(2)}`,
              },
              {
                key: 'balanceDue',
                label: 'Balance',
                align: 'right',
                render: (row) => `$${Number(row.balanceDue).toFixed(2)}`,
              },
              {
                key: 'createdAt',
                label: 'Created Date',
                cellClassName: 'text-muted-foreground',
                render: (row) => row.createdAt ? String(row.createdAt).slice(0, 10) : '—',
              },
              {
                key: 'updatedAt',
                label: 'Updated Date',
                cellClassName: 'text-muted-foreground',
                render: (row) => row.updatedAt ? String(row.updatedAt).slice(0, 10) : '—',
              },
            ]}
            data={pageClaims}
            total={totalFiltered}
            page={page}
            pageSize={pageSize}
            searchValue={globalSearch}
            onSearch={(keyword) => {
              setGlobalSearch(keyword);
              setPage(1);
            }}
            onPageChange={setPage}
            onPageSizeChange={(limit) => {
              setPageSize(limit);
              setPage(1);
            }}
            getRowId={(row) => row.id}
            isLoading={loading}
            searchPlaceholder="Search by Claim ID, patient, MRN, or payer..."
            emptyMessage="No claims match your filters."
            pageSizeOptions={PAGE_SIZES}
            actions={(claim) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewingClaim(claim)}
                  aria-label="View claim"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Edit claim">
                  <Link to={`/rcm/cms-1500?claimId=${claim.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                  aria-label="Print claim"
                >
                  <Link to={`/rcm/claims/${claim.id}/print`} target="_blank" rel="noreferrer">
                    <Printer className="h-4 w-4" />
                  </Link>
                </Button>
                <RowActionsMenu aria-label="More actions">
                  <RowActionsMenuItem onClick={() => setViewingClaim(claim)}>
                    <Eye className="h-4 w-4" /> View claim
                  </RowActionsMenuItem>
                  <RowActionsMenuItem asChild>
                    <Link to={`/rcm/cms-1500?claimId=${claim.id}`}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </RowActionsMenuItem>
                  <RowActionsMenuItem asChild>
                    <Link to={`/rcm/claims/${claim.id}/print`} target="_blank" rel="noreferrer">
                      <Printer className="h-4 w-4" /> Print
                    </Link>
                  </RowActionsMenuItem>
                  <RowActionsMenuItem
                    onClick={async () => {
                      try {
                        const res = await rcmApi.copyClaim(claim.id);
                        const copied = res.data || res;
                        if (copied?.id) navigate(`/rcm/cms-1500?claimId=${copied.id}`);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copy Claim
                  </RowActionsMenuItem>
                  {(claim.status === 'draft' || claim.status === 'ready') && (
                    <RowActionsMenuItem>
                      <Send className="h-4 w-4" /> Submit to payer
                    </RowActionsMenuItem>
                  )}
                  {(claim.status === 'rejected' || claim.status === 'denied') && (
                    <RowActionsMenuItem>
                      <Send className="h-4 w-4" /> Re-submit
                    </RowActionsMenuItem>
                  )}
                  <RowActionsMenuItem asChild>
                    <Link to={`/rcm/cms-1500?claimId=${claim.id}`}>
                      <FileText className="h-4 w-4" /> Split / History / Preview
                    </Link>
                  </RowActionsMenuItem>
                  <RowActionsMenuItem>
                    <DollarSign className="h-4 w-4" /> Post payment
                  </RowActionsMenuItem>
                  <RowActionsMenuItem>
                    <AlertCircle className="h-4 w-4" /> Appeal
                  </RowActionsMenuItem>
                  <RowActionsMenuItem onClick={() => setConfirmWriteOff(true)}>
                    <FileText className="h-4 w-4" /> Write off
                  </RowActionsMenuItem>
                  <RowActionsMenuItem>
                    <Flag className="h-4 w-4" /> Add note / flag
                  </RowActionsMenuItem>
                  <RowActionsMenuItem
                    className="text-destructive"
                    onClick={() => setConfirmVoid(true)}
                  >
                    <Ban className="h-4 w-4" /> Void / Cancel
                  </RowActionsMenuItem>
                </RowActionsMenu>
              </div>
            )}
          />
          {totalFiltered === 0 && !loading && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
              <Button size="sm" asChild>
                <Link to="/rcm/cms-1500">Create first claim</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">{selectedIds.size} claim(s) selected</span>
          <Button size="sm" disabled={!canSubmitSelected}>Submit to payer</Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmVoid(true)}>Void / Cancel</Button>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={!canExportSelected}>
            Export to CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Clear selection</Button>
        </div>
      )}

      {/* View claim dialog */}
      <Dialog open={!!viewingClaim} onOpenChange={(open) => !open && setViewingClaim(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim details</DialogTitle>
          </DialogHeader>
          {viewingClaim && (
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted-foreground">Claim ID:</span> {viewingClaim.claimId}</p>
              <p><span className="text-muted-foreground">Patient:</span> {viewingClaim.patientName}</p>
              <p><span className="text-muted-foreground">MRN:</span> {viewingClaim.patientMrn}</p>
              <p><span className="text-muted-foreground">DOS:</span> {viewingClaim.dateOfService}</p>
              <p><span className="text-muted-foreground">Payer:</span> {viewingClaim.payer}</p>
              <p><span className="text-muted-foreground">Status:</span> {getStatusLabel(viewingClaim.status)}</p>
              <p><span className="text-muted-foreground">Total:</span> ${viewingClaim.totalCharge.toFixed(2)}</p>
              {viewingClaim.rejectionReason && (
                <p><span className="text-muted-foreground">Reason:</span> {viewingClaim.rejectionReason}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingClaim(null)}>Close</Button>
            <Button asChild>
              <Link to={viewingClaim ? `/rcm/cms-1500?claimId=${viewingClaim.id}` : '#'} onClick={() => setViewingClaim(null)}>
                Edit claim
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void confirmation */}
      <Dialog open={confirmVoid} onOpenChange={setConfirmVoid}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void / Cancel claim(s)</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Are you sure you want to void the selected claim(s)? You may be required to provide a reason to the payer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmVoid(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmVoid(false); clearSelection(); }}>Void claim(s)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write-off confirmation */}
      <Dialog open={confirmWriteOff} onOpenChange={setConfirmWriteOff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write off</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter the write-off amount and reason (e.g. small balance, bad debt). This will adjust the balance for the selected claim(s).
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmWriteOff(false)}>Cancel</Button>
            <Button onClick={() => { setConfirmWriteOff(false); }}>Confirm write off</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to collections confirmation */}
      <Dialog open={confirmCollections} onOpenChange={setConfirmCollections}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to collections</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Selected claim(s) will be marked for collections. Confirm to proceed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCollections(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmCollections(false); clearSelection(); }}>Send to collections</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
