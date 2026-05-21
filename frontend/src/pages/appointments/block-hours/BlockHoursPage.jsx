import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { providerBlockHoursStore } from './providerBlockHoursMock';
import { BlockHoursFormDialog } from './BlockHoursFormDialog';
import { ViewBlockHoursDialog } from './ViewBlockHoursDialog';

const DAYS_OPTIONS = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

function formatTimeSlot(start, end) {
  if (!start || !end) return '-';
  return `${start} – ${end}`;
}

function formatDateRange(start, end) {
  if (!start && !end) return '-';
  if (start && !end) return `${start} → (no end)`;
  if (!start && end) return `(no start) → ${end}`;
  return `${start} → ${end}`;
}

const BLOCK_COLUMNS = [
  { key: 'providerName', label: 'Provider Name', cellClassName: 'font-medium' },
  { key: 'dateRange', label: 'Date Range', render: (row) => formatDateRange(row.effectiveStartDate, row.effectiveEndDate) },
  { key: 'days', label: 'Days', render: (row) => (row.days || []).join(', ') || '-' },
  { key: 'timeSlot', label: 'Time Range', render: (row) => formatTimeSlot(row.startTime, row.endTime) },
  { key: 'locations', label: 'Locations', render: (row) => (row.locations || []).join(', ') || '-' },
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

function DeleteConfirmDialog({ open, onOpenChange, block, onConfirm, isLoading }) {
  if (!block) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${open ? '' : 'hidden'}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 rounded-lg border bg-background p-6 shadow-lg max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold">Delete Block</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Are you sure you want to delete the block hours for <strong>{block.providerName}</strong>?
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(block)} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BlockHoursPage() {
  const [blocks, setBlocks] = useState([]);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({ providerId: '', day: '', status: '' });
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBlocks = useCallback(() => {
    setIsLoading(true);
    providerBlockHoursStore
      .getBlocks(filters)
      .then((data) => {
        setBlocks(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [filters]);

  useEffect(() => {
    providerBlockHoursStore.getProviders(false).then(setProviders);
  }, []);

  const filteredBySearch = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return blocks;
    return blocks.filter((row) => {
      const providerName = (row.providerName || '').toLowerCase();
      const days = (row.days || []).join(' ').toLowerCase();
      const time = `${row.startTime || ''} ${row.endTime || ''}`.toLowerCase();
      const dates = `${row.effectiveStartDate || ''} ${row.effectiveEndDate || ''}`.toLowerCase();
      const locations = (row.locations || []).join(' ').toLowerCase();
      const reason = (row.reason || '').toLowerCase();
      const status = (row.status || '').toLowerCase();
      return (
        providerName.includes(q) ||
        days.includes(q) ||
        time.includes(q) ||
        dates.includes(q) ||
        locations.includes(q) ||
        reason.includes(q) ||
        status.includes(q)
      );
    });
  }, [blocks, search]);

  const total = filteredBySearch.length;
  const currentPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, Math.ceil(total / pagination.limit))
  );
  const paginatedBlocks = useMemo(
    () => filteredBySearch.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [filteredBySearch, currentPage, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const handleAdd = () => {
    setSelectedBlock(null);
    setIsFormOpen(true);
  };

  const handleEdit = (b) => {
    setSelectedBlock(b);
    setIsFormOpen(true);
  };

  const handleView = (b) => {
    setSelectedBlock(b);
    setIsViewOpen(true);
  };

  const handleToggleStatus = async (b) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerBlockHoursStore.toggleBlockStatus(b.id);
      setMessage({ type: 'success', text: 'Block status updated' });
      fetchBlocks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (b) => {
    setSelectedBlock(b);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async (b) => {
    setIsDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      await providerBlockHoursStore.deleteBlock(b.id);
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

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (selectedBlock) {
        await providerBlockHoursStore.updateBlock(selectedBlock.id, data);
        setMessage({ type: 'success', text: 'Block updated' });
      } else {
        await providerBlockHoursStore.createBlock(data);
        setMessage({ type: 'success', text: 'Block added' });
      }
      setIsFormOpen(false);
      setSelectedBlock(null);
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
          <p className="text-muted-foreground">Block hours inside a provider’s existing schedule</p>
        </div>
        <Button onClick={handleAdd}>
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
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Day</Label>
            <Select
              value={filters.day || 'all'}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, day: v === 'all' ? '' : v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {DAYS_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        data={paginatedBlocks}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by provider, dates, days, time, locations, reason, status..."
        emptyMessage="No blocks found. Click Add Block Hours to create one."
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(row)} title="View" aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row)} title="Edit" aria-label="Edit">
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
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDeleteClick(row)}
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <BlockHoursFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        block={selectedBlock}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
      <ViewBlockHoursDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        block={selectedBlock}
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        block={selectedBlock}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}

