import { useState, useEffect } from 'react';
import { VitalsSection } from './vitals/VitalsSection';
import { AllergiesSection } from './allergies/AllergiesSection';
import { SocialHistorySection } from './social/SocialHistorySection';
import { FallRiskSection } from './safety/FallRiskSection';
import { SuicideAssessmentSection } from './safety/SuicideAssessmentSection';
import { HungerScreeningSection } from './safety/HungerScreeningSection';
import { PHQ9Section } from './safety/PHQ9Section';
import { DAST10Section } from './safety/DAST10Section';
import { GAD7Section } from './safety/GAD7Section';
import { NIHStrokeScaleSection } from './safety/NIHStrokeScaleSection';
import { PainAssessmentSection } from './safety/PainAssessmentSection';
import { MedicationSection } from './medications/MedicationSection';
import { ImmunizationSection } from './immunizations/ImmunizationSection';
import { ROSSection } from './ros/ROSSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const noteTypes = [
  'Triage Note',
  'Vital Signs Note',
  'Initial Assessment Note',
  'Chief Complaint Documentation',
  'Allergy Verification Note',
  'Medication Reconciliation Note',
  'Immunization / Vaccination Note',
  'Procedure Assistance Note',
  'Wound Care / Dressing Note',
  'Injection / Infusion Note',
  'Patient Education / Counseling Note',
  'Follow-up Visit Note',
  'Pre-Consultation Note',
  'Post-Consultation Note',
  'Lab Sample Collection Note',
  'Specimen Handling Note',
  'Referral Coordination Note',
  'Discharge / Visit Completion Note',
  'Adverse Reaction Note',
  'Incident Report Note',
  'Telephone / Telehealth Note',
  'Appointment Reschedule Note',
  'No-Show Documentation Note',
  'Care Coordination Note',
  'Device Use / Teaching Note (e.g., inhaler, glucometer)',
  'Pain Assessment Note',
  'Nutrition Advice Note',
  'Psychosocial Assessment Note',
  'Infection Control Screening Note',
  'Other / General Nursing Note',
];

// All assessments from both tabs for the Assessment review listing
const NURSE_ASSESSMENT_ITEMS = [
  { id: 'vitals', name: 'Patient Vitals', tab: 'nurse-assessment', component: <VitalsSection /> },
  { id: 'allergies', name: 'Allergies', tab: 'nurse-assessment', component: <AllergiesSection /> },
  { id: 'ros', name: 'ROS', tab: 'nurse-assessment', component: <ROSSection /> },
  { id: 'social-history', name: 'Social History', tab: 'nurse-assessment', component: <SocialHistorySection /> },
  { id: 'medication', name: 'Medication History', tab: 'nurse-assessment', component: <MedicationSection /> },
  { id: 'immunization', name: 'Current Immunization', tab: 'nurse-assessment', component: <ImmunizationSection /> },
];

const SCREENING_ASSESSMENT_ITEMS = [
  { id: 'fall-risk', name: 'Fall Risk Assessment', tab: 'patient-screening', component: <FallRiskSection /> },
  { id: 'suicide', name: 'Suicide Assessment', tab: 'patient-screening', component: <SuicideAssessmentSection /> },
  { id: 'hunger', name: 'Hunger Screening', tab: 'patient-screening', component: <HungerScreeningSection /> },
  { id: 'phq9', name: 'PHQ-9 Depression Screening', tab: 'patient-screening', component: <PHQ9Section /> },
  { id: 'dast10', name: 'Drug Abuse Screening (DAST-10)', tab: 'patient-screening', component: <DAST10Section /> },
  { id: 'gad7', name: 'GAD-7 Anxiety Severity', tab: 'patient-screening', component: <GAD7Section /> },
  { id: 'nih-stroke', name: 'NIH Stroke Scale', tab: 'patient-screening', component: <NIHStrokeScaleSection /> },
  { id: 'pain', name: 'Pain Assessment', tab: 'patient-screening', component: <PainAssessmentSection /> },
];

const ALL_ASSESSMENTS = [...NURSE_ASSESSMENT_ITEMS, ...SCREENING_ASSESSMENT_ITEMS];

