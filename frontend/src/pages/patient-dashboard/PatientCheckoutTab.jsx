import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, LogOut, CheckCircle2, User } from 'lucide-react';
import { appointmentApi } from '@/services/api';
import { usePatientChart } from './PatientChartContext';
import { formatPatientName } from './patientChartUtils';

const DISPOSITIONS = [
  { value: 'home', label: 'Discharge to home / self-care' },
  { value: 'home-with-support', label: 'Home with family / caregiver support' },
  { value: 'transfer-ed', label: 'Transfer to emergency department' },
  { value: 'transfer-specialist', label: 'Direct referral / specialist appointment scheduled' },
  { value: 'admit', label: 'Admit / observation (rare in ambulatory)' },
];

export function PatientCheckoutTab() {
  const { patient, appointment, encounter, refreshChart, isSampleChart, advanceVisitStatus } = usePatientChart();
  const [disposition, setDisposition] = useState('home');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [instructions, setInstructions] = useState(
    'Return precautions discussed. Seek urgent care for fever >101.5°F, worsening shortness of breath, chest pain, or confusion.',
  );
  const [checklist, setChecklist] = useState({
    vitals: true,
    ordersReviewed: true,
    medsReconciled: true,
    education: false,
    followUpScheduled: false,
    billingReady: false,
  });
  const [copayCollected, setCopayCollected] = useState(false);
  const [visitCoded, setVisitCoded] = useState(false);
  const [checkoutAttested, setCheckoutAttested] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleCheck = (key) => setChecklist((c) => ({ ...c, [key]: !c[key] }));

  const handleCompleteCheckout = async () => {
    if (!checkoutAttested) return;
    setSaving(true);
    setError(null);
    try {
      if (isSampleChart) {
        advanceVisitStatus('Checkout');
        setCompleted(true);
        refreshChart();
      } else if (appointment?.id) {
        await appointmentApi.updateStatus(appointment.id, 'Completed');
        setCompleted(true);
        await refreshChart();
      }
    } catch (err) {
      setError(err?.message || 'Failed to complete checkout');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintSummary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const name = patient ? formatPatientName(patient) : 'Patient';
    printWindow.document.write(`
      <html><head><title>After-visit summary — ${name}</title></head><body>
      <h1>After-visit summary</h1>
      <p><strong>Patient:</strong> ${name} · MRN ${patient?.mrn || '—'}</p>
      <p><strong>Provider:</strong> ${encounter?.visitProvider || appointment?.provider || '—'}</p>
      <p><strong>Location:</strong> ${encounter?.location || appointment?.department || '—'}</p>
      <h2>Instructions</h2><pre>${instructions}</pre>
      <h2>Follow-up</h2><p>${followUpNotes || '—'} ${followUpDate ? `(${followUpDate})` : ''}</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const patientName = patient ? formatPatientName(patient) : '—';

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient checkout</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Outpatient visit closure: verify clinical tasks, disposition, instructions, and billing readiness.
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-2 shrink-0" onClick={handlePrintSummary}>
          <Printer className="h-4 w-4" />
          Print checkout summary
        </Button>
      </div>

      <Card className="border-primary/20 print:border print:shadow-none">
        <CardHeader className="pb-3 print:pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Encounter</CardTitle>
                <CardDescription>
                  MRN <span className="font-mono text-foreground">{patient?.mrn || '—'}</span>
                  {' · '}{patientName}
                </CardDescription>
              </div>
            </div>
            <Badge variant={completed ? 'default' : 'secondary'} className="shrink-0">
              {completed ? 'Checked out' : appointment?.status || 'In progress'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm print:text-xs">
          <p>
            <span className="text-muted-foreground">Date of service:</span>{' '}
            <span className="font-medium">
              {encounter?.appointmentDate || new Date().toLocaleDateString()}
              {encounter?.appointmentTime ? ` ${encounter.appointmentTime}` : ''}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Rendering provider:</span>{' '}
            <span className="font-medium">{encounter?.visitProvider || appointment?.provider || '—'}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Location:</span>{' '}
            <span className="font-medium">{encounter?.location || appointment?.department || '—'}</span>
          </p>
          {encounter?.reason && (
            <p>
              <span className="text-muted-foreground">Chief complaint:</span>{' '}
              <span className="font-medium">{encounter.reason}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pre-checkout checklist</CardTitle>
          <CardDescription>Confirm tasks before completing the visit.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            { key: 'vitals', label: 'Vital signs reviewed and documented' },
            { key: 'ordersReviewed', label: 'Orders & results reviewed with patient when applicable' },
            { key: 'medsReconciled', label: 'Medication reconciliation completed' },
            { key: 'education', label: 'Patient education / teach-back documented' },
            { key: 'followUpScheduled', label: 'Follow-up appointment or plan documented' },
            { key: 'billingReady', label: 'Charge capture / coding ready for billing' },
          ].map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-muted/50">
              <Checkbox checked={checklist[key]} onCheckedChange={() => toggleCheck(key)} className="mt-0.5" />
              <span className="text-sm leading-snug">{label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Disposition</CardTitle>
            <CardDescription>Where the patient is going after this encounter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Disposition</Label>
              <Select value={disposition} onValueChange={setDisposition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSITIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="follow-up-date">Next follow-up (optional)</Label>
              <Input
                id="follow-up-date"
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="follow-up-notes">Follow-up plan notes</Label>
              <Textarea
                id="follow-up-notes"
                rows={3}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">After-visit summary</CardTitle>
            <CardDescription>Instructions the patient takes home.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-instructions">Discharge / AVS instructions</Label>
              <Textarea
                id="checkout-instructions"
                rows={8}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[180px] font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Billing & administrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox checked={copayCollected} onCheckedChange={(v) => setCopayCollected(!!v)} />
            <span className="text-sm">Copay / self-pay collected or waived per policy</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox checked={visitCoded} onCheckedChange={(v) => setVisitCoded(!!v)} />
            <span className="text-sm">Visit diagnosis & procedure codes verified</span>
          </label>
          <hr className="border-border" />
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <Checkbox checked={checkoutAttested} onCheckedChange={(v) => setCheckoutAttested(!!v)} className="mt-1" />
            <span className="text-sm">
              I attest that clinical checkout is complete: patient informed of diagnosis, treatment plan, medications,
              follow-up, and return precautions as documented above.
            </span>
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button
          type="button"
          size="lg"
          className="gap-2"
          disabled={!checkoutAttested || completed || saving}
          onClick={handleCompleteCheckout}
        >
          <CheckCircle2 className="h-5 w-5" />
          {saving ? 'Completing…' : 'Complete outpatient checkout'}
        </Button>
        <Button type="button" variant="outline" size="lg" className="gap-2" onClick={handlePrintSummary}>
          <Printer className="h-5 w-5" />
          Print for chart
        </Button>
      </div>

      {completed && (
        <Card className="border-green-600/40 bg-green-50/80 dark:bg-green-950/30 print:border print:bg-white">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <LogOut className="h-8 w-8 text-green-700 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Checkout recorded</p>
              <p className="text-sm text-green-800/90 dark:text-green-200/90">
                Appointment marked completed at {new Date().toLocaleString()}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
