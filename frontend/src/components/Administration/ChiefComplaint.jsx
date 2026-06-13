import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Plus, Eye, Pencil, Trash2, Heart, Stethoscope } from 'lucide-react';
import { FormField, FormSection } from '@/components/ui/form-layout';
import { cn } from '@/lib/utils';
import { chiefComplaintApi } from '@/services/api';

function ChiefComplaintFormDialog({
  open,
  onOpenChange,
  mode,
  name,
  onNameChange,
  nameError,
  code,
  onCodeChange,
  isFavourite,
  onFavouriteChange,
  onCancel,
  onSubmit,
  isSubmitting,
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const readOnly = isView;

  const title = isView ? 'View chief complaint' : isEdit ? 'Edit chief complaint' : 'Add chief complaint';
  const description = isView
    ? 'Read-only summary of this chief complaint.'
    : isEdit
      ? 'Update the complaint label staff can select during encounters.'
      : 'Create a reusable chief complaint option for clinical documentation.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg w-[calc(100%-2rem)]">
        <DialogHeader className="space-y-3 border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1 text-left">
              <DialogTitle className="text-lg leading-tight">{title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!readOnly) onSubmit();
          }}
          className="flex flex-col"
        >
          <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-5 sm:px-6">
            <FormSection title="Complaint details">
              <FormField
                label="Chief Complaint Name"
                htmlFor="chiefComplaintName"
                required
                hint={readOnly ? undefined : 'Use clear, clinical wording (e.g. Chest pain, Fever).'}
                error={nameError}
              >
                <Input
                  id="chiefComplaintName"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Abdominal pain"
                  className={cn('h-10 bg-background', nameError && 'border-destructive focus-visible:ring-destructive', readOnly && 'bg-muted')}
                  autoFocus={!readOnly}
                  disabled={readOnly || isSubmitting}
                  readOnly={readOnly}
                />
              </FormField>
              <FormField
                label="Code"
                htmlFor="chiefComplaintCode"
                hint={readOnly ? undefined : 'Optional short code for reporting or integrations (e.g. CC-FEVER).'}
              >
                <Input
                  id="chiefComplaintCode"
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  placeholder="e.g. CC-FEVER"
                  className={cn('h-10', readOnly && 'bg-muted')}
                  disabled={readOnly || isSubmitting}
                  readOnly={readOnly}
                />
              </FormField>
            </FormSection>

            <FormSection title="Favourite Mark" className="mt-5">
              {readOnly ? (
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-4',
                    isFavourite
                      ? 'border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                      : 'border-border bg-muted/20',
                  )}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      isFavourite ? 'fill-red-500 text-red-500' : 'fill-transparent text-muted-foreground/50',
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Favourite</p>
                    <p className="text-xs text-muted-foreground">
                      {isFavourite ? 'Marked as favourite for your account' : 'Not marked as favourite'}
                    </p>
                  </div>
                </div>
              ) : (
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
                    <p className="text-sm font-medium text-foreground">Favourite Mark</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      Mark as favourite for your account only — not shared across all users.
                    </p>
                  </div>
                  <Checkbox
                    checked={isFavourite}
                    onCheckedChange={(checked) => onFavouriteChange(!!checked)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Mark as favourite"
                    className="shrink-0"
                    disabled={isSubmitting}
                  />
                </button>
              )}
            </FormSection>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            {readOnly ? (
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add complaint'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ChiefComplaint = () => {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintToDelete, setComplaintToDelete] = useState(null);

  const [chiefComplaintName, setChiefComplaintName] = useState('');
  const [chiefComplaintCode, setChiefComplaintCode] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState('');

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chiefComplaintApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setComplaints(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const rows = useMemo(
    () =>
      complaints.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [complaints, pagination.page, pagination.limit],
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

  const resetForm = () => {
    setChiefComplaintName('');
    setChiefComplaintCode('');
    setIsFavourite(false);
    setNameError('');
    setSelectedComplaint(null);
  };

  const populateForm = (complaint) => {
    setChiefComplaintName(complaint.name || '');
    setChiefComplaintCode(complaint.code || '');
    setIsFavourite(!!complaint.isFavourite);
    setNameError('');
  };

  const openComplaint = async (complaint, mode) => {
    try {
      const response = await chiefComplaintApi.getById(complaint.id);
      setSelectedComplaint(response.data);
      populateForm(response.data);
      setFormMode(mode);
      setIsFormOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load chief complaint');
    }
  };

  const handleAddNew = () => {
    resetForm();
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleFormOpenChange = (open) => {
    setIsFormOpen(open);
    if (!open) resetForm();
  };

  const handleCancel = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handleSubmit = async () => {
    const trimmed = chiefComplaintName.trim();
    if (!trimmed) {
      setNameError('Chief complaint name is required.');
      return;
    }
    setNameError('');
    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmed,
        code: chiefComplaintCode.trim() || null,
        isFavourite: !!isFavourite,
      };
      if (formMode === 'edit' && selectedComplaint?.id) {
        await chiefComplaintApi.update(selectedComplaint.id, payload);
      } else {
        await chiefComplaintApi.create(payload);
      }
      setIsFormOpen(false);
      resetForm();
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavourite = async (complaint) => {
    try {
      const response = await chiefComplaintApi.toggleFavourite(complaint.id);
      const next = response.data?.isFavourite;
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? { ...c, isFavourite: next } : c)),
      );
    } catch (err) {
      alert(err.message || 'Failed to update favourite');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!complaintToDelete) return;
    setIsSubmitting(true);
    try {
      await chiefComplaintApi.delete(complaintToDelete.id);
      setComplaintToDelete(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={[
          {
            key: '_srNo',
            label: 'Sr. No',
            align: 'center',
            className: 'w-14 min-w-14 max-w-16 px-2',
            cellClassName: 'w-14 min-w-14 max-w-16 px-2 tabular-nums',
            render: (row) => row._srNo,
          },
          { key: 'name', label: 'Chief Complaint Name', cellClassName: 'font-medium' },
          {
            key: 'code',
            label: 'Chief Complaint Code',
            render: (row) =>
              row.code ? (
                <span className="font-mono text-xs">{row.code}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
        ]}
        data={rows}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name or code..."
        emptyMessage="No chief complaints found"
        actions={(complaint) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleToggleFavourite(complaint)}
              aria-label={complaint.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
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
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openComplaint(complaint, 'view')}
              aria-label="View"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openComplaint(complaint, 'edit')}
              aria-label="Edit"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setComplaintToDelete(complaint)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ChiefComplaintFormDialog
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        mode={formMode}
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
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
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
              <span className="font-semibold text-foreground">{complaintToDelete?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setComplaintToDelete(null)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChiefComplaint;
