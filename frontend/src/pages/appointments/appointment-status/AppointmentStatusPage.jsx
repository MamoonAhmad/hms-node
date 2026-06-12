import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_STATUSES_STORAGE_KEY,
  DEFAULT_APPOINTMENT_STATUSES,
  getAppointmentStatuses,
  normalizeHexColor,
  saveAppointmentStatuses,
} from '@/lib/appointmentStatuses';

const STORAGE_KEY = APPOINTMENT_STATUSES_STORAGE_KEY;
const defaultSeed = DEFAULT_APPOINTMENT_STATUSES;

const emptyForm = () => ({
  name: '',
  color: '#3b82f6',
});

function getStored() {
  return getAppointmentStatuses();
}

function setStored(list) {
  saveAppointmentStatuses(list);
}

function isLightColor(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return false;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function rowToForm(row) {
  return {
    name: row?.name || '',
    color: normalizeHexColor(row?.color) || '#3b82f6',
  };
}

export function AppointmentStatusPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colorError, setColorError] = useState('');

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const color = normalizeHexColor(form.color);
    if (!color) {
      setColorError('Enter a valid color code (e.g. #3b82f6)');
      return;
    }

    setIsSubmitting(true);
    try {
      const list = getStored();
      const nameTaken = list.some(
        (x) => x.name.toLowerCase() === name.toLowerCase() && x.id !== selectedItem?.id,
      );
      if (nameTaken) {
        alert('An appointment status with this name already exists');
        return;
      }

      const payload = { name, color };

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
    if (!window.confirm(`Delete appointment status "${row.name}"?`)) return;
    const next = getStored().filter((x) => x.id !== row.id);
    setStored(next);
    setItems(next);
  };

  const pickerValue = normalizeHexColor(form.color) || '#3b82f6';

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
                    placeholder="#3b82f6"
                    className={cn(colorError && 'border-destructive')}
                  />
                  {colorError && <p className="text-xs text-destructive">{colorError}</p>}
                </div>
              </div>
            </div>

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                    No appointment statuses found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const hex = normalizeHexColor(row.color) || '#6b7280';
                  const light = isLightColor(hex);
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
                            onClick={() => handleDelete(row)}
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
