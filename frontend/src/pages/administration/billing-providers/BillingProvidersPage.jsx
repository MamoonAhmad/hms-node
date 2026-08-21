import { useState, useEffect, useCallback } from 'react';
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
import { billingProviderApi } from '@/services/api';

const LEGACY_STORAGE_KEY = 'hms_billing_providers';

async function importLegacyLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return false;
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length === 0) return false;

    for (const row of rows) {
      if (!row.name?.trim()) continue;
      await billingProviderApi.create({
        name: row.name.trim(),
        code: row.code || undefined,
        npi: row.npi || undefined,
        taxId: row.taxId || undefined,
        address: row.address || undefined,
        isActive: row.isActive !== false,
      });
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function BillingProvidersPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res = await billingProviderApi.getAll({
        page: 1,
        limit: 500,
        search: search || undefined,
        status: 'all',
      });

      if ((res.data || []).length === 0 && localStorage.getItem(LEGACY_STORAGE_KEY)) {
        await importLegacyLocalStorage();
        res = await billingProviderApi.getAll({ page: 1, limit: 500, status: 'all' });
      }

      setItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load billing providers');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
      if (selected?.id) {
        await billingProviderApi.update(selected.id, data);
      } else {
        await billingProviderApi.create(data);
      }
      setIsFormOpen(false);
      setSelected(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selected?.id) return;
    setIsSubmitting(true);
    try {
      await billingProviderApi.delete(selected.id);
      setIsDeleteOpen(false);
      setSelected(null);
      fetchItems();
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
          <p className="text-muted-foreground">Manage billing providers used on CMS-1500 claims</p>
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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

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
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                    No billing providers found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
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
