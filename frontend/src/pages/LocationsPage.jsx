import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LocationFormDialog } from '@/components/locations/LocationFormDialog';
import { DeleteLocationDialog } from '@/components/locations/DeleteLocationDialog';
import { locationApi, tenantApi } from '@/services/api';

function formatCityStateCountry(location) {
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.country) parts.push(location.country);
  return parts.length > 0 ? parts.join(', ') : '-';
}

const COLUMNS = [
  { key: '_srNo', label: 'Sr No', render: (row) => row._srNo },
  {
    key: 'name',
    label: 'Name',
    cellClassName: 'font-medium',
    render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: 'tenant',
    label: 'Tenant',
    render: (row) => row.tenant?.name ?? <span className="text-muted-foreground">-</span>,
  },
  {
    key: 'address',
    label: 'Address',
    render: (row) => row.address ?? <span className="text-muted-foreground">-</span>,
  },
  {
    key: 'location',
    label: 'City / Region',
    render: (row) => {
      const fc = formatCityStateCountry(row);
      return fc !== '-' ? (
        <span className="text-sm">{fc}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    key: 'phone',
    label: 'Phone',
    render: (row) => row.phone ?? <span className="text-muted-foreground">-</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) =>
      row.isActive ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          <Check className="h-3 w-3" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
          <X className="h-3 w-3" />
          Inactive
        </span>
      ),
  },
];

export function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [tenants, setTenants] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await tenantApi.getAll({ limit: 100, isActive: true });
        setTenants(response.data || []);
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      }
    };
    fetchTenants();
  }, []);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (statusFilter !== '') params.isActive = statusFilter;
      if (tenantFilter) params.tenantId = tenantFilter;

      const response = await locationApi.getAll(params);
      setLocations(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, tenantFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const tableData = useMemo(
    () =>
      locations.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [locations, pagination.page, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleStatusChange = (value) => {
    setStatusFilter(value === 'all' ? '' : value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTenantChange = (value) => {
    setTenantFilter(value === 'all' ? '' : value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedLocation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = (location) => {
    setSelectedLocation(location);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedLocation) {
        await locationApi.update(selectedLocation.id, data);
      } else {
        await locationApi.create(data);
      }
      setIsFormOpen(false);
      fetchLocations();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocation?.id) return;
    setIsSubmitting(true);
    try {
      await locationApi.delete(selectedLocation.id);
      setIsDeleteOpen(false);
      fetchLocations();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground">Manage facility locations and tenant linkage.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={tenantFilter || 'all'} onValueChange={handleTenantChange}>
          <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filter by tenant">
            <SelectValue placeholder="All tenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={String(tenant.id)}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        data={tableData}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name, city, state, or country..."
        emptyMessage="No locations found"
        actions={(location) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(location)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(location)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <LocationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        location={selectedLocation}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <DeleteLocationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        location={selectedLocation}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
}