export function NurseDashboard() {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [noteType, setNoteType] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('nurse-assessment');
  const [openAccordions, setOpenAccordions] = useState([]);
  const [assessmentStatus, setAssessmentStatus] = useState(() =>
    ALL_ASSESSMENTS.reduce((acc, a) => ({ ...acc, [a.id]: false }), {})
  );
  const [viewAssessmentId, setViewAssessmentId] = useState(null);

  useEffect(() => {
    const toDateTimeLocal = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const h = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d}T${h}:${min}`;
    };
    setDateTime(toDateTimeLocal());
  }, []);

  useEffect(() => {
    // Set current date time when modal opens and reset form for new note
    if (isNotesModalOpen) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      setNoteType('');
      setNotes('');
    }
  }, [isNotesModalOpen]);

  const handleSaveDraft = () => {
    // TODO: Implement save as draft functionality
    console.log('Saving as draft:', { noteType, dateTime, notes });
    // Don't close modal when saving as draft
  };

  const handleSaveNotes = () => {
    // TODO: Implement save notes functionality
    console.log('Saving notes:', { noteType, dateTime, notes });
    setIsNotesModalOpen(false);
    // Reset form
    setNoteType('');
    setNotes('');
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving nurse assessment...');
  };

  const handleViewAssessment = (id) => {
    setViewAssessmentId(id);
  };

  const handleEditAssessment = (assessment) => {
    setActiveTab(assessment.tab);
    if (assessment.tab === 'patient-screening') {
      setOpenAccordions([assessment.id]);
    } else {
      setTimeout(() => {
        const el = document.getElementById(`assessment-${assessment.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const viewAssessment = viewAssessmentId ? ALL_ASSESSMENTS.find((a) => a.id === viewAssessmentId) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Patient&apos;s Nurse Assessment</h1>
        <p className="text-muted-foreground">Manage nurse assessment details</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="nurse-assessment">Nurse Assessment</TabsTrigger>
          <TabsTrigger value="patient-screening">Patient Screening</TabsTrigger>
          <TabsTrigger value="assessment-review">Assessment Review</TabsTrigger>
        </TabsList>

        <TabsContent value="nurse-assessment" className="mt-6 space-y-6">
          <div id="assessment-vitals">
            <VitalsSection />
          </div>
          <div id="assessment-allergies">
            <AllergiesSection />
          </div>
          <div id="assessment-ros">
            <ROSSection />
          </div>
          <div id="assessment-social-history">
            <SocialHistorySection />
          </div>
          <div id="assessment-medication">
            <MedicationSection />
          </div>
          <div id="assessment-immunization">
            <ImmunizationSection />
          </div>

          <div className="space-y-4 pt-2 border-t pt-6">
            <Label className="text-base font-semibold">Nurse Notes</Label>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noteType-inline">Note Type</Label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger id="noteType-inline" className="w-full">
                    <SelectValue placeholder="Select note type" />
                  </SelectTrigger>
                  <SelectContent>
                    {noteTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTime-inline">Date Time</Label>
                <Input
                  id="dateTime-inline"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes-inline">Notes</Label>
                <Textarea
                  id="notes-inline"
                  placeholder="Enter nurse notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                  Save as Draft
                </Button>
                <Button type="button" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNotesModalOpen(true)}
              className="w-full md:w-auto"
            >
              Add More Notes
            </Button>
            <Button onClick={handleSave} className="w-full md:w-auto ml-2">
              Save Nurse Assessment
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="patient-screening" className="mt-6">
          <Accordion
            type="multiple"
            value={openAccordions}
            onValueChange={setOpenAccordions}
            className="w-full space-y-1"
          >
            {SCREENING_ASSESSMENT_ITEMS.map(({ id, name, component }) => (
              <AccordionItem key={id} value={id} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <span className="font-semibold text-foreground">{name}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">{component}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="assessment-review" className="mt-6">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Assessment</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_ASSESSMENTS.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.name}</TableCell>
                    <TableCell>
                      <Badge variant={assessmentStatus[assessment.id] ? 'default' : 'secondary'}>
                        {assessmentStatus[assessment.id] ? 'Completed' : 'Uncompleted'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAssessment(assessment.id)}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAssessment(assessment)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assessment View Modal (read-only) */}
      <Dialog open={!!viewAssessmentId} onOpenChange={(open) => !open && setViewAssessmentId(null)}>
        <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewAssessment?.name ?? 'Assessment'}</DialogTitle>
          </DialogHeader>
          <div className="pointer-events-none select-none opacity-95">
            <fieldset disabled className="border-0 min-w-0 p-0 m-0 space-y-0">
              {viewAssessment && viewAssessment.component}
            </fieldset>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewAssessmentId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nurse Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Nurse Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="noteType">Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTime">Date Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter nurse notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsNotesModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button type="button" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


