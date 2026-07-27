import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pill,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { medicationOrderApi } from '@/services/api/medicationOrder.api';
import { usePatientChart } from './PatientChartContext';
import { MedicationOrderComposer } from './medications/MedicationOrderComposer';
import {
  CUSTOM_ORDER_SETS_STORAGE_KEY,
  HANDLING_LABELS,
  MEDICATION_STATUS_TABS,
  SAMPLE_MEDICATION_ORDERS,
  STATUS_BADGE_CLASSES,
} from './medications/medicationConstants';
import { ChartTabShell, SectionCard, StatusBadge } from './components/chart-ui';

function loadOrderSets() {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_SETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function PatientMedicationsTab() {
  const {
    patientId,
    appointmentId,
    isSampleChart,
    refreshKey,
    refreshChart,
  } = usePatientChart();

  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ All: 0, Draft: 0, Signed: 0, Verified: 0, Sent: 0, Completed: 0, Cancelled: 0 });
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [refillsOpen, setRefillsOpen] = useState(false);
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);
  const [orderSets, setOrderSets] = useState([]);

  const canFetch = patientId && !isSampleChart;

  const loadOrders = useCallback(async () => {
    if (isSampleChart) {
      setOrders(SAMPLE_MEDICATION_ORDERS);
      setStatusCounts({ All: 1, Draft: 0, Signed: 1, Verified: 0, Sent: 0, Completed: 0, Cancelled: 0 });
      return;
    }
    if (!canFetch) return;

    setLoading(true);
    try {
      const [ordersRes, countsRes] = await Promise.all([
        medicationOrderApi.getOrders(patientId, { appointmentId: appointmentId || undefined }),
        medicationOrderApi.getStatusCounts(patientId, { appointmentId: appointmentId || undefined }),
      ]);
      setOrders(ordersRes.data || []);
      setStatusCounts(countsRes.data || { All: 0, Draft: 0, Signed: 0, Verified: 0, Sent: 0, Completed: 0, Cancelled: 0 });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId, canFetch, isSampleChart]);

  useEffect(() => {
    loadOrders();
    setOrderSets(loadOrderSets().filter((s) => s.category === 'Pharmacy' || s.category === 'Medication' || !s.category));
  }, [loadOrders, refreshKey]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'All') {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.medicationName?.toLowerCase().includes(q) ||
          o.medicationCode?.toLowerCase().includes(q) ||
          o.sigPreview?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, statusFilter, searchQuery]);

  const handleSaved = useCallback(
    (sampleData) => {
      if (isSampleChart && sampleData) {
        setOrders((prev) => [...sampleData, ...prev]);
        setStatusCounts((prev) => ({
          ...prev,
          All: prev.All + sampleData.length,
          Draft: prev.Draft + sampleData.filter((d) => d.status === 'Draft').length,
          Signed: prev.Signed + sampleData.filter((d) => d.status === 'Signed').length,
        }));
      } else {
        loadOrders();
        refreshChart();
      }
    },
    [isSampleChart, loadOrders, refreshChart],
  );

  const medicationOrderSets = orderSets.filter(
    (s) => s.items?.some((i) => i.category === 'Pharmacy') || s.name?.toLowerCase().includes('med'),
  );

  return (
    <ChartTabShell
      title="Medications"
      description="Medication orders for the current patient encounter."
      actions={
        <>
          <Button variant="outline" onClick={() => setRefillsOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refills
          </Button>
          <Button onClick={() => setComposerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Medication
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {MEDICATION_STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              type="button"
              data-active={statusFilter === tab.id}
              className="chart-filter-chip"
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
              <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-muted px-1.5 text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search Orders"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <SectionCard title="Quick access / order sets" icon={Pill} accent="muted">
        <button
          type="button"
          className="mb-3 flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-left text-sm font-medium hover:bg-muted/40"
          onClick={() => setQuickAccessOpen((v) => !v)}
        >
          <span>{quickAccessOpen ? 'Collapse order sets' : 'Expand order sets'}</span>
          {quickAccessOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {quickAccessOpen && (
          <>
            {medicationOrderSets.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-6 text-center">
                <p className="text-sm font-medium">No order sets available.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save a reusable order template from the composer or configure shared sets in admin.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {medicationOrderSets.map((set) => (
                  <Button key={set.id || set.name} variant="outline" size="sm">
                    {set.name}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </SectionCard>

      <SectionCard title="Medication orders" icon={Pill} accent="info" contentClassName="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16">
            <Pill className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              No medication orders found for this encounter.
            </p>
            <Button className="mt-4" onClick={() => setComposerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Medication
            </Button>
          </div>
        ) : (
          <div className="chart-table-wrap border-0 shadow-none">
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>SIG</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.medicationName}</div>
                      <div className="font-mono text-xs text-muted-foreground">{order.medicationCode}</div>
                    </TableCell>
                    <TableCell>{order.strength || '—'}</TableCell>
                    <TableCell>{order.medicationClass || '—'}</TableCell>
                    <TableCell>{HANDLING_LABELS[order.handlingMethod] || order.handlingMethod}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={order.sigPreview}>{order.sigPreview || '—'}</TableCell>
                    <TableCell><StatusBadge status={order.status} className={cn(STATUS_BADGE_CLASSES[order.status] || '')} /></TableCell>
                    <TableCell>{order.orderedBy || order.prescriber || '—'}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <MedicationOrderComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        patientId={patientId}
        appointmentId={appointmentId}
        isSampleChart={isSampleChart}
        existingOrders={orders}
        onSaved={handleSaved}
      />

      <Dialog open={refillsOpen} onOpenChange={setRefillsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refill Requests</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Manage refill requests for active medication orders. No pending refill requests for this encounter.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefillsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChartTabShell>
  );
}
