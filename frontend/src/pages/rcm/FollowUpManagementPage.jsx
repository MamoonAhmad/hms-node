import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import {
  Filter,
  Plus,
  Calendar,
  CheckCircle,
  List,
  Download,
  X,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZES = [10, 25, 50];

// Mock data matching CollaborateMD Follow Up: Alerts, Claim #, Patient Name, DOS, Current Payer, Last Billed Date, Balance, Claim Follow Up Date, Last Note, Last Note Date, Last Note User, Status, Claim Type, First Billed D, Last Claim St, Task Due Date
const MOCK_FOLLOW_UPS = [
  {
    id: 'fu-001',
    claimNumber: '171724863',
    patientName: 'Alexis, Prince',
    dos: '02/15/2026',
    currentPayer: '3P Administrators',
    lastBilledDate: '02/18/2026',
    balance: 1009.0,
    claimFollowUpDate: '03/05/2026',
    lastNote: 'Awaiting response from payer',
    lastNoteDate: '02/28/2026',
    lastNoteUser: 'Sarah J.',
    status: 'CLAIM AT 3P ADMINISTRATORS',
    claimType: 'Professional',
    firstBilledDate: '02/16/2026',
    lastClaimStatus: 'Submitted',
    taskDueDate: '03/05/2026',
    hasAlert: true,
  },
  {
    id: 'fu-002',
    claimNumber: '171724864',
    patientName: 'ABDUL, ABDUL',
    dos: '02/12/2026',
    currentPayer: '',
    lastBilledDate: '02/14/2026',
    balance: 340.0,
    claimFollowUpDate: '',
    lastNote: 'Patient balance - sent statement',
    lastNoteDate: '02/20/2026',
    lastNoteUser: 'Mike C.',
    status: 'BALANCE DUE PATIENT',
    claimType: 'Professional',
    firstBilledDate: '02/14/2026',
    lastClaimStatus: 'Patient responsibility',
    taskDueDate: '',
    hasAlert: false,
  },
  {
    id: 'fu-003',
    claimNumber: '171724865',
    patientName: 'ABC, PATIENT',
    dos: '02/10/2026',
    currentPayer: 'Medicaid',
    lastBilledDate: '02/12/2026',
    balance: 0,
    claimFollowUpDate: '03/01/2026',
    lastNote: 'Pending Medicaid EOB',
    lastNoteDate: '02/25/2026',
    lastNoteUser: 'Sarah J.',
    status: 'CLAIM AT MEDICAID',
    claimType: 'Professional',
    firstBilledDate: '02/12/2026',
    lastClaimStatus: 'In review',
    taskDueDate: '03/01/2026',
    hasAlert: true,
  },
  {
    id: 'fu-004',
    claimNumber: '171724866',
    patientName: 'Smith, Jane',
    dos: '02/08/2026',
    currentPayer: 'Aetna',
    lastBilledDate: '02/10/2026',
    balance: 225.5,
    claimFollowUpDate: '03/10/2026',
    lastNote: 'Appeal submitted',
    lastNoteDate: '02/22/2026',
    lastNoteUser: 'Mike C.',
    status: 'APPEAL IN PROGRESS',
    claimType: 'Professional',
    firstBilledDate: '02/10/2026',
    lastClaimStatus: 'Denied - appealing',
    taskDueDate: '03/10/2026',
    hasAlert: false,
  },
  {
    id: 'fu-005',
    claimNumber: '171724867',
    patientName: 'Doe, John',
    dos: '02/05/2026',
    currentPayer: 'Blue Cross',
    lastBilledDate: '02/07/2026',
    balance: 150.0,
    claimFollowUpDate: '',
    lastNote: '',
    lastNoteDate: '',
    lastNoteUser: '',
    status: 'SUBMITTED',
    claimType: 'Institutional',
    firstBilledDate: '02/07/2026',
    lastClaimStatus: 'Pending',
    taskDueDate: '',
    hasAlert: false,
  },
  {
    id: 'fu-006',
    claimNumber: '171724868',
    patientName: 'Williams, Anna',
    dos: '02/01/2026',
    currentPayer: 'Medicare',
    lastBilledDate: '02/03/2026',
    balance: 89.0,
    claimFollowUpDate: '02/28/2026',
    lastNote: 'Secondary claim to follow',
    lastNoteDate: '02/15/2026',
    lastNoteUser: 'Sarah J.',
    status: 'SECONDARY BILLING',
    claimType: 'Professional',
    firstBilledDate: '02/03/2026',
    lastClaimStatus: 'Paid - secondary',
    taskDueDate: '02/28/2026',
    hasAlert: true,
  },
];

export function FollowUpManagementPage() {
  const [findInTable, setFindInTable] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredList = useMemo(() => {
    let list = [...MOCK_FOLLOW_UPS];
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
    return list;
  }, [findInTable]);

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
    if (selectedIds.size === pageData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageData.map((r) => r.id)));
    }
  }, [selectedIds.size, pageData]);

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
        <h1 className="text-xl font-semibold text-foreground">Follow Up Management</h1>
      </div>

      {/* Action bar - CollaborateMD style (screenshot 2) */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <Button variant="outline" size="sm" className="gap-1">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
        <Button size="sm" className="gap-1">
          <Calendar className="h-4 w-4" />
          Set Follow Up
        </Button>
        <Button size="sm" className="gap-1">
          <CheckCircle className="h-4 w-4" />
          Check Claim Status
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <List className="h-4 w-4" />
          Task Options
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <X className="h-4 w-4" />
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

      {showFilters && (
        <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground mt-2">
          No filters applied. Use filter options to narrow results.
        </div>
      )}

      {/* Table */}
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
                  aria-label={`Select ${row.claimNumber}`}
                />
              ),
            },
            {
              key: 'alerts',
              label: 'Alerts',
              className: 'w-12',
              cellClassName: 'w-12',
              render: (row) =>
                row.hasAlert ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 fill-amber-100" aria-label="Alert" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: 'claimNumber',
              label: 'Claim #',
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
              key: 'patientName',
              label: 'Patient Name',
              render: (row) => (
                <Link
                  to={`/patient-dashboard/${row.claimNumber}`}
                  className="text-primary hover:underline font-medium"
                >
                  {row.patientName}
                </Link>
              ),
            },
            { key: 'dos', label: 'DOS', cellClassName: 'text-sm' },
            {
              key: 'currentPayer',
              label: 'Current Payer',
              cellClassName: 'text-sm',
              render: (row) => row.currentPayer || 'No current payer',
            },
            {
              key: 'lastBilledDate',
              label: 'Last Billed Date',
              cellClassName: 'text-sm',
            },
            {
              key: 'balance',
              label: 'Balance',
              align: 'right',
              cellClassName: 'font-medium',
              render: (row) => `$${Number(row.balance).toFixed(2)}`,
            },
            {
              key: 'claimFollowUpDate',
              label: 'Claim Follow Up Date',
              cellClassName: 'text-sm',
              render: (row) => row.claimFollowUpDate || '—',
            },
            {
              key: 'lastNote',
              label: 'Last Note',
              cellClassName: 'text-sm text-muted-foreground max-w-[180px] truncate',
              render: (row) => row.lastNote || '—',
            },
            {
              key: 'lastNoteDate',
              label: 'Last Note Date',
              cellClassName: 'text-sm text-muted-foreground',
              render: (row) => row.lastNoteDate || '—',
            },
            {
              key: 'lastNoteUser',
              label: 'Last Note User',
              cellClassName: 'text-sm text-muted-foreground',
              render: (row) => row.lastNoteUser || '—',
            },
            {
              key: 'status',
              label: 'Status',
              cellClassName: 'text-sm font-medium',
            },
            {
              key: 'claimType',
              label: 'Claim Type',
              cellClassName: 'text-sm',
            },
            {
              key: 'firstBilledDate',
              label: 'First Billed D',
              cellClassName: 'text-sm',
            },
            {
              key: 'lastClaimStatus',
              label: 'Last Claim St',
              cellClassName: 'text-sm text-muted-foreground',
            },
            {
              key: 'taskDueDate',
              label: 'Task Due Date',
              cellClassName: 'text-sm',
              render: (row) => row.taskDueDate || '—',
            },
          ]}
          data={pageData}
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
          emptyMessage="No follow-ups match your search."
          pageSizeOptions={PAGE_SIZES}
        />
      </div>

      {/* Footer - CollaborateMD style */}
      <div className="mt-3 flex flex-wrap items-center gap-6 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
        <span className="font-medium">
          Claims: <strong>{totalFiltered}</strong>
        </span>
        <span className="font-medium">
          Total Balance: <strong>${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </span>
      </div>
    </div>
  );
}
