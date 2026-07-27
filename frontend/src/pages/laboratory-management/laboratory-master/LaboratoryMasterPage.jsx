import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, Eye, FlaskConical } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LabTestFormDialog } from '@/components/laboratory/LabTestFormDialog';
import { labTestApi } from '@/services/api';
import { LAB_TEST_CATEGORIES, SPECIMEN_TYPES } from '@/lib/labConstants';

function auditUserLabel(user) {
  if (!user) return '—';
  return user.name || user.email || '—';
}

function formatAuditDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const STATUS_BADGE = (isActive) =>
  isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
      <Check className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
      <X className="h-3 w-3" />
      Inactive
    </span>
  );

const COLUMNS = [
  { key: 'name', label: 'Lab Name', cellClassName: 'font-medium' },
  { key: 'code', label: 'Lab Code', cellClassName: 'font-mono text-xs' },
  { key: 'category', label: 'Category' },
  { key: 'specimenType', label: 'Specimen Type' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => STATUS_BADGE(row.isActive),
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

export function LaboratoryMasterPage() {
  const [labTests, setLabTests] = useState([]);
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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [specimenFilter, setSpecimenFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(nameFilter), 400);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCode(codeFilter), 400);
    return () => clearTimeout(timer);
  }, [codeFilter]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState('create');

  const fetchLabTests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedName.trim()) params.name = debouncedName.trim();
      if (debouncedCode.trim()) params.code = debouncedCode.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (specimenFilter) params.specimenType = specimenFilter;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;
      if (createdFrom) params.createdFrom = createdFrom;
      if (createdTo) params.createdTo = createdTo;

      const response = await labTestApi.getAll(params);
      setLabTests(response.data);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedName,
    debouncedCode,
    categoryFilter,
    specimenFilter,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  const handlePageChange = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedLabTest(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openLabTest = async (labTest, mode) => {
    try {
      const response = await labTestApi.getById(labTest.id);
      setSelectedLabTest(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load laboratory test');
    }
  };

  const handleView = (labTest) => openLabTest(labTest, 'view');
  const handleEdit = (labTest) => openLabTest(labTest, 'edit');

  const handleDelete = (labTest) => {
    setSelectedLabTest(labTest);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedLabTest) {
        await labTestApi.update(selectedLabTest.id, data);
      } else {
        await labTestApi.create(data);
      }
      setIsFormOpen(false);
      fetchLabTests();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      const result = await labTestApi.delete(selectedLabTest.id);
      setIsDeleteOpen(false);
      fetchLabTests();
      if (result?.message) {
        alert(result.message);
      }
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
          <div className="flex items-center gap-2 text-primary">
            <FlaskConical className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold text-foreground">Laboratory Master</h1>
          </div>
          <p className="text-muted-foreground">
            Manage laboratory tests available for patient orders
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Laboratory Test
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Search &amp; Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="lab-name-filter">Lab Name</Label>
            <Input
              id="lab-name-filter"
              value={nameFilter}
              onChange={(e) => handleFilterChange(setNameFilter)(e.target.value)}
              placeholder="Search by lab name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-code-filter">Lab Code</Label>
            <Input
              id="lab-code-filter"
              value={codeFilter}
              onChange={(e) => handleFilterChange(setCodeFilter)(e.target.value)}
              placeholder="Search by lab code..."
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-category-filter">Category</Label>
            <Select
              value={categoryFilter || 'all'}
              onValueChange={(value) =>
                handleFilterChange(setCategoryFilter)(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger id="lab-category-filter">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {LAB_TEST_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-specimen-filter">Specimen Type</Label>
            <Select
              value={specimenFilter || 'all'}
              onValueChange={(value) =>
                handleFilterChange(setSpecimenFilter)(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger id="lab-specimen-filter">
                <SelectValue placeholder="All specimen types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All specimen types</SelectItem>
                {SPECIMEN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange(setStatusFilter)(value)}
            >
              <SelectTrigger id="lab-status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-created-from">Created From</Label>
            <Input
              id="lab-created-from"
              type="date"
              value={createdFrom}
              onChange={(e) => handleFilterChange(setCreatedFrom)(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-created-to">Created To</Label>
            <Input
              id="lab-created-to"
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

      <DataTable
        columns={COLUMNS}
        data={labTests}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        emptyMessage="No laboratory tests found."
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleView(row)}
              aria-label="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(row)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(row)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <LabTestFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        labTest={selectedLabTest}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        mode={formMode}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Laboratory Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedLabTest?.name}&quot;? If this test has
              been used in patient orders, it will be marked as inactive instead of being permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
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
