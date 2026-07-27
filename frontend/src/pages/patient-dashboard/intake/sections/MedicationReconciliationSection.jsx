import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { useIntake } from '../IntakeContext';
import {
  INTAKE_SECTIONS,
  MEDICATION_ACTIONS,
  MEDICATION_ROUTES,
  MEDICATION_FREQUENCIES,
} from '../intakeConstants';
import { medicationCatalogApi } from '@/services/api/medicationCatalog.api';

const emptyMed = () => ({
  medicationName: '',
  medicationCatalogId: null,
  dose: '',
  action: '',
  frequency: '',
  route: '',
  patientReported: false,
  verified: false,
});

function formatDose(med) {
  const dose = [med.defaultDose, med.defaultDoseUnit].filter(Boolean).join(' ').trim();
  if (dose) return dose;
  return [med.strength, med.strengthUnit].filter(Boolean).join(' ').trim();
}

function formatDisplayName(med) {
  const strengthLabel = [med.strength, med.strengthUnit].filter(Boolean).join(' ').trim();
  const baseName = med.name || med.genericName || med.brandName || 'Medication';
  if (
    strengthLabel &&
    !String(baseName).toLowerCase().includes(String(med.strength || '').toLowerCase())
  ) {
    return `${baseName} ${strengthLabel}`;
  }
  return baseName;
}

const ROUTE_ALIASES = {
  intravenous: 'IV',
  iv: 'IV',
  intramuscular: 'IM',
  im: 'IM',
  subcutaneous: 'Subcutaneous',
  sc: 'Subcutaneous',
  sq: 'Subcutaneous',
  oral: 'Oral',
  po: 'Oral',
  topical: 'Topical',
  inhalation: 'Inhalation',
  rectal: 'Rectal',
  sublingual: 'Sublingual',
};

function pickRoute(med) {
  if (!Array.isArray(med.route) || !med.route.length) return '';
  for (const candidate of med.route) {
    const key = String(candidate || '').toLowerCase();
    const aliased = ROUTE_ALIASES[key];
    if (aliased && MEDICATION_ROUTES.includes(aliased)) return aliased;
    const match = MEDICATION_ROUTES.find((r) => r.toLowerCase() === key);
    if (match) return match;
  }
  return '';
}

function pickFrequency(med) {
  const freq = med.defaultFrequency || '';
  if (!freq) return '';
  return (
    MEDICATION_FREQUENCIES.find((f) => f.toLowerCase() === String(freq).toLowerCase()) || ''
  );
}

