import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

// Static data
const activeProblems = [
  {
    id: 1,
    diagnosisName: 'Type 2 Diabetes',
    icdCode: 'E11.9',
    status: 'Active',
    onsetDate: '2020-01-15',
  },
  {
    id: 2,
    diagnosisName: 'Hypertension',
    icdCode: 'I10',
    status: 'Active',
    onsetDate: '2019-06-20',
  },
  {
    id: 3,
    diagnosisName: 'Hyperlipidemia',
    icdCode: 'E78.5',
    status: 'Active',
    onsetDate: '2021-03-10',
  },
];

const pastProblems = [
  {
    id: 4,
    diagnosisName: 'Acute Bronchitis',
    icdCode: 'J20.9',
    status: 'Resolved',
    onsetDate: '2023-03-10',
    resolvedDate: '2023-03-25',
  },
  {
    id: 5,
    diagnosisName: 'Upper Respiratory Infection',
    icdCode: 'J06.9',
    status: 'Resolved',
    onsetDate: '2022-11-05',
    resolvedDate: '2022-11-15',
  },
];

export function DiagnosesTab({ patient }) {
  const [activeSubTab, setActiveSubTab] = useState('active');
  const [activeDiagnoses, setActiveDiagnoses] = useState(activeProblems);
  const [pastDiagnoses] = useState(pastProblems);

  const handleAddDiagnosis = () => {
    // Mock: Add new diagnosis
    const newDiagnosis = {
      id: Date.now(),
      diagnosisName: 'New Diagnosis',
      icdCode: 'Z00.0',
      status: 'Active',
      onsetDate: new Date().toISOString().split('T')[0],
    };
    setActiveDiagnoses([...activeDiagnoses, newDiagnosis]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Diagnoses / Problem List</h2>
        <Button onClick={handleAddDiagnosis}>
          <Plus className="h-4 w-4 mr-2" />
          Add Diagnosis
        </Button>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="active">Active Problems</TabsTrigger>
          <TabsTrigger value="past">Past Problems</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeDiagnoses.map((diagnosis) => (
                  <div
                    key={diagnosis.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{diagnosis.diagnosisName}</p>
                      <p className="text-sm text-muted-foreground">
                        ICD-10: {diagnosis.icdCode} | Onset: {new Date(diagnosis.onsetDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{diagnosis.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Past Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pastDiagnoses.map((diagnosis) => (
                  <div
                    key={diagnosis.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{diagnosis.diagnosisName}</p>
                      <p className="text-sm text-muted-foreground">
                        ICD-10: {diagnosis.icdCode} | Resolved: {new Date(diagnosis.resolvedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{diagnosis.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
