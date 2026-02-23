import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { VitalsTable } from './VitalsTable';
import { AllergiesTable } from './AllergiesTable';
import { NurseNotesTable } from './NurseNotesTable';
import { FallRiskTable } from './FallRiskTable';
import { SuicideRatingTable } from './SuicideRatingTable';
import { ROSTable } from './ROSTable';
import { MedicalHistoryTable } from './MedicalHistoryTable';

export function NurseAssessment({ patientId }) {
  const [activeTab, setActiveTab] = useState('all');

  // Mock data
  const mockVitals = [
    {
      id: 1,
      takenBy: 'Nurse Johnson',
      takenAt: '2025-01-15T10:30:00',
      bp: '120/80',
      pulse: 72,
      temperature: '98.6°F',
      weight: '180 lbs',
      height: '5\'10"',
      bloodGroup: 'O+',
      painAssessment: '3/10',
      glucose: '95 mg/dL',
      o2Saturation: '98%',
    },
  ];

  const mockAllergies = [
    {
      id: 1,
      allergyType: 'Drug',
      allergyName: 'Penicillin',
      onsetDate: '2020-01-15',
      severity: 'Severe',
      reaction: 'Rash, Hives',
      status: 'Active',
      takenBy: 'Nurse Johnson',
      takenAt: '2025-01-15T10:30:00',
      endDate: null,
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="nurse-notes">Nurse Notes</TabsTrigger>
            <TabsTrigger value="fall-risk">Fall Risk</TabsTrigger>
            <TabsTrigger value="suicide-rating">Suicide Rating</TabsTrigger>
            <TabsTrigger value="ros">ROS</TabsTrigger>
            <TabsTrigger value="medical-history">Medical History</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            <VitalsTable data={mockVitals} />
            <AllergiesTable data={mockAllergies} />
            <NurseNotesTable data={[]} />
            <FallRiskTable data={[]} />
            <SuicideRatingTable data={[]} />
            <ROSTable data={[]} />
            <MedicalHistoryTable data={[]} />
          </TabsContent>

          <TabsContent value="vitals" className="mt-6">
            <VitalsTable data={mockVitals} />
          </TabsContent>

          <TabsContent value="allergies" className="mt-6">
            <AllergiesTable data={mockAllergies} />
          </TabsContent>

          <TabsContent value="nurse-notes" className="mt-6">
            <NurseNotesTable data={[]} />
          </TabsContent>

          <TabsContent value="fall-risk" className="mt-6">
            <FallRiskTable data={[]} />
          </TabsContent>

          <TabsContent value="suicide-rating" className="mt-6">
            <SuicideRatingTable data={[]} />
          </TabsContent>

          <TabsContent value="ros" className="mt-6">
            <ROSTable data={[]} />
          </TabsContent>

          <TabsContent value="medical-history" className="mt-6">
            <MedicalHistoryTable data={[]} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


