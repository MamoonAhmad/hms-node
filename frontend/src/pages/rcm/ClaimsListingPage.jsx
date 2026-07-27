import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  X,
  MoreHorizontal,
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
import { claimApi } from '@/services/api/claim.api';

// Status options for filter and display (use 'all' not '' for Radix Select)
const CLAIM_STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready to submit' },
  { value: 'submitted', label: 'Submitted' },
];

function mapApiClaim(claim) {
  const status = String(claim.status || 'Draft').toLowerCase();
  const totalCharge = Number(claim.totalCharge) || 0;
  const dos = claim.dateOfService
    ? String(claim.dateOfService).slice(0, 10)
    : '';
  return {
    id: claim.id,
    claimId: claim.claimNumber,
    patientName: claim.patientName
      || [claim.patientLastName, claim.patientFirstName].filter(Boolean).join(', '),
    patientMrn: claim.patientMrn || '',
    dateOfService: dos,
    payer: claim.payerName || '—',
    status,
    claimType: claim.claimType || 'original',
    totalCharge,
    amountPaid: 0,
    balanceDue: totalCharge,
    submittedDate: claim.submittedAt ? String(claim.submittedAt).slice(0, 10) : null,
    renderingProvider: claim.renderingProviderName || '—',
    placeOfService: claim.placeOfService || '',
    rejectionReason: null,
    encounterNumber: claim.encounterNumber || null,
    appointmentId: claim.appointmentId || null,
    patientId: claim.patientId || null,
    raw: claim,
  };
}

