import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SubSpecialtyFormDialog } from '@/components/providers/SubSpecialtyFormDialog';

const mockSpecialities = [
  { id: 1, name: 'Cardiology', code: 'CARD', isActive: true },
  { id: 2, name: 'Pediatrics', code: 'PED', isActive: true },
];

const mockSubSpecialities = [
  {
    id: 1,
    specialtyId: 1,
    specialty: { id: 1, name: 'Cardiology', code: 'CARD' },
    name: 'Interventional Cardiology',
    code: 'ICARD',
    isActive: true,
  },
  {
    id: 2,
    specialtyId: 2,
    specialty: { id: 2, name: 'Pediatrics', code: 'PED' },
    name: 'General Pediatrics',
    code: 'GPED',
    isActive: true,
  },
];

const COLUMNS = [
  { key: '_srNo', label: 'Sr No', render: (row) => row._srNo },
  {
    key: 'specialty',
    label: 'Parent Speciality Name',
    render: (row) => row.specialty?.name || '-',
    cellClassName: 'font-medium',
  },
  { key: 'name', label: 'Sub Speciality Name', cellClassName: 'font-medium' },
  {
    key: 'status',
    label: 'Speciality Status',
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

export function SubSpecialitiesPage() {
  const [rows, setRows] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // create | edit | view
  const [selected, setSelected] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const t = setTimeout(() => {
      setSpecialties(mockSpecialities);
      setRows(mockSubSpecialities);
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  const tableData = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = !q
      ? rows
      : rows.filter(
          (r) =>
            (r.specialty?.name && r.specialty.name.toLowerCase().includes(q)) ||
            (r.name && r.name.toLowerCase().includes(q)) ||
            (r.code && String(r.code).toLowerCase().includes(q))
        );
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
    const base = (currentPage - 1) * pagination.limit;
    return filtered
      .slice(base, base + pagination.limit)
      .map((r, i) => ({ ...r, _srNo: base + i + 1 }));
  }, [rows, pagination.page, pagination.limit, search]);

  const total = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows.length;
    return rows.filter(
      (r) =>
        (r.specialty?.name && r.specialty.name.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.code && String(r.code).toLowerCase().includes(q))
    ).length;
  }, [rows, search]);

  const handleCreate = () => {
    setSelected(null);
    setFormMode('create');
    setIsFormOpen(true);
  };
  const handleView = (row) => {
    setSelected(row);
    setFormMode('view');
    setIsFormOpen(true);
  };
  const handleEdit = (row) => {
    setSelected(row);
    setFormMode('edit');
    setIsFormOpen(true);
  };
  const handleDelete = (row) => {
    setSelected(row);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selected?.id) {
        const specialty = specialties.find((s) => String(s.id) === String(payload.specialtyId));
        setRows((prev) =>
          prev.map((r) =>
            r.id === selected.id
              ? {
                  ...r,
                  ...payload,
                  specialtyId: payload.specialtyId,
                  specialty: specialty ? { id: specialty.id, name: specialty.name, code: specialty.code } : r.specialty,
                }
              : r
          )
        );
      } else {
        const nextId = Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1;
        const specialty = specialties.find((s) => String(s.id) === String(payload.specialtyId));
        setRows((prev) => [
          {
            ...payload,
            id: nextId,
            specialtyId: payload.specialtyId,
            specialty: specialty ? { id: specialty.id, name: specialty.name, code: specialty.code } : null,
          },
          ...prev,
        ]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      setRows((prev) => prev.filter((r) => r.id !== selected.id));
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sub Specialities</h1>
          <p className="text-muted-foreground">Manage provider sub specialities</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Speciality
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        data={tableData}
        total={total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={(q) => {
          setSearch(q);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        getRowId={(r) => r.id}
        searchPlaceholder="Search by parent speciality, name, or code..."
        emptyMessage="No sub specialities found"
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => handleView(row)} aria-label="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(row)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(row)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <SubSpecialtyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        subSpecialty={selected}
        specialties={specialties}
        mode={formMode}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[700px] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Sub Speciality</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{selected?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting || !selected}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

