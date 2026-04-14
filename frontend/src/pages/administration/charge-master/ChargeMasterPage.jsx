import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { ChargeMasterFormDialog } from './ChargeMasterFormDialog';
import { chargeMasterApi } from '@/services/api';

export function ChargeMasterPage() {
  const [charges, setCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCharges();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchCharges();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCharges = async () => {
    setIsLoading(true);
    try {
      const response = await chargeMasterApi.getAll({ search });
      setCharges(response.data || response || []);
    } catch (err) {
      console.error('Error fetching charges:', err);
      setCharges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCharge(null);
    setIsFormOpen(true);
  };

  const handleEdit = (charge) => {
    setSelectedCharge(charge);
    setIsFormOpen(true);
  };

  const handleDelete = (charge) => {
    setSelectedCharge(charge);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedCharge) {
        await chargeMasterApi.update(selectedCharge.id, data);
      } else {
        await chargeMasterApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedCharge(null);
      fetchCharges();
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await chargeMasterApi.delete(selectedCharge.id);
      setIsDeleteOpen(false);
      setSelectedCharge(null);
      fetchCharges();
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Charge Master</h1>
          <p className="text-muted-foreground">Manage charge master entries</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Charge
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search charge master..."
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
                <TableHead>CPT Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Revenue Code</TableHead>
                <TableHead>Standard Amount</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                    No charges found
                  </TableCell>
                </TableRow>
              ) : (
                charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="font-medium">{charge.cptCode || '-'}</TableCell>
                    <TableCell>{charge.description || '-'}</TableCell>
                    <TableCell>{charge.revenueCode || '-'}</TableCell>
                    <TableCell>
                      {charge.standardAmount
                        ? `$${Number(charge.standardAmount).toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell>{charge.location || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(charge)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(charge)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <ChargeMasterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        charge={selectedCharge}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Charge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this charge entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


