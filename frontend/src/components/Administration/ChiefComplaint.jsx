import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Eye, Edit, Trash2, Heart, Stethoscope } from 'lucide-react';
import { FormField, FormSection } from '@/components/ui/form-layout';
import { cn } from '@/lib/utils';

function ChiefComplaintFormDialog({
  open,
  onOpenChange,
  isEdit,
  name,
  onNameChange,
  nameError,
  code,
  onCodeChange,
  isFavourite,
  onFavouriteChange,
  onCancel,
  onSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg w-[calc(100%-2rem)]">
        <DialogHeader className="space-y-3 border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1 text-left">
              <DialogTitle className="text-lg leading-tight">
                {isEdit ? 'Edit chief complaint' : 'Add chief complaint'}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {isEdit
                  ? 'Update the complaint label staff can select during encounters.'
                  : 'Create a reusable chief complaint option for clinical documentation.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col"
        >
          <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-5 sm:px-6">
            <FormSection title="Complaint details">
              <FormField
                label="Chief complaint name"
                htmlFor="chiefComplaintName"
                required
                hint="Use clear, clinical wording (e.g. Chest pain, Fever)."
                error={nameError}
              >
                <Input
                  id="chiefComplaintName"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Abdominal pain"
                  className={cn('h-10', nameError && 'border-destructive focus-visible:ring-destructive')}
                  autoFocus
                />
              </FormField>
              <FormField
                label="Code"
                htmlFor="chiefComplaintCode"
                hint="Optional short code for reporting or integrations (e.g. CC-FEVER)."
              >
                <Input
                  id="chiefComplaintCode"
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  placeholder="e.g. CC-FEVER"
                  className="h-10"
                />
              </FormField>
            </FormSection>

            <FormSection title="Quick access" className="mt-5">
              <button
                type="button"
                onClick={() => onFavouriteChange(!isFavourite)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isFavourite
                    ? 'border-red-200/80 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20'
                    : 'border-border bg-card hover:bg-muted/40',
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    isFavourite ? 'bg-red-100 text-red-600 dark:bg-red-950/50' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isFavourite ? 'fill-red-500 text-red-500' : 'fill-transparent',
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Favourite</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Pin this complaint for faster access in lists and search.
                  </p>
                </div>
                <Checkbox
                  checked={isFavourite}
                  onCheckedChange={(checked) => onFavouriteChange(!!checked)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Mark as favourite"
                  className="shrink-0"
                />
              </button>
            </FormSection>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="w-full sm:w-auto">
              {isEdit ? 'Save changes' : 'Add complaint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ChiefComplaint = () => {
  const [complaints, setComplaints] = useState([
    { id: 1, name: 'Fever', code: 'CC-FEVER', isFavourite: false },
    { id: 2, name: 'Cough', code: 'CC-COUGH', isFavourite: true },
    { id: 3, name: 'Pain', code: '', isFavourite: false },
    { id: 4, name: 'Headache', code: '', isFavourite: false },
    { id: 5, name: 'Nausea', code: '', isFavourite: false },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [chiefComplaintName, setChiefComplaintName] = useState('');
  const [chiefComplaintCode, setChiefComplaintCode] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [nameError, setNameError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return complaints;
    return complaints.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q),
    );
  }, [complaints, search]);

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

  const resetForm = () => {
    setChiefComplaintName('');
    setChiefComplaintCode('');
    setIsFavourite(false);
    setNameError('');
    setSelectedComplaint(null);
  };

  const handleAddComplaint = () => {
    const trimmed = chiefComplaintName.trim();
    if (!trimmed) {
      setNameError('Chief complaint name is required.');
      return;
    }
    setNameError('');
    if (selectedComplaint) {
      setComplaints(complaints.map((c) =>
        c.id === selectedComplaint.id
          ? { ...c, name: trimmed, code: chiefComplaintCode.trim(), isFavourite: !!isFavourite }
          : c
      ));
    } else {
      const nextId = complaints.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      setComplaints([
        ...complaints,
        { id: nextId, name: trimmed, code: chiefComplaintCode.trim(), isFavourite: !!isFavourite },
      ]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleFormOpenChange = (open) => {
    setIsModalOpen(open);
    if (!open) resetForm();
  };

  const handleToggleFavourite = (complaint) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaint.id ? { ...c, isFavourite: !c.isFavourite } : c
      )
    );
  };

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewModalOpen(true);
  };

  const handleEdit = (complaint) => {
    setSelectedComplaint(complaint);
    setChiefComplaintName(complaint.name);
    setChiefComplaintCode(complaint.code || '');
    setIsFavourite(!!complaint.isFavourite);
    setNameError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (complaint) => {
    setComplaintToDelete(complaint);
  };

  const handleDeleteConfirm = () => {
    if (!complaintToDelete) return;
    setComplaints((prev) => prev.filter((c) => c.id !== complaintToDelete.id));
    setComplaintToDelete(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Chief Complaints</h1>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Chief Complaint
        </Button>
      </div>

      <DataTable
        columns={[
          {
            key: '_srNo',
            label: 'Sr. No.',
            align: 'center',
            className: 'w-14 min-w-14 max-w-16 px-2',
            cellClassName: 'w-14 min-w-14 max-w-16 px-2 tabular-nums',
            render: (row) => row._srNo,
          },
          { key: 'name', label: 'Chief Complaint Name' },
        ]}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name or code..."
        emptyMessage="No chief complaints found"
        actions={(complaint) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleFavourite(complaint)}
              className="h-8 w-8 p-0"
              title={complaint.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  complaint.isFavourite
                    ? 'fill-red-500 text-red-500'
                    : 'fill-transparent text-muted-foreground/40',
                )}
              />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleView(complaint)} className="h-8 w-8 p-0" title="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(complaint)} className="h-8 w-8 p-0" title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(complaint)} className="h-8 w-8 p-0" title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <ChiefComplaintFormDialog
        open={isModalOpen}
        onOpenChange={handleFormOpenChange}
        isEdit={!!selectedComplaint}
        name={chiefComplaintName}
        onNameChange={(value) => {
          setChiefComplaintName(value);
          if (nameError) setNameError('');
        }}
        nameError={nameError}
        code={chiefComplaintCode}
        onCodeChange={setChiefComplaintCode}
        isFavourite={isFavourite}
        onFavouriteChange={setIsFavourite}
        onCancel={handleCancel}
        onSubmit={handleAddComplaint}
      />

      <Dialog
        open={!!complaintToDelete}
        onOpenChange={(open) => {
          if (!open) setComplaintToDelete(null);
        }}
      >
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Delete chief complaint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{complaintToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setComplaintToDelete(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} className="w-full sm:w-auto">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg w-[calc(100%-2rem)]">
          <DialogHeader className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
            <DialogTitle className="text-lg">Chief complaint details</DialogTitle>
            <DialogDescription>Read-only summary of this complaint option.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <FormField label="Chief complaint name" htmlFor="viewChiefComplaintName">
              <Input
                id="viewChiefComplaintName"
                value={selectedComplaint?.name || ''}
                disabled
                className="h-10 bg-muted"
              />
            </FormField>
            <FormField label="Code" htmlFor="viewChiefComplaintCode">
              <Input
                id="viewChiefComplaintCode"
                value={selectedComplaint?.code || ''}
                disabled
                placeholder="—"
                className="h-10 bg-muted"
              />
            </FormField>
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border p-4',
                selectedComplaint?.isFavourite
                  ? 'border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                  : 'border-border bg-muted/20',
              )}
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  selectedComplaint?.isFavourite
                    ? 'fill-red-500 text-red-500'
                    : 'fill-transparent text-muted-foreground/50',
                )}
              />
              <div>
                <p className="text-sm font-medium text-foreground">Favourite</p>
                <p className="text-xs text-muted-foreground">
                  {selectedComplaint?.isFavourite ? 'Pinned for quick access' : 'Not marked as favourite'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChiefComplaint;
