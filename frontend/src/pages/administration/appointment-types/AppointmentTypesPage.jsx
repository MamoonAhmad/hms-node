import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { appointmentTypeApi } from '@/services/api';
import {
  AppointmentTypeHistorySidebar,
  formatUsAuditDateTime,
} from './AppointmentTypeHistorySidebar';

const MODAL_SHELL_PROPS = {
  closeOnOverlayClick: false,
  onEscapeKeyDown: (e) => e.preventDefault(),
};

const emptyForm = () => ({
  name: '',
  description: '',
  isActive: true,
  providerRequired: false,
  defaultTime: '',
});

function rowToForm(row) {
  const defaultTime = row?.defaultTime;
  return {
    name: row?.name || '',
    description: row?.description || '',
    isActive: row?.isActive !== false,
    providerRequired: row?.providerRequired === true,
    defaultTime: defaultTime === 0 || defaultTime ? String(defaultTime) : '',
  };
}

function formatTimeDisplay(value) {
  if (value === '' || value == null) return '—';
  return String(value);
}

function isSystemAppointmentType(row) {
  if (!row) return false;
  if (row.isSystem === true) return true;
  return String(row.name || '').trim().toLowerCase() === 'general';
}

function parseDefaultTime(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return null;
  return num;
}

function buildPayload(form) {
  const name = form.name.trim();
  const defaultTime = parseDefaultTime(form.defaultTime);
  return {
    name,
    description: form.description?.trim() || null,
    isActive: form.isActive !== false,
    providerRequired: form.providerRequired === true,
    defaultTime,
  };
}

function payloadsEqual(a, b) {
  return (
    a.name === b.name &&
    (a.description || '') === (b.description || '') &&
    a.isActive === b.isActive &&
    a.providerRequired === b.providerRequired &&
    (a.defaultTime ?? null) === (b.defaultTime ?? null)
  );
}

function auditUserLabel(user) {
  if (!user) return '—';
  return user.name || user.email || '—';
}

function formatAuditDate(value) {
  return formatUsAuditDateTime(value);
}

