import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Beaker,
  CreditCard,
  FileText,
  FlaskConical,
  Home,
  Landmark,
  MessageSquare,
  Microscope,
  Pill,
  Scan,
  Scissors,
  Share2,
  Syringe,
  Users,
} from 'lucide-react';
import { OverviewSection } from './OverviewSection';
import { DemographicsSection } from './DemographicsSection';
import { ContactsSection } from './ContactsSection';
import { InsuranceSection } from './InsuranceSection';
import { AppointmentsSection } from './AppointmentsSection';
import { EncountersSection } from './EncountersSection';
import { ProblemsSection } from './ProblemsSection';
import { AllergiesSection } from './AllergiesSection';
import { OrdersSection } from './OrdersSection';
import { DocumentsSection } from './DocumentsSection';
import { TimelineSection } from './TimelineSection';
import { PlaceholderSection } from './PlaceholderSection';

const PLACEHOLDERS = {
  'clinical-notes': { icon: FileText, title: 'Clinical Notes', description: 'SOAP, progress, nursing and other clinical notes.', emptyTitle: 'No clinical notes recorded.' },
  medications: { icon: Pill, title: 'Medications', description: 'Active, historical, and discontinued medications.', emptyTitle: 'No active medications recorded.' },
  laboratory: { icon: FlaskConical, title: 'Laboratory', description: 'Laboratory orders and results.', emptyTitle: 'No laboratory results available.' },
  imaging: { icon: Scan, title: 'Imaging', description: 'Radiology and imaging orders and reports.', emptyTitle: 'No imaging results available.' },
  procedures: { icon: Scissors, title: 'Procedures', description: 'Performed and ordered procedures.', emptyTitle: 'No procedures recorded.' },
  immunizations: { icon: Syringe, title: 'Immunizations', description: 'Immunization history and due vaccines.', emptyTitle: 'No immunizations recorded.' },
  vitals: { icon: Activity, title: 'Vitals', description: 'Historical vital signs and trends.', emptyTitle: 'No vitals recorded.' },
  assessments: { icon: BadgeCheck, title: 'Assessments', description: 'Screening and clinical assessments.', emptyTitle: 'No assessments recorded.' },
  flowsheets: { icon: Activity, title: 'Flowsheets', description: 'Time-based clinical flowsheets.', emptyTitle: 'No flowsheets available.' },
  communications: { icon: MessageSquare, title: 'Communications', description: 'Centralized patient communication log.', emptyTitle: 'No communications found.' },
  referrals: { icon: Share2, title: 'Referrals', description: 'Incoming and outgoing referrals.', emptyTitle: 'No referrals found.' },
  'care-team': { icon: Users, title: 'Care Team', description: 'Providers and staff involved in this patient’s care.', emptyTitle: 'No care team members recorded.' },
  'medical-history': { icon: Microscope, title: 'Medical History', description: 'Past medical conditions and hospitalizations.', emptyTitle: 'No medical history recorded.' },
  'surgical-history': { icon: Scissors, title: 'Surgical History', description: 'Surgeries and procedures history.', emptyTitle: 'No surgical history recorded.' },
  'family-history': { icon: Home, title: 'Family History', description: 'Family medical history.', emptyTitle: 'No family history recorded.' },
  'social-history': { icon: Beaker, title: 'Social History', description: 'Social determinants and lifestyle history.', emptyTitle: 'No social history recorded.' },
  billing: { icon: CreditCard, title: 'Billing Summary', description: 'High-level financial summary for this patient.', emptyTitle: 'No billing information available.' },
  audit: { icon: Landmark, title: 'Audit History', description: 'Chart access and change history.', emptyTitle: 'No audit records available.' },
  allergies: { icon: AlertTriangle, title: 'Allergies', description: 'Allergy information.', emptyTitle: 'No allergies recorded.' },
};

export function renderSection(sectionId, props) {
  switch (sectionId) {
    case 'overview':
      return <OverviewSection {...props} />;
    case 'demographics':
      return <DemographicsSection {...props} />;
    case 'contacts':
      return <ContactsSection {...props} />;
    case 'insurance':
      return <InsuranceSection {...props} />;
    case 'appointments':
      return <AppointmentsSection {...props} />;
    case 'encounters':
      return <EncountersSection {...props} />;
    case 'problems':
      return <ProblemsSection {...props} />;
    case 'allergies':
      return <AllergiesSection {...props} />;
    case 'orders':
      return <OrdersSection {...props} />;
    case 'documents':
      return <DocumentsSection {...props} />;
    case 'timeline':
      return <TimelineSection {...props} />;
    default: {
      const cfg = PLACEHOLDERS[sectionId];
      if (!cfg) return <PlaceholderSection title="Section" description="This section is not available." />;
      return <PlaceholderSection {...cfg} />;
    }
  }
}
