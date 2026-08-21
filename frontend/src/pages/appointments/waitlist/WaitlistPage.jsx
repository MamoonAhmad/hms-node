import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  CalendarPlus,
  Send,
  XCircle,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WaitlistFilters } from '@/components/waitlist/WaitlistFilters';
import { WaitlistEntryFormDialog } from '@/components/waitlist/WaitlistEntryFormDialog';
import { WaitlistOfferDialog } from '@/components/waitlist/WaitlistOfferDialog';
import { WaitlistBookDialog } from '@/components/waitlist/WaitlistBookDialog';
import { WaitlistEventsSidebar } from '@/components/waitlist/WaitlistEventsSidebar';
import {
  WaitlistPriorityBadge,
  WaitlistStatusBadge,
} from '@/components/waitlist/WaitlistStatusBadge';
import {
  formatDateValue,
  formatOfferSlot,
  formatPatientName,
  formatPreferredTimes,
  formatProviderName,
} from '@/lib/waitlistConstants';
import { cn } from '@/lib/utils';
import {
  appointmentTypeApi,
  departmentApi,
  patientApi,
  providerApi,
  waitlistApi,
} from '@/services/api';

const SEGMENTED_GROUP =
  'flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1 shadow-sm';
const SEGMENTED_ACTIVE = 'bg-background text-foreground shadow-sm hover:bg-background';
const SEGMENTED_IDLE = 'text-muted-foreground hover:bg-background/70 hover:text-foreground';

