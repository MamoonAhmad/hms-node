import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Static data
const activeDiagnoses = [
  { id: 1, name: 'Type 2 Diabetes', code: 'E11.9', status: 'Active' },
  { id: 2, name: 'Hypertension', code: 'I10', status: 'Active' },
  { id: 3, name: 'Hyperlipidemia', code: 'E78.5', status: 'Active' },
];

const recentVitals = [
  { date: '2025-01-20', bp: '120/80', pulse: '72', temp: '98.6°F', spO2: '98%', weight: '75 kg' },
  { date: '2025-01-15', bp: '118/78', pulse: '70', temp: '98.4°F', spO2: '99%', weight: '75 kg' },
  { date: '2025-01-10', bp: '122/82', pulse: '74', temp: '98.7°F', spO2: '97%', weight: '76 kg' },
];

const latestLabResults = [
  { test: 'HbA1c', result: '6.5%', normalRange: '<7%', flag: 'Normal', date: '2025-01-15' },
  { test: 'Cholesterol', result: '180 mg/dL', normalRange: '<200 mg/dL', flag: 'Normal', date: '2025-01-15' },
  { test: 'LDL', result: '110 mg/dL', normalRange: '<100 mg/dL', flag: 'Abnormal', date: '2025-01-15' },
];

export function OverviewTab({ patient }) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Patient Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {patient.name} is a {patient.age}-year-old {patient.gender === 'M' ? 'male' : 'female'} patient 
            with a history of Type 2 Diabetes and Hypertension. Currently on multiple medications for 
            chronic disease management. Last visit was for routine follow-up. Patient is compliant 
            with medications and follows dietary recommendations.
          </p>
        </CardContent>
      </Card>

      {/* Active Diagnoses */}
      <Card>
        <CardHeader>
          <CardTitle>Active Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeDiagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{diagnosis.name}</p>
                  <p className="text-sm text-muted-foreground">ICD-10: {diagnosis.code}</p>
                </div>
                <Badge variant="secondary">{diagnosis.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>Pulse</TableHead>
                  <TableHead>Temp</TableHead>
                  <TableHead>SpO₂</TableHead>
                  <TableHead>Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVitals.map((vital, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{new Date(vital.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{vital.bp}</TableCell>
                    <TableCell>{vital.pulse} bpm</TableCell>
                    <TableCell>{vital.temp}</TableCell>
                    <TableCell>{vital.spO2}</TableCell>
                    <TableCell>{vital.weight}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Latest Lab Results */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Lab Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Normal Range</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestLabResults.map((lab, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{lab.test}</TableCell>
                    <TableCell>{lab.result}</TableCell>
                    <TableCell className="text-muted-foreground">{lab.normalRange}</TableCell>
                    <TableCell>
                      <Badge variant={lab.flag === 'Normal' ? 'default' : 'destructive'}>
                        {lab.flag}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(lab.date).toLocaleDateString()}</TableCell>
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
