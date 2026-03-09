import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Edit, Package } from 'lucide-react';
import { loadMedicines, saveMedicines } from './medicinesManagementMock';
import { MedicineFormDialog } from './MedicineFormDialog';
import { ViewMedicineDialog } from './ViewMedicineDialog';

export function PharmacyInventoryPage() {
  const [list, setList] = useState(() => loadMedicines());
  const [search, setSearch] = useState('');
  const [editMedicine, setEditMedicine] = useState(null);
  const [viewMedicine, setViewMedicine] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (m) =>
        (m.medicationName || '').toLowerCase().includes(q) ||
        (m.genericName || '').toLowerCase().includes(q) ||
        (m.ndc || '').toLowerCase().includes(q) ||
        (m.drugType || '').toLowerCase().includes(q)
    );
  }, [list, search]);

  const handleSave = (payload) => {
    if (payload.id) {
      setList((prev) => {
        const next = prev.map((m) => (m.id === payload.id ? { ...m, ...payload } : m));
        saveMedicines(next);
        return next;
      });
      setEditMedicine(null);
    } else {
      const id = Math.max(0, ...list.map((m) => m.id)) + 1;
      const newItem = { ...payload, id };
      setList((prev) => {
        const next = [...prev, newItem];
        saveMedicines(next);
        return next;
      });
      setAddOpen(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Reports</h1>
          <p className="text-muted-foreground">Medication formulary and stock quantity</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add medication
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication Formulary</CardTitle>
          <p className="text-sm text-muted-foreground">Search and update quantity, stock, and inventory details.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="sr-only">Search</Label>
            <Input
              placeholder="Search by name, generic, NDC, or drug type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication name</TableHead>
                  <TableHead>Generic name</TableHead>
                  <TableHead>NDC</TableHead>
                  <TableHead>Drug type</TableHead>
                  <TableHead>Unit of purchase</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Current stock</TableHead>
                  <TableHead>Last inventory date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                      No medications in formulary. Add a medication to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.medicationName}</TableCell>
                      <TableCell>{row.genericName || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{row.ndc || '—'}</TableCell>
                      <TableCell>{row.drugType || '—'}</TableCell>
                      <TableCell>{row.unitOfPurchase || '—'}</TableCell>
                      <TableCell className="text-right">{row.quantity ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">{row.currentQuantity ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.lastInventoryDate ? new Date(row.lastInventoryDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewMedicine(row)} title="View">
                            <Eye className="h-4 w-4 icon-action-view" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditMedicine(row)} title="Update quantity / stock">
                            <Package className="h-4 w-4 mr-1" />
                            Update stock
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MedicineFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        medicine={null}
        isAdd
        onSave={handleSave}
      />
      <MedicineFormDialog
        open={!!editMedicine}
        onOpenChange={(open) => !open && setEditMedicine(null)}
        medicine={editMedicine}
        isAdd={false}
        onSave={handleSave}
      />
      <ViewMedicineDialog
        open={!!viewMedicine}
        onOpenChange={(open) => !open && setViewMedicine(null)}
        medicine={viewMedicine}
      />
    </div>
  );
}
