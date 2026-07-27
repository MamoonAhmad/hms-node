import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Info,
  Pill,
  Search,
  Star,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { patientApi } from '@/services/api/patient.api';
import { patientProblemApi } from '@/services/api/patientProblem.api';
import { medicationOrderApi } from '@/services/api/medicationOrder.api';
import { medicationCatalogApi } from '@/services/api/medicationCatalog.api';
import {
  HANDLING_METHODS,
  HANDLING_LABELS,
  PHARMACY_OPTIONS,
  SIG_DURATIONS,
  SIG_FREQUENCIES,
  SIG_ROUTES,
  SIG_TEMPLATES,
  SIG_UNITS,
} from './medicationConstants';
import {
  buildSigPreview,
  getCdsAlerts,
  hasBlockingSafetyAlerts,
  runSafetyChecks,
} from './medicationSafety';
import {
  EMPTY_SIG,
  mapFormularyToCatalogItem,
  pickSigFromFormulary,
} from './medicationFormUtils';

function SeverityIcon({ severity }) {
  if (severity === 'Critical' || severity === 'Warning') {
    return <AlertTriangle className="h-4 w-4 shrink-0" />;
  }
  return <Info className="h-4 w-4 shrink-0" />;
}

export function MedicationOrderComposer({
  open,
  onOpenChange,
  patientId,
  appointmentId,
  isSampleChart,
  existingOrders = [],
  onSaved,
}) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [handlingMethod, setHandlingMethod] = useState('');
  const [sig, setSig] = useState(EMPTY_SIG);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [sampleNdc, setSampleNdc] = useState('');
  const [sampleLotNumber, setSampleLotNumber] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [quantity, setQuantity] = useState('');
  const [refills, setRefills] = useState('');
  const [daysSupply, setDaysSupply] = useState('');
  const [substitutionAllowed, setSubstitutionAllowed] = useState(true);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [draftOrders, setDraftOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patientContext, setPatientContext] = useState({
    allergies: [],
    activeProblems: [],
    currentMedications: [],
    weightKg: null,
    ageYears: null,
  });
  const [favorites, setFavorites] = useState(() => new Set());

  const resetComposer = useCallback(() => {
    setSearchQuery('');
    setSelectedMedication(null);
    setHandlingMethod('');
    setSig(EMPTY_SIG);
    setAdditionalInstructions('');
    setSampleNdc('');
    setSampleLotNumber('');
    setPharmacy('');
    setQuantity('');
    setRefills('');
    setDaysSupply('');
    setSubstitutionAllowed(true);
    setSafetyAcknowledged(false);
    setDraftOrders([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetComposer();
      return undefined;
    }

    if (isSampleChart) {
      setPatientContext({
        allergies: [
          { allergenName: 'Folic Acid' },
          { allergenName: 'Sulfa/Sulfonamides' },
          { allergenName: 'Cat (Feline) Derivatives' },
        ],
        activeProblems: [{ diagnosisDescription: 'Type 2 diabetes mellitus without complications' }],
        currentMedications: [{ medicationName: 'Aspirin' }],
        weightKg: 90.27,
        ageYears: 31,
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const [summaryRes, problemsRes] = await Promise.all([
          patientApi.getSummary(patientId, { encounterId: appointmentId }),
          patientProblemApi.getAll(patientId, { status: 'Active' }),
        ]);
        if (cancelled) return;
        const summary = summaryRes.data || {};
        const dob = summary.dateOfBirth ? new Date(summary.dateOfBirth) : null;
        const ageYears = dob
          ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;
        setPatientContext({
          allergies: summary.allergies || [],
          activeProblems: problemsRes.data || [],
          currentMedications: (summary.currentMedications || []).map((m) => ({
            medicationName: m.name || m.medicationName,
          })),
          weightKg: summary.weightKg ?? summary.vitals?.weight ?? null,
          ageYears,
        });
      } catch {
        if (!cancelled) {
          setPatientContext({ allergies: [], activeProblems: [], currentMedications: [], weightKg: null, ageYears: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, patientId, appointmentId, isSampleChart, resetComposer]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCatalogLoading(true);
      try {
        const res = await medicationCatalogApi.searchActive({
          search: searchQuery.trim() || undefined,
          limit: 50,
        });
        if (!cancelled) {
          const rows = Array.isArray(res?.data) ? res.data : [];
          setCatalogResults(rows.map(mapFormularyToCatalogItem));
        }
      } catch {
        if (!cancelled) setCatalogResults([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, open]);

  const sigPreview = useMemo(() => buildSigPreview(sig), [sig]);

  const safetyAlerts = useMemo(() => {
    if (!selectedMedication) return [];
    return runSafetyChecks({
      medication: selectedMedication,
      allergies: patientContext.allergies,
      activeProblems: patientContext.activeProblems,
      currentMedications: patientContext.currentMedications,
      existingOrders: [...existingOrders, ...draftOrders],
      patientAge: patientContext.ageYears,
      patientWeightKg: patientContext.weightKg,
      sig,
    });
  }, [selectedMedication, patientContext, existingOrders, draftOrders, sig]);

  const cdsAlerts = useMemo(
    () => getCdsAlerts({
      patientAge: patientContext.ageYears,
      activeProblems: patientContext.activeProblems,
    }),
    [patientContext],
  );

  const blockingSafety = hasBlockingSafetyAlerts(safetyAlerts);

  const canAddToDraft = Boolean(
    selectedMedication &&
    handlingMethod &&
    sig.dose &&
    sig.unit &&
    sig.route &&
    sig.frequency &&
    sig.duration &&
    (handlingMethod !== 'sample_given' || (sampleNdc.trim() && sampleLotNumber.trim())) &&
    (!blockingSafety || safetyAcknowledged),
  );

  const handleSelectMedication = (med) => {
    setSelectedMedication(med);
    setHandlingMethod('');
    setSafetyAcknowledged(false);
    setSig(pickSigFromFormulary(med));
    if (med.instructions) {
      setAdditionalInstructions(med.instructions);
    }
  };

  const handleApplySigTemplate = (template) => {
    setSig((prev) => ({
      ...prev,
      dose: template.dose,
      unit: template.unit,
      route: template.route,
      frequency: template.frequency,
      duration: template.duration,
    }));
  };

  const buildDraftPayload = () => ({
    appointmentId,
    medicationCatalogId: selectedMedication?.id?.startsWith('sample') ? null : selectedMedication?.id,
    medicationName: selectedMedication.name,
    medicationCode: selectedMedication.code,
    medicationClass: selectedMedication.medicationClass,
    strength: selectedMedication.strength,
    dosageForm: selectedMedication.dosageForm,
    formularyTier: selectedMedication.formularyStatus || selectedMedication.formularyTier,
    ndcSafetyFlag: selectedMedication.ndcSafetyFlag,
    handlingMethod,
    dose: sig.dose,
    unit: sig.unit,
    route: sig.route,
    frequency: sig.frequency,
    duration: sig.duration,
    prn: sig.prn,
    sigPreview,
    additionalInstructions: additionalInstructions.trim() || null,
    sampleNdc: handlingMethod === 'sample_given' ? sampleNdc.trim() : null,
    sampleLotNumber: handlingMethod === 'sample_given' ? sampleLotNumber.trim() : null,
    pharmacy: handlingMethod === 'send_to_pharmacy' ? pharmacy || null : null,
    quantity: quantity ? Number(quantity) : null,
    refills: refills ? Number(refills) : null,
    daysSupply: daysSupply ? Number(daysSupply) : null,
    substitutionAllowed,
    prescriber: user?.name || user?.email || null,
    safetyAlerts,
    safetyAcknowledged: blockingSafety ? safetyAcknowledged : true,
    status: 'Draft',
  });

  const handleAddToDraft = () => {
    if (!canAddToDraft) return;
    const draft = {
      ...buildDraftPayload(),
      id: `draft-${Date.now()}`,
      status: 'Draft',
    };
    setDraftOrders((prev) => [...prev, draft]);
    setSelectedMedication(null);
    setHandlingMethod('');
    setSig(EMPTY_SIG);
    setAdditionalInstructions('');
    setSampleNdc('');
    setSampleLotNumber('');
    setSafetyAcknowledged(false);
    setSearchQuery('');
  };

  const handleSaveDrafts = async () => {
    if (draftOrders.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      if (isSampleChart) {
        onSaved?.(draftOrders);
        onOpenChange(false);
        return;
      }
      await medicationOrderApi.bulkSave(patientId, {
        appointmentId,
        orders: draftOrders.map(({ id, ...rest }) => rest),
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save draft orders');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSign = async () => {
    if (draftOrders.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      if (isSampleChart) {
        onSaved?.(draftOrders.map((d) => ({ ...d, status: 'Signed' })));
        onOpenChange(false);
        return;
      }
      const saveRes = await medicationOrderApi.bulkSave(patientId, {
        appointmentId,
        orders: draftOrders.map(({ id, ...rest }) => rest),
      });
      const orderIds = (saveRes.data || []).map((o) => o.id);
      if (orderIds.length) {
        await medicationOrderApi.bulkSign(patientId, orderIds);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save and sign orders');
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = (code) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>New Order</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Search the catalog, configure SIG and handling, then add medications to draft orders.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {patientContext.allergies.length > 0 && (
          <div className="shrink-0 border-b bg-red-50 px-6 py-3 dark:bg-red-950/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800 dark:text-red-200">Allergy</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {patientContext.allergies.map((a, i) => (
                <Badge key={i} variant="destructive">{a.allergenName || a.name}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
          <div className="overflow-y-auto px-6 py-4">
            {!selectedMedication ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search medication formulary..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {catalogLoading
                      ? 'Searching formulary…'
                      : `${catalogResults.length} formulary medications`}
                  </p>
                  <Button variant="outline" size="sm" type="button">Create Custom Order</Button>
                </div>
                <div className="divide-y rounded-lg border">
                  {catalogResults.map((med) => (
                    <div
                      key={med.id || med.code}
                      className="flex w-full items-start gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        onClick={() => handleSelectMedication(med)}
                      >
                        <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{med.name}</span>
                            {med.preferredDrug ? (
                              <Badge variant="outline" className="text-[10px]">Preferred</Badge>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            <span>{med.genericName || '—'}</span>
                            <span>{med.strength}</span>
                            <span>{med.dosageForm}</span>
                            <span>{med.medicationClass}</span>
                            <span>{med.formularyTier || '—'}</span>
                            <span className="font-mono">{med.code}</span>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground hover:text-amber-500"
                        onClick={() => toggleFavorite(med.code)}
                        aria-label="Toggle favorite"
                      >
                        <Star className={cn('h-4 w-4', favorites.has(med.code) && 'fill-amber-400 text-amber-500')} />
                      </button>
                    </div>
                  ))}
                  {!catalogLoading && catalogResults.length === 0 && (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">No medications found</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{selectedMedication.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedMedication.medicationClass}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          Formulary: {selectedMedication.formularyTier || selectedMedication.formularyStatus || '—'}
                        </Badge>
                        <Badge variant="outline">NDC: {selectedMedication.ndc || selectedMedication.ndcSafetyFlag || '—'}</Badge>
                        {selectedMedication.genericName ? (
                          <Badge variant="outline">Generic: {selectedMedication.genericName}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedMedication(null)}>
                      Change medication
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">How should this medication be handled?</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {HANDLING_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={cn(
                          'rounded-lg border p-3 text-left transition-colors',
                          handlingMethod === method.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                            : 'hover:bg-muted/50',
                        )}
                        onClick={() => setHandlingMethod(method.id)}
                      >
                        <p className="font-medium">{method.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{method.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {handlingMethod === 'give_in_clinic' && (
                  <p className="text-sm text-muted-foreground">
                    This medication will appear on eMAR for administration by the care team.
                  </p>
                )}

                {handlingMethod === 'sample_given' && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <h4 className="font-medium">Sample Details</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>NDC *</Label>
                        <Input placeholder="e.g. 0071-0155-23" value={sampleNdc} onChange={(e) => setSampleNdc(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Lot Number *</Label>
                        <Input placeholder="e.g. ABC1234" value={sampleLotNumber} onChange={(e) => setSampleLotNumber(e.target.value)} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      NDC and lot number are recorded with the in-clinic administration in the eMAR.
                    </p>
                  </div>
                )}

                {handlingMethod === 'send_to_pharmacy' && (
                  <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Pharmacy</Label>
                      <Select value={pharmacy} onValueChange={setPharmacy}>
                        <SelectTrigger><SelectValue placeholder="Select pharmacy" /></SelectTrigger>
                        <SelectContent>
                          {PHARMACY_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Quantity</Label>
                      <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Refills</Label>
                      <Input type="number" value={refills} onChange={(e) => setRefills(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Days Supply</Label>
                      <Input type="number" value={daysSupply} onChange={(e) => setDaysSupply(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Checkbox checked={substitutionAllowed} onCheckedChange={setSubstitutionAllowed} id="substitution" />
                      <Label htmlFor="substitution">Substitution allowed</Label>
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      Medication will be transmitted through the e-prescribing network after signing.
                    </p>
                  </div>
                )}

                {handlingMethod === 'print' && (
                  <p className="text-sm text-muted-foreground">
                    This will be printed for patient to take to pharmacy. The order should be printable after signing.
                  </p>
                )}

                {handlingMethod && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Directions / SIG</Label>
                        <div className="flex flex-wrap gap-1">
                          {SIG_TEMPLATES.map((t) => (
                            <Button key={t.id} variant="outline" size="sm" type="button" onClick={() => handleApplySigTemplate(t)}>
                              {t.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                          <Label>Dose *</Label>
                          <Input value={sig.dose} onChange={(e) => setSig((s) => ({ ...s, dose: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Unit *</Label>
                          <Select value={sig.unit} onValueChange={(v) => setSig((s) => ({ ...s, unit: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SIG_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Route *</Label>
                          <Select value={sig.route} onValueChange={(v) => setSig((s) => ({ ...s, route: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SIG_ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Frequency *</Label>
                          <Select value={sig.frequency} onValueChange={(v) => setSig((s) => ({ ...s, frequency: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SIG_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Duration *</Label>
                          <Select value={sig.duration} onValueChange={(v) => setSig((s) => ({ ...s, duration: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SIG_DURATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2 pb-2">
                          <Checkbox checked={sig.prn} onCheckedChange={(c) => setSig((s) => ({ ...s, prn: Boolean(c) }))} id="prn" />
                          <Label htmlFor="prn">PRN</Label>
                        </div>
                      </div>
                      {sigPreview && (
                        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                          <span className="font-medium">SIG Preview: </span>{sigPreview}
                        </div>
                      )}
                      <Button variant="outline" size="sm" type="button">Save as SIG Template</Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Instructions</Label>
                      <Textarea value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)} rows={2} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Safety Checks</Label>
                      {safetyAlerts.length === 0 ? (
                        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200">
                          No drug interactions, allergy conflicts, or duplicate orders detected.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {safetyAlerts.map((alert, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                                alert.severity === 'Critical' && 'border-red-200 bg-red-50 text-red-800 dark:bg-red-950/30',
                                alert.severity === 'Warning' && 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30',
                                alert.severity === 'Info' && 'border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/30',
                              )}
                            >
                              <SeverityIcon severity={alert.severity} />
                              <span>{alert.message}</span>
                            </div>
                          ))}
                          {blockingSafety && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={safetyAcknowledged}
                                onCheckedChange={setSafetyAcknowledged}
                                id="ack-safety"
                              />
                              <Label htmlFor="ack-safety">I have reviewed and acknowledge the safety alerts above</Label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button onClick={handleAddToDraft} disabled={!canAddToDraft}>
                      Add Medication to Draft Orders
                    </Button>
                  </>
                )}
              </div>
            )}

            {draftOrders.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Draft Orders ({draftOrders.length})</h4>
                {draftOrders.map((d) => (
                  <div key={d.id} className="rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">{d.medicationName}</p>
                    <p className="text-muted-foreground">{HANDLING_LABELS[d.handlingMethod]} · {d.sigPreview}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="overflow-y-auto border-t bg-muted/20 px-4 py-4 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Patient Context</h4>
                <div className="mt-2 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Allergies</p>
                    <p>{patientContext.allergies.map((a) => a.allergenName || a.name).join(', ') || 'None recorded'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Active Problems</p>
                    <p>{patientContext.activeProblems.map((p) => p.diagnosisDescription).join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Current Medications</p>
                    <p>{patientContext.currentMedications.map((m) => m.medicationName).join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Patient Info</p>
                    <p>Weight: {patientContext.weightKg != null ? `${patientContext.weightKg} kg` : '—'}</p>
                    <p>Age: {patientContext.ageYears != null ? `${patientContext.ageYears} years` : '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold">CDS Alerts</h4>
                {cdsAlerts.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No active clinical decision support alerts</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {cdsAlerts.map((alert, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs">
                        <SeverityIcon severity={alert.severity} />
                        <span>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedMedication && (
                <div>
                  <h4 className="text-sm font-semibold">Order Preview</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">{selectedMedication.name}</p>
                    <p className="text-muted-foreground">Order type: Medication</p>
                    <p className="font-mono text-xs">{selectedMedication.code}</p>
                    {handlingMethod && <p>Handling: {HANDLING_LABELS[handlingMethod]}</p>}
                    {sigPreview && <p className="text-muted-foreground">{sigPreview}</p>}
                    <p>Status: Draft</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {error && (
          <div className="shrink-0 border-t bg-destructive/10 px-6 py-2 text-sm text-destructive">{error}</div>
        )}

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="outline" onClick={handleSaveDrafts} disabled={draftOrders.length === 0 || saving}>
            Save Draft Orders
          </Button>
          <Button onClick={handleSaveAndSign} disabled={draftOrders.length === 0 || saving}>
            Save & Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
