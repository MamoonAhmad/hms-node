import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ImmunizationSection() {
  const [immunizations, setImmunizations] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [immunizationForm, setImmunizationForm] = useState({
    immunization: '',
    date: '',
    location: '',
  });
  const [noCurrentImmunizations, setNoCurrentImmunizations] = useState(false);

  const resetForm = () => {
    setImmunizationForm({
      immunization: '',
      date: '',
      location: '',
    });
    setEditingIndex(null);
  };

  const openEdit = (im, idx) => {
    setEditingIndex(idx);
    setImmunizationForm({
      immunization: im.immunization || '',
      date: im.date || '',
      location: im.location || '',
    });
  };

  const handleImmunizationSave = () => {
    if (!immunizationForm.immunization?.trim()) return;
    const timestamp = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());

    if (editingIndex != null) {
      setImmunizations((prev) =>
        prev.map((item, i) =>
          i === editingIndex
            ? { ...immunizationForm, timestamp: item.timestamp || timestamp }
            : item,
        ),
      );
    } else {
      setImmunizations((prev) => [...prev, { ...immunizationForm, timestamp }]);
    }
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Current Immunization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 rounded-lg border border-border/60 p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="no-current-immunizations"
            checked={noCurrentImmunizations}
            onCheckedChange={(checked) => setNoCurrentImmunizations(!!checked)}
          />
          <Label htmlFor="no-current-immunizations" className="text-sm">
            No current immunizations
          </Label>
        </div>

        {!noCurrentImmunizations && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="immunization">Immunization</Label>
                <Input
                  id="immunization"
                  className="h-9 w-full"
                  placeholder="Immunization"
                  value={immunizationForm.immunization}
                  onChange={(e) => setImmunizationForm((p) => ({ ...p, immunization: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="immunization-date">Date</Label>
                <Input
                  id="immunization-date"
                  type="date"
                  className="h-9 w-full"
                  value={immunizationForm.date}
                  onChange={(e) => setImmunizationForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="immunization-location">Location</Label>
                <Input
                  id="immunization-location"
                  className="h-9 w-full"
                  placeholder="Location"
                  value={immunizationForm.location}
                  onChange={(e) => setImmunizationForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleImmunizationSave}>
                {editingIndex != null ? 'Save Changes' : 'Add Immunization'}
              </Button>
              {editingIndex != null && (
                <Button size="sm" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}

        {!noCurrentImmunizations && immunizations.length > 0 && (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Immunization</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {immunizations.map((im, idx) => (
                  <TableRow key={`${im.immunization}-${idx}`}>
                    <TableCell className="font-medium">{im.immunization || '-'}</TableCell>
                    <TableCell>{im.date || '-'}</TableCell>
                    <TableCell>{im.location || '-'}</TableCell>
                    <TableCell>{im.timestamp}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => openEdit(im, idx)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
