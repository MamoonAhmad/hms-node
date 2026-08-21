import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChargeMasterFormDialog } from './ChargeMasterFormDialog';
import { CatalogStatusBadge, YesNoBadge } from '@/components/rcm/CatalogStatusBadge';
import { chargeMasterApi } from '@/services/api';
import { CPT_CODE_TYPES } from '@/lib/codeCatalog';

export function ChargeMasterPage() {
  const [charges, setCharges] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [codeTypeFilter, setCodeTypeFilter] = useState('all');
  const [billableFilter, setBillableFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCharges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chargeMasterApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter,
        codeType: codeTypeFilter !== 'all' ? codeTypeFilter : undefined,
        isBillable: billableFilter === 'all' ? undefined : billableFilter === 'yes',
        includeNonBillable: billableFilter === 'yes' ? undefined : 'true',
      });
      setCharges(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setCharges([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, codeTypeFilter, billableFilter]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const rows = useMemo(
    () =>
      charges.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [charges, pagination.page, pagination.limit],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const openRecord = async (record, mode) => {
    try {
      const response = await chargeMasterApi.getById(record.id);
      setSelectedCharge(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load charge master entry');
    }
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedCharge?.id) {
        await chargeMasterApi.update(selectedCharge.id, data);
      } else {
        await chargeMasterApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedCharge(null);
      fetchCharges();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCharge) return;
    setIsSubmitting(true);
    try {
      await chargeMasterApi.delete(selectedCharge.id);
      setIsDeleteOpen(false);
      setSelectedCharge(null);
      fetchCharges();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Charge Master</h1>
          <p className="text-muted-foreground mt-1">
            Facility fee schedule used for charge capture, claims, and self-pay pricing.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedCharge(null);
            setFormMode('create');
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Charge
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium">Filters</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Code type</Label>
            <Select
              value={codeTypeFilter}
              onValueChange={(value) => {
                setCodeTypeFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {CPT_CODE_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Billable</Label>
            <Select
              value={billableFilter}
              onValueChange={(value) => {
                setBillableFilter(value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Billable</SelectItem>
                <SelectItem value="no">Not billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={[
          { key: '_srNo', label: 'Sr.', render: (row) => row._srNo },
          { key: 'cptCode', label: 'CPT / HCPCS', cellClassName: 'font-mono font-medium' },
          { key: 'description', label: 'Description' },
          { key: 'revenueCode', label: 'Rev', render: (row) => row.revenueCode || '—' },
          {
            key: 'standardAmount',
            label: 'Standard $',
            render: (row) => (row.standardAmount != null ? `$${Number(row.standardAmount).toFixed(2)}` : '—'),
          },
          {
            key: 'cashPrice',
            label: 'Cash $',
            render: (row) => (row.cashPrice != null ? `$${Number(row.cashPrice).toFixed(2)}` : '—'),
          },
          { key: 'location', label: 'Location', render: (row) => row.location || '—' },
          {
            key: 'isBillable',
            label: 'Billable',
            render: (row) => <YesNoBadge value={row.isBillable !== false} />,
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <CatalogStatusBadge isActive={row.isActive} />,
          },
        ]}
        data={rows}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search CPT, charge code, description, or location..."
        emptyMessage="No charge master entries found"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openRecord(row, 'view')} title="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => openRecord(row, 'edit')} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedCharge(row);
                setIsDeleteOpen(true);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ChargeMasterFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedCharge(null);
        }}
        charge={formMode === 'create' ? null : selectedCharge}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete charge master entry</DialogTitle>
            <DialogDescription>
              Delete {selectedCharge?.cptCode || 'this charge'}? It will be removed from charge capture.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
