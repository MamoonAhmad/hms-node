import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  RefreshCw,
  MoreHorizontal,
  FilePlus2,
  UserPlus,
  LayoutDashboard,
  FileText,
  IdCard,
  Receipt,
  StickyNote,
  History,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { claimApi } from '@/services/api/claim.api';
import { formatDob } from '@/pages/patient-dashboard/patientChartUtils';
import { formatGenderLabel } from '@/components/patients/listing/patientListUtils';

const DOC_STATUS_OPTIONS = [
  { value: 'all', label: 'All doc statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'signed', label: 'Signed' },
  { value: 'not_signed', label: 'Not signed' },
  { value: 'non_billable', label: 'Non billable' },
  { value: 'no_medical_record', label: 'No medical record found' },
  { value: 'unbilled', label: 'Unbilled' },
  { value: 'not_completed', label: 'Not completed' },
];

const PATIENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All patient types' },
  { value: 'in-house', label: 'In Person' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'home-visit', label: 'Home Visit' },
];

const DATE_PRESETS = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

const DOC_STATUS_VARIANT = {
  pending: 'warning',
  signed: 'success',
  not_signed: 'destructive',
  non_billable: 'muted',
  no_medical_record: 'destructive',
  unbilled: 'info',
  not_completed: 'warning',
};

function docStatusLabel(value) {
  return DOC_STATUS_OPTIONS.find((o) => o.value === value)?.label || value || '—';
}

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveDateRange(preset, customFrom, customTo) {
  const today = new Date();
  if (preset === 'today') {
    const key = toDateKey(today);
    return { dateFrom: key, dateTo: key };
  }
  if (preset === '7') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { dateFrom: toDateKey(from), dateTo: toDateKey(today) };
  }
  if (preset === '30') {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { dateFrom: toDateKey(from), dateTo: toDateKey(today) };
  }
  if (preset === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: toDateKey(from), dateTo: toDateKey(today) };
  }
  if (preset === 'custom') {
    return { dateFrom: customFrom || undefined, dateTo: customTo || undefined };
  }
  return { dateFrom: undefined, dateTo: undefined };
}

function formatShortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ClaimsWorklistPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [docStatus, setDocStatus] = useState('all');
  const [patientType, setPatientType] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [openRowMenuId, setOpenRowMenuId] = useState(null);
  const [assignRow, setAssignRow] = useState(null);
  const [assignName, setAssignName] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [docStatusRow, setDocStatusRow] = useState(null);
  const [docStatusValue, setDocStatusValue] = useState('pending');

  const fetchWorklist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = resolveDateRange(datePreset, dateFrom, dateTo);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        docStatus: docStatus !== 'all' ? docStatus : undefined,
        patientType: patientType !== 'all' ? patientType : undefined,
        unassigned: assignmentFilter === 'unassigned' ? true : undefined,
      };
      const res = await claimApi.listWorklist(params);
      setRows(Array.isArray(res.data) ? res.data : []);
      setPagination((p) => ({
        ...p,
        total: res.pagination?.total ?? 0,
        page: res.pagination?.page ?? p.page,
        limit: res.pagination?.limit ?? p.limit,
      }));
    } catch (err) {
      setError(err.message || 'Failed to load claims worklist');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    datePreset,
    dateFrom,
    dateTo,
    docStatus,
    patientType,
    assignmentFilter,
  ]);

  useEffect(() => {
    fetchWorklist();
  }, [fetchWorklist]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (datePreset !== 'all') n += 1;
    if (docStatus !== 'all') n += 1;
    if (patientType !== 'all') n += 1;
    if (assignmentFilter !== 'all') n += 1;
    return n;
  }, [search, datePreset, docStatus, patientType, assignmentFilter]);

  const clearFilters = () => {
    setSearch('');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setDocStatus('all');
    setPatientType('all');
    setAssignmentFilter('all');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openPatientHub = (row) => {
    if (!row.patientId) return;
    navigate(
      `/patient-dashboard/${row.patientId}?appointmentId=${row.appointmentId || ''}&tab=summary`,
    );
  };

  const openDocumentation = (row) => {
    if (!row.patientId) return;
    navigate(
      `/patient-dashboard/${row.patientId}?appointmentId=${row.appointmentId || ''}&tab=notes`,
    );
  };

  const openChargeCapture = (row) => {
    if (!row.patientId) return;
    navigate(
      `/patient-dashboard/${row.patientId}?appointmentId=${row.appointmentId || ''}&tab=charge-capture`,
    );
  };

  const openFacesheet = (row) => {
    if (!row.patientId) return;
    navigate(`/patients/${row.patientId}/chart`);
  };

  const handleCreateClaim = async (row) => {
    if (!row.patientId || !row.appointmentId) return;
    setActionBusyId(row.id);
    setOpenRowMenuId(null);
    try {
      if (row.claimId) {
        navigate(`/rcm/cms-1500?claimId=${row.claimNumber || row.claimId}`);
        return;
      }
      const res = await claimApi.generateClaim(row.patientId, row.appointmentId);
      const claim = res?.data;
      if (claim?.claimNumber || claim?.id) {
        navigate(`/rcm/cms-1500?claimId=${claim.claimNumber || claim.id}`);
      } else {
        openChargeCapture(row);
      }
    } catch (err) {
      alert(err.message || 'Unable to create claim. Complete charge capture first.');
      openChargeCapture(row);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleAssignSave = async () => {
    if (!assignRow) return;
    const name = assignName.trim();
    if (!name) return;
    setAssignSaving(true);
    try {
      await claimApi.updateWorklistItem(assignRow.checkoutId || assignRow.appointmentId || assignRow.id, {
        assignedUserName: name,
      });
      setAssignRow(null);
      setAssignName('');
      await fetchWorklist();
    } catch (err) {
      alert(err.message || 'Failed to assign user');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDocStatusSave = async () => {
    if (!docStatusRow) return;
    setAssignSaving(true);
    try {
      await claimApi.updateWorklistItem(
        docStatusRow.checkoutId || docStatusRow.appointmentId || docStatusRow.id,
        { docStatus: docStatusValue },
      );
      setDocStatusRow(null);
      await fetchWorklist();
    } catch (err) {
      alert(err.message || 'Failed to update documentation status');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleRemove = async (row) => {
    setOpenRowMenuId(null);
    if (!window.confirm('Remove this encounter from the claims worklist?')) return;
    setActionBusyId(row.id);
    try {
      await claimApi.removeFromWorklist(row.checkoutId || row.appointmentId || row.id);
      await fetchWorklist();
    } catch (err) {
      alert(err.message || 'Failed to remove from worklist');
    } finally {
      setActionBusyId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'patient',
        label: 'Patient Name & MRN',
        render: (row) => (
          <button type="button" className="text-left group" onClick={() => openPatientHub(row)}>
            <span className="block font-medium text-primary group-hover:underline">
              {row.patientName || '—'}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{row.mrn || '—'}</span>
          </button>
        ),
      },
      {
        key: 'encounter',
        label: 'Encounter # & Date',
        render: (row) => (
          <div className="text-sm">
            <div className="font-mono text-xs">{row.encounterNumber || '—'}</div>
            <div className="text-muted-foreground">{formatShortDate(row.encounterDate)}</div>
          </div>
        ),
      },
      {
        key: 'demographics',
        label: 'DOB / Age / Gender',
        render: (row) => (
          <div className="text-sm text-muted-foreground">
            {formatDob(row.dateOfBirth)}, {row.age != null ? `${row.age}y` : '—'},{' '}
            {formatGenderLabel(row.gender)}
          </div>
        ),
      },
      {
        key: 'insurance',
        label: 'Insurance',
        render: (row) => (
          <span className="block max-w-[180px] truncate text-sm" title={row.insuranceLabel || ''}>
            {row.insuranceLabel || '—'}
          </span>
        ),
      },
      {
        key: 'patientType',
        label: 'Patient Type',
        render: (row) => row.patientType || '—',
      },
      {
        key: 'dischargeDate',
        label: 'Discharge Date',
        render: (row) => formatDateTime(row.dischargeDate),
      },
      {
        key: 'provider',
        label: 'Rendering Provider',
        render: (row) => (
          <span className="block max-w-[160px] truncate text-sm" title={row.renderingProvider || ''}>
            {row.renderingProvider || '—'}
          </span>
        ),
      },
      {
        key: 'docStatus',
        label: 'Doc Status',
        render: (row) => (
          <Badge variant={DOC_STATUS_VARIANT[row.docStatus] || 'muted'} className="font-normal whitespace-nowrap">
            {docStatusLabel(row.docStatus)}
          </Badge>
        ),
      },
      {
        key: 'assigned',
        label: 'Assigned User',
        render: (row) => row.assignedUserName || <span className="text-muted-foreground">Unassigned</span>,
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        render: (row) => formatDateTime(row.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Claims Worklist"
        description="Encounters with completed checkout ready for coding and claim creation"
        breadcrumbs="Claims"
        actions={
          <Button variant="outline" size="sm" onClick={fetchWorklist} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="worklist-search">Search</Label>
              <Input
                id="worklist-search"
                placeholder="Patient, MRN, encounter #..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Discharge date</Label>
              <Select
                value={datePreset}
                onValueChange={(v) => {
                  setDatePreset(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Doc status</Label>
              <Select
                value={docStatus}
                onValueChange={(v) => {
                  setDocStatus(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Patient type</Label>
              <Select
                value={patientType}
                onValueChange={(v) => {
                  setPatientType(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATIENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignment</Label>
              <Select
                value={assignmentFilter}
                onValueChange={(v) => {
                  setAssignmentFilter(v);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignments</SelectItem>
                  <SelectItem value="unassigned">Unassigned only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {datePreset === 'custom' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="wl-from">From</Label>
                <Input
                  id="wl-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wl-to">To</Label>
                <Input
                  id="wl-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Worklist
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({pagination.total} encounter{pagination.total === 1 ? '' : 's'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            total={pagination.total}
            page={pagination.page}
            pageSize={pagination.limit}
            isLoading={loading}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
            getRowId={(row) => row.id}
            emptyMessage="No completed checkouts on the worklist"
            actions={(row) => (
              <div className="relative flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={actionBusyId === row.id}
                  onClick={() => setOpenRowMenuId((id) => (id === row.id ? null : row.id))}
                  aria-label="Open actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                {openRowMenuId === row.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setOpenRowMenuId(null)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-md border bg-popover p-1 shadow-lg">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleCreateClaim(row)}
                      >
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Create Claim
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          setAssignRow(row);
                          setAssignName(row.assignedUserName || '');
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign User
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          openPatientHub(row);
                        }}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Patient Hub
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          setDocStatusRow(row);
                          setDocStatusValue(row.docStatus || 'pending');
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Documentation
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          openFacesheet(row);
                        }}
                      >
                        <IdCard className="mr-2 h-4 w-4" />
                        View Facesheet
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          openChargeCapture(row);
                        }}
                      >
                        <Receipt className="mr-2 h-4 w-4" />
                        Account Statement
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setOpenRowMenuId(null);
                          openDocumentation(row);
                        }}
                      >
                        <StickyNote className="mr-2 h-4 w-4" />
                        Notes
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link
                          to={`/patients/${row.patientId}/encounters`}
                          onClick={() => setOpenRowMenuId(null)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          History
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => handleRemove(row)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Encounter from worklist
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(assignRow)} onOpenChange={(open) => !open && setAssignRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Assign {assignRow?.patientName} ({assignRow?.encounterNumber}) to a worklist user.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="assign-user-name">User name</Label>
              <Input
                id="assign-user-name"
                value={assignName}
                onChange={(e) => setAssignName(e.target.value)}
                placeholder="Enter assignee name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignRow(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAssignSave} disabled={assignSaving || !assignName.trim()}>
              {assignSaving ? 'Saving…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(docStatusRow)} onOpenChange={(open) => !open && setDocStatusRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Documentation status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={docStatusValue} onValueChange={setDocStatusValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_STATUS_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDocStatusRow(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDocStatusSave} disabled={assignSaving}>
              {assignSaving ? 'Saving…' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
