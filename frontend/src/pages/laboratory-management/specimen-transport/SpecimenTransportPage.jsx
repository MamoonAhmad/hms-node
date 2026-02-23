import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Eye, Printer } from 'lucide-react';
import { labApi } from '@/services/api';

function calcAge(dob) {
  if (!dob) return '-';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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

export function SpecimenTransportPage() {
  const navigate = useNavigate();
  const [transportList, setTransportList] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const groupedByPatient = useMemo(() => {
    const byPatient = new Map();
    transportList.forEach((row) => {
      const pid = row.patientId;
      if (!byPatient.has(pid)) {
        byPatient.set(pid, {
          patientId: pid,
          patient: row.patient,
          tests: [],
        });
      }
      byPatient.get(pid).tests.push(row);
    });
    return Array.from(byPatient.values()).map((g) => ({
      ...g,
      totalOrders: g.tests.length,
      lastUpdated: g.tests.reduce(
        (max, t) => (t.transportTimestamp && (!max || new Date(t.transportTimestamp) > new Date(max)) ? t.transportTimestamp : t.createdAt && (!max || new Date(t.createdAt) > new Date(max)) ? t.createdAt : max),
        null
      ),
    }));
  }, [transportList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groupedByPatient;
    return groupedByPatient.filter(
      (g) =>
        (g.patient?.name || '').toLowerCase().includes(q) ||
        (g.patient?.mrn || '').toLowerCase().includes(q)
    );
  }, [groupedByPatient, search]);

  const total = filtered.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => filtered.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [filtered, currentPage, pagination.limit]
  );

  useEffect(() => {
    labApi.getTransportList({}).then(({ data }) => setTransportList(data || []));
  }, []);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleViewDetail = (patientId) => {
    navigate(`/laboratory-management/specimen-transport/patient/${patientId}`);
  };

  const handlePrintBarcodes = (group) => {
    const ids = group.tests.map((t) => t.id).join(',');
    navigate(`/laboratory-management/specimen-collection/labels?specimenIds=${ids}`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Specimen Transport</h1>
        <p className="text-muted-foreground">Manage specimen transport and logistics</p>
      </div>

      <DataTable
        columns={[
          {
            key: 'patientInfo',
            label: 'Patient Info',
            render: (group) => (
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">MRN: {group.patient?.mrn ?? '-'}</div>
                <div className="font-medium">{group.patient?.name ?? '-'}</div>
                <div className="text-sm text-muted-foreground">
                  {group.patient?.gender ?? '-'} · {calcAge(group.patient?.dob)} yrs
                </div>
              </div>
            ),
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
            render: (group) => <span className="text-sm text-muted-foreground">{formatDateTime(group.lastUpdated)}</span>,
          },
        ]}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.patientId}
        searchPlaceholder="Search by patient name or MRN..."
        emptyMessage="No lab orders found"
        actions={(group) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(group.patientId)} className="h-8 w-8 p-0" title="View order detail">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handlePrintBarcodes(group)} className="h-8 w-8 p-0" title="Print barcodes for lab order">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