export function WaitlistPage() {
  const [entries, setEntries] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'active',
    priority: '',
    preferredProviderId: '',
    preferredDepartmentId: '',
    appointmentTypeId: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const providerOptions = useMemo(
    () =>
      providers.map((p) => ({
        id: p.id,
        name: [p.firstName, p.lastName].filter(Boolean).join(' '),
      })),
    [providers],
  );

  const buildQuery = useCallback(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search || undefined,
      priority: filters.priority || undefined,
      preferredProviderId: filters.preferredProviderId || undefined,
      preferredDepartmentId: filters.preferredDepartmentId || undefined,
      appointmentTypeId: filters.appointmentTypeId || undefined,
    };
    if (filters.status === 'active') params.activeOnly = true;
    else if (filters.status) params.status = filters.status;
    return params;
  }, [filters, pagination.page, pagination.limit]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, countsRes] = await Promise.all([
        waitlistApi.getAll(buildQuery()),
        waitlistApi.getStatusCounts({
          search: filters.search || undefined,
          priority: filters.priority || undefined,
          preferredProviderId: filters.preferredProviderId || undefined,
          preferredDepartmentId: filters.preferredDepartmentId || undefined,
          appointmentTypeId: filters.appointmentTypeId || undefined,
        }),
      ]);
      setEntries(listRes.data || []);
      setPagination((prev) => ({
        ...prev,
        total: listRes.pagination?.total ?? 0,
        totalPages: listRes.pagination?.totalPages ?? 0,
      }));
      setStatusCounts(countsRes.data || { all: 0, active: 0 });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load waitlist' });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery, filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [filters]);

  useEffect(() => {
    Promise.all([
      patientApi.getAll({ limit: 200 }),
      providerApi.getAll({ limit: 500 }),
      departmentApi.getAll({ limit: 200 }),
      appointmentTypeApi.getActive(),
    ])
      .then(([patientRes, providerRes, deptRes, typeRes]) => {
        setPatients(patientRes.data || []);
        setProviders(providerRes.data || []);
        setDepartments(deptRes.data || []);
        setAppointmentTypes(typeRes.data || []);
      })
      .catch(() => {});
  }, []);

  const refresh = () => {
    setMessage({ type: '', text: '' });
    fetchEntries();
  };

  const openCreate = () => {
    setSelected(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const openEdit = (entry) => {
    setSelected(entry);
    setFormMode('edit');
    setFormOpen(true);
  };

  const openEvents = async (entry) => {
    setSelected(entry);
    setEventsOpen(true);
    setEventsLoading(true);
    try {
      const res = await waitlistApi.getEvents(entry.id);
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const runAction = async (fn, successText) => {
    setActionBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await fn();
      setMessage({ type: 'success', text: successText });
      fetchEntries();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionBusy(false);
    }
  };

  const statusTabs = [
    { key: 'active', label: 'Active', count: statusCounts.active },
    { key: 'Waiting', label: 'Waiting', count: statusCounts.Waiting },
    { key: 'Offered', label: 'Offered', count: statusCounts.Offered },
    { key: 'Booked', label: 'Booked', count: statusCounts.Booked },
    { key: '', label: 'All', count: statusCounts.all },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Waitlist</h1>
          <p className="text-muted-foreground">
            Queue patients for open slots, offer appointments, and book when capacity frees up.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              runAction(() => waitlistApi.expireStale(), 'Expired offers returned to waiting')
            }
            disabled={actionBusy}
          >
            <RefreshCw className="h-4 w-4" />
            Expire stale offers
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add to waitlist
          </Button>
        </div>
      </div>

      {message.text && (
        <div
          className={cn(
            'rounded-lg border p-3 text-sm',
            message.type === 'error'
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {message.text}
        </div>
      )}

      <div className={SEGMENTED_GROUP}>
        {statusTabs.map((tab) => (
          <Button
            key={tab.key || 'all'}
            type="button"
            variant="ghost"
            size="sm"
            className={filters.status === tab.key ? SEGMENTED_ACTIVE : SEGMENTED_IDLE}
            onClick={() => setFilters((f) => ({ ...f, status: tab.key }))}
          >
            {tab.label} ({tab.count ?? 0})
          </Button>
        ))}
      </div>

      <WaitlistFilters
        filters={filters}
        onChange={setFilters}
        providers={providerOptions}
        departments={departments}
        appointmentTypes={appointmentTypes}
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Preferences</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Offer / booking</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  Loading waitlist…
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No waitlist entries found
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{formatPatientName(entry.patient)}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {entry.patient?.mrn || '—'}
                    </div>
                    {entry.reason && (
                      <div className="text-xs text-muted-foreground mt-1">{entry.reason}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {entry.preferredProvider
                        ? formatProviderName(entry.preferredProvider)
                        : 'Any provider'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.appointmentType?.name || 'Any type'}
                      {entry.preferredDepartment?.departmentName
                        ? ` · ${entry.preferredDepartment.departmentName}`
                        : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateValue(entry.preferredDateFrom)} –{' '}
                      {formatDateValue(entry.preferredDateTo)}
                      {entry.preferredTimeWindow && entry.preferredTimeWindow !== 'any'
                        ? ` · ${entry.preferredTimeWindow}`
                        : ''}
                    </div>
                    {Array.isArray(entry.preferredTimes) && entry.preferredTimes.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Times: {formatPreferredTimes(entry.preferredTimes)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <WaitlistPriorityBadge priority={entry.priority} />
                  </TableCell>
                  <TableCell>
                    <WaitlistStatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>
                    {entry.status === 'Offered' ? (
                      <div className="text-sm">{formatOfferSlot(entry)}</div>
                    ) : entry.bookedAppointment ? (
                      <div className="text-sm">
                        {entry.bookedAppointment.encounterNumber}
                        <div className="text-xs text-muted-foreground">
                          {formatDateValue(entry.bookedAppointment.appointmentDate)}{' '}
                          {entry.bookedAppointment.appointmentTime}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end flex-wrap gap-1">
                      {['Waiting', 'Declined'].includes(entry.status) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Offer slot"
                            onClick={() => {
                              setSelected(entry);
                              setOfferOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Book now"
                            onClick={() => {
                              setSelected(entry);
                              setBookOpen(true);
                            }}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit"
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {entry.status === 'Offered' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Accept offer"
                            disabled={actionBusy}
                            onClick={() =>
                              runAction(
                                () => waitlistApi.acceptOffer(entry.id),
                                'Offer accepted — appointment booked',
                              )
                            }
                          >
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Decline offer"
                            disabled={actionBusy}
                            onClick={() =>
                              runAction(
                                () =>
                                  waitlistApi.declineOffer(entry.id, {
                                    returnToWaiting: true,
                                    reason: 'Patient declined',
                                  }),
                                'Offer declined — returned to waiting',
                              )
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Book with different slot"
                            onClick={() => {
                              setSelected(entry);
                              setBookOpen(true);
                            }}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {['Waiting', 'Offered', 'Declined'].includes(entry.status) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Cancel entry"
                          disabled={actionBusy}
                          onClick={() =>
                            runAction(
                              () => waitlistApi.cancel(entry.id, { reason: 'Cancelled by staff' }),
                              'Waitlist entry cancelled',
                            )
                          }
                        >
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="History"
                        onClick={() => openEvents(entry)}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <WaitlistEntryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        entry={selected}
        patients={patients}
        providers={providerOptions}
        departments={departments}
        appointmentTypes={appointmentTypes}
        onSuccess={refresh}
      />

      <WaitlistOfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        entry={selected}
        providers={providerOptions}
        onSuccess={refresh}
      />

      <WaitlistBookDialog
        open={bookOpen}
        onOpenChange={setBookOpen}
        entry={selected}
        providers={providerOptions}
        departments={departments}
        appointmentTypes={appointmentTypes}
        onSuccess={refresh}
      />

      <WaitlistEventsSidebar
        open={eventsOpen}
        onClose={() => setEventsOpen(false)}
        events={events}
        isLoading={eventsLoading}
        title={formatPatientName(selected?.patient)}
      />
    </div>
  );
}
