import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const physicalExamTemplates = {
  generalAppearance: [
    { label: 'Normal', value: 'Alert, oriented, in no acute distress.' },
    { label: 'Abnormal', value: 'Ill-appearing; in mild distress.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  heent: [
    { label: 'Normal', value: 'HEENT: Normocephalic, atraumatic; PERRLA; EOMI; mucous membranes moist.' },
    { label: 'Abnormal', value: 'HEENT: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  cardiovascular: [
    { label: 'Normal', value: 'CVS: Regular rate and rhythm; no murmurs/rubs/gallops.' },
    { label: 'Abnormal', value: 'CVS: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  respiratory: [
    { label: 'Normal', value: 'RS: Clear to auscultation bilaterally; no wheezes/rales/rhonchi.' },
    { label: 'Abnormal', value: 'RS: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  abdomen: [
    { label: 'Normal', value: 'Abdomen: Soft, non-tender, non-distended; bowel sounds present.' },
    { label: 'Abnormal', value: 'Abdomen: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  musculoskeletal: [
    { label: 'Normal', value: 'MSK: Normal range of motion; no deformities.' },
    { label: 'Abnormal', value: 'MSK: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  neurological: [
    { label: 'Normal', value: 'Neuro: Alert and oriented; cranial nerves grossly intact; no focal deficits.' },
    { label: 'Abnormal', value: 'Neuro: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
  skin: [
    { label: 'Normal', value: 'Skin: Warm, dry; no rashes or lesions.' },
    { label: 'Abnormal', value: 'Skin: Abnormal findings noted.' },
    { label: 'Not examined', value: 'Not examined.' },
  ],
};

export function ClinicalNotesModal({ isOpen, onClose, onSave, patient, note }) {
  const [collapsedSections, setCollapsedSections] = useState({
    subjective: false,
    objective: false,
    assessment: false,
    plan: false,
  });

  const [formData, setFormData] = useState({
    // Header
    encounterDate: '',
    encounterTime: '',
    visitType: 'OPD',
    provider: '',
    department: '',
    // Subjective
    chiefComplaint: '',
    historyOfPresentIllness: '',
    ros: '',
    painScale: '',
    durationOfSymptoms: '',
    associatedSymptoms: '',
    pastMedicalHistory: '',
    drugAllergies: '',
    currentMedicationsReported: '',
    // Objective - Vitals
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    spO2: '',
    weight: '',
    height: '',
    bmi: '',
    // Objective - Physical Examination
    generalAppearance: '',
    heent: '',
    cardiovascular: '',
    respiratory: '',
    abdomen: '',
    musculoskeletal: '',
    neurological: '',
    skin: '',
    // Assessment
    primaryDiagnosis: '',
    clinicalImpressionNotes: '',
    // Plan - Medications
    medications: [],
    // Plan - Further Plan
    furtherPlan: '',
    // Plan - Patient Instructions
    lifestyleAdvice: '',
    warningSigns: '',
    homeCareGuidance: '',
    // Plan - Follow-Up
    followUpDate: '',
    // Signatures
    providerName: '',
    signedByProvider: false,
    signedDateTime: '',
    // Addendum
    addendumText: '',
  });

  const [newMedication, setNewMedication] = useState({
    drugName: '',
    dose: '',
    frequency: '',
    duration: '',
    specialInstructions: '',
  });


  useEffect(() => {
    if (note && !note.isAddendum) {
      setFormData((prev) => ({
        ...prev,
        ...note,
        medications: note.medications || [],
      }));
    } else if (!note || note.isAddendum) {
      const now = new Date();
      setFormData((prev) => ({
        ...prev,
        encounterDate: now.toISOString().split('T')[0],
        encounterTime: now.toTimeString().slice(0, 5),
        visitType: 'OPD',
        provider: patient?.providerName || '',
        providerName: patient?.providerName || '',
      }));
    }
  }, [note, patient, isOpen]);

  useEffect(() => {
    const weightNum = parseFloat(formData.weight);
    const heightNum = parseFloat(formData.height);
    if (weightNum && heightNum && heightNum > 0) {
      const heightInMeters = heightNum / 100; // Convert cm to meters
      const bmi = (weightNum / (heightInMeters * heightInMeters)).toFixed(1);
      setFormData((prev) => ({ ...prev, bmi }));
    } else if (!formData.weight || !formData.height) {
      setFormData((prev) => ({ ...prev, bmi: '' }));
    }
  }, [formData.weight, formData.height]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleSection = (section) => {
    setCollapsedSections({ ...collapsedSections, [section]: !collapsedSections[section] });
  };

  const applyPhysicalExamTemplate = (field, templateValue) => {
    setFormData({ ...formData, [field]: templateValue });
  };

  const handleAddMedication = () => {
    if (newMedication.drugName) {
      setFormData({
        ...formData,
        medications: [...formData.medications, { ...newMedication, id: Date.now() }],
      });
      setNewMedication({
        drugName: '',
        dose: '',
        frequency: '',
        duration: '',
        specialInstructions: '',
      });
    }
  };

  const handleRemoveMedication = (id) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((m) => m.id !== id),
    });
  };

  const isAddendum = note?.isAddendum;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[700px] max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAddendum ? 'Add Addendum' : note ? 'Edit Clinical Note' : 'Add Clinical Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Header Section */}
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-base">Common Header Section</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Patient Name</Label>
                  <Input value={patient?.name || 'N/A'} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Patient ID / MRN</Label>
                  <Input value={patient?.mrn || 'N/A'} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Age</Label>
                  <Input value={`${patient?.age || 'N/A'} Years`} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <Input
                    value={patient?.gender === 'M' ? 'Male' : 'Female'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="encounterDate">Encounter Date *</Label>
                  <Input
                    id="encounterDate"
                    type="date"
                    value={formData.encounterDate}
                    onChange={(e) => setFormData({ ...formData, encounterDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="encounterTime">Encounter Time *</Label>
                  <Input
                    id="encounterTime"
                    type="time"
                    value={formData.encounterTime}
                    onChange={(e) => setFormData({ ...formData, encounterTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="visitType">Visit Type *</Label>
                  <Select
                    value={formData.visitType}
                    onValueChange={(value) => setFormData({ ...formData, visitType: value })}
                    required
                  >
                    <SelectTrigger id="visitType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPD">OPD</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="provider">Provider / Consultant Name *</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="Enter provider name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department / Specialty</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Enter department"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {isAddendum && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Addendum to Note dated: {note?.date ? new Date(note.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          )}

          {/* S: Subjective Section */}
          <Card>
            <CardHeader
              className="bg-blue-50 cursor-pointer"
              onClick={() => toggleSection('subjective')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">S: Subjective</CardTitle>
                {collapsedSections.subjective ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {!collapsedSections.subjective && (
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                  <Input
                    id="chiefComplaint"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    placeholder="Enter chief complaint"
                  />
                </div>
                <div>
                  <Label htmlFor="historyOfPresentIllness">History of Present Illness</Label>
                  <Textarea
                    id="historyOfPresentIllness"
                    value={formData.historyOfPresentIllness}
                    onChange={(e) =>
                      setFormData({ ...formData, historyOfPresentIllness: e.target.value })
                    }
                    placeholder="Enter history of present illness"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="ros">ROS</Label>
                  <Textarea
                    id="ros"
                    value={formData.ros}
                    onChange={(e) => setFormData({ ...formData, ros: e.target.value })}
                    placeholder="Enter review of systems"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="painScale">Pain Scale (0-10)</Label>
                    <Select
                      value={formData.painScale}
                      onValueChange={(value) => setFormData({ ...formData, painScale: value })}
                    >
                      <SelectTrigger id="painScale">
                        <SelectValue placeholder="Select pain scale" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="durationOfSymptoms">Duration of Symptoms</Label>
                    <Input
                      id="durationOfSymptoms"
                      value={formData.durationOfSymptoms}
                      onChange={(e) =>
                        setFormData({ ...formData, durationOfSymptoms: e.target.value })
                      }
                      placeholder="e.g., 3 days, 2 weeks"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="associatedSymptoms">Associated Symptoms</Label>
                  <Textarea
                    id="associatedSymptoms"
                    value={formData.associatedSymptoms}
                    onChange={(e) =>
                      setFormData({ ...formData, associatedSymptoms: e.target.value })
                    }
                    placeholder="Enter associated symptoms"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="pastMedicalHistory">Past Medical History (Brief)</Label>
                  <Textarea
                    id="pastMedicalHistory"
                    value={formData.pastMedicalHistory}
                    onChange={(e) =>
                      setFormData({ ...formData, pastMedicalHistory: e.target.value })
                    }
                    placeholder="Enter past medical history"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="drugAllergies">Drug Allergies</Label>
                  <Textarea
                    id="drugAllergies"
                    value={formData.drugAllergies}
                    onChange={(e) => setFormData({ ...formData, drugAllergies: e.target.value })}
                    placeholder="Enter drug allergies"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="currentMedicationsReported">Current Medications (Patient Reported)</Label>
                  <Textarea
                    id="currentMedicationsReported"
                    value={formData.currentMedicationsReported}
                    onChange={(e) =>
                      setFormData({ ...formData, currentMedicationsReported: e.target.value })
                    }
                    placeholder="Enter current medications as reported by patient"
                    rows={3}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* O: Objective Section */}
          <Card>
            <CardHeader
              className="bg-green-50 cursor-pointer"
              onClick={() => toggleSection('objective')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">O: Objective</CardTitle>
                {collapsedSections.objective ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {!collapsedSections.objective && (
              <CardContent className="pt-4 space-y-6">
                {/* Vitals Sub-Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-4">Vitals</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="bloodPressure">Blood Pressure</Label>
                      <Input
                        id="bloodPressure"
                        value={formData.bloodPressure}
                        onChange={(e) =>
                          setFormData({ ...formData, bloodPressure: e.target.value })
                        }
                        placeholder="120/80"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heartRate">Heart Rate</Label>
                      <Input
                        id="heartRate"
                        value={formData.heartRate}
                        onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                        placeholder="72 bpm"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        value={formData.temperature}
                        onChange={(e) =>
                          setFormData({ ...formData, temperature: e.target.value })
                        }
                        placeholder="98.6°F"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                      <Input
                        id="respiratoryRate"
                        value={formData.respiratoryRate}
                        onChange={(e) =>
                          setFormData({ ...formData, respiratoryRate: e.target.value })
                        }
                        placeholder="16/min"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spO2">SpO₂</Label>
                      <Input
                        id="spO2"
                        value={formData.spO2}
                        onChange={(e) => setFormData({ ...formData, spO2: e.target.value })}
                        placeholder="98%"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="75"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="175"
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bmi">BMI (Auto-calculated)</Label>
                      <Input
                        id="bmi"
                        value={formData.bmi || 'N/A'}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Examination Sub-Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-4">Physical Examination (By Systems)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="generalAppearance">General Appearance</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('generalAppearance', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.generalAppearance.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="generalAppearance"
                        value={formData.generalAppearance}
                        onChange={(e) =>
                          setFormData({ ...formData, generalAppearance: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="heent">HEENT</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('heent', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.heent.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="heent"
                        value={formData.heent}
                        onChange={(e) => setFormData({ ...formData, heent: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardiovascular">Cardiovascular</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('cardiovascular', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.cardiovascular.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="cardiovascular"
                        value={formData.cardiovascular}
                        onChange={(e) =>
                          setFormData({ ...formData, cardiovascular: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="respiratory">Respiratory</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('respiratory', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.respiratory.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="respiratory"
                        value={formData.respiratory}
                        onChange={(e) =>
                          setFormData({ ...formData, respiratory: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="abdomen">Abdomen</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('abdomen', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.abdomen.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="abdomen"
                        value={formData.abdomen}
                        onChange={(e) => setFormData({ ...formData, abdomen: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="musculoskeletal">Musculoskeletal</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('musculoskeletal', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.musculoskeletal.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="musculoskeletal"
                        value={formData.musculoskeletal}
                        onChange={(e) =>
                          setFormData({ ...formData, musculoskeletal: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="neurological">Neurological</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('neurological', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.neurological.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="neurological"
                        value={formData.neurological}
                        onChange={(e) =>
                          setFormData({ ...formData, neurological: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="skin">Skin</Label>
                      <div className="mt-2 mb-2">
                        <Select onValueChange={(value) => applyPhysicalExamTemplate('skin', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {physicalExamTemplates.skin.map((t) => (
                              <SelectItem key={t.label} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="skin"
                        value={formData.skin}
                        onChange={(e) => setFormData({ ...formData, skin: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* A: Assessment Section */}
          <Card>
            <CardHeader
              className="bg-yellow-50 cursor-pointer"
              onClick={() => toggleSection('assessment')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">A: Assessment</CardTitle>
                {collapsedSections.assessment ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {!collapsedSections.assessment && (
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
                  <Input
                    id="primaryDiagnosis"
                    value={formData.primaryDiagnosis}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryDiagnosis: e.target.value })
                    }
                    placeholder="Enter primary diagnosis"
                  />
                </div>
                <div>
                  <Label htmlFor="clinicalImpressionNotes">Clinical Impression Notes</Label>
                  <Textarea
                    id="clinicalImpressionNotes"
                    value={formData.clinicalImpressionNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, clinicalImpressionNotes: e.target.value })
                    }
                    placeholder="Enter clinical impression notes"
                    rows={4}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* P: Plan Section */}
          <Card>
            <CardHeader
              className="bg-purple-50 cursor-pointer"
              onClick={() => toggleSection('plan')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">P: Plan</CardTitle>
                {collapsedSections.plan ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {!collapsedSections.plan && (
              <CardContent className="pt-4 space-y-6">
                {/* Further Plan */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-4">Further Plan</h4>
                  <div>
                    <Label htmlFor="furtherPlan">Further Plan</Label>
                    <Textarea
                      id="furtherPlan"
                      value={formData.furtherPlan}
                      onChange={(e) => setFormData({ ...formData, furtherPlan: e.target.value })}
                      placeholder="Enter further plan"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Medications Sub-Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-4">Medications</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Input
                          placeholder="Drug Name"
                          value={newMedication.drugName}
                          onChange={(e) =>
                            setNewMedication({ ...newMedication, drugName: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Dose"
                          value={newMedication.dose}
                          onChange={(e) =>
                            setNewMedication({ ...newMedication, dose: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Frequency"
                          value={newMedication.frequency}
                          onChange={(e) =>
                            setNewMedication({ ...newMedication, frequency: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Duration"
                          value={newMedication.duration}
                          onChange={(e) =>
                            setNewMedication({ ...newMedication, duration: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Special Instructions"
                          value={newMedication.specialInstructions}
                          onChange={(e) =>
                            setNewMedication({ ...newMedication, specialInstructions: e.target.value })
                          }
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddMedication}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Medication
                        </Button>
                      </div>
                    </div>
                    {formData.medications.length > 0 && (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Drug Name</TableHead>
                              <TableHead>Dose</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Special Instructions</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.medications.map((med) => (
                              <TableRow key={med.id}>
                                <TableCell className="font-medium">{med.drugName}</TableCell>
                                <TableCell>{med.dose}</TableCell>
                                <TableCell>{med.frequency}</TableCell>
                                <TableCell>{med.duration}</TableCell>
                                <TableCell>{med.specialInstructions || '-'}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMedication(med.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Instructions Sub-Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-4">Patient Instructions</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lifestyleAdvice">Lifestyle Advice</Label>
                      <Textarea
                        id="lifestyleAdvice"
                        value={formData.lifestyleAdvice}
                        onChange={(e) =>
                          setFormData({ ...formData, lifestyleAdvice: e.target.value })
                        }
                        placeholder="Enter lifestyle advice"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="warningSigns">Warning Signs</Label>
                      <Textarea
                        id="warningSigns"
                        value={formData.warningSigns}
                        onChange={(e) =>
                          setFormData({ ...formData, warningSigns: e.target.value })
                        }
                        placeholder="Enter warning signs to watch for"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="homeCareGuidance">Home Care Guidance</Label>
                      <Textarea
                        id="homeCareGuidance"
                        value={formData.homeCareGuidance}
                        onChange={(e) =>
                          setFormData({ ...formData, homeCareGuidance: e.target.value })
                        }
                        placeholder="Enter home care guidance"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-Up Sub-Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-4">Follow-Up</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="followUpDate">Follow-up Date</Label>
                      <Input
                        id="followUpDate"
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) =>
                          setFormData({ ...formData, followUpDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Addendum Section - Only show if it's an addendum */}
          {isAddendum && (
            <Card>
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-base">Addendum</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="addendumText">Addendum Text *</Label>
                  <Textarea
                    id="addendumText"
                    value={formData.addendumText || ''}
                    onChange={(e) => setFormData({ ...formData, addendumText: e.target.value })}
                    placeholder="Enter addendum text"
                    rows={5}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Added By</Label>
                    <Input
                      value={formData.provider || 'Current User'}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      value={new Date().toLocaleString()}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signatures & Legal Section - Only show if not addendum */}
          {!isAddendum && (
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-base">Signatures & Legal</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="providerName">Provider Name</Label>
                  <Input
                    id="providerName"
                    value={formData.providerName}
                    onChange={(e) =>
                      setFormData({ ...formData, providerName: e.target.value })
                    }
                    placeholder="Enter provider name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signedByProvider"
                    checked={formData.signedByProvider}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        signedByProvider: checked,
                        signedDateTime: checked ? new Date().toISOString() : '',
                      });
                    }}
                  />
                  <Label htmlFor="signedByProvider" className="cursor-pointer">
                    Signed by Provider
                  </Label>
                </div>
                {formData.signedByProvider && (
                  <div>
                    <Label>Date & Time of Signing</Label>
                    <Input
                      value={
                        formData.signedDateTime
                          ? new Date(formData.signedDateTime).toLocaleString()
                          : ''
                      }
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{formData.signedByProvider ? 'Checkout' : 'Save Note'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
