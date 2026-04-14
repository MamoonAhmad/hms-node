import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, MapPin } from 'lucide-react';
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
import { LocationFormDialog } from '@/components/locations/LocationFormDialog';
import { locationApi } from '@/services/api';

export function FacilitiesPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      const response = await locationApi.getAll(params);
      const data = response.data || response || [];
      setItems(Array.isArray(data) ? data : []);
      if (response.pagination) {
        setPagination((p) => ({
          ...p,
          total: response.pagination.total ?? data.length,
          totalPages: response.pagination.totalPages ?? Math.ceil((response.pagination.total ?? data.length) / pagination.limit),
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load facilities');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

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
      if (selected) {
        await locationApi.update(selected.id, data);
      } else {
        await locationApi.create(data);
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
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await locationApi.delete(selected.id);
      setIsDeleteOpen(false);
      setSelected(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (row) => {
    const parts = [row.city, row.state, row.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (row.address || '-');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facility</h1>
          <p className="text-muted-foreground">Manage facilities (locations)</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Facility
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, city, state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                    No facilities found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {row.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{row.address || '-'}</TableCell>
                    <TableCell>{formatAddress(row)}</TableCell>
                    <TableCell>{row.phone || '-'}</TableCell>
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

      <LocationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        location={selected}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Facility</DialogTitle>
            <DialogDescription>Facility details</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-2 text-sm">
              <p><span className="font-medium">Name:</span> {selected.name || '-'}</p>
              <p><span className="font-medium">Address:</span> {selected.address || '-'}</p>
              <p><span className="font-medium">City:</span> {selected.city || '-'}</p>
              <p><span className="font-medium">State:</span> {selected.state || '-'}</p>
              <p><span className="font-medium">Country:</span> {selected.country || '-'}</p>
              <p><span className="font-medium">Phone:</span> {selected.phone || '-'}</p>
              <p><span className="font-medium">Status:</span> {selected.isActive !== false ? 'Active' : 'Inactive'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Facility</DialogTitle>
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
