import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IntakeSectionShell } from '../IntakeSectionShell';
import { useIntake } from '../IntakeContext';

function GenericIntakeForm({ title, open, onOpenChange, onSave, fields, emptyForm, sectionKey }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { saveSection } = useIntake();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await saveSection(sectionKey, form);
      onSave?.();
      onOpenChange(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.fullWidth ? 'sm:col-span-2 space-y-2' : 'space-y-2'}>
              <Label>{field.label}</Label>
              {field.type === 'select' ? (
                <Select value={form[field.key]} onValueChange={(v) => update(field.key, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  rows={field.rows || 3}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                />
              ) : (
                <Input
                  type={field.type || 'text'}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function createSection(title, sectionKey, fields, emptyForm, summaryKeys) {
  return function Section() {
    return (
      <IntakeSectionShell
        title={title}
        sectionKey={sectionKey}
        renderSummary={(data) => summaryKeys.map((k) => data[k]).filter(Boolean).join(' · ')}
      >
        {({ open, onOpenChange, onSaved }) => (
          <GenericIntakeForm
            title={title}
            sectionKey={sectionKey}
            fields={fields}
            emptyForm={emptyForm}
            open={open}
            onOpenChange={onOpenChange}
            onSave={onSaved}
          />
        )}
      </IntakeSectionShell>
    );
  };
}

export const MedicationReconciliationSection = createSection(
  'Medication Reconciliation',
  'medication_reconciliation',
  [
    { key: 'noMedications', label: 'No medications', type: 'select', options: ['No', 'Yes'] },
    { key: 'medicationName', label: 'Medication name' },
    { key: 'dose', label: 'Dose' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'route', label: 'Route' },
    { key: 'action', label: 'Action', type: 'select', options: ['Continue', 'Discontinue', 'Hold', 'New'] },
    { key: 'patientReported', label: 'Patient reported', type: 'select', options: ['Yes', 'No'] },
    { key: 'verified', label: 'Verified', type: 'select', options: ['Yes', 'No'] },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
  ],
  {
    noMedications: 'No',
    medicationName: '',
    dose: '',
    frequency: '',
    route: '',
    action: 'Continue',
    patientReported: 'Yes',
    verified: 'No',
    notes: '',
  },
  ['medicationName', 'dose', 'action'],
);

export const SurgicalHistorySection = createSection(
  'Past Surgical History',
  'surgical_history',
  [
    { key: 'procedureName', label: 'Procedure name' },
    { key: 'procedureDate', label: 'Procedure date', type: 'date' },
    { key: 'surgeon', label: 'Surgeon' },
    { key: 'facility', label: 'Facility' },
    {
      key: 'anesthesiaType',
      label: 'Anesthesia type',
      type: 'select',
      options: ['General', 'Local', 'Regional', 'Spinal', 'Epidural', 'Sedation', 'None', 'Unknown'],
    },
    {
      key: 'outcome',
      label: 'Outcome',
      type: 'select',
      options: ['Successful', 'Partially Successful', 'Unsuccessful', 'Complication Occurred', 'Unknown'],
    },
    { key: 'complications', label: 'Complications', type: 'textarea', fullWidth: true },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
  ],
  {
    procedureName: '',
    procedureDate: '',
    surgeon: '',
    facility: '',
    anesthesiaType: 'Unknown',
    outcome: 'Successful',
    complications: '',
    notes: '',
  },
  ['procedureName', 'procedureDate', 'surgeon'],
);

export const FamilyHistorySection = createSection(
  'Family History',
  'family_history',
  [
    {
      key: 'relationship',
      label: 'Relationship',
      type: 'select',
      options: ['Mother', 'Father', 'Sister', 'Brother', 'Other Relative'],
    },
    { key: 'condition', label: 'Condition' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Resolved', 'Unknown'] },
    { key: 'ageAtOnset', label: 'Age at onset' },
    { key: 'livingStatus', label: 'Living status', type: 'select', options: ['Yes', 'No', 'Unknown'] },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
  ],
  {
    relationship: '',
    condition: '',
    status: 'Active',
    ageAtOnset: '',
    livingStatus: 'Unknown',
    notes: '',
  },
  ['relationship', 'condition', 'status'],
);

export const HospitalEdVisitSection = createSection(
  'Recent Hospital / ED Visit',
  'hospital_ed_visit',
  [
    {
      key: 'visitType',
      label: 'Visit type',
      type: 'select',
      options: [
        'Emergency Department Visit',
        'Inpatient Admission',
        'Observation Stay',
        'Urgent Care Visit',
        'Other',
      ],
    },
    { key: 'facilityName', label: 'Facility name' },
    { key: 'admissionDate', label: 'Admission date', type: 'date' },
    { key: 'dischargeDate', label: 'Discharge date', type: 'date' },
    { key: 'chiefComplaint', label: 'Chief complaint / reason', type: 'textarea', fullWidth: true },
    { key: 'primaryDiagnosis', label: 'Primary diagnosis' },
    {
      key: 'outcome',
      label: 'Outcome',
      type: 'select',
      options: ['Discharged Home', 'Admitted', 'Transferred', 'Left Against Medical Advice (AMA)', 'Expired', 'Unknown'],
    },
    { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
  ],
  {
    visitType: '',
    facilityName: '',
    admissionDate: '',
    dischargeDate: '',
    chiefComplaint: '',
    primaryDiagnosis: '',
    outcome: 'Discharged Home',
    notes: '',
  },
  ['visitType', 'facilityName', 'admissionDate'],
);
