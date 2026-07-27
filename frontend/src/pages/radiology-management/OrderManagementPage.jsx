import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Printer, Edit, FileText } from 'lucide-react';
import { orderApi } from '@/services/api';
import {
  mapOrderToRadiologyRow,
  groupOrdersByPatient,
} from '@/lib/orderWorklist';
import { EditRadiologyReportDialog } from './EditRadiologyReportDialog';
import { ViewRadiologyReportDialog } from './ViewRadiologyReportDialog';

function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const EMPTY_ORDER_FILTERS = {
  testName: '',
  status: '',
};

export function OrderManagementPage() {
  const navigate = useNavigate();
  const [viewTab, setViewTab] = useState('patients');
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [orderFilters, setOrderFilters] = useState(EMPTY_ORDER_FILTERS);
  const [editOrder, setEditOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrders({
        category: 'Radiology',
        destination: 'onsite',
        limit: 500,
      });
      const mapped = (res?.data || [])
        .filter((o) => o.status !== 'Cancelled')
        .map(mapOrderToRadiologyRow);
      setOrderList(mapped);
    } catch (err) {
      setOrderList([]);
      setError(err.message || 'Failed to load radiology orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderApi.getOrders({
          category: 'Radiology',
          destination: 'onsite',
          limit: 500,
        });
        const mapped = (res?.data || [])
          .filter((o) => o.status !== 'Cancelled')
          .map(mapOrderToRadiologyRow);
        if (!cancelled) setOrderList(mapped);
      } catch (err) {
        if (!cancelled) {
          setOrderList([]);
          setError(err.message || 'Failed to load radiology orders');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedByPatient = useMemo(
    () => groupOrdersByPatient(orderList, 'orderDateTime'),
    [orderList]
  );

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groupedByPatient;
    return groupedByPatient.filter(
      (r) =>
        (r.patient?.name || '').toLowerCase().includes(q) ||
        (r.patient?.mrn || '').toLowerCase().includes(q) ||
        (r.patient?.gender || '').toLowerCase().includes(q)
    );
  }, [groupedByPatient, search]);

  const total = filteredPatients.length;
  const currentPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, Math.ceil(total / pagination.limit))
  );
  const patientRows = useMemo(
    () =>
      filteredPatients.slice(
        (currentPage - 1) * pagination.limit,
        currentPage * pagination.limit
      ),
    [filteredPatients, currentPage, pagination.limit]
  );

  const filteredOrders = useMemo(() => {
    return orderList.filter((o) => {
      if (
        orderFilters.testName &&
        !(o.orderName || '').toLowerCase().includes(orderFilters.testName.toLowerCase())
      ) {
        return false;
      }
      if (orderFilters.status && o.status !== orderFilters.status) return false;
      return true;
    });
  }, [orderList, orderFilters]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback(
    (page) => setPagination((p) => ({ ...p, page })),
    []
  );
  const handlePageSizeChange = useCallback(
    (limit) => setPagination((p) => ({ ...p, limit, page: 1 })),
    []
  );

  const handleViewDetail = (patientId) => {
    navigate(`/radiology-management/order-management/patient/${patientId}`);
  };

  const handlePrintBarcode = (patientId) => {
    navigate(`/radiology-management/patient/${patientId}/labels`);
  };

  const handleClearOrderFilters = () => setOrderFilters(EMPTY_ORDER_FILTERS);

  const handleSaveReport = useCallback(
    async (updatedOrder) => {
      try {
        if (updatedOrder?.id && updatedOrder?.status) {
          await orderApi.updateOrderStatus(updatedOrder.id, updatedOrder.status);
        }
        setEditOrder(null);
        await loadOrders();
      } catch (err) {
        alert(err.message || 'Failed to update order');
      }
    },
    [loadOrders]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Radiology order management by patient or by order</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Tabs value={viewTab} onValueChange={setViewTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="patients">By Patients</TabsTrigger>
          <TabsTrigger value="orders">By Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Listing</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: 'patientInfo',
                    label: 'Patient Information',
                    render: (r) => (
                      <div className="space-y-0.5">
                        <div className="font-medium">{r.patient?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.patient?.gender || '-'} · DOB: {r.patient?.dob || '-'} · MRN:{' '}
                          {r.patient?.mrn || '-'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'totalOrders',
                    label: 'Total Orders',
                    render: (r) => r.totalOrders,
                  },
                  {
                    key: 'createdAt',
                    label: 'Created At',
                    cellClassName: 'text-muted-foreground',
                    render: (r) => formatDateTime(r.createdAt),
                  },
                ]}
                data={patientRows}
                total={total}
                page={currentPage}
                pageSize={pagination.limit}
                searchValue={search}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                getRowId={(r) => r.patientId}
                searchPlaceholder="Search by patient name or MRN..."
                emptyMessage={loading ? 'Loading orders...' : 'No orders'}
                actions={(r) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View detail"
                      onClick={() => handleViewDetail(r.patientId)}
                    >
                      <Eye className="h-4 w-4 icon-action-view" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Print barcode"
                      onClick={() => handlePrintBarcode(r.patientId)}
                    >
                      <Printer className="h-4 w-4 icon-action-print" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input
                placeholder="Test name"
                value={orderFilters.testName}
                onChange={(e) =>
                  setOrderFilters((f) => ({ ...f, testName: e.target.value }))
                }
                className="w-[180px]"
              />
              <Select
                value={orderFilters.status || '_'}
                onValueChange={(v) =>
                  setOrderFilters((f) => ({ ...f, status: v === '_' ? '' : v }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resulted">Resulted</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleClearOrderFilters}>
                Clear
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Information</TableHead>
                    <TableHead>Order Detail</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No orders
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{order.patient?.name}</div>
                            <div className="text-muted-foreground">
                              MRN: {order.patient?.mrn}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium">{order.orderName}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {order.procedureCode || order.id?.slice(0, 8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(order.lastUpdatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewOrder(order)}
                              title="View"
                            >
                              <Eye className="h-4 w-4 icon-action-view" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditOrder(order)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 icon-action-edit" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/radiology-management/order/${order.id}/report`,
                                  '_blank'
                                )
                              }
                              title="Print report"
                            >
                              <FileText className="h-4 w-4 icon-action-print" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/radiology-management/order/${order.id}/labels`,
                                  '_blank'
                                )
                              }
                              title="Print barcode"
                            >
                              <Printer className="h-4 w-4 icon-action-print" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editOrder && (
        <EditRadiologyReportDialog
          open={!!editOrder}
          onClose={() => setEditOrder(null)}
          order={editOrder}
          patient={editOrder.patient}
          onSave={handleSaveReport}
        />
      )}
      {viewOrder && (
        <ViewRadiologyReportDialog
          open={!!viewOrder}
          onClose={() => setViewOrder(null)}
          order={viewOrder}
          patient={viewOrder.patient}
        />
      )}
    </div>
  );
}
