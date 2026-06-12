import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
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
const emptyForm = () => ({
  name: '',
  description: '',
  isActive: true,
  defaultTime: '',
});

const STORAGE_KEY = 'hms_appointment_types';

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStored(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const defaultSeed = [
  { id: 'apt-new', name: 'New Patient', description: '', isActive: true },
  { id: 'apt-follow', name: 'Follow-up', description: '', isActive: true },
  { id: 'apt-urgent', name: 'Urgent', description: '', isActive: true },
  { id: 'apt-tele', name: 'Telehealth', description: '', isActive: true },
  { id: 'apt-proc', name: 'Procedure', description: '', isActive: true },
];

function rowToForm(row) {
  const defaultTime = row?.defaultTime;
  return {
    name: row?.name || '',
    description: row?.description || '',
    isActive: row?.isActive !== false,
    defaultTime: defaultTime === 0 || defaultTime ? String(defaultTime) : '',
  };
}

function formatDefaultTimeDisplay(value) {
  if (value === '' || value == null) return '—';
  return String(value);
}

function parseDefaultTime(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  const num = Number(trimmed);
  if (Number.isNaN(num)) return null;
  return num;
}

export function AppointmentTypesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    const stored = getStored();
    if (stored.length === 0) {
      setStored(defaultSeed);
      setItems(defaultSeed);
      return;
    }
    setItems(stored);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        (x.name || '').toLowerCase().includes(q) ||
        (x.description || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const isReadOnly = formMode === 'view';

  const openForm = (mode, row = null) => {
    setFormMode(mode);
    setSelectedItem(row);
    setForm(row ? rowToForm(row) : emptyForm());
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode('create');
    setSelectedItem(null);
    setForm(emptyForm());
  };

  const buildPayload = (name, defaultTime) => ({
    name,
    description: form.description?.trim() || '',
    isActive: form.isActive !== false,
    defaultTime,
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    const name = form.name.trim();
    if (!name) return;

    const defaultTime = parseDefaultTime(form.defaultTime);
    if (defaultTime === null) {
      alert('Time must be a valid number (integers or decimals allowed)');
      return;
    }

    setIsSubmitting(true);
    try {
      const list = getStored();
      const nameTaken = list.some(
        (x) =>
          (x.name || '').toLowerCase() === name.toLowerCase() &&
          x.id !== selectedItem?.id,
      );
      if (nameTaken) {
        alert('Appointment type already exists');
        return;
      }

      const payload = buildPayload(name, defaultTime);
      let next;

      if (formMode === 'edit' && selectedItem) {
        next = list.map((x) =>
          x.id === selectedItem.id
            ? { ...x, ...payload, updatedAt: new Date().toISOString() }
            : x,
        );
      } else {
        next = [
          ...list,
          {
            id: crypto.randomUUID(),
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }

      setStored(next);
      setItems(next);
      closeForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row) => {
    const next = getStored().filter((x) => x.id !== row.id);
    setStored(next);
    setItems(next);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Appointment Types</h1>
          <p className="text-muted-foreground">Manage outpatient appointment types used in scheduling.</p>
        </div>
        <Button type="button" onClick={() => openForm('create')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Appointment Type
        </Button>
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setIsFormOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'view'
                ? 'View Appointment Type'
                : formMode === 'edit'
                  ? 'Edit Appointment Type'
                  : 'Add Appointment Type'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aptTypeName">Name</Label>
                <Input
                  id="aptTypeName"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Annual Physical"
                  disabled={isReadOnly}
                  className={cn(isReadOnly && 'bg-muted cursor-default')}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="aptTypeActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: !!checked }))}
                    disabled={isReadOnly}
                  />
                  <Label
                    htmlFor="aptTypeActive"
                    className={cn('font-normal', !isReadOnly && 'cursor-pointer')}
                  >
                    Active
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aptTypeTime">Time (optional)</Label>
              <Input
                id="aptTypeTime"
                type="number"
                step="any"
                min="0"
                value={form.defaultTime}
                onChange={(e) => setForm((p) => ({ ...p, defaultTime: e.target.value }))}
                placeholder="e.g. 30 or 15.5"
                disabled={isReadOnly}
                className={cn(isReadOnly && 'bg-muted cursor-default')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aptTypeDesc">Description (optional)</Label>
              <Textarea
                id="aptTypeDesc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Short description for staff"
                disabled={isReadOnly}
                className={cn(isReadOnly && 'bg-muted cursor-default')}
              />
            </div>

            <DialogFooter className="gap-2">
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

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-semibold text-foreground">Existing Appointment Types</div>
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    No appointment types found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.description || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDefaultTimeDisplay(row.defaultTime)}
                    </TableCell>
                    <TableCell>
                      {row.isActive ? (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted text-foreground">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4 icon-action-delete" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

