import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { BillingProviderFormDialog } from './BillingProviderFormDialog';

const STORAGE_KEY = 'hms_billing_providers';

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStored(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function BillingProvidersPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setItems(getStored());
  };

  useEffect(() => {
    setIsLoading(true);
    load();
    setIsLoading(false);
  }, []);

  const filtered = search.trim()
    ? items.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.npi || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.code || '').toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const handleCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setSelected(row);
    setIsFormOpen(true);
  };

  const handleView = (row) => {
    setSelected(row);
    setIsViewOpen(true);
  };

  const handleDelete = (row) => {
    setSelected(row);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const list = getStored();
      if (selected) {
        const idx = list.findIndex((r) => r.id === selected.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      } else {
        list.push({
          id: crypto.randomUUID(),
          ...data,
          isActive: data.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setStored(list);
      load();
      setIsFormOpen(false);
      setSelected(null);
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const list = getStored().filter((r) => r.id !== selected.id);
      setStored(list);
      load();
      setIsDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing Providers</h1>
          <p className="text-muted-foreground">Manage billing providers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Billing Provider
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, NPI, or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                    No billing providers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name || '-'}</TableCell>
                    <TableCell>{row.code || '-'}</TableCell>
                    <TableCell>{row.npi || '-'}</TableCell>
                    <TableCell>{row.taxId || '-'}</TableCell>
                    <TableCell>{row.isActive !== false ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => handleView(row)}>
                          <Eye className="h-4 w-4 icon-action-view" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => handleEdit(row)}>
                          <Pencil className="h-4 w-4 icon-action-edit" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => handleDelete(row)}>
                          <Trash2 className="h-4 w-4 icon-action-delete" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BillingProviderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        billingProvider={selected}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Billing Provider</DialogTitle>
            <DialogDescription>Details</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-2 text-sm">
              <p><span className="font-medium">Name:</span> {selected.name || '-'}</p>
              <p><span className="font-medium">Code:</span> {selected.code || '-'}</p>
              <p><span className="font-medium">NPI:</span> {selected.npi || '-'}</p>
              <p><span className="font-medium">Tax ID:</span> {selected.taxId || '-'}</p>
              <p><span className="font-medium">Address:</span> {selected.address || '-'}</p>
              <p><span className="font-medium">Status:</span> {selected.isActive !== false ? 'Active' : 'Inactive'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Billing Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selected?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
