import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ProcedureFormDialog } from './ProcedureFormDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Mock data - static data only
const mockProcedures = [
  {
    id: 1,
    procedureDescription: 'Office Visit - Established Patient',
    genericDescription: 'Routine office visit',
    procedureCategoryId: 1,
    category: { id: 1, name: 'Office Visits' },
    procedureDepartment: 'General Medicine',
    cptCode: '99213',
    revenueCode: '0510',
    mod1: '',
    mod2: '',
    mod3: '',
    mod4: '',
  },
  {
    id: 2,
    procedureDescription: 'Complete Blood Count (CBC)',
    genericDescription: 'Laboratory test',
    procedureCategoryId: 2,
    category: { id: 2, name: 'Laboratory' },
    procedureDepartment: 'Lab',
    cptCode: '85025',
    revenueCode: '0300',
    mod1: '',
    mod2: '',
    mod3: '',
    mod4: '',
  },
  {
    id: 3,
    procedureDescription: 'Chest X-Ray',
    genericDescription: 'Radiology procedure',
    procedureCategoryId: 3,
    category: { id: 3, name: 'Radiology' },
    procedureDepartment: 'Radiology',
    cptCode: '71020',
    revenueCode: '0320',
    mod1: '',
    mod2: '',
    mod3: '',
    mod4: '',
  },
];

const mockCategories = [
  { id: 1, name: 'Office Visits' },
  { id: 2, name: 'Laboratory' },
  { id: 3, name: 'Radiology' },
  { id: 4, name: 'Surgery' },
];

const PROCEDURE_COLUMNS = [
  {
    key: 'procedureDescription',
    label: 'Procedure Description',
    cellClassName: 'font-medium',
    render: (row) => row.procedureDescription || row.procedureName,
  },
  { key: 'genericDescription', label: 'Generic Description', render: (row) => row.genericDescription || row.genericName || '-' },
  { key: 'category', label: 'Category', render: (row) => row.category?.name || row.categoryName || '-' },
  { key: 'cptCode', label: 'CPT Code', render: (row) => row.cptCode || row.procedureCode || '-' },
  { key: 'revenueCode', label: 'Revenue Code', render: (row) => row.revenueCode || '-' },
];

export function ProceduresPage() {
  const [procedures, setProcedures] = useState(mockProcedures);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const filteredProcedures = useMemo(() => {
    if (!search.trim()) return procedures;
    const q = search.toLowerCase().trim();
    return procedures.filter(
      (p) =>
        (p.procedureDescription || p.procedureName || '').toLowerCase().includes(q) ||
        (p.genericDescription || p.genericName || '').toLowerCase().includes(q) ||
        (p.category?.name || p.categoryName || '').toLowerCase().includes(q) ||
        (p.cptCode || p.procedureCode || '').toLowerCase().includes(q) ||
        (p.procedureDepartment || p.department || '').toLowerCase().includes(q)
    );
  }, [procedures, search]);

  const total = filteredProcedures.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => filteredProcedures.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [filteredProcedures, currentPage, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleCreate = () => {
    setSelectedProcedure(null);
    setIsFormOpen(true);
  };

  const handleEdit = (procedure) => {
    setSelectedProcedure(procedure);
    setIsFormOpen(true);
  };

  const handleView = (procedure) => {
    setSelectedProcedure(procedure);
    setIsViewModalOpen(true);
  };

  const handleDelete = (procedure) => {
    if (window.confirm(`Are you sure you want to delete this procedure?`)) {
      setProcedures(procedures.filter(p => p.id !== procedure.id));
    }
  };

  const handleFormSubmit = (data) => {
    setIsSubmitting(true);
    // Simulate API call delay
    setTimeout(() => {
      if (selectedProcedure) {
        // Update existing
        setProcedures(procedures.map(p => 
          p.id === selectedProcedure.id 
            ? { ...p, ...data, category: mockCategories.find(c => c.id === data.procedureCategoryId) }
            : p
        ));
      } else {
        // Add new
        const newProcedure = {
          id: Math.max(...procedures.map(p => p.id), 0) + 1,
          ...data,
          category: mockCategories.find(c => c.id === data.procedureCategoryId),
        };
        setProcedures([...procedures, newProcedure]);
      }
      setIsFormOpen(false);
      setSelectedProcedure(null);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Procedure Codes</h1>
          <p className="text-muted-foreground">Manage procedure codes</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Code
        </Button>
      </div>

      <DataTable
        columns={PROCEDURE_COLUMNS}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search procedures..."
        emptyMessage="No procedures found"
        actions={(procedure) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(procedure)} className="h-8 w-8 p-0" title="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(procedure)} className="h-8 w-8 p-0" title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(procedure)} className="h-8 w-8 p-0" title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <ProcedureFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        procedure={selectedProcedure}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Procedure Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Procedure Description</Label>
                <Input
                  value={selectedProcedure?.procedureDescription || selectedProcedure?.procedureName || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Generic Description</Label>
                <Input
                  value={selectedProcedure?.genericDescription || selectedProcedure?.genericName || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Procedure Category</Label>
                <Input
                  value={selectedProcedure?.category?.name || selectedProcedure?.categoryName || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Procedure Department</Label>
                <Input
                  value={selectedProcedure?.procedureDepartment || selectedProcedure?.department || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Procedure/CPT Code</Label>
                <Input
                  value={selectedProcedure?.cptCode || selectedProcedure?.procedureCode || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Revenue Code</Label>
                <Input
                  value={selectedProcedure?.revenueCode || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Mod 1</Label>
                <Input
                  value={selectedProcedure?.mod1 || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Mod 2</Label>
                <Input
                  value={selectedProcedure?.mod2 || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Mod 3</Label>
                <Input
                  value={selectedProcedure?.mod3 || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Mod 4</Label>
                <Input
                  value={selectedProcedure?.mod4 || '-'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


