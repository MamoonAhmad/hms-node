import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { providerApi, providerBlockHourApi } from '@/services/api';
import { DAYS_FILTER_OPTIONS } from '@/lib/providerScheduleUtils';
import { formatDateRange, formatTimeSlot, buildBlockPayload } from '@/lib/providerBlockHourUtils';
import { BlockHoursFormDialog } from './BlockHoursFormDialog';
import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';

const BLOCK_COLUMNS = [
  { key: 'providerName', label: 'Provider Name', cellClassName: 'font-medium' },
  {
    key: 'dateRange',
    label: 'Date Range',
    render: (row) => formatDateRange(row.effectiveStartDate, row.effectiveEndDate),
  },
  { key: 'days', label: 'Days', render: (row) => (row.days || []).join(', ') || '-' },
  { key: 'timeSlot', label: 'Time Range', render: (row) => formatTimeSlot(row.startTime, row.endTime) },
  { key: 'reason', label: 'Reason', render: (row) => row.reason || '-' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
        {row.status}
      </Badge>
    ),
  },
];

export function BlockHoursPage() {
  const { departmentId } = useTopbarDepartment();
  const [blocks, setBlocks] = useState([]);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({ providerId: '', days: [], status: '' });
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [formMode, setFormMode] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBlocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await providerBlockHourApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        providerId: filters.providerId || undefined,
        departmentId: departmentId || undefined,
        days: filters.days.length ? filters.days : undefined,
        status: filters.status || undefined,
      });
      setBlocks(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total ?? 0,
        totalPages: response.pagination?.totalPages ?? 0,
      }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load block hours' });
      setBlocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, search, departmentId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [filters, search, departmentId]);

  useEffect(() => {
    providerApi.getAll({ limit: 500, departmentId: departmentId || undefined }).then((res) => {
      setProviders(
        (res.data || []).map((p) => ({
          id: p.id,
          name: [p.firstName, p.lastName].filter(Boolean).join(' '),
          npi: p.npi || '',
        })),
      );
    }).catch(() => setProviders([]));
  }, [departmentId]);

  const providerOptions = useMemo(
    () => providers.map((p) => ({ value: p.id, label: p.name })),
    [providers],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const openForm = (mode, block = null) => {
    setSelectedBlock(block);
    setFormMode(mode);
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedBlock(null);
  };

  const handleToggleStatus = async (block) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerBlockHourApi.toggleStatus(block.id);
      setMessage({ type: 'success', text: 'Block status updated' });
      fetchBlocks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBlock) return;
    setIsDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerBlockHourApi.delete(selectedBlock.id);
      setMessage({ type: 'success', text: 'Block deleted' });
      setIsDeleteOpen(false);
      setSelectedBlock(null);
      fetchBlocks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = buildBlockPayload(formData);
      if (formMode === 'edit' && selectedBlock) {
        await providerBlockHourApi.update(selectedBlock.id, payload);
        setMessage({ type: 'success', text: 'Block updated' });
      } else {
        await providerBlockHourApi.create(payload);
        setMessage({ type: 'success', text: 'Block added' });
      }
      closeForm();
      fetchBlocks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save block' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Block Hours</h1>
          <p className="text-muted-foreground">Block hours inside a provider&apos;s existing schedule</p>
        </div>
        <Button onClick={() => openForm('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Block Hours
        </Button>
      </div>

      {message.text && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'error'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={filters.providerId || 'all'}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, providerId: v === 'all' ? '' : v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {providerOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Days</Label>
            <MultiSelect
              options={DAYS_FILTER_OPTIONS}
              value={filters.days}
              onChange={(v) => setFilters((prev) => ({ ...prev, days: v }))}
              placeholder="All days"
              className="w-full"
              showSelectAll
              selectAllLabel="All days"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v === 'all' ? '' : v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={BLOCK_COLUMNS}
        data={blocks}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by provider, dates, days, time, reason, status..."
        emptyMessage="No blocks found. Click Add Block Hours to create one."
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openForm('view', row)}
              title="View"
              aria-label="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openForm('edit', row)}
              title="Edit"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToggleStatus(row)}
              disabled={isSubmitting}
              title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
              aria-label={row.status === 'Active' ? 'Deactivate' : 'Activate'}
            >
              <Power
                className={`h-4 w-4 ${
                  row.status === 'Active'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-destructive'
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedBlock(row);
                setIsDeleteOpen(true);
              }}
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <BlockHoursFormDialog
        open={formMode === 'create' || formMode === 'edit' || formMode === 'view'}
        readOnly={formMode === 'view'}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        block={selectedBlock}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Block</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the block hours for{' '}
            <strong>{selectedBlock?.providerName}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
