import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, X } from 'lucide-react';

// Static data
const currentMedications = [
  {
    id: 1,
    drugName: 'Metformin',
    dose: '500mg',
    frequency: 'Twice daily',
    duration: 'Ongoing',
    startDate: '2024-01-01',
  },
  {
    id: 2,
    drugName: 'Lisinopril',
    dose: '10mg',
    frequency: 'Once daily',
    duration: 'Ongoing',
    startDate: '2024-01-01',
  },
  {
    id: 3,
    drugName: 'Atorvastatin',
    dose: '20mg',
    frequency: 'Once daily',
    duration: 'Ongoing',
    startDate: '2024-03-15',
  },
  {
    id: 4,
    drugName: 'Aspirin',
    dose: '81mg',
    frequency: 'Once daily',
    duration: 'Ongoing',
    startDate: '2023-06-01',
  },
  {
    id: 5,
    drugName: 'Metoprolol',
    dose: '25mg',
    frequency: 'Twice daily',
    duration: 'Ongoing',
    startDate: '2024-02-10',
  },
];

export function MedicationsTab({ patient }) {
  const [medications, setMedications] = useState(currentMedications);

  const handleAddMedication = () => {
    // Mock: Add new medication
    const newMed = {
      id: Date.now(),
      drugName: 'New Medication',
      dose: '100mg',
      frequency: 'Once daily',
      duration: '30 days',
      startDate: new Date().toISOString().split('T')[0],
    };
    setMedications([...medications, newMed]);
  };

  const handleDiscontinue = (medId) => {
    // Mock: Remove medication
    setMedications(medications.filter((m) => m.id !== medId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Medications</h2>
        <Button onClick={handleAddMedication}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      No medications found
                    </TableCell>
                  </TableRow>
                ) : (
                  medications.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.drugName}</TableCell>
                      <TableCell>{med.dose}</TableCell>
                      <TableCell>{med.frequency}</TableCell>
                      <TableCell>{med.duration}</TableCell>
                      <TableCell>{new Date(med.startDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDiscontinue(med.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Discontinue
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
