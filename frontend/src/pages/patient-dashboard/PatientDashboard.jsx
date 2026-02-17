import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OverviewTab } from './tabs/OverviewTab';
import { SOAPNotesTab } from './tabs/SOAPNotesTab';
import { OrdersTab } from './tabs/OrdersTab';
import { ResultsTab } from './tabs/ResultsTab';

// Mock patient data - static data only
const mockPatientData = {
  id: 1,
  mrn: 'MRN-001',
  firstName: 'John',
  lastName: 'Doe',
  name: 'John Doe',
  dob: '1985-05-15',
  dateOfBirth: '1985-05-15',
  age: 39,
  gender: 'M',
  visitType: 'OPD',
  providerName: 'Dr. Sarah Smith',
  encounterDate: '2025-01-20',
  encounterTime: '10:30 AM',
  insuranceName: 'Blue Cross Blue Shield',
  patientStatus: 'In Process',
  allergies: [
    { name: 'Penicillin', severity: 'Critical' },
    { name: 'Peanuts', severity: 'High' },
  ],
  criticalAlerts: [
    { type: 'Diabetes Alert', message: 'Monitor blood glucose levels' },
  ],
};

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [patient] = useState(mockPatientData);

  return (
    <div className="space-y-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <Card className="border-0 rounded-none">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-xl font-bold">{patient.name}</h2>
                  <Badge variant="secondary">{patient.mrn}</Badge>
                  <span className="text-muted-foreground">
                    {patient.age} Years, {patient.gender === 'M' ? 'Male' : 'Female'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Visit Type: </span>
                    <span className="font-medium">{patient.visitType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider: </span>
                    <span className="font-medium">{patient.providerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Encounter: </span>
                    <span className="font-medium">
                      {patient.encounterDate} {patient.encounterTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DOB: </span>
                    <span className="font-medium">
                      {new Date(patient.dob).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="default">{patient.patientStatus}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Allergies:</span>
                      {patient.allergies.map((allergy, idx) => (
                        <Badge
                          key={idx}
                          variant={allergy.severity === 'Critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {allergy.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {patient.criticalAlerts && patient.criticalAlerts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Alerts:</span>
                      {patient.criticalAlerts.map((alert, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {alert.type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full gap-1 overflow-x-auto pb-2">
            <TabsTrigger value="overview" className="text-xs whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="soap-notes" className="text-xs whitespace-nowrap">Charts</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs whitespace-nowrap">Orders</TabsTrigger>
            <TabsTrigger value="results" className="text-xs whitespace-nowrap">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab patient={patient} />
          </TabsContent>

          <TabsContent value="soap-notes" className="mt-6">
            <SOAPNotesTab patient={patient} />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersTab patient={patient} />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsTab patient={patient} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
