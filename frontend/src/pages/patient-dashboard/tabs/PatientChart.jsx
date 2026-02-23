import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NurseAssessment } from './components/NurseAssessment';
import { OrdersSection } from './components/OrdersSection';
import { ClinicianNotesSection } from './components/ClinicianNotesSection';
import { DocumentsSection } from './components/DocumentsSection';
import { CodesSection } from './components/CodesSection';
import { BillingSection } from './components/BillingSection';
import {
  ClipboardList,
  FileText,
  Stethoscope,
  FileSearch,
  Code,
  DollarSign,
} from 'lucide-react';

export function PatientChart({ patientId }) {
  const [activeSection, setActiveSection] = useState('nurse-assessment');

  const menuItems = [
    { id: 'nurse-assessment', label: 'Nurse Assessment', icon: ClipboardList },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'clinician-notes', label: 'Clinician Notes', icon: Stethoscope },
    { id: 'documents', label: 'Documents', icon: FileSearch },
    { id: 'codes', label: 'Codes', icon: Code },
    { id: 'billing', label: 'Billing', icon: DollarSign },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Right Side Vertical Menu */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        {activeSection === 'nurse-assessment' && <NurseAssessment patientId={patientId} />}
        {activeSection === 'orders' && <OrdersSection patientId={patientId} />}
        {activeSection === 'clinician-notes' && <ClinicianNotesSection patientId={patientId} />}
        {activeSection === 'documents' && <DocumentsSection patientId={patientId} />}
        {activeSection === 'codes' && <CodesSection patientId={patientId} />}
        {activeSection === 'billing' && <BillingSection patientId={patientId} />}
      </div>
    </div>
  );
}


