import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

export function AppointmentTypesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const list = getStored();
      const exists = list.some((x) => (x.name || '').toLowerCase() === name.toLowerCase());
      if (exists) {
        alert('Appointment type already exists');
        return;
      }
      const next = [
        ...list,
        {
          id: crypto.randomUUID(),
          name,
          description: form.description?.trim() || '',
          isActive: form.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setStored(next);
      setForm({ name: '', description: '', isActive: true });
      setItems(next);
      setIsFormOpen(false);
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
        <Button
          type="button"
          onClick={() => {
            setForm({ name: '', description: '', isActive: true });
            setIsFormOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Appointment Type
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Add Appointment Type</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aptTypeName">Name</Label>
                <Input
                  id="aptTypeName"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Annual Physical"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="aptTypeActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: !!checked }))}
                  />
                  <Label htmlFor="aptTypeActive" className="font-normal cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aptTypeDesc">Description (optional)</Label>
              <Textarea
                id="aptTypeDesc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Short description for staff"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.name.trim()}>
                Add Appointment
              </Button>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    No appointment types found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.description || '—'}</TableCell>
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
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(row)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

