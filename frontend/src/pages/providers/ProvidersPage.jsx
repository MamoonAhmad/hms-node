import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ProviderFormDialog } from '@/components/providers/ProviderFormDialog';

const mockProviders = [
  {
    id: 1,
    serialNum: 1,
    npi: '1234567890',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Smith',
    email: 'john.smith@hospital.com',
    phone: '(555) 123-4567',
    specialty: 'Cardiology',
    status: 'Active',
  },
  {
    id: 2,
    serialNum: 2,
    npi: '0987654321',
    firstName: 'Sarah',
    middleName: '',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    phone: '(555) 234-5678',
    specialty: 'Pediatrics',
    status: 'Active',
  },
];

const COLUMNS = [
  { key: 'serialNum', label: 'Serial Num' },
  { key: 'npi', label: 'Provider NPI', cellClassName: 'font-mono text-xs' },
  {
    key: 'name',
    label: 'Provider Name',
    cellClassName: 'font-medium',
    render: (row) =>
      `${row.firstName || ''} ${row.middleName ? `${row.middleName} ` : ''}${row.lastName || ''}`.trim() || '-',
  },
  { key: 'email', label: 'Provider Email' },
  { key: 'phone', label: 'Provider Phone' },
  { key: 'specialty', label: 'Specialty' },
];

export function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setProviders(mockProviders);
      setIsLoading(false);
    }, 500);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        (p.npi && p.npi.toLowerCase().includes(q)) ||
        `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.specialty && p.specialty.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q))
    );
  }, [providers, search]);

  const total = filtered.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () =>
      filtered
        .slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit)
        .map((row, i) => ({ ...row, _srNo: (currentPage - 1) * pagination.limit + i + 1 })),
    [filtered, currentPage, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      console.log('Provider data:', data);
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columnsWithSrNo = [
    { key: '_srNo', label: 'Serial Num', render: (row) => row._srNo },
    ...COLUMNS.filter((c) => c.key !== 'serialNum'),
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Providers Management</h1>
          <p className="text-muted-foreground">Manage healthcare providers</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={columnsWithSrNo}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by NPI, name, email, or specialty..."
        emptyMessage="No providers found"
      />

      <ProviderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
