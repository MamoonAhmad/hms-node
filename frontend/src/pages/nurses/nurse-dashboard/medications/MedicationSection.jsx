import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddMedicationDialog } from './AddMedicationDialog';

export function MedicationSection() {
  const [medications, setMedications] = useState([]);
  const [medicationForm, setMedicationForm] = useState({
    type: '',
    name: '',
    reason: '',
    dosage: '',
    frequency: '',
    startDate: '',
  });
  const [noCurrentMedication, setNoCurrentMedication] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  const handleMedicationSave = () => {
    const timestamp = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());
    setMedications((prev) => [...prev, { ...medicationForm, timestamp }]);
    setMedicationForm({
      type: '',
      name: '',
      reason: '',
      dosage: '',
      frequency: '',
      startDate: '',
    });
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Medication History</CardTitle>
        {!noCurrentMedication && (
          <Button size="sm" variant="outline" onClick={() => setShowMedicationForm(true)}>
            Add Medication
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Input id="medication-timestamp" className="hidden" disabled />
        <div className="flex items-center gap-3">
          <Checkbox
            id="no-current-medication"
            checked={noCurrentMedication}
            onCheckedChange={(checked) => setNoCurrentMedication(!!checked)}
          />
          <Label htmlFor="no-current-medication" className="text-sm">
            No current medication
          </Label>
        </div>

        {!noCurrentMedication && (
          <>
            <AddMedicationDialog
              open={showMedicationForm}
              onOpenChange={setShowMedicationForm}
              form={medicationForm}
              onFormChange={setMedicationForm}
              onSave={handleMedicationSave}
            />

            {medications.length > 0 && (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medications.map((m, idx) => (
                      <TableRow key={`${m.name}-${idx}`}>
                        <TableCell>{m.type || '-'}</TableCell>
                        <TableCell className="font-medium">{m.name || '-'}</TableCell>
                        <TableCell>{m.reason || '-'}</TableCell>
                        <TableCell>{m.dosage || '-'}</TableCell>
                        <TableCell>{m.frequency || '-'}</TableCell>
                        <TableCell>{m.startDate || '-'}</TableCell>
                        <TableCell>{m.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


