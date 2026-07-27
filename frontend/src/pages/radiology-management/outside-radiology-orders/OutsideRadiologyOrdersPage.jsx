import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Eye, Printer } from 'lucide-react';
import { orderApi } from '@/services/api';
import {
  mapOrderToRadiologyRow,
  groupOrdersByPatient,
} from '@/lib/orderWorklist';

function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function OutsideRadiologyOrdersPage() {
  const navigate = useNavigate();
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderApi.getOrders({ category: 'Radiology', destination: 'external', limit: 500 });
        const mapped = (res?.data || [])
          .filter((o) => o.status !== 'Cancelled')
          .map(mapOrderToRadiologyRow);
        if (!cancelled) setAllRows(groupOrdersByPatient(mapped, 'orderDateTime'));
      } catch (err) {
        if (!cancelled) {
          setAllRows([]);
          setError(err.message || 'Failed to load outside radiology orders');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        (r.patient?.name || '').toLowerCase().includes(q) ||
        (r.patient?.mrn || '').toLowerCase().includes(q) ||
        (r.patient?.gender || '').toLowerCase().includes(q)
    );
  }, [allRows, search]);

  const total = filtered.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => filtered.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [filtered, currentPage, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleViewDetail = (patientId) => {
    navigate(`/radiology-management/outside-radiology-orders/patient/${patientId}`);
  };

  const handlePrintBarcode = (patientId) => {
    navigate(`/radiology-management/patient/${patientId}/labels`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Outside radiology orders</h1>
      <p className="text-muted-foreground">External radiology orders from patient encounters</p>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
                      {r.patient?.gender || '-'} · DOB: {r.patient?.dob || '-'} · MRN: {r.patient?.mrn || '-'}
                    </div>
                  </div>
                ),
              },
              { key: 'totalOrders', label: 'Total Orders', render: (r) => r.totalOrders },
              { key: 'createdAt', label: 'Created At', cellClassName: 'text-muted-foreground', render: (r) => formatDateTime(r.createdAt) },
            ]}
            data={rows}
            total={total}
            page={currentPage}
            pageSize={pagination.limit}
            searchValue={search}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            getRowId={(r) => r.patientId}
            searchPlaceholder="Search by patient name or MRN..."
            emptyMessage={loading ? 'Loading...' : 'No orders'}
            actions={(r) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View detail" onClick={() => handleViewDetail(r.patientId)}>
                  <Eye className="h-4 w-4 icon-action-view" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Print barcode" onClick={() => handlePrintBarcode(r.patientId)}>
                  <Printer className="h-4 w-4 icon-action-print" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