export function MedicationReconciliationSection() {
  const { getRecordsBySection, saveSection, updateRecord, saving, isCertified } = useIntake();
  const records = getRecordsBySection(INTAKE_SECTIONS.MEDICATION_RECONCILIATION);
  const [open, setOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [noMedication, setNoMedication] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [medForm, setMedForm] = useState(emptyMed);
  const [pendingMeds, setPendingMeds] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef(null);

  const allMeds = records.flatMap((r) => {
    if (r.payload?.noMedication) {
      return [{ ...r.payload, recordId: r.id, isNoMed: true, medIndex: 0 }];
    }
    return (r.payload?.medications || []).map((m, medIndex) => ({
      ...m,
      recordId: r.id,
      medIndex,
    }));
  });

  useEffect(() => () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }, []);

  const searchFormulary = (term) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = String(term || '').trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await medicationCatalogApi.searchActive({ search: q, limit: 20 });
        setSearchResults(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectFormularyMed = (med) => {
    setMedForm((prev) => ({
      ...prev,
      medicationName: formatDisplayName(med),
      medicationCatalogId: med.id || null,
      dose: formatDose(med) || prev.dose,
      frequency: pickFrequency(med) || prev.frequency,
      route: pickRoute(med) || prev.route,
    }));
    setSearchResults([]);
  };

  const handleOpen = () => {
    setEditingRecordId(null);
    setNoMedication(false);
    setShowMedForm(false);
    setPendingMeds([]);
    setMedForm(emptyMed());
    setSearchResults([]);
    setOpen(true);
  };

  const openEdit = (item) => {
    const record = records.find((r) => r.id === item.recordId);
    if (!record) return;
    setEditingRecordId(record.id);
    if (record.payload?.noMedication || item.isNoMed) {
      setNoMedication(true);
      setPendingMeds([]);
      setShowMedForm(false);
    } else {
      setNoMedication(false);
      setPendingMeds(record.payload?.medications || []);
      setShowMedForm(false);
    }
    setMedForm(emptyMed());
    setSearchResults([]);
    setOpen(true);
  };

  const addPendingMed = () => {
    if (!medForm.medicationName) return;
    setPendingMeds((prev) => [...prev, medForm]);
    setMedForm(emptyMed());
    setSearchResults([]);
    setShowMedForm(false);
  };

  const handleSave = async () => {
    const payload = noMedication
      ? { noMedication: true, medications: [] }
      : { noMedication: false, medications: pendingMeds };

    if (editingRecordId) {
      await updateRecord(editingRecordId, { payload });
    } else {
      await saveSection({
        sectionType: INTAKE_SECTIONS.MEDICATION_RECONCILIATION,
        payload,
      });
    }
    setEditingRecordId(null);
    setOpen(false);
  };

  return (
    <IntakeSectionCard
      id="assessment-med-reconciliation"
      title="Medication Reconciliation"
      onAdd={handleOpen}
    >
      <IntakeInlineFormPanel
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditingRecordId(null);
            setSearchResults([]);
          }
        }}
        title={editingRecordId ? 'Edit Medication Reconciliation' : 'Medication Reconciliation'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || (!noMedication && pendingMeds.length === 0)}>
              {editingRecordId ? 'Save Changes' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id="no-medication"
            checked={noMedication}
            onCheckedChange={(c) => {
              setNoMedication(!!c);
              if (c) setShowMedForm(false);
            }}
          />
          <Label htmlFor="no-medication">No medication</Label>
        </div>

        {!noMedication && (
          <>
            <Button type="button" variant="outline" onClick={() => setShowMedForm(true)}>
              Add Medication
            </Button>
            {pendingMeds.length > 0 && (
              <div className="space-y-1 rounded border p-3 text-sm">
                {pendingMeds.map((m, i) => (
                  <p key={i}>{m.medicationName} — {m.dose} {m.frequency}</p>
                ))}
              </div>
            )}
            {showMedForm && (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative min-w-0 space-y-2">
                    <Label htmlFor="med-name">Medication Name</Label>
                    <Input
                      id="med-name"
                      className="h-9 w-full"
                      value={medForm.medicationName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMedForm((p) => ({
                          ...p,
                          medicationName: value,
                          medicationCatalogId: null,
                        }));
                        searchFormulary(value);
                      }}
                      placeholder="Search medication formulary..."
                      autoComplete="off"
                    />
                    {searching && (
                      <p className="text-xs text-muted-foreground">Searching formulary…</p>
                    )}
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                        {searchResults.map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => selectFormularyMed(row)}
                          >
                            <span className="font-medium">{formatDisplayName(row)}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {[
                                row.genericName,
                                row.dosageForm,
                                row.therapeuticCategory || row.medicationClass,
                                row.formularyStatus,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="med-dose">Dose</Label>
                    <Input
                      id="med-dose"
                      className="h-9 w-full"
                      value={medForm.dose}
                      onChange={(e) => setMedForm((p) => ({ ...p, dose: e.target.value }))}
                      placeholder="Dose"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="med-action">Action</Label>
                    <Select value={medForm.action} onValueChange={(v) => setMedForm((p) => ({ ...p, action: v }))}>
                      <SelectTrigger id="med-action" className="h-9 w-full">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_ACTIONS.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="med-frequency">Frequency</Label>
                    <Select value={medForm.frequency} onValueChange={(v) => setMedForm((p) => ({ ...p, frequency: v }))}>
                      <SelectTrigger id="med-frequency" className="h-9 w-full">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="med-route">Route</Label>
                    <Select value={medForm.route} onValueChange={(v) => setMedForm((p) => ({ ...p, route: v }))}>
                      <SelectTrigger id="med-route" className="h-9 w-full">
                        <SelectValue placeholder="Route" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_ROUTES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Patient Reported</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
                      <Checkbox
                        id="med-patient-reported"
                        checked={medForm.patientReported}
                        onCheckedChange={(c) => setMedForm((p) => ({ ...p, patientReported: !!c }))}
                      />
                      <Label htmlFor="med-patient-reported" className="font-normal">Yes</Label>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Verified</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
                      <Checkbox
                        id="med-verified"
                        checked={medForm.verified}
                        onCheckedChange={(c) => setMedForm((p) => ({ ...p, verified: !!c }))}
                      />
                      <Label htmlFor="med-verified" className="font-normal">Yes</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Button type="button" onClick={addPendingMed}>Add to List</Button>
                </div>
              </div>
            )}
          </>
        )}
      </IntakeInlineFormPanel>

      {allMeds.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMeds.map((m, i) => (
              <TableRow key={`${m.recordId}-${m.medIndex ?? i}`}>
                <TableCell className="font-medium">
                  {m.isNoMed ? 'No medication' : m.medicationName}
                </TableCell>
                <TableCell>{m.isNoMed ? '—' : m.dose || '—'}</TableCell>
                <TableCell>{m.isNoMed ? '—' : m.action || '—'}</TableCell>
                <TableCell>{m.isNoMed ? '—' : m.frequency || '—'}</TableCell>
                <TableCell>{m.isNoMed ? '—' : m.route || '—'}</TableCell>
                <TableCell>{m.isNoMed ? '—' : m.patientReported ? 'Yes' : 'No'}</TableCell>
                <TableCell>{m.isNoMed ? '—' : m.verified ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right">
                  <IntakeRecordActions
                    isCertified={isCertified}
                    onEdit={() => openEdit(m)}
                    onAmend={() => openEdit(m)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No medication reconciliation recorded.</p>
      )}
    </IntakeSectionCard>
  );
}
