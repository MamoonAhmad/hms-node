import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  isLightHexColor,
  normalizeHexColor,
} from '@/lib/appointmentStatuses';
import { appointmentStatusApi } from '@/services/api';

const emptyForm = () => ({
  name: '',
  color: '#123B5D',
});

function rowToForm(row) {
  return {
    name: row?.name || '',
    color: normalizeHexColor(row?.color) || '#123B5D',
  };
}

function auditUserLabel(user) {
  if (!user) return '—';
  return user.name || user.email || '—';
}

function formatAuditDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function AppointmentStatusPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [colorError, setColorError] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentStatusApi.getAll({ limit: 500 });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        (x.name || '').toLowerCase().includes(q) ||
        (x.color || '').toLowerCase().includes(q),
    );
  }, [items, search]);

  const openForm = (mode, row = null) => {
    setFormMode(mode);
    setSelectedItem(row);
    setForm(row ? rowToForm(row) : emptyForm());
    setColorError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode('create');
    setSelectedItem(null);
    setForm(emptyForm());
    setColorError('');
  };

  const handleColorTextChange = (value) => {
    setForm((p) => ({ ...p, color: value }));
    if (colorError) setColorError('');
  };

  const handleColorPickerChange = (value) => {
    setForm((p) => ({ ...p, color: value }));
    if (colorError) setColorError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const color = normalizeHexColor(form.color);
    if (!color) {
      setColorError('Enter a valid color code (e.g. #123B5D)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { name, color };
      if (formMode === 'edit' && selectedItem?.id) {
        await appointmentStatusApi.update(selectedItem.id, payload);
      } else {
        await appointmentStatusApi.create(payload);
      }
      closeForm();
      await fetchList();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await appointmentStatusApi.delete(deleteTarget.id);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await fetchList();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickerValue = normalizeHexColor(form.color) || '#123B5D';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Appointment Status</h1>
          <p className="text-muted-foreground">
            Manage status labels and colors used for appointments.
          </p>
        </div>
        <Button type="button" onClick={() => openForm('create')} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Appointment Status
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setIsFormOpen(true);
        }}
      >
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'edit' ? 'Edit Appointment Status' : 'Add Appointment Status'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentStatusName">Appointment status name *</Label>
              <Input
                id="appointmentStatusName"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Scheduled"
              />
            </div>

            <div className="space-y-2">
              <Label>Appointment status color *</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pickerValue}
                    onChange={(e) => handleColorPickerChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                    aria-label="Pick a color"
                  />
                  <div
                    className="h-10 w-10 shrink-0 rounded-md border border-border"
                    style={{ backgroundColor: pickerValue }}
                    title={pickerValue}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="appointmentStatusColor" className="text-xs text-muted-foreground">
                    Color code
                  </Label>
                  <Input
                    id="appointmentStatusColor"
                    value={form.color}
                    onChange={(e) => handleColorTextChange(e.target.value)}
                    placeholder="#123B5D"
                    className={cn(colorError && 'border-destructive')}
                  />
                  {colorError && <p className="text-xs text-destructive">{colorError}</p>}
                </div>
              </div>
            </div>

            {formMode === 'edit' && selectedItem && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="font-medium">{auditUserLabel(selectedItem.creator)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatAuditDate(selectedItem.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated by</p>
                  <p className="font-medium">{auditUserLabel(selectedItem.updater)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatAuditDate(selectedItem.updatedAt)}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.name.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Remove Appointment Status</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold">{deleteTarget?.name}</span> from the active
              catalogue? It will no longer appear when scheduling new appointments.
              {deleteTarget?._count?.appointments > 0 && (
                <span className="mt-2 block text-muted-foreground">
                  {deleteTarget._count.appointments} existing appointment(s) will keep this status
                  label on their records.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting || !deleteTarget}
            >
              {isSubmitting ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-semibold text-foreground">Appointment statuses</div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or color..."
            className="sm:max-w-xs"
          />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    No appointment statuses found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const hex = normalizeHexColor(row.color) || '#6b7280';
                  const light = isLightHexColor(hex);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border"
                            style={{
                              backgroundColor: hex,
                              color: light ? '#1f2937' : '#ffffff',
                              borderColor: hex,
                            }}
                          >
                            {row.name}
                          </span>
                          <span className="text-sm text-muted-foreground font-mono">{hex}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {auditUserLabel(row.creator)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {auditUserLabel(row.updater)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => openForm('edit', row)}
                          >
                            <Pencil className="h-4 w-4 icon-action-edit" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => handleDeleteClick(row)}
                          >
                            <Trash2 className="h-4 w-4 icon-action-delete" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
