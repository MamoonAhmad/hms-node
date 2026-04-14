import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, AlertTriangle, Pill, Calendar, DollarSign, Shield, Bell, LayoutDashboard, ClipboardList, FileCheck, Stethoscope, FileText, Code, CreditCard } from 'lucide-react';
import { SOAPNotesTab } from './SOAPNotesTab';
import { PatientOrderEntryTab } from './PatientOrderEntryTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { NurseAssessmentSummaryContent } from './NurseAssessmentSummaryContent';
import { DocumentsSummaryContent } from './DocumentsSummaryContent';
import { ClaimForm } from './ClaimForm';
import { cn } from '@/lib/utils';

// Placeholder data for clinical snapshot (replace with API/context later)
const mockSummary = {
  name: 'John Doe',
  age: 45,
  gender: 'Male',
  mrn: 'MRN-001234',
  contact: '(555) 123-4567',
  allergies: [
    { name: 'Penicillin', severity: 'Critical' },
    { name: 'Peanuts', severity: 'High' },
  ],
  chronicConditions: ['Type 2 Diabetes', 'Hypertension', 'COPD'],
  currentMedications: ['Metformin 500mg BID', 'Lisinopril 10mg daily', 'Albuterol inhaler PRN'],
  lastVisitDate: '2025-02-15',
  upcomingAppointment: '2025-03-01 at 10:00 AM — Dr. Smith, Follow-up',
  outstandingBills: '$240.00',
  insurance: {
    primary: 'Blue Cross Blue Shield',
    id: 'XYZ-123456',
    group: 'GRP-789',
  },
  alerts: [
    { type: 'High-risk', message: 'Diabetes – monitor A1C' },
    { type: 'Pending', message: 'Lab results pending (CMP, HbA1c)' },
  ],
};

const SUMMARY_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'results', label: 'Results', icon: FileCheck },
  { id: 'nurse-assessment', label: 'Nurse assessment', icon: Stethoscope },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'diagnosis-codes', label: 'Diagnosis codes', icon: Code },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

function PatientSummarySectionContent({ sectionId }) {
  if (sectionId === 'billing') {
    return <ClaimForm />;
  }
  const titles = {
    orders: 'Orders',
    results: 'Results',
    'nurse-assessment': 'Nurse assessment',
    documents: 'Documents',
    'diagnosis-codes': 'Diagnosis codes',
  };
  const title = titles[sectionId] || sectionId;
  const descriptions = {
    orders: 'Lab orders, imaging orders, and other clinical orders for this encounter. Content for this section will be shown here.',
    results: 'Lab results, imaging reports, and other result documents. Content for this section will be shown here.',
    'nurse-assessment': 'Nurse assessment findings and vital signs documentation. Content for this section will be shown here.',
    documents: 'Uploaded documents, consent forms, and patient-provided materials. Content for this section will be shown here.',
    'diagnosis-codes': 'ICD-10 diagnosis codes associated with this patient and encounter. Content for this section will be shown here.',
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{descriptions[sectionId]}</p>
      </CardContent>
    </Card>
  );
}

function PatientSummaryTab() {
  const [selectedSection, setSelectedSection] = useState('overview');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Patient Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_3fr]">
        {/* Left column – 70% – overview cards OR section-specific content */}
        <div className="min-w-0">
          {selectedSection === 'overview' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Patient photo + demographics */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <User className="h-12 w-12" />
            </div>
            <div className="grid gap-1 text-sm min-w-0">
              <p className="font-semibold text-foreground text-base">{mockSummary.name}</p>
              <p><span className="text-muted-foreground">Age:</span> {mockSummary.age}</p>
              <p><span className="text-muted-foreground">Gender:</span> {mockSummary.gender}</p>
              <p><span className="text-muted-foreground">MRN:</span> <span className="font-mono">{mockSummary.mrn}</span></p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span className="text-muted-foreground">Contact:</span> {mockSummary.contact}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Last visit + Upcoming appointment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last visit</p>
              <p className="font-medium">{mockSummary.lastVisitDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Upcoming appointment</p>
              <p className="font-medium">{mockSummary.upcomingAppointment}</p>
            </div>
          </CardContent>
        </Card>

        {/* Allergies - highlighted in red */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {mockSummary.allergies.map((a, i) => (
                <li key={i} className="font-medium text-red-800 dark:text-red-300">
                  {a.name}
                  {a.severity === 'Critical' && (
                    <Badge variant="destructive" className="ml-2 text-xs">Critical</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Chronic conditions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chronic conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {mockSummary.chronicConditions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Current medications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Current medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {mockSummary.currentMedications.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Outstanding bills */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Outstanding bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{mockSummary.outstandingBills}</p>
          </CardContent>
        </Card>

        {/* Insurance summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Insurance summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Primary:</span> {mockSummary.insurance.primary}</p>
            <p><span className="text-muted-foreground">Member ID:</span> {mockSummary.insurance.id}</p>
            <p><span className="text-muted-foreground">Group:</span> {mockSummary.insurance.group}</p>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="lg:col-span-2 md:col-span-2 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Bell className="h-4 w-4" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {mockSummary.alerts.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 text-amber-700 dark:text-amber-400 border-amber-400">
                    {a.type}
                  </Badge>
                  <span className="text-muted-foreground">{a.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
          </div>
          ) : selectedSection === 'nurse-assessment' ? (
            <NurseAssessmentSummaryContent />
          ) : selectedSection === 'documents' ? (
            <DocumentsSummaryContent />
          ) : (
            <PatientSummarySectionContent sectionId={selectedSection} />
          )}
        </div>

        {/* Right column – 30% – section nav */}
        <div className="min-w-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                {SUMMARY_SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSection(id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50',
                      selectedSection === id
                        ? 'bg-muted text-foreground border-l-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('patient-summary');
  const { patientId } = useParams();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full gap-1 overflow-x-auto pb-2">
          <TabsTrigger value="patient-summary" className="text-sm whitespace-nowrap">
            Patient Summary
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-sm whitespace-nowrap">
            SOAP Notes
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-sm whitespace-nowrap">
            Orders
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-sm whitespace-nowrap">
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="results" className="text-sm whitespace-nowrap">
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patient-summary" className="mt-6">
          <PatientSummaryTab />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <SOAPNotesTab />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <PatientOrderEntryTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-6">
          <PrescriptionsTab />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <h1 className="text-2xl font-bold text-foreground">Patient Dashboard</h1>
          <p className="text-muted-foreground mt-2">Results content goes here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
