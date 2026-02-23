import { useState } from 'react';
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
import { Plus } from 'lucide-react';

// Static data
const vitalsHistory = [
  {
    id: 1,
    date: '2025-01-20',
    bp: '120/80',
    pulse: '72',
    temperature: '98.6°F',
    spO2: '98%',
    weight: '75 kg',
    bmi: '24.5',
  },
  {
    id: 2,
    date: '2025-01-15',
    bp: '118/78',
    pulse: '70',
    temperature: '98.4°F',
    spO2: '99%',
    weight: '75 kg',
    bmi: '24.5',
  },
  {
    id: 3,
    date: '2025-01-10',
    bp: '122/82',
    pulse: '74',
    temperature: '98.7°F',
    spO2: '97%',
    weight: '76 kg',
    bmi: '24.8',
  },
];

export function VitalsTab({ patient }) {
  const [vitals, setVitals] = useState(vitalsHistory);
  const [newVitals, setNewVitals] = useState({
    bp: '',
    pulse: '',
    temperature: '',
    spO2: '',
    weight: '',
  });

  const calculateBMI = (weight) => {
    // Mock calculation - in real app would use height
    const weightNum = parseFloat(weight);
    if (!weightNum) return '';
    // Assuming height of 1.75m for demo
    const height = 1.75;
    const bmi = (weightNum / (height * height)).toFixed(1);
    return bmi;
  };

  const handleAddVitals = () => {
    if (newVitals.bp && newVitals.pulse) {
      const bmi = calculateBMI(newVitals.weight);
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ...newVitals,
        bmi: bmi || 'N/A',
      };
      setVitals([newEntry, ...vitals]);
      setNewVitals({ bp: '', pulse: '', temperature: '', spO2: '', weight: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vitals & Observations</h2>
        <Button onClick={handleAddVitals}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Vitals
        </Button>
      </div>

      {/* Vitals Entry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Blood Pressure</Label>
            <Input
              placeholder="120/80"
              value={newVitals.bp}
              onChange={(e) => setNewVitals({ ...newVitals, bp: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Pulse</Label>
            <Input
              placeholder="72 bpm"
              value={newVitals.pulse}
              onChange={(e) => setNewVitals({ ...newVitals, pulse: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Temperature</Label>
            <Input
              placeholder="98.6°F"
              value={newVitals.temperature}
              onChange={(e) => setNewVitals({ ...newVitals, temperature: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">SpO₂</Label>
            <Input
              placeholder="98%"
              value={newVitals.spO2}
              onChange={(e) => setNewVitals({ ...newVitals, spO2: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Weight</Label>
            <Input
              placeholder="75 kg"
              value={newVitals.weight}
              onChange={(e) => setNewVitals({ ...newVitals, weight: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">BMI</Label>
            <Input
              value={calculateBMI(newVitals.weight) || 'N/A'}
              readOnly
              className="bg-muted"
            />
          </CardContent>
        </Card>
      </div>

      {/* Vitals History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vitals History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>Pulse</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>SpO₂</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>BMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vitals.map((vital) => (
                  <TableRow key={vital.id}>
                    <TableCell>{new Date(vital.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{vital.bp}</TableCell>
                    <TableCell>{vital.pulse} bpm</TableCell>
                    <TableCell>{vital.temperature}</TableCell>
                    <TableCell>{vital.spO2}</TableCell>
                    <TableCell>{vital.weight}</TableCell>
                    <TableCell>{vital.bmi}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