function AuditUserCell({ user, date }) {
  return (
    <div className="text-sm">
      <p className="font-medium text-foreground">{auditUserLabel(user)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{formatUsAuditDateTime(date)}</p>
    </div>
  );
}

export function AppointmentTypesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentTypeApi.getAll({ limit: 500 });
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
        (x.description || '').toLowerCase().includes(q) ||
        formatTimeDisplay(x.defaultTime).toLowerCase().includes(q),
    );
  }, [items, search]);

  const isReadOnly = formMode === 'view';

  const openForm = (mode, row = null) => {
    // System types (General) are view-only.
    if (row && isSystemAppointmentType(row) && mode === 'edit') {
      mode = 'view';
    }
    setFormMode(mode);
    setSelectedItem(row);
    setForm(row ? rowToForm(row) : emptyForm());
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode('create');
    setSelectedItem(null);
    setForm(emptyForm());
    setFieldErrors({});
  };

  const validateForm = () => {
    const next = {};
    const name = form.name.trim();
    if (!name) next.name = 'Appointment type is required';
    if (form.defaultTime.trim() !== '' && parseDefaultTime(form.defaultTime) === null) {
      next.defaultTime = 'Time must be a valid number (integers or decimals allowed)';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validateForm()) return;

    const payload = buildPayload(form);

    if (formMode === 'edit' && selectedItem) {
      const original = buildPayload(rowToForm(selectedItem));
      if (payloadsEqual(payload, original)) {
        closeForm();
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (formMode === 'edit' && selectedItem?.id) {
        await appointmentTypeApi.update(selectedItem.id, payload);
      } else {
        await appointmentTypeApi.create(payload);
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
    if (isSystemAppointmentType(row)) {
      setError('The "General" appointment type is system-defined and cannot be deleted.');
      return;
    }
    setDeleteTarget(row);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await appointmentTypeApi.delete(deleteTarget.id);
      closeDeleteDialog();
      await fetchList();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistory = async (row) => {
    setHistoryTarget(row);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await appointmentTypeApi.getHistory(row.id);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryTarget(null);
    setHistory([]);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Appointment Types</h1>
          <p className="text-muted-foreground">
            Manage outpatient appointment types used in scheduling.
          </p>
        </div>
        <Button type="button" onClick={() => openForm('create')} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Appointment Type
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl w-[95vw]" {...MODAL_SHELL_PROPS}>
          <DialogHeader>
            <DialogTitle>
              {formMode === 'view'
                ? 'View Appointment Type'
                : formMode === 'edit'
                  ? 'Edit Appointment Type'
                  : 'Add Appointment Type'}
            </DialogTitle>
            {selectedItem && isSystemAppointmentType(selectedItem) && (
              <DialogDescription>
                General is a system appointment type. It is available for all providers and cannot be
                edited or deleted.
              </DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aptTypeName">
                Appointment Type {!isReadOnly && <span className="text-destructive">*</span>}
              </Label>
              {isReadOnly ? (
                <Input
                  id="aptTypeName"
                  value={form.name}
                  readOnly
                  className="bg-muted cursor-default"
                />
              ) : (
                <Input
                  id="aptTypeName"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="e.g., Annual Physical"
                  className={cn(fieldErrors.name && 'border-destructive')}
                />
              )}
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              {isReadOnly ? (
                <Input
                  value={form.isActive ? 'Active' : 'Inactive'}
                  readOnly
                  className="bg-muted cursor-default max-w-xs"
                />
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="aptTypeActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: !!checked }))}
                  />
                  <Label htmlFor="aptTypeActive" className="font-normal cursor-pointer">
                    Active
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    ({form.isActive ? 'Active' : 'Inactive'})
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Provider require</Label>
              {isReadOnly ? (
                <Input
                  value={form.providerRequired ? 'Yes' : 'No'}
                  readOnly
                  className="bg-muted cursor-default max-w-xs"
                />
              ) : (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="aptTypeProviderRequired"
                      checked={form.providerRequired}
                      onCheckedChange={(checked) =>
                        setForm((p) => ({ ...p, providerRequired: !!checked }))
                      }
                    />
                    <Label htmlFor="aptTypeProviderRequired" className="font-normal cursor-pointer">
                      Provider require
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When checked, this type is hidden from the general catalog and only shown for
                    providers whose schedule includes it.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aptTypeTime">Time (optional)</Label>
              <Input
                id="aptTypeTime"
                type="number"
                step="any"
                min="0"
                value={form.defaultTime}
                onChange={(e) => {
                  setForm((p) => ({ ...p, defaultTime: e.target.value }));
                  if (fieldErrors.defaultTime) {
                    setFieldErrors((p) => ({ ...p, defaultTime: undefined }));
                  }
                }}
                placeholder="e.g. 30 or 15.5"
                readOnly={isReadOnly}
                className={cn(
                  isReadOnly && 'bg-muted cursor-default',
                  fieldErrors.defaultTime && 'border-destructive',
                )}
              />
              {fieldErrors.defaultTime && (
                <p className="text-xs text-destructive">{fieldErrors.defaultTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aptTypeDesc">Description</Label>
              <Textarea
                id="aptTypeDesc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Short description for staff"
                readOnly={isReadOnly}
                className={cn(isReadOnly && 'bg-muted cursor-default')}
              />
            </div>

            {(formMode === 'view' || formMode === 'edit') && selectedItem && (
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
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting || !form.name.trim()}>
                  {isSubmitting
                    ? 'Saving...'
                    : formMode === 'edit'
                      ? 'Save Changes'
                      : 'Add Appointment Type'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg w-[95vw]" {...MODAL_SHELL_PROPS}>
          <DialogHeader>
            <DialogTitle>Delete Appointment Type</DialogTitle>
            <DialogDescription>
              Do you actually want to delete this appointment type?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeDeleteDialog} disabled={isSubmitting}>
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting || !deleteTarget}
            >
              {isSubmitting ? 'Deleting...' : 'Yes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-semibold text-foreground">Appointment types</div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appointment types..."
            className="sm:max-w-xs"
          />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sr. No.</TableHead>
                <TableHead>Appointment Type</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    No appointment types found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, index) => {
                  const systemType = isSystemAppointmentType(row);
                  return (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{row.name}</span>
                        {systemType && (
                          <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            System
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeDisplay(row.defaultTime)}
                    </TableCell>
                    <TableCell>
                      <AuditUserCell user={row.creator} date={row.createdAt} />
                    </TableCell>
                    <TableCell>
                      <AuditUserCell user={row.updater} date={row.updatedAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View history"
                          aria-label="View history"
                          onClick={() => openHistory(row)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View"
                          aria-label="View"
                          onClick={() => openForm('view', row)}
                        >
                          <Eye className="h-4 w-4 icon-action-view" />
                        </Button>
                        {!systemType && (
                          <>
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
                          </>
                        )}
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

      <AppointmentTypeHistorySidebar
        open={historyOpen}
        onClose={closeHistory}
        appointmentTypeName={historyTarget?.name}
        history={history}
        isLoading={historyLoading}
      />
    </div>
  );
}
