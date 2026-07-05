import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SocialHistorySection } from '@/pages/nurses/nurse-dashboard/social/SocialHistorySection';
import { MedicationSection } from '@/pages/nurses/nurse-dashboard/medications/MedicationSection';
import { ImmunizationSection } from '@/pages/nurses/nurse-dashboard/immunizations/ImmunizationSection';
import { ROSSection } from '@/pages/nurses/nurse-dashboard/ros/ROSSection';
import { ChiefComplaintHPISection } from './sections/ChiefComplaintHPISection';
import { IntakeSignatureSection } from './sections/IntakeSignatureSection';
import { IntakeVitalsSection } from './sections/IntakeVitalsSection';
import { IntakeAllergiesSection } from './sections/IntakeAllergiesSection';
import {
  FamilyHistorySection,
  HospitalEdVisitSection,
  MedicationReconciliationSection,
  SurgicalHistorySection,
} from './sections/GenericIntakeSections';
import { INTAKE_SECTIONS } from './intakeConstants';

const SECTION_COMPONENTS = {
  chief_complaint_hpi: ChiefComplaintHPISection,
  vitals: IntakeVitalsSection,
  allergies: IntakeAllergiesSection,
  medication_reconciliation: MedicationReconciliationSection,
  ros: ROSSection,
  medication_history: MedicationSection,
  immunization: ImmunizationSection,
  surgical_history: SurgicalHistorySection,
  social_history: SocialHistorySection,
  family_history: FamilyHistorySection,
  hospital_ed_visit: HospitalEdVisitSection,
  intake_signature: IntakeSignatureSection,
};

export function IntakeNurseAssessmentPanel() {
  const [activeSection, setActiveSection] = useState(INTAKE_SECTIONS[0].id);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(`intake-section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav
        className="shrink-0 lg:sticky lg:top-4 lg:w-56"
        aria-label="Nurse assessment sections"
      >
        <div className="flex gap-2 overflow-x-auto rounded-lg border bg-muted/30 p-2 lg:flex-col lg:overflow-visible">
          {INTAKE_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors',
                activeSection === section.id
                  ? 'bg-card font-medium text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        {INTAKE_SECTIONS.map((section) => {
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          return (
            <div key={section.id} id={`intake-section-${section.id}`}>
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
}