function toApiStatus(status) {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

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

// Mock claims data (sample/dummy for listing)
const MOCK_CLAIMS = [
  {
    id: 'clm-001',
    claimId: 'CLM-2025-001',
    patientName: 'Doe, John',
    patientMrn: 'MRN-1001',
    dateOfService: '2025-01-15',
    payer: 'Blue Cross Blue Shield',
    status: 'submitted',
    claimType: 'original',
    totalCharge: 250.0,
    amountPaid: 0,
    balanceDue: 250.0,
    submittedDate: '2025-01-16',
    renderingProvider: 'Dr. Jane Smith',
    placeOfService: '11 - Office',
    rejectionReason: null,
  },
  {
    id: 'clm-002',
    claimId: 'CLM-2025-002',
    patientName: 'Smith, Mary',
    patientMrn: 'MRN-1002',
    dateOfService: '2025-01-14',
    payer: 'Aetna',
    status: 'paid',
    claimType: 'original',
    totalCharge: 150.0,
    amountPaid: 150.0,
    balanceDue: 0,
    submittedDate: '2025-01-15',
    renderingProvider: 'Dr. Jane Smith',
    placeOfService: '11 - Office',
    rejectionReason: null,
  },
  {
    id: 'clm-003',
    claimId: 'CLM-2024-150',
    patientName: 'Johnson, Robert',
    patientMrn: 'MRN-1003',
    dateOfService: '2024-12-20',
    payer: 'United Healthcare',
    status: 'rejected',
    claimType: 'original',
    totalCharge: 300.0,
    amountPaid: 0,
    balanceDue: 300.0,
    submittedDate: '2024-12-21',
    renderingProvider: 'Dr. John Lee',
    placeOfService: '22 - Outpatient Hospital',
    rejectionReason: 'Duplicate claim',
  },
  {
    id: 'clm-004',
    claimId: 'CLM-2024-149',
    patientName: 'Williams, Anna',
    patientMrn: 'MRN-1004',
    dateOfService: '2024-12-18',
    payer: 'Medicare',
    status: 'accepted',
    claimType: 'original',
    totalCharge: 180.0,
    amountPaid: 0,
    balanceDue: 180.0,
    submittedDate: '2024-12-19',
    renderingProvider: 'Dr. Jane Smith',
    placeOfService: '11 - Office',
    rejectionReason: null,
  },
  {
    id: 'clm-005',
    claimId: 'CLM-2025-003',
    patientName: 'Brown, James',
    patientMrn: 'MRN-1005',
    dateOfService: '2025-01-10',
    payer: 'Cigna',
    status: 'draft',
    claimType: 'original',
    totalCharge: 95.0,
    amountPaid: 0,
    balanceDue: 95.0,
    submittedDate: null,
    renderingProvider: 'Dr. John Lee',
    placeOfService: '11 - Office',
    rejectionReason: null,
  },
  {
    id: 'clm-006',
    claimId: 'CLM-2025-004',
    patientName: 'Davis, Emily',
    patientMrn: 'MRN-1006',
    dateOfService: '2025-01-12',
    payer: 'Blue Cross Blue Shield',
    status: 'denied',
    claimType: 'original',
    totalCharge: 420.0,
    amountPaid: 0,
    balanceDue: 420.0,
    submittedDate: '2025-01-13',
    renderingProvider: 'Dr. Jane Smith',
    placeOfService: '23 - Emergency Room',
    rejectionReason: 'Prior authorization required',
  },
  {
    id: 'clm-007',
    claimId: 'CLM-2024-148',
    patientName: 'Garcia, Carlos',
    patientMrn: 'MRN-1007',
    dateOfService: '2024-12-10',
    payer: 'Aetna',
    status: 'partial',
    claimType: 'original',
    totalCharge: 200.0,
    amountPaid: 120.0,
    balanceDue: 80.0,
    submittedDate: '2024-12-11',
    renderingProvider: 'Dr. John Lee',
    placeOfService: '11 - Office',
    rejectionReason: null,
  },
];

function getStatusBadgeVariant(status) {
  const map = {
    draft: 'muted',
    ready: 'info',
    submitted: 'info',
    accepted: 'success',
    rejected: 'destructive',
    denied: 'destructive',
    paid: 'success',
    partial: 'warning',
    appealing: 'warning',
    voided: 'muted',
  };
  return map[status] || 'muted';
}

function getStatusLabel(status) {
  const map = {
    draft: 'Draft',
    ready: 'Ready to submit',
    submitted: 'Submitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
    denied: 'Denied',
    paid: 'Paid',
    partial: 'Partial',
    appealing: 'Appealing',
    voided: 'Voided',
  };
  return map[status] || status;
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
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loadError, setLoadError] = useState(null);

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

  // Row actions menu
  const [openRowMenuId, setOpenRowMenuId] = useState(null);

  // Bulk / confirm dialogs
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [confirmWriteOff, setConfirmWriteOff] = useState(false);
  const [confirmCollections, setConfirmCollections] = useState(false);
  const [viewingClaim, setViewingClaim] = useState(null);

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

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await claimApi.listClaims({
        page: 1,
        limit: 100,
        search: globalSearchDebounced || undefined,
        status: statusFilter !== 'all' ? toApiStatus(statusFilter) : undefined,
        dateFrom: dosFrom || undefined,
        dateTo: dosTo || undefined,
      });
      const rows = (res?.data || []).map(mapApiClaim);
      setClaims(rows);
    } catch (err) {
      setLoadError(err?.message || 'Failed to load claims');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [globalSearchDebounced, statusFilter, dosFrom, dosTo]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleRefresh = useCallback(() => {
    loadClaims();
  }, [loadClaims]);

  const handleMarkReady = useCallback(async (claim) => {
    try {
      await claimApi.updateClaimStatus(claim.id, 'Ready');
      await loadClaims();
    } catch (err) {
      setLoadError(err?.message || 'Failed to update claim');
    }
  }, [loadClaims]);

  const handleSubmitClaim = useCallback(async (claim) => {
    try {
      if (claim.status === 'draft') {
        await claimApi.updateClaimStatus(claim.id, 'Ready');
      }
      await claimApi.updateClaimStatus(claim.id, 'Submitted');
      await loadClaims();
    } catch (err) {
      setLoadError(err?.message || 'Failed to submit claim');
    }
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

      {loadError && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      )}

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
                    to={`/rcm/cms-1500?claimId=${row.claimId}`}
                    className="text-primary hover:underline"
                  >
                    {row.claimId}
                  </Link>
                ),
              },
              {
                key: 'patientName',
                label: 'Patient',
                cellClassName: 'font-medium',
                render: (row) => (
                  row.patientId ? (
                    <Link
                      to={`/patient-dashboard/${row.patientId}${row.appointmentId ? `?appointmentId=${row.appointmentId}&tab=charge-capture` : '?tab=charge-capture'}`}
                      className="text-primary hover:underline"
                    >
                      {row.patientName}
                    </Link>
                  ) : (
                    <span>{row.patientName}</span>
                  )
                ),
              },
              {
                key: 'patientMrn',
                label: 'MRN',
                cellClassName: 'font-mono text-xs text-muted-foreground',
              },
              { key: 'dateOfService', label: 'DOS' },
              { key: 'payer', label: 'Payer' },
              {
                key: 'status',
                label: 'Status',
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
                key: 'submittedDate',
                label: 'Submitted',
                cellClassName: 'text-muted-foreground',
                render: (row) => row.submittedDate || '—',
              },
              {
                key: 'renderingProvider',
                label: 'Rendering provider',
                cellClassName: 'text-muted-foreground text-xs',
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
                {claim.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleMarkReady(claim)}
                  >
                    Ready
                  </Button>
                )}
                {(claim.status === 'draft' || claim.status === 'ready') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSubmitClaim(claim)}
                    aria-label="Submit claim"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Edit claim">
                  <Link to={`/rcm/cms-1500?claimId=${claim.claimId}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setOpenRowMenuId(openRowMenuId === claim.id ? null : claim.id)}
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {openRowMenuId === claim.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setOpenRowMenuId(null)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border bg-popover p-1 shadow-lg">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setViewingClaim(claim);
                            setOpenRowMenuId(null);
                          }}
                        >
                          <Eye className="h-4 w-4" /> View claim
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link
                            to={`/rcm/cms-1500?claimId=${claim.claimId}`}
                            onClick={() => setOpenRowMenuId(null)}
                          >
                            <Pencil className="h-4 w-4" /> Edit claim
                          </Link>
                        </Button>
                        {(claim.status === 'draft' || claim.status === 'ready') && (
                          <Button variant="ghost" className="w-full justify-start">
                            <Send className="h-4 w-4" /> Submit to payer
                          </Button>
                        )}
                        {(claim.status === 'rejected' || claim.status === 'denied') && (
                          <Button variant="ghost" className="w-full justify-start">
                            <Send className="h-4 w-4" /> Re-submit
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            window.print();
                            setOpenRowMenuId(null);
                          }}
                        >
                          <Printer className="h-4 w-4" /> Print claim
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <Copy className="h-4 w-4" /> Copy claim
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <DollarSign className="h-4 w-4" /> Post payment
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <AlertCircle className="h-4 w-4" /> Appeal
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setConfirmWriteOff(true);
                            setOpenRowMenuId(null);
                          }}
                        >
                          <FileText className="h-4 w-4" /> Write off
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <Flag className="h-4 w-4" /> Add note / flag
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive"
                          onClick={() => {
                            setConfirmVoid(true);
                            setOpenRowMenuId(null);
                          }}
                        >
                          <Ban className="h-4 w-4" /> Void / Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
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
              <Link to={viewingClaim ? `/rcm/cms-1500?claimId=${viewingClaim.claimId}` : '#'} onClick={() => setViewingClaim(null)}>
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
