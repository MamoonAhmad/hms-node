import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ImmunizationSection() {
  const [immunizations, setImmunizations] = useState([]);
  const [immunizationForm, setImmunizationForm] = useState({
    immunization: '',
    date: '',
    location: '',
  });
  const [noCurrentImmunizations, setNoCurrentImmunizations] = useState(false);

  const handleImmunizationSave = () => {
    const timestamp = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());
    setImmunizations((prev) => [...prev, { ...immunizationForm, timestamp }]);
    setImmunizationForm({
      immunization: '',
      date: '',
      location: '',
    });
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
                  value={immunizationForm.date}
                  onChange={(e) => setImmunizationForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="immunization-location">Location</Label>
                <Input
                  id="immunization-location"
                  placeholder="Location"
                  value={immunizationForm.location}
                  onChange={(e) => setImmunizationForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleImmunizationSave}>
              Add Immunization
            </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {immunizations.map((im, idx) => (
                  <TableRow key={`${im.immunization}-${idx}`}>
                    <TableCell className="font-medium">{im.immunization || '-'}</TableCell>
                    <TableCell>{im.date || '-'}</TableCell>
                    <TableCell>{im.location || '-'}</TableCell>
                    <TableCell>{im.timestamp}</TableCell>
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


