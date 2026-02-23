import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Send } from 'lucide-react';
import { labApi } from '@/services/api';
import { getLabOrderTransportStatusBadgeClass, LAB_ORDER_TRANSPORT_STATUS } from '@/lib/labConstants';
import { CreateLabOrderTransportDialog } from './CreateLabOrderTransportDialog';

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function LabOrderTransportPage() {
  const [list, setList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [createOpen, setCreateOpen] = useState(false);

  const loadList = useCallback(() => {
    const status = statusFilter === 'all' ? undefined : statusFilter;
    labApi
      .getLabOrderTransportList({ status, search: search || undefined })
      .then((res) => setList(res?.data ?? []))
      .catch(() => setList([]));
  }, [statusFilter, search]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const total = list.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => list.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [list, currentPage, pagination.limit]
  );

  const handleSendOrder = async (order) => {
    if (order.status !== LAB_ORDER_TRANSPORT_STATUS.DRAFT) return;
    try {
      await labApi.updateLabOrderTransport(order.id, {
        status: LAB_ORDER_TRANSPORT_STATUS.SENT_FOR_COLLECTION,
        sentAt: new Date().toISOString(),
      });
      loadList();
    } catch (e) {
      alert(e?.message || 'Failed to send order');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Lab Order Transport</h1>
        <p className="text-muted-foreground">
          Assign lab tests to patients and send orders for collection or transport (outpatient clinic scenario).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Lab orders</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create order
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, page: 1 })); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.values(LAB_ORDER_TRANSPORT_STATUS).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={[
              { key: 'orderNumber', label: 'Order #', cellClassName: 'font-medium', render: (row) => row.orderNumber },
              {
                key: 'patient',
                label: 'Patient',
                render: (row) => (
                  <div className="space-y-0.5">
                    <div className="font-medium">{row.patient?.name ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">{row.patient?.mrn ?? ''}</div>
                  </div>
                ),
              },
              { key: 'tests', label: 'Tests', render: (row) => <span className="text-sm">{row.testNames?.length ? row.testNames.join(', ') : '-'}</span> },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabOrderTransportStatusBadgeClass(row.status)}`}>
                    {row.status}
                  </span>
                ),
              },
              { key: 'orderDate', label: 'Order date', cellClassName: 'text-sm text-muted-foreground', render: (row) => formatDateTime(row.orderDate) },
              { key: 'provider', label: 'Provider', cellClassName: 'text-sm', render: (row) => row.orderingProvider || '-' },
            ]}
            data={rows}
            total={total}
            page={currentPage}
            pageSize={pagination.limit}
            searchValue={search}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            getRowId={(row) => row.id}
            searchPlaceholder="Search by patient name, MRN, order number..."
            emptyMessage="No lab orders. Create one to get started."
            actions={(order) =>
              order.status === LAB_ORDER_TRANSPORT_STATUS.DRAFT ? (
                <Button variant="outline" size="sm" onClick={() => handleSendOrder(order)}>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              ) : null
            }
          />
        </CardContent>
      </Card>

      <CreateLabOrderTransportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={loadList}
      />
    </div>
  );
}
