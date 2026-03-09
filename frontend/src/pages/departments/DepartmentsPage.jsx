import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { DepartmentFormDialog } from '@/components/departments/DepartmentFormDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Mock data - replace with actual API call
const mockDepartments = [
  {
    id: 1,
    departmentName: 'Cardiology',
    departmentCode: 'CARD-001',
    departmentType: 'Specialty',
    facilityName: 'Main Hospital',
    status: 'Active',
    departmentHead: 'Dr. John Smith',
    assignedProviders: 5,
    operatingHours: '8:00 AM - 5:00 PM',
  },
  {
    id: 2,
    departmentName: 'General Medicine',
    departmentCode: 'GEN-001',
    departmentType: 'General',
    facilityName: 'Main Hospital',
    status: 'Active',
    departmentHead: 'Dr. Sarah Johnson',
    assignedProviders: 8,
    operatingHours: '9:00 AM - 6:00 PM',
  },
];

const DEPARTMENT_COLUMNS = [
  { key: 'departmentName', label: 'Department Name', cellClassName: 'font-medium' },
  { key: 'departmentCode', label: 'Department Code', cellClassName: 'font-mono text-xs' },
  { key: 'departmentType', label: 'Department Type' },
  { key: 'facilityName', label: 'Facility / Clinic Name' },
  {
    key: 'status',
    label: 'Status',
    render: (row) =>
      row.status === 'Active' ? (
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
  { key: 'departmentHead', label: 'Department Head' },
  { key: 'assignedProviders', label: 'Assigned Providers' },
  { key: 'operatingHours', label: 'Operating Hours' },
];

export function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('departmentName');
  const [sortOrder, setSortOrder] = useState('asc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setDepartments(mockDepartments);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredAndSortedDepartments = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return [...departments]
      .filter(
        (dept) =>
          !searchLower ||
          dept.departmentName?.toLowerCase().includes(searchLower) ||
          dept.departmentCode?.toLowerCase().includes(searchLower) ||
          dept.departmentType?.toLowerCase().includes(searchLower) ||
          dept.facilityName?.toLowerCase().includes(searchLower) ||
          dept.status?.toLowerCase().includes(searchLower) ||
          dept.departmentHead?.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        if (typeof aVal === 'string') {
          aVal = (aVal ?? '').toLowerCase();
          bVal = (bVal ?? '').toLowerCase();
        }
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
  }, [departments, search, sortBy, sortOrder]);

  const total = filteredAndSortedDepartments.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const paginatedDepartments = useMemo(
    () =>
      filteredAndSortedDepartments.slice(
        (currentPage - 1) * pagination.limit,
        currentPage * pagination.limit
      ),
    [filteredAndSortedDepartments, currentPage, pagination.limit]
  );

  const handleSearch = (keyword) => {
    setSearch(keyword);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (value) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };
  const sortValue = `${sortBy}-${sortOrder}`;

  const handleCreate = () => {
    setSelectedDepartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = (department) => {
    setSelectedDepartment(department);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call
      console.log('Department data:', data);
      setIsFormOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call
      setIsDeleteOpen(false);
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
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage outpatient departments</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortValue} onValueChange={handleSort}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="departmentName-asc">Department Name (A–Z)</SelectItem>
              <SelectItem value="departmentName-desc">Department Name (Z–A)</SelectItem>
              <SelectItem value="status-asc">Status (A–Z)</SelectItem>
              <SelectItem value="status-desc">Status (Z–A)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={DEPARTMENT_COLUMNS}
        data={paginatedDepartments}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name, code, type, facility, status..."
        emptyMessage="No departments found"
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleEdit(row)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4 icon-action-edit" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(row)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 icon-action-delete" />
            </Button>
          </div>
        )}
      />

      <DepartmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        department={selectedDepartment}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{selectedDepartment?.departmentName}</span>?
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
