import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
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
  hasBlockingSafetyAlerts,
  runSafetyChecks,
} from './medicationSafety';
import { EMPTY_SIG, pickSigFromFormulary } from './medicationFormUtils';

function SeverityIcon({ severity }) {
  if (severity === 'Critical' || severity === 'Warning') {
    return <AlertTriangle className="h-4 w-4 shrink-0" />;
  }
  return <Info className="h-4 w-4 shrink-0" />;
}

/**
 * Right-side drawer with the medication order detail form
 * (same fields as Medications tab after selecting a formulary drug).
 */
export function MedicationOrderDetailSidebar({
  open,
  onClose,
  medication,
  initialDetails = null,
  existingOrders = [],
  patientContext = null,
  onConfirm,
  readOnly = false,
}) {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!open || !medication) return;

    if (initialDetails) {
      setHandlingMethod(initialDetails.handlingMethod || '');
      setSig({
        dose: initialDetails.dose || '',
        unit: initialDetails.unit || EMPTY_SIG.unit,
        route: initialDetails.route || EMPTY_SIG.route,
        frequency: initialDetails.frequency || EMPTY_SIG.frequency,
        duration: initialDetails.duration || EMPTY_SIG.duration,
        prn: !!initialDetails.prn,
      });
      setAdditionalInstructions(initialDetails.additionalInstructions || '');
      setSampleNdc(initialDetails.sampleNdc || '');
      setSampleLotNumber(initialDetails.sampleLotNumber || '');
      setPharmacy(initialDetails.pharmacy || '');
      setQuantity(initialDetails.quantity != null ? String(initialDetails.quantity) : '');
      setRefills(initialDetails.refills != null ? String(initialDetails.refills) : '');
      setDaysSupply(initialDetails.daysSupply != null ? String(initialDetails.daysSupply) : '');
      setSubstitutionAllowed(initialDetails.substitutionAllowed !== false);
      setSafetyAcknowledged(!!initialDetails.safetyAcknowledged);
      return;
    }

    setHandlingMethod('');
    setSig(pickSigFromFormulary(medication));
    setAdditionalInstructions(medication.instructions || '');
    setSampleNdc('');
    setSampleLotNumber('');
    setPharmacy('');
    setQuantity('');
    setRefills('');
    setDaysSupply('');
    setSubstitutionAllowed(true);
    setSafetyAcknowledged(false);
  }, [open, medication, initialDetails]);

  const sigPreview = useMemo(() => buildSigPreview(sig), [sig]);

  const safetyAlerts = useMemo(() => {
    if (!medication) return [];
    return runSafetyChecks({
      medication,
      allergies: patientContext?.allergies || [],
      activeProblems: patientContext?.activeProblems || [],
      currentMedications: patientContext?.currentMedications || [],
      existingOrders,
      patientAge: patientContext?.ageYears,
      patientWeightKg: patientContext?.weightKg,
      sig,
    });
  }, [medication, patientContext, existingOrders, sig]);

  const blockingSafety = hasBlockingSafetyAlerts(safetyAlerts);

  const canConfirm = Boolean(
    medication &&
      handlingMethod &&
      sig.dose &&
      sig.unit &&
      sig.route &&
      sig.frequency &&
      sig.duration &&
      (handlingMethod !== 'sample_given' || (sampleNdc.trim() && sampleLotNumber.trim())) &&
      (!blockingSafety || safetyAcknowledged),
  );

  const buildPayload = (status = 'Draft') => ({
    medicationCatalogId: medication?.id?.startsWith?.('sample') ? null : medication?.id,
    medicationName: medication.name,
    medicationCode: medication.code,
    medicationClass: medication.medicationClass,
    strength: medication.strength,
    dosageForm: medication.dosageForm,
    formularyTier: medication.formularyStatus || medication.formularyTier,
    ndcSafetyFlag: medication.ndcSafetyFlag,
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
    status,
  });

  const handleApplySigTemplate = (template) => {
    if (readOnly) return;
    setSig((prev) => ({
      ...prev,
      dose: template.dose,
      unit: template.unit,
      route: template.route,
      frequency: template.frequency,
      duration: template.duration,
    }));
  };

  if (!open || !medication) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close medication detail"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l bg-card shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Medication Order Detail</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{medication.name}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">{medication.name}</h3>
            <p className="text-sm text-muted-foreground">{medication.medicationClass}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                Formulary: {medication.formularyTier || medication.formularyStatus || '—'}
              </Badge>
              <Badge variant="outline">
                NDC: {medication.ndc || medication.ndcSafetyFlag || '—'}
              </Badge>
              {medication.genericName ? (
                <Badge variant="outline">Generic: {medication.genericName}</Badge>
              ) : null}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">How should this medication be handled?</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {HANDLING_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={readOnly}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    handlingMethod === method.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'hover:bg-muted/50',
                    readOnly && 'opacity-70',
                  )}
                  onClick={() => !readOnly && setHandlingMethod(method.id)}
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
                  <Input
                    placeholder="e.g. 0071-0155-23"
                    value={sampleNdc}
                    onChange={(e) => setSampleNdc(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Lot Number *</Label>
                  <Input
                    placeholder="e.g. ABC1234"
                    value={sampleLotNumber}
                    onChange={(e) => setSampleLotNumber(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          )}

          {handlingMethod === 'send_to_pharmacy' && (
            <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Pharmacy</Label>
                <Select value={pharmacy} onValueChange={setPharmacy} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pharmacy" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHARMACY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>Refills</Label>
                <Input
                  type="number"
                  value={refills}
                  onChange={(e) => setRefills(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>Days Supply</Label>
                <Input
                  type="number"
                  value={daysSupply}
                  onChange={(e) => setDaysSupply(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  checked={substitutionAllowed}
                  onCheckedChange={setSubstitutionAllowed}
                  id="orders-substitution"
                  disabled={readOnly}
                />
                <Label htmlFor="orders-substitution">Substitution allowed</Label>
              </div>
            </div>
          )}

          {handlingMethod === 'print' && (
            <p className="text-sm text-muted-foreground">
              This will be printed for patient to take to pharmacy after signing.
            </p>
          )}

          {handlingMethod && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Directions / SIG</Label>
                  {!readOnly && (
                    <div className="flex flex-wrap justify-end gap-1">
                      {SIG_TEMPLATES.map((t) => (
                        <Button
                          key={t.id}
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => handleApplySigTemplate(t)}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Dose *</Label>
                    <Input
                      value={sig.dose}
                      onChange={(e) => setSig((s) => ({ ...s, dose: e.target.value }))}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit *</Label>
                    <Select
                      value={sig.unit}
                      onValueChange={(v) => setSig((s) => ({ ...s, unit: v }))}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIG_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Route *</Label>
                    <Select
                      value={sig.route}
                      onValueChange={(v) => setSig((s) => ({ ...s, route: v }))}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIG_ROUTES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Frequency *</Label>
                    <Select
                      value={sig.frequency}
                      onValueChange={(v) => setSig((s) => ({ ...s, frequency: v }))}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIG_FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Duration *</Label>
                    <Select
                      value={sig.duration}
                      onValueChange={(v) => setSig((s) => ({ ...s, duration: v }))}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIG_DURATIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <Checkbox
                      checked={sig.prn}
                      onCheckedChange={(c) => setSig((s) => ({ ...s, prn: Boolean(c) }))}
                      id="orders-prn"
                      disabled={readOnly}
                    />
                    <Label htmlFor="orders-prn">PRN</Label>
                  </div>
                </div>
                {sigPreview && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-medium">SIG Preview: </span>
                    {sigPreview}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Additional Instructions</Label>
                <Textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  rows={2}
                  disabled={readOnly}
                />
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
                          alert.severity === 'Critical' &&
                            'border-red-200 bg-red-50 text-red-800 dark:bg-red-950/30',
                          alert.severity === 'Warning' &&
                            'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30',
                          alert.severity === 'Info' &&
                            'border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/30',
                        )}
                      >
                        <SeverityIcon severity={alert.severity} />
                        <span>{alert.message}</span>
                      </div>
                    ))}
                    {blockingSafety && !readOnly && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={safetyAcknowledged}
                          onCheckedChange={setSafetyAcknowledged}
                          id="orders-ack-safety"
                        />
                        <Label htmlFor="orders-ack-safety">
                          I have reviewed and acknowledge the safety alerts above
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {handlingMethod && (
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium">Order Preview</p>
                  <p className="text-muted-foreground">
                    {HANDLING_LABELS[handlingMethod]} · {sigPreview || '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: {initialDetails?.status || 'Draft'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button
              type="button"
              disabled={!canConfirm}
              onClick={() => onConfirm?.(buildPayload('Draft'))}
            >
              {initialDetails ? 'Update Order Detail' : 'Add Medication Order'}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
