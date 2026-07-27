import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Loader2, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { runSafetyChecks } from '../medications/medicationSafety';
import { SIG_ROUTES } from '../medications/medicationConstants';
import { getAdministrationMeta } from './administrationType';
import {
  ADMINISTRATION_STATUS_OPTIONS,
  FIVE_RIGHTS,
  HOLD_REASONS,
  MISSED_REASONS,
  REFUSAL_REASONS,
  SYMPTOM_SEVERITY_OPTIONS,
} from './emarConstants';

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function AlertList({ alerts, acknowledged, onAcknowledge }) {
  if (!alerts?.length) return null;
  const hasCritical = alerts.some((a) => a.severity === 'Critical');

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <AlertTriangle className="h-4 w-4" />
        Clinical Decision Support Alerts
      </p>
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={cn(
            'rounded border px-2 py-1.5 text-sm',
            alert.severity === 'Critical'
              ? 'border-red-300 bg-red-50 text-red-900'
              : alert.severity === 'Warning'
                ? 'border-amber-300 bg-white text-amber-900'
                : 'border-blue-200 bg-white text-blue-900',
          )}
        >
          <Badge variant="outline" className="mr-2 text-[10px]">
            {alert.type}
          </Badge>
          {alert.message}
        </div>
      ))}
      {hasCritical && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={acknowledged} onCheckedChange={onAcknowledge} />
          I acknowledge critical alerts and wish to proceed
        </label>
      )}
    </div>
  );
}

