import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getLabStatusBadgeClass } from '@/lib/labConstants';
import {
  calcAge,
  mapOrderToLabRow,
  groupOrdersByPatient,
} from '@/lib/orderWorklist';
import { EditResultsDialog } from './EditResultsDialog';
import { ViewResultDialog } from './ViewResultDialog';

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

const EMPTY_ORDER_FILTERS = {
  testId: '',
  testName: '',
  specimenStatus: '',
  resultStatus: '',
};

export function ResultManagementPage() {
  const navigate = useNavigate();
  const [viewTab, setViewTab] = useState('patients');
  const [resultList, setResultList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [orderFilters, setOrderFilters] = useState(EMPTY_ORDER_FILTERS);
  const [editTest, setEditTest] = useState(null);
  const [viewTest, setViewTest] = useState(null);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrders({ category: 'Lab', destination: 'onsite', limit: 500 });
      const rows = (res?.data || [])
        .filter((o) => o.status !== 'Cancelled')
        .map(mapOrderToLabRow);
      setResultList(rows);
    } catch (err) {
      setResultList([]);
      setError(err.message || 'Failed to load lab results');
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
        const res = await orderApi.getOrders({ category: 'Lab', destination: 'onsite', limit: 500 });
        const rows = (res?.data || [])
          .filter((o) => o.status !== 'Cancelled')
          .map(mapOrderToLabRow);
        if (!cancelled) setResultList(rows);
      } catch (err) {
        if (!cancelled) {
          setResultList([]);
          setError(err.message || 'Failed to load lab results');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedByPatient = useMemo(() => {
    return groupOrdersByPatient(resultList, 'createdAt').map((g) => {
      const created = g.tests.map((t) => t.createdAt).filter(Boolean);
      const updated = g.tests.map((t) => t.updatedAt || t.createdAt).filter(Boolean);
      return {
        ...g,
        createdAt: created.length ? created.sort()[0] : null,
        updatedAt: updated.length ? updated.sort().reverse()[0] : null,
      };
    });
  }, [resultList]);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groupedByPatient;
    return groupedByPatient.filter(
      (g) =>
        (g.patient?.name || '').toLowerCase().includes(q) ||
        (g.patient?.mrn || '').toLowerCase().includes(q)
    );
  }, [groupedByPatient, search]);

  const patientTotal = filteredPatients.length;
  const patientPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, Math.ceil(patientTotal / pagination.limit))
  );
  const patientRows = useMemo(
    () =>
      filteredPatients.slice(
        (patientPage - 1) * pagination.limit,
        patientPage * pagination.limit
      ),
    [filteredPatients, patientPage, pagination.limit]
  );

  const filteredOrders = useMemo(() => {
    return resultList.filter((row) => {
      if (
        orderFilters.testId &&
        !(row.testId || '').toLowerCase().includes(orderFilters.testId.toLowerCase())
      ) {
        return false;
      }
      if (
        orderFilters.testName &&
        !(row.testName || '').toLowerCase().includes(orderFilters.testName.toLowerCase())
      ) {
        return false;
      }
      if (orderFilters.specimenStatus && row.specimenStatus !== orderFilters.specimenStatus) {
        return false;
      }
      if (
        orderFilters.resultStatus &&
        (row.resultStatus || row.status) !== orderFilters.resultStatus
      ) {
        return false;
      }
      return true;
    });
  }, [resultList, orderFilters]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback(
    (limit) => setPagination((p) => ({ ...p, limit, page: 1 })),
    []
  );

  const handleViewDetail = (patientId) => {
    navigate(`/laboratory-management/result-management/patient/${patientId}`);
  };

  const handlePrintBarcodes = (group) => {
    const ids = group.tests.map((t) => t.id).join(',');
    navigate(`/laboratory-management/specimen-collection/labels?specimenIds=${ids}`);
  };

  const handleClearOrderFilters = () => setOrderFilters(EMPTY_ORDER_FILTERS);

  const handleSaved = async (updated) => {
    if (updated?.id && updated?.resultStatus) {
      const statusMap = {
        Pending: 'Pending',
        'In Progress': 'In Progress',
        Completed: 'Resulted',
        Resulted: 'Resulted',
        Cancelled: 'Cancelled',
      };
      try {
        await orderApi.updateOrderStatus(
          updated.id,
          statusMap[updated.resultStatus] || updated.resultStatus
        );
      } catch (err) {
        alert(err.message || 'Failed to update order status');
        return;
      }
    }
    setEditTest(null);
    await loadResults();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Onsite result management</h1>
        <p className="text-muted-foreground">Onsite lab orders from patient encounters</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Tabs value={viewTab} onValueChange={setViewTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="patients">By Patients</TabsTrigger>
          <TabsTrigger value="orders">By Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <DataTable
            columns={[
              {
                key: 'patientInfo',
                label: 'Patient Information',
                render: (group) => (
                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">
                      MRN: {group.patient?.mrn ?? '-'}
                    </div>
                    <div className="font-medium">{group.patient?.name ?? '-'}</div>
                    <div className="text-sm text-muted-foreground">
                      {group.patient?.gender ?? '-'} · {calcAge(group.patient?.dateOfBirth)} yrs
                    </div>
                  </div>
                ),
              },
              {
                key: 'labOrders',
                label: 'Lab Orders',
                render: (group) => (
                  <div className="text-sm">
                    Total lab orders: <span className="font-medium">{group.totalOrders}</span>
                  </div>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created At',
                render: (group) => (
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(group.createdAt)}
                  </span>
                ),
              },
              {
                key: 'updatedAt',
                label: 'Updated At',
                render: (group) => (
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(group.updatedAt)}
                  </span>
                ),
              },
            ]}
            data={patientRows}
            total={patientTotal}
            page={patientPage}
            pageSize={pagination.limit}
            searchValue={search}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            getRowId={(row) => row.patientId}
            searchPlaceholder="Search by patient name or MRN..."
            emptyMessage={loading ? 'Loading...' : 'No results'}
            actions={(group) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetail(group.patientId)}
                  className="h-8 w-8 p-0"
                  title="View detail"
                >
                  <Eye className="h-4 w-4 icon-action-view" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePrintBarcodes(group)}
                  className="h-8 w-8 p-0"
                  title="Print barcode"
                >
                  <Printer className="h-4 w-4 icon-action-print" />
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input
                placeholder="Test ID"
                value={orderFilters.testId}
                onChange={(e) => setOrderFilters((f) => ({ ...f, testId: e.target.value }))}
                className="max-w-[120px]"
              />
              <Input
                placeholder="Test Name"
                value={orderFilters.testName}
                onChange={(e) => setOrderFilters((f) => ({ ...f, testName: e.target.value }))}
                className="max-w-[180px]"
              />
              <Select
                value={orderFilters.specimenStatus || '_'}
                onValueChange={(v) =>
                  setOrderFilters((f) => ({ ...f, specimenStatus: v === '_' ? '' : v }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Specimen Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={orderFilters.resultStatus || '_'}
                onValueChange={(v) =>
                  setOrderFilters((f) => ({ ...f, resultStatus: v === '_' ? '' : v }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Result Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Resulted">Resulted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleClearOrderFilters}>
                Clear All
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Test Information</TableHead>
                    <TableHead>Specimen Status</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Test Result Status</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No orders
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">
                              MRN: {row.patient?.mrn ?? '-'}
                            </div>
                            <div className="font-medium">{row.patient?.name ?? '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium">{row.testName}</div>
                            <div className="text-sm text-muted-foreground">
                              Test ID: {row.testId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabStatusBadgeClass(row.specimenStatus)}`}
                          >
                            {row.specimenStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabStatusBadgeClass(row.resultStatus)}`}
                          >
                            {row.resultStatus || 'Ordered'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewTest(row)}
                              title="View result"
                            >
                              <Eye className="h-4 w-4 icon-action-view" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditTest(row)}
                              title="Edit result"
                            >
                              <Edit className="h-4 w-4 icon-action-edit" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/laboratory-management/result-management/report/${row.id}`
                                )
                              }
                              title="Print lab report"
                            >
                              <FileText className="h-4 w-4 icon-action-print" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/laboratory-management/specimen-collection/labels?specimenId=${row.id}&count=1`
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

      {editTest && (
        <EditResultsDialog
          open={!!editTest}
          onOpenChange={(open) => !open && setEditTest(null)}
          labTest={editTest}
          onSaved={handleSaved}
        />
      )}

      {viewTest && (
        <ViewResultDialog
          open={!!viewTest}
          onOpenChange={(open) => !open && setViewTest(null)}
          labTest={viewTest}
        />
      )}
    </div>
  );
}
