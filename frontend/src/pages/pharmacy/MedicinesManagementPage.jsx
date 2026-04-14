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
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { loadMedicines, saveMedicines } from './medicinesManagementMock';
import { MedicineFormDialog } from './MedicineFormDialog';
import { ViewMedicineDialog } from './ViewMedicineDialog';

export function MedicinesManagementPage() {
  const [list, setList] = useState(() => loadMedicines());
  const [filters, setFilters] = useState({
    medicineName: '',
    genericName: '',
    ndc: '',
    drugType: '',
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [viewMedicine, setViewMedicine] = useState(null);

  const filtered = useMemo(() => {
    let items = list;
    if (filters.medicineName.trim()) {
      const q = filters.medicineName.toLowerCase();
      items = items.filter((m) => (m.medicationName || '').toLowerCase().includes(q));
    }
    if (filters.genericName.trim()) {
      const q = filters.genericName.toLowerCase();
      items = items.filter((m) => (m.genericName || '').toLowerCase().includes(q));
    }
    if (filters.ndc.trim()) {
      const q = filters.ndc.toLowerCase();
      items = items.filter((m) => (m.ndc || '').toLowerCase().includes(q));
    }
    if (filters.drugType.trim()) {
      const q = filters.drugType.toLowerCase();
      items = items.filter((m) => (m.drugType || '').toLowerCase().includes(q));
    }
    return items;
  }, [list, filters]);

  const handleFilter = () => {};
  const handleResetFilters = () => setFilters({ medicineName: '', genericName: '', ndc: '', drugType: '' });

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

  const handleDelete = (medicine) => {
    if (!confirm(`Delete "${medicine.medicationName}"?`)) return;
    setList((prev) => {
      const next = prev.filter((m) => m.id !== medicine.id);
      saveMedicines(next);
      return next;
    });
    setEditMedicine(null);
    setViewMedicine(null);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicines Management</h1>
          <p className="text-muted-foreground">Manage medicine inventory</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add medicines</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Medicine name</Label>
              <Input
                placeholder="Medicine name"
                value={filters.medicineName}
                onChange={(e) => setFilters((f) => ({ ...f, medicineName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Generic name</Label>
              <Input
                placeholder="Generic name"
                value={filters.genericName}
                onChange={(e) => setFilters((f) => ({ ...f, genericName: e.target.value }))}
              />
            </div>
            <div>
              <Label>NDC</Label>
              <Input
                placeholder="NDC"
                value={filters.ndc}
                onChange={(e) => setFilters((f) => ({ ...f, ndc: e.target.value }))}
              />
            </div>
            <div>
              <Label>Drug type</Label>
              <Input
                placeholder="Drug type"
                value={filters.drugType}
                onChange={(e) => setFilters((f) => ({ ...f, drugType: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFilter}>Filter</Button>
            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Sr No</TableHead>
                  <TableHead>Medicine name</TableHead>
                  <TableHead>EMR ID</TableHead>
                  <TableHead>Generic name</TableHead>
                  <TableHead>NDC</TableHead>
                  <TableHead>Drug type</TableHead>
                  <TableHead className="text-right">Current quantity</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No medicines</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.medicationName}</TableCell>
                      <TableCell>{row.emrId}</TableCell>
                      <TableCell>{row.genericName}</TableCell>
                      <TableCell>{row.ndc}</TableCell>
                      <TableCell>{row.drugType}</TableCell>
                      <TableCell className="text-right">{row.currentQuantity}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewMedicine(row)} title="View"><Eye className="h-4 w-4 icon-action-view" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditMedicine(row)} title="Edit"><Edit className="h-4 w-4 icon-action-edit" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} title="Delete"><Trash2 className="h-4 w-4 icon-action-delete" /></Button>
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
        isAdd={true}
        onSave={handleSave}
      />
      <MedicineFormDialog
        open={!!editMedicine}
        onOpenChange={(o) => !o && setEditMedicine(null)}
        medicine={editMedicine}
        isAdd={false}
        onSave={handleSave}
      />
      <ViewMedicineDialog
        open={!!viewMedicine}
        onOpenChange={(o) => !o && setViewMedicine(null)}
        medicine={viewMedicine}
      />
    </div>
  );
}