export function AdministerMedicationDialog({
  open,
  onOpenChange,
  entry,
  panel,
  onSubmit,
  submitting,
}) {
  const [status, setStatus] = useState('Administered');
  const [administrationDate, setAdministrationDate] = useState(todayDateStr());
  const [administrationTime, setAdministrationTime] = useState(nowTimeStr());
  const [doseGiven, setDoseGiven] = useState('');
  const [route, setRoute] = useState('');
  const [site, setSite] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [needleGauge, setNeedleGauge] = useState('');
  const [actuations, setActuations] = useState('');
  const [applicationAmount, setApplicationAmount] = useState('');
  const [witnessRequired, setWitnessRequired] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [comments, setComments] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [missedReason, setMissedReason] = useState('');
  const [prnReason, setPrnReason] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState('');
  const [preAssessment, setPreAssessment] = useState('');
  const [postAssessment, setPostAssessment] = useState('');
  const [effectivenessEvaluation, setEffectivenessEvaluation] = useState('');
  const [fiveRights, setFiveRights] = useState({
    rightPatient: false,
    rightMedication: false,
    rightDose: false,
    rightRoute: false,
    rightTime: false,
  });
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setStatus('Administered');
    setAdministrationDate(todayDateStr());
    setAdministrationTime(nowTimeStr());
    setDoseGiven(entry.dose || '');
    setRoute(entry.route || '');
    setSite('');
    setVolumeMl('');
    setNeedleGauge('');
    setActuations('');
    setApplicationAmount('');
    setWitnessRequired(false);
    setWitnessName('');
    setComments('');
    setHoldReason('');
    setRefusalReason('');
    setMissedReason('');
    setPrnReason('');
    setSymptomSeverity('');
    setPreAssessment('');
    setPostAssessment('');
    setEffectivenessEvaluation('');
    setFiveRights({
      rightPatient: false,
      rightMedication: false,
      rightDose: false,
      rightRoute: false,
      rightTime: false,
    });
    setSafetyAcknowledged(false);
  }, [entry, open]);

  const safetyAlerts = useMemo(() => {
    if (!entry) return [];
    return runSafetyChecks({
      medication: {
        name: entry.medicationName,
        medicationName: entry.medicationName,
        medicationClass: entry.medicationClass,
      },
      allergies: panel?.allergies || [],
      existingOrders: [],
      patientAge: panel?.age,
      sig: { dose: entry.dose, unit: entry.unit, route: entry.route },
    });
  }, [entry, panel]);

  const adminMeta = useMemo(() => getAdministrationMeta(entry || {}), [entry]);

  const allFiveRightsVerified = FIVE_RIGHTS.every((r) => fiveRights[r.key]);
  const hasCriticalAlerts = safetyAlerts.some((a) => a.severity === 'Critical');
  const siteRequiredForType = adminMeta.requiresSite && status === 'Administered';
  const canSubmit =
    allFiveRightsVerified &&
    (!hasCriticalAlerts || safetyAcknowledged) &&
    (status !== 'Held' || holdReason) &&
    (status !== 'Refused' || refusalReason) &&
    (status !== 'Missed' || missedReason) &&
    (!siteRequiredForType || site) &&
    (!entry?.prn || status !== 'Administered' || prnReason.trim());

  const toggleRight = (key) => {
    setFiveRights((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    // The API only persists a subset of fields; fold type-specific administration
    // details into the comments so they are captured in the record.
    const detailParts = [];
    if (volumeMl) detailParts.push(`Volume: ${volumeMl} mL`);
    if (needleGauge) detailParts.push(`Needle: ${needleGauge}`);
    if (actuations) detailParts.push(`Actuations: ${actuations}`);
    if (applicationAmount) detailParts.push(`Amount applied: ${applicationAmount}`);
    const detailSummary = detailParts.length ? `[${adminMeta.label}] ${detailParts.join(' · ')}` : '';
    const mergedComments = [comments.trim(), detailSummary].filter(Boolean).join('\n');

    onSubmit({
      administrationStatus: status,
      administrationDate,
      administrationTime,
      doseGiven,
      route,
      site,
      witnessRequired,
      witnessName,
      comments: mergedComments,
      holdReason: status === 'Held' ? holdReason : undefined,
      refusalReason: status === 'Refused' ? refusalReason : undefined,
      missedReason: status === 'Missed' ? missedReason : undefined,
      prnReason: entry?.prn ? prnReason : undefined,
      symptomSeverity: entry?.prn ? symptomSeverity : undefined,
      preAssessment: entry?.prn ? preAssessment : undefined,
      postAssessment: entry?.prn ? postAssessment : undefined,
      effectivenessEvaluation: entry?.prn ? effectivenessEvaluation : undefined,
      fiveRightsVerified: fiveRights,
      safetyAlerts,
      safetyAcknowledged,
    });
  };

  if (!entry) return null;

  const isSample = entry.handlingMethod === 'sample_given';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Administer Medication</DialogTitle>
        </DialogHeader>

        <DialogBody className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">{entry.medicationName}</p>
              <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                <Syringe className="h-3 w-3" />
                {adminMeta.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.strength} · {entry.route} · {entry.frequency}
              {entry.prn ? ' · PRN' : ''}
            </p>
            <p className="mt-1 text-sm">{entry.sigPreview}</p>
            {entry.additionalInstructions && (
              <p className="mt-1 text-sm text-muted-foreground">{entry.additionalInstructions}</p>
            )}
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <span>Ordered by: {entry.orderedBy || entry.prescriber || '—'}</span>
              <span>Formulary: {entry.formularyTier || '—'}</span>
            </div>
          </div>

          {isSample && (
            <div className="rounded-lg border status-soft-info p-3 text-sm">
              <p className="font-semibold">Sample Medication</p>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                <span>NDC: {entry.sampleNdc || '—'}</span>
                <span>Lot: {entry.sampleLotNumber || '—'}</span>
                <span>Qty: {entry.sampleQuantity ?? '—'}</span>
                <span>
                  Expiration:{' '}
                  {entry.sampleExpirationDate
                    ? new Date(entry.sampleExpirationDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          )}

          <AlertList
            alerts={safetyAlerts}
            acknowledged={safetyAcknowledged}
            onAcknowledge={(v) => setSafetyAcknowledged(Boolean(v))}
          />

          <div>
            <p className="mb-2 text-sm font-semibold">Five Rights Verification</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FIVE_RIGHTS.map((r) => (
                <label
                  key={r.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                    fiveRights[r.key]
                      ? 'border-green-300 bg-green-50'
                      : 'border-border bg-background',
                  )}
                >
                  <Checkbox
                    checked={fiveRights[r.key]}
                    onCheckedChange={() => toggleRight(r.key)}
                  />
                  {fiveRights[r.key] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Administration Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMINISTRATION_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={administrationDate}
                onChange={(e) => setAdministrationDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={administrationTime}
                onChange={(e) => setAdministrationTime(e.target.value)}
              />
            </div>
            <div>
              <Label>Dose Given</Label>
              <Input
                value={doseGiven}
                onChange={(e) => setDoseGiven(e.target.value)}
                placeholder={entry.unit ? `${entry.dose} ${entry.unit}` : ''}
              />
            </div>
            <div>
              <Label>Route</Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
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
            {adminMeta.sites.length > 0 && (
              <div>
                <Label>
                  {adminMeta.type === 'topical'
                    ? 'Application Site'
                    : adminMeta.type === 'ophthalmic'
                      ? 'Side'
                      : 'Site'}
                  {adminMeta.requiresSite && ' *'}
                </Label>
                <Select value={site} onValueChange={setSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminMeta.sites.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(adminMeta.type === 'injection' || adminMeta.type === 'infusion') && (
              <div>
                <Label>Volume (mL)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(e.target.value)}
                  placeholder="e.g. 1.0"
                />
              </div>
            )}

            {adminMeta.type === 'injection' && (
              <div>
                <Label>Needle Gauge</Label>
                <Select value={needleGauge} onValueChange={setNeedleGauge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gauge" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminMeta.gauges.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {adminMeta.type === 'inhalation' && (
              <div>
                <Label>Actuations / Puffs</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={actuations}
                  onChange={(e) => setActuations(e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>
            )}

            {adminMeta.type === 'topical' && (
              <div>
                <Label>Amount Applied</Label>
                <Input
                  value={applicationAmount}
                  onChange={(e) => setApplicationAmount(e.target.value)}
                  placeholder="e.g. thin layer / 1 FTU"
                />
              </div>
            )}
          </div>

          {status === 'Held' && (
            <div>
              <Label>Hold Reason *</Label>
              <Select value={holdReason} onValueChange={setHoldReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {HOLD_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {status === 'Refused' && (
            <div>
              <Label>Refusal Reason *</Label>
              <Select value={refusalReason} onValueChange={setRefusalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REFUSAL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {status === 'Missed' && (
            <div>
              <Label>Missed Reason *</Label>
              <Select value={missedReason} onValueChange={setMissedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {MISSED_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {entry.prn && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">PRN Documentation</p>
              <div>
                <Label>PRN Reason *</Label>
                <Input value={prnReason} onChange={(e) => setPrnReason(e.target.value)} />
              </div>
              <div>
                <Label>Symptom Severity</Label>
                <Select value={symptomSeverity} onValueChange={setSymptomSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYMPTOM_SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pre-Assessment</Label>
                <Textarea value={preAssessment} onChange={(e) => setPreAssessment(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Post-Assessment</Label>
                <Textarea value={postAssessment} onChange={(e) => setPostAssessment(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Effectiveness Evaluation</Label>
                <Input
                  value={effectivenessEvaluation}
                  onChange={(e) => setEffectivenessEvaluation(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={witnessRequired}
                onCheckedChange={(v) => setWitnessRequired(Boolean(v))}
              />
              Witness Required
            </label>
            {witnessRequired && (
              <div>
                <Label>Witness Name</Label>
                <Input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <Label>Comments</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Administration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
