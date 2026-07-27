import { useCallback, useEffect, useState } from 'react';
import { Camera, Check, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadiologyStudyFormDialog } from '@/components/radiology/RadiologyStudyFormDialog';
import { RADIOLOGY_MODALITY_OPTIONS } from '@/components/radiology/radiologyStudyConstants';
import { radiologyStudyApi } from '@/services/api';

function auditUserLabel(user) {
  if (!user) return '—';
  return user.name || user.email || '—';
}

function formatAuditDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const STATUS_FILTER_ALL = 'all';

export function RadiologyMasterPage() {
  const [studies, setStudies] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [debouncedBodyPart, setDebouncedBodyPart] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(nameFilter), 400);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCode(codeFilter), 400);
    return () => clearTimeout(timer);
  }, [codeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBodyPart(bodyPartFilter), 400);
    return () => clearTimeout(timer);
  }, [bodyPartFilter]);

  const fetchStudies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedName.trim()) params.name = debouncedName.trim();
      if (debouncedCode.trim()) params.code = debouncedCode.trim();
      if (modalityFilter) params.modality = modalityFilter;
      if (debouncedBodyPart.trim()) params.bodyPart = debouncedBodyPart.trim();
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;
      if (createdFrom) params.createdFrom = createdFrom;
      if (createdTo) params.createdTo = createdTo;

      const response = await radiologyStudyApi.getAll(params);
      setStudies(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setStudies([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedName,
    debouncedCode,
    modalityFilter,
    debouncedBodyPart,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedStudy(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openStudy = async (study, mode) => {
    try {
      const response = await radiologyStudyApi.getById(study.id);
      setSelectedStudy(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load radiology study');
    }
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedStudy) {
        await radiologyStudyApi.update(selectedStudy.id, data);
      } else {
        await radiologyStudyApi.create(data);
      }
      setIsFormOpen(false);
      fetchStudies();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (study) => {
    setSelectedStudy(study);
    setDeleteMessage(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudy?.id) return;
    setIsSubmitting(true);
    try {
      const response = await radiologyStudyApi.delete(selectedStudy.id);
      setDeleteMessage(response.message || null);
      setIsDeleteOpen(false);
      fetchStudies();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Radiology Name', cellClassName: 'font-medium' },
    { key: 'code', label: 'Radiology Code', cellClassName: 'font-mono text-sm' },
    { key: 'modality', label: 'Modality' },
    {
      key: 'bodyPart',
      label: 'Body Part',
      render: (row) => row.bodyPart || '—',
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
    {
      key: 'createdBy',
      label: 'Created By',
      render: (row) => auditUserLabel(row.creator),
    },
    {
      key: 'createdAt',
      label: 'Created Date & Time',
      render: (row) => formatAuditDate(row.createdAt),
    },
    {
      key: 'updatedBy',
      label: 'Updated By',
      render: (row) => auditUserLabel(row.updater),
    },
    {
      key: 'updatedAt',
      label: 'Updated Date & Time',
      render: (row) => formatAuditDate(row.updatedAt),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Camera className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Radiology Master</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Manage radiology and imaging studies available for selection when placing orders from the
            Patient Dashboard.
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Radiology Study
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Search &amp; Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="radiology-name-filter">Radiology Name</Label>
            <Input
              id="radiology-name-filter"
              value={nameFilter}
              onChange={(e) => handleFilterChange(setNameFilter)(e.target.value)}
              placeholder="Search by name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-code-filter">Radiology Code</Label>
            <Input
              id="radiology-code-filter"
              value={codeFilter}
              onChange={(e) => handleFilterChange(setCodeFilter)(e.target.value)}
              placeholder="Search by code..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-modality-filter">Modality</Label>
            <Select
              value={modalityFilter || STATUS_FILTER_ALL}
              onValueChange={(value) =>
                handleFilterChange(setModalityFilter)(value === STATUS_FILTER_ALL ? '' : value)
              }
            >
              <SelectTrigger id="radiology-modality-filter" aria-label="Filter by modality">
                <SelectValue placeholder="All modalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All modalities</SelectItem>
                {RADIOLOGY_MODALITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-body-part-filter">Body Part</Label>
            <Input
              id="radiology-body-part-filter"
              value={bodyPartFilter}
              onChange={(e) => handleFilterChange(setBodyPartFilter)(e.target.value)}
              placeholder="Filter by body part..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange(setStatusFilter)(value)}
            >
              <SelectTrigger id="radiology-status-filter" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-created-from">Created From</Label>
            <Input
              id="radiology-created-from"
              type="date"
              value={createdFrom}
              onChange={(e) => handleFilterChange(setCreatedFrom)(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiology-created-to">Created To</Label>
            <Input
              id="radiology-created-to"
              type="date"
              value={createdTo}
              onChange={(e) => handleFilterChange(setCreatedTo)(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {deleteMessage && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {deleteMessage}
        </div>
      )}

      <DataTable
        columns={columns}
        data={studies}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        isLoading={isLoading}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onPageSizeChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        getRowId={(row) => row.id}
        hideToolbar
        emptyMessage="No radiology studies found"
        actions={(study) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openStudy(study, 'view')} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => openStudy(study, 'edit')} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(study)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <RadiologyStudyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        study={selectedStudy}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        mode={formMode}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[520px] max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Radiology Study</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{selectedStudy?.name}</span>? If this study has been
              used in patient orders, it will be marked inactive instead of permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
