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
import { Eye, Printer, Edit, Plus } from 'lucide-react';
import { orderApi } from '@/services/api';
import { getLabStatusBadgeClass, SPECIMEN_TYPES } from '@/lib/labConstants';
import {
  formatAgeDisplay,
  mapOrderToLabRow,
  groupOrdersByPatient,
  OPEN_LAB_ORDER_STATUSES,
} from '@/lib/orderWorklist';
import { EditSpecimenDialog } from './EditSpecimenDialog';
import { ViewSpecimenDialog } from './ViewSpecimenDialog';

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
  specimenType: '',
};

export function SpecimenCollectionPage() {
  const navigate = useNavigate();
  const [viewTab, setViewTab] = useState('patients');
  const [collectionList, setCollectionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [orderFilters, setOrderFilters] = useState(EMPTY_ORDER_FILTERS);
  const [editTest, setEditTest] = useState(null);
  const [viewTest, setViewTest] = useState(null);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrders({ category: 'Lab', destination: 'onsite', limit: 500 });
      const rows = (res?.data || [])
        .filter((o) => OPEN_LAB_ORDER_STATUSES.has(o.status) || !o.status)
        .map(mapOrderToLabRow);
      setCollectionList(rows);
    } catch (err) {
      setCollectionList([]);
      setError(err.message || 'Failed to load lab orders');
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
          .filter((o) => OPEN_LAB_ORDER_STATUSES.has(o.status) || !o.status)
          .map(mapOrderToLabRow);
        if (!cancelled) setCollectionList(rows);
      } catch (err) {
        if (!cancelled) {
          setCollectionList([]);
          setError(err.message || 'Failed to load lab orders');
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
    () => groupOrdersByPatient(collectionList, 'createdAt'),
    [collectionList]
  );

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
    return collectionList.filter((row) => {
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
      if (orderFilters.specimenType && row.specimenType !== orderFilters.specimenType) {
        return false;
      }
      return true;
    });
  }, [collectionList, orderFilters]);

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
    navigate(`/laboratory-management/specimen-collection/patient/${patientId}`);
  };

  const handlePrintBarcodes = (group) => {
    const ids = group.tests.map((t) => t.id).join(',');
    navigate(`/laboratory-management/specimen-collection/labels?specimenIds=${ids}`);
  };

  const handleClearOrderFilters = () => setOrderFilters(EMPTY_ORDER_FILTERS);

  const handleSaved = async () => {
    setEditTest(null);
    await loadCollection();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Specimen Collection</h1>
        <p className="text-muted-foreground">Manage specimen collection and tracking</p>
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
                label: 'Patient Info',
                render: (group) => (
                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground">
                      MRN: {group.patient?.mrn ?? '-'}
                    </div>
                    <div className="font-medium">{group.patient?.name ?? '-'}</div>
                  </div>
                ),
              },
              {
                key: 'dobGenderAge',
                label: 'DOB / Gender / Age',
                render: (group) => (
                  <div className="text-sm text-muted-foreground">
                    {group.patient?.dob ?? '-'} / {group.patient?.gender ?? '-'} /{' '}
                    {formatAgeDisplay(group.patient?.dateOfBirth)}
                  </div>
                ),
              },
              {
                key: 'specimenStatus',
                label: 'Specimen Status',
                render: (group) => {
                  const statuses = [
                    ...new Set((group.tests || []).map((t) => t.specimenStatus).filter(Boolean)),
                  ];
                  if (!statuses.length) {
                    return <span className="text-sm text-muted-foreground">-</span>;
                  }
                  return (
                    <div className="flex flex-wrap gap-1">
                      {statuses.map((status) => (
                        <span
                          key={status}
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getLabStatusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                      ))}
                    </div>
                  );
                },
              },
              {
                key: 'labOrder',
                label: 'Lab Order',
                render: (group) => (
                  <div className="text-sm">
                    Total lab orders: <span className="font-medium">{group.totalOrders}</span>
                  </div>
                ),
              },
              {
                key: 'lastUpdated',
                label: 'Last Updated',
                render: (group) => (
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(group.lastUpdated)}
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
            emptyMessage={loading ? 'Loading lab orders...' : 'No lab orders found'}
            actions={(group) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetail(group.patientId)}
                  className="h-8 w-8 p-0"
                  title="View order detail"
                >
                  <Eye className="h-4 w-4 icon-action-view" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePrintBarcodes(group)}
                  className="h-8 w-8 p-0"
                  title="Print barcodes for lab order"
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
                className="w-[180px]"
              />
              <Input
                placeholder="Test Name"
                value={orderFilters.testName}
                onChange={(e) => setOrderFilters((f) => ({ ...f, testName: e.target.value }))}
                className="w-[180px]"
              />
              <Select
                value={orderFilters.specimenStatus || '_'}
                onValueChange={(v) =>
                  setOrderFilters((f) => ({ ...f, specimenStatus: v === '_' ? '' : v }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Specimen Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={orderFilters.specimenType || '_'}
                onValueChange={(v) =>
                  setOrderFilters((f) => ({ ...f, specimenType: v === '_' ? '' : v }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Specimen Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">All</SelectItem>
                  {SPECIMEN_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
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
                    <TableHead>DOB / Gender / Age</TableHead>
                    <TableHead>Test Information</TableHead>
                    <TableHead>Specimen Status</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {row.patient?.dob ?? '-'} / {row.patient?.gender ?? '-'} /{' '}
                          {formatAgeDisplay(row.patient?.dateOfBirth)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium">{row.testName}</div>
                            <div className="text-sm text-muted-foreground">
                              Test ID: {row.testId}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Test Status: {row.resultStatus || 'Ordered'}
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
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(row.orderDateTime)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewTest(row)}
                              title="View"
                            >
                              <Eye className="h-4 w-4 icon-action-view" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditTest(row)}
                              title={
                                row.specimenStatus === 'Pending'
                                  ? 'Add Specimen Collection'
                                  : 'Edit Specimen'
                              }
                            >
                              {row.specimenStatus === 'Pending' ? (
                                <Plus className="h-4 w-4 icon-action-edit" />
                              ) : (
                                <Edit className="h-4 w-4 icon-action-edit" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/laboratory-management/specimen-collection/labels?specimenId=${row.id}&count=1`
                                )
                              }
                              title="Print Barcode"
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
        <EditSpecimenDialog
          open={!!editTest}
          onOpenChange={(open) => !open && setEditTest(null)}
          labTest={editTest}
          onSaved={handleSaved}
        />
      )}

      {viewTest && (
        <ViewSpecimenDialog
          open={!!viewTest}
          onOpenChange={(open) => !open && setViewTest(null)}
          labTest={viewTest}
        />
      )}
    </div>
  );
}
