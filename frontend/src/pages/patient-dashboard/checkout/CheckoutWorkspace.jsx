import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  LogOut,
  Mail,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useCheckout } from './CheckoutContext';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell, StatusBadge } from '../components/chart-ui';
import { canCompleteEntEncounter, getPresentAirwayRedFlags, loadEntState } from '../ent/entUtils';
import {
  CHECKOUT_STATUSES,
  CHECKLIST_ITEMS,
  CHECKLIST_STATE_LABELS,
  CHECKLIST_STATE_STYLES,
  DOCUMENT_TYPES,
  FOLLOW_UP_TIMEFRAMES,
  INSTRUCTION_TYPES,
  INSURANCE_STATUSES,
  NOTE_TYPES,
  ORDER_STATUS_STYLES,
  PAYMENT_METHODS,
  TASK_PRIORITIES,
} from './checkoutConstants';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function openPrintWindow(html, title = 'Document') {
  const w = window.open('', '_blank');
  if (!w) {
    window.print();
    return;
  }
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  w.focus();
  w.print();
}

function htmlToText(html) {
  if (!html) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || el.innerText || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function CheckoutWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    bundle,
    loading,
    error,
    saving,
    appointmentId,
    isLocked,
    isCompleted,
    updateCheckout,
    saveInstruction,
    deleteInstruction,
    addNote,
    addTask,
    recordPayment,
    completeCheckout,
    reopenCheckout,
    previewAvs,
    loadBundle,
  } = useCheckout();
  const { patientId } = usePatientChart();

  const [completeError, setCompleteError] = useState(null);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const [avsOpen, setAvsOpen] = useState(false);
  const [avsMethod, setAvsMethod] = useState('print');
  const [avsError, setAvsError] = useState(null);
  const [avsNotice, setAvsNotice] = useState('');
  const [delivering, setDelivering] = useState(false);

  const [instrType, setInstrType] = useState(INSTRUCTION_TYPES[8]);
  const [instrContent, setInstrContent] = useState('');
  const [editInstrId, setEditInstrId] = useState(null);

  const [followUpRequired, setFollowUpRequired] = useState(null);
  const [followUpTimeframe, setFollowUpTimeframe] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [noteType, setNoteType] = useState('general');
  const [noteContent, setNoteContent] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Normal');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  const [codesReviewed, setCodesReviewed] = useState(false);
  const [insuranceStatus, setInsuranceStatus] = useState('Pending');
  const [docsPrinted, setDocsPrinted] = useState(false);

  useEffect(() => {
    const co = bundle?.checkout;
    const bill = bundle?.billing;
    if (!co) return;
    setFollowUpRequired(co.followUpRequired ?? null);
    setFollowUpTimeframe(co.followUpTimeframe || '');
    setFollowUpReason(co.followUpReason || '');
    setFollowUpDate(co.followUpData?.appointmentDate || '');
    setFollowUpTime(co.followUpData?.appointmentTime || '');
    setCodesReviewed(co.billingData?.codesReviewed || false);
    setInsuranceStatus(co.insuranceStatus || bill?.insuranceStatus || 'Pending');
    setDocsPrinted(co.documentsMeta?.printedOrShared || false);
  }, [bundle?.checkout?.id, bundle?.checkout?.updatedAt, bundle?.billing?.insuranceStatus]);

  if (!appointmentId && !loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Select an encounter to start patient checkout.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading checkout…
      </div>
    );
  }

  if (!bundle) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">{error || 'Unable to load checkout'}</CardContent>
      </Card>
    );
  }

  const { header, checklist, clinicalReview, orders, medications, referrals, billing, checkout } = bundle;
  const statusMeta = CHECKOUT_STATUSES[bundle.status] || CHECKOUT_STATUSES.in_progress;
  const checklistMap = Object.fromEntries((checklist || []).map((c) => [c.key, c.state]));

  const handleSaveFollowUp = async () => {
    await updateCheckout({
      followUpRequired: followUpRequired ?? checkout.followUpRequired,
      followUpTimeframe: followUpTimeframe || checkout.followUpTimeframe,
      followUpReason: followUpReason || checkout.followUpReason,
      followUpData: {
        ...(checkout.followUpData || {}),
        appointmentDate: followUpDate || checkout.followUpData?.appointmentDate,
        appointmentTime: followUpTime || checkout.followUpData?.appointmentTime,
        reason: followUpReason || checkout.followUpReason,
      },
    });
  };

  const handleSaveInstruction = async () => {
    if (!instrContent.trim()) return;
    await saveInstruction({ instructionType: instrType, content: instrContent.trim() }, editInstrId);
    setInstrContent('');
    setEditInstrId(null);
  };

  const handleRecordPayment = async () => {
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    await recordPayment({
      amountDue: billing.balanceDue,
      paymentAmount: amount,
      paymentMethod,
      transactionRef: transactionRef || undefined,
      notes: paymentNotes || undefined,
      balanceRemaining: Math.max(0, (billing.balanceDue || 0) - amount),
    });
    setPaymentAmount('');
    setTransactionRef('');
    setPaymentNotes('');
  };

  const handleComplete = async () => {
    setCompleteError(null);
    if (!canCompleteEntEncounter(patientId, appointmentId)) {
      const flags = getPresentAirwayRedFlags(loadEntState(patientId, appointmentId).throat);
      setCompleteError(
        `Airway emergency findings require provider acknowledgement and an immediate management plan on the ENT tab before checkout can be completed${
          flags.length ? ` (${flags.join(', ')})` : ''
        }.`,
      );
      return;
    }
    try {
      await completeCheckout();
    } catch (err) {
      setCompleteError(err?.message || 'Validation failed');
    }
  };

  const openAvsDialog = () => {
    setAvsError(null);
    setAvsMethod('print');
    setAvsOpen(true);
  };

  const handleDeliverAvs = async () => {
    setAvsError(null);
    const patientEmail = header?.patient?.email?.trim();

    if (avsMethod === 'email' && !patientEmail) {
      setAvsError(
        'No email address is on file for this patient. Please add an email during registration before emailing the After Visit Summary.',
      );
      return;
    }

    setDelivering(true);
    try {
      const html = await previewAvs();

      if (avsMethod === 'print') {
        openPrintWindow(html, `AVS — ${header.patient.name}`);
        if (!isLocked) {
          await updateCheckout({
            documentsMeta: { printedOrShared: true, deliveredVia: 'print', documents: ['After Visit Summary'] },
          });
        }
        setAvsNotice('After Visit Summary sent to printer.');
      } else {
        const body = htmlToText(html);
        const subject = `After Visit Summary — ${header.patient.name}`;
        const mailto = `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
        const link = document.createElement('a');
        link.href = mailto;
        link.click();
        if (!isLocked) {
          await updateCheckout({
            documentsMeta: {
              printedOrShared: true,
              deliveredVia: 'email',
              deliveredTo: patientEmail,
              documents: ['After Visit Summary'],
            },
          });
        }
        setAvsNotice(`After Visit Summary emailed to ${patientEmail}.`);
      }
      setAvsOpen(false);
    } catch (err) {
      setAvsError(err?.message || 'Failed to deliver After Visit Summary');
    } finally {
      setDelivering(false);
    }
  };

  const handlePrintReceipt = (payment) => {
    const html = `<!DOCTYPE html><html><head><title>Receipt</title></head><body>
<h1>Payment Receipt</h1>
<p><strong>Patient:</strong> ${header.patient.name}<br/><strong>MRN:</strong> ${header.patient.mrn}</p>
<p><strong>Date:</strong> ${formatDateTime(payment.createdAt)}<br/>
<strong>Amount Paid:</strong> $${Number(payment.paymentAmount).toFixed(2)}<br/>
<strong>Method:</strong> ${payment.paymentMethod}<br/>
<strong>Transaction ID:</strong> ${payment.transactionRef || payment.receiptNumber || '—'}<br/>
<strong>Collected By:</strong> ${payment.collectedByName || '—'}</p>
<p><strong>Balance Remaining:</strong> $${Number(payment.balanceRemaining || 0).toFixed(2)}</p>
</body></html>`;
    openPrintWindow(html, 'Payment Receipt');
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return;
    await reopenCheckout(reopenReason.trim());
    setReopenOpen(false);
    setReopenReason('');
  };

  return (
    <ChartTabShell
      title="Patient checkout"
      description="Complete clinical review, billing, follow-up, and close the outpatient visit."
      className="print:space-y-4"
      actions={
        <>
          <Button type="button" variant="outline" size="sm" className="gap-2 print:hidden" onClick={loadBundle} disabled={saving}>
            <RefreshCw className={cn('h-4 w-4', saving && 'animate-spin')} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-2 print:hidden" onClick={openAvsDialog}>
            <FileText className="h-4 w-4" />
            After Visit Summary
          </Button>
          {isCompleted && (
            <Button type="button" variant="outline" size="sm" className="gap-2 print:hidden" onClick={() => setReopenOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Reopen Checkout
            </Button>
          )}
        </>
      }
    >
      {avsNotice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200 print:hidden">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {avsNotice}
          </span>
          <button type="button" className="text-green-700/80 hover:text-green-900" onClick={() => setAvsNotice('')}>
            Dismiss
          </button>
        </div>
      )}

      {/* Patient & encounter header */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                {header.patient.photoUrl ? (
                  <img src={header.patient.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7" />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm min-w-0">
                <div>
                  <p className="font-semibold text-base">{header.patient.name}</p>
                  <p><span className="text-muted-foreground">MRN:</span> <span className="font-mono">{header.patient.mrn}</span></p>
                  <p><span className="text-muted-foreground">DOB:</span> {formatDate(header.patient.dateOfBirth)} ({header.patient.age} yrs)</p>
                  <p><span className="text-muted-foreground">Gender:</span> {header.patient.gender || '—'}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {header.patient.phone || '—'}</p>
                  <p><span className="text-muted-foreground">Email:</span> {header.patient.email || '—'}</p>
                </div>
                <div>
                  <p><span className="text-muted-foreground">Encounter #:</span> <span className="font-mono">{header.encounter.encounterNumber}</span></p>
                  <p><span className="text-muted-foreground">Visit Date:</span> {header.encounter.visitDate} {header.encounter.appointmentTime}</p>
                  <p><span className="text-muted-foreground">Visit Type:</span> {header.encounter.visitType}</p>
                  <p><span className="text-muted-foreground">Provider:</span> {header.encounter.provider || '—'}</p>
                </div>
                <div>
                  <p><span className="text-muted-foreground">Department:</span> {header.encounter.department || '—'}</p>
                  <p><span className="text-muted-foreground">Location:</span> {header.encounter.location || '—'}</p>
                  <p><span className="text-muted-foreground">Room:</span> {header.encounter.room || '—'}</p>
                  <p><span className="text-muted-foreground">Visit Status:</span> {header.encounter.visitStatus}</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={cn('shrink-0 border', statusMeta.className)}>
              {statusMeta.label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Checkout Checklist</CardTitle>
          <CardDescription>Required actions before completing checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKLIST_ITEMS.map(({ key, label }) => {
              const state = checklistMap[key] || 'pending';
              return (
                <div
                  key={key}
                  className={cn('flex items-center justify-between rounded-lg border px-3 py-2 text-sm', CHECKLIST_STATE_STYLES[state])}
                >
                  <span className="leading-snug pr-2">{label}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {CHECKLIST_STATE_LABELS[state]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Clinical warnings */}
      {clinicalReview.warnings?.length > 0 && (
        <Card className="border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
              {clinicalReview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Clinical review */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Clinical Review</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><span className="text-muted-foreground">Chief Complaint:</span> {clinicalReview.chiefComplaint || '—'}</div>
          <div><span className="text-muted-foreground">Signed SOAP Note:</span> {clinicalReview.signedSoapNote ? 'Yes' : 'No'}</div>
          <div><span className="text-muted-foreground">Orders:</span> {clinicalReview.ordersCount}</div>
          <div><span className="text-muted-foreground">Medications:</span> {clinicalReview.medicationsCount}</div>
          <div><span className="text-muted-foreground">Procedures:</span> {clinicalReview.proceduresCount}</div>
          <div><span className="text-muted-foreground">Referrals:</span> {clinicalReview.referralsCount}</div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Assessment:</span> {clinicalReview.assessment || '—'}</div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Plan:</span> {clinicalReview.plan || '—'}</div>
          <div className="sm:col-span-3">
            <span className="text-muted-foreground">Diagnosis:</span>{' '}
            {(clinicalReview.diagnoses || []).map((d) => `${d.code || ''} ${d.description}`).join('; ') || '—'}
          </div>
        </CardContent>
      </Card>

      {/* Orders review */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders Review</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-muted-foreground text-center py-6">No orders for this encounter</TableCell></TableRow>
              ) : orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.orderType}</TableCell>
                  <TableCell>{o.procedureName}</TableCell>
                  <TableCell className="font-mono text-xs">{o.procedureCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ORDER_STATUS_STYLES[o.status] || ''}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDateTime(o.orderDateTime)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Medication Review</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Handling</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No medications for this encounter</TableCell></TableRow>
              ) : medications.map((m) => (
                <TableRow key={m.id} className={!['Signed', 'Sent', 'Printed', 'Administered', 'Completed'].includes(m.status) ? 'bg-amber-50/50' : ''}>
                  <TableCell className="font-medium">{m.medicationName}</TableCell>
                  <TableCell>{m.dose || '—'}</TableCell>
                  <TableCell>{m.route || '—'}</TableCell>
                  <TableCell>{m.frequency || '—'}</TableCell>
                  <TableCell>{m.handlingMethod}</TableCell>
                  <TableCell>{m.pharmacy || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{m.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Referral Review</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Referred To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Appt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No referrals for this encounter</TableCell></TableRow>
              ) : referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.referralType}</TableCell>
                  <TableCell>{r.specialty}</TableCell>
                  <TableCell>{r.referredTo || '—'}</TableCell>
                  <TableCell>{r.priority}</TableCell>
                  <TableCell>{r.authorizationStatus}</TableCell>
                  <TableCell>{r.appointmentStatus}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Follow-up */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Follow-Up Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={followUpRequired === true}
                  disabled={isLocked}
                  onCheckedChange={() => setFollowUpRequired(true)}
                />
                Follow-up required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={followUpRequired === false}
                  disabled={isLocked}
                  onCheckedChange={() => setFollowUpRequired(false)}
                />
                Not required
              </label>
            </div>
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={followUpTimeframe} onValueChange={setFollowUpTimeframe} disabled={isLocked}>
                <SelectTrigger><SelectValue placeholder="Select timeframe" /></SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_TIMEFRAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Appointment Date</Label>
                <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-2">
                <Label>Appointment Time</Label>
                <Input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Visit</Label>
              <Textarea rows={3} value={followUpReason} onChange={(e) => setFollowUpReason(e.target.value)} disabled={isLocked} />
            </div>
            {!isLocked && (
              <Button type="button" size="sm" onClick={handleSaveFollowUp} disabled={saving}>Save follow-up</Button>
            )}
          </CardContent>
        </Card>

        {/* Patient instructions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(checkout.instructions || []).map((inst) => (
              <div key={inst.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary">{inst.instructionType}</Badge>
                  {!isLocked && (
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setEditInstrId(inst.id); setInstrType(inst.instructionType); setInstrContent(inst.content); }}>Edit</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteInstruction(inst.id)}>Delete</Button>
                    </div>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap">{inst.content}</p>
              </div>
            ))}
            {!isLocked && (
              <>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={instrType} onValueChange={setInstrType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INSTRUCTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea rows={4} value={instrContent} onChange={(e) => setInstrContent(e.target.value)} />
                </div>
                <Button type="button" size="sm" onClick={handleSaveInstruction} disabled={saving}>
                  {editInstrId ? 'Update instruction' : 'Add instruction'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing & insurance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Billing Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Insurance Status:</span> {billing.insuranceStatus}</p>
            <p><span className="text-muted-foreground">Primary:</span> {billing.primaryInsurance?.provider || '—'} {billing.primaryInsurance?.memberId ? `(${billing.primaryInsurance.memberId})` : ''}</p>
            <p><span className="text-muted-foreground">Copay:</span> ${Number(billing.copayAmount || 0).toFixed(2)}</p>
            <p><span className="text-muted-foreground">Balance Due:</span> ${Number(billing.balanceDue || 0).toFixed(2)}</p>
            <p><span className="text-muted-foreground">CPT:</span> {(billing.cptCodes || []).join(', ') || '—'}</p>
            <p><span className="text-muted-foreground">ICD-10:</span> {(billing.icd10Codes || []).join(', ') || '—'}</p>
            <p><span className="text-muted-foreground">Payment Status:</span> {billing.paymentStatus}</p>
            <p className="pt-1 text-xs text-muted-foreground">
              Encounter coding (ICD order, CPT lines, POS, providers) is on the Coding tab. Generate the claim after charges are locked.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('tab', 'charge-capture');
                setSearchParams(next, { replace: true });
              }}
            >
              Open encounter coding
            </Button>
            {!isLocked && (
              <label className="flex items-center gap-2 pt-2">
                <Checkbox
                  checked={codesReviewed}
                  onCheckedChange={async (v) => {
                    setCodesReviewed(!!v);
                    await updateCheckout({ billingData: { ...(checkout.billingData || {}), codesReviewed: !!v, cptCodes: billing.cptCodes, icd10Codes: billing.icd10Codes } });
                  }}
                />
                <span>Billing codes reviewed</span>
              </label>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Insurance Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={insuranceStatus}
                disabled={isLocked}
                onValueChange={async (v) => {
                  setInsuranceStatus(v);
                  await updateCheckout({ insuranceStatus: v });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSURANCE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {['Not Verified', 'Inactive', 'Pending'].includes(insuranceStatus) && (
              <p className="text-sm text-amber-700 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Insurance is not verified. Review before completing checkout.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment collection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(checkout.payments || []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">${Number(p.paymentAmount).toFixed(2)} — {p.paymentMethod}</p>
                <p className="text-muted-foreground text-xs">{formatDateTime(p.createdAt)} · {p.receiptNumber || p.transactionRef || '—'}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => handlePrintReceipt(p)}>Print Receipt</Button>
            </div>
          ))}
          {!isLocked && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Amount Due</Label>
                <Input value={`$${Number(billing.balanceDue || 0).toFixed(2)}`} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <Input type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction Reference</Label>
                <Input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Payment Notes</Label>
                <Textarea rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={handleRecordPayment} disabled={saving || !paymentAmount}>Record Payment</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DOCUMENT_TYPES.map((doc) => (
              <Button key={doc} type="button" variant="outline" size="sm" onClick={doc === 'After Visit Summary' ? openAvsDialog : undefined}>
                {doc}
              </Button>
            ))}
          </div>
          {!isLocked && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox
                checked={docsPrinted}
                onCheckedChange={async (v) => {
                  setDocsPrinted(!!v);
                  await updateCheckout({ documentsMeta: { printedOrShared: !!v } });
                }}
              />
              Documents printed or shared with patient
            </label>
          )}
        </CardContent>
      </Card>

      {/* Tasks & notes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Task Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(checkout.tasks || []).map((t) => (
              <div key={t.id} className="rounded border p-2 text-sm">
                <p className="font-medium">{t.title}</p>
                <p className="text-muted-foreground text-xs">{t.priority} · Due {formatDate(t.dueDate)} · {t.status}</p>
              </div>
            ))}
            {!isLocked && (
              <>
                <Input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                <Textarea placeholder="Notes" rows={2} value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} />
                <Button
                  type="button"
                  size="sm"
                  disabled={!taskTitle.trim()}
                  onClick={async () => {
                    await addTask({ title: taskTitle.trim(), priority: taskPriority, dueDate: taskDueDate || null, notes: taskNotes || null });
                    setTaskTitle('');
                    setTaskDueDate('');
                    setTaskNotes('');
                  }}
                >
                  Create Task
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Checkout Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(checkout.notes || []).map((n) => (
              <div key={n.id} className="rounded border p-2 text-sm">
                <Badge variant="outline" className="text-[10px]">{n.noteType}</Badge>
                <p className="mt-1 whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
            ))}
            {!isLocked && (
              <>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NOTE_TYPES.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea rows={3} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
                <Button
                  type="button"
                  size="sm"
                  disabled={!noteContent.trim()}
                  onClick={async () => {
                    await addNote({ noteType, content: noteContent.trim() });
                    setNoteContent('');
                  }}
                >
                  Add Note
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(error || completeError) && <p className="text-sm text-destructive">{completeError || error}</p>}

      {/* Complete / Summary */}
      {!isCompleted ? (
        <div className="flex flex-wrap gap-3 print:hidden">
          <Button type="button" size="lg" className="gap-2" disabled={isLocked || saving} onClick={handleComplete}>
            <CheckCircle2 className="h-5 w-5" />
            {saving ? 'Completing…' : 'Complete Checkout'}
          </Button>
        </div>
      ) : (
        <Card className="border-green-600/40 bg-green-50/80 dark:bg-green-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-900 dark:text-green-100">Checkout Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <LogOut className="h-8 w-8 text-green-700 shrink-0" />
              <div className="space-y-1">
                <p><strong>Patient:</strong> {header.patient.name}</p>
                <p><strong>Encounter:</strong> {header.encounter.encounterNumber}</p>
                <p><strong>Checked out:</strong> {formatDateTime(checkout.completedAt)}</p>
                <p><strong>By:</strong> {checkout.completedByName || '—'}</p>
                <p><strong>Follow-up:</strong> {checkout.followUpReason || checkout.followUpData?.reason || '—'}</p>
                <p><strong>Payment:</strong> {(checkout.payments || []).length ? `$${checkout.payments.reduce((s, p) => s + Number(p.paymentAmount), 0).toFixed(2)} collected` : 'None'}</p>
                <p><strong>Pending tasks:</strong> {(checkout.tasks || []).filter((t) => t.status === 'Open').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={avsOpen} onOpenChange={setAvsOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Deliver After Visit Summary</DialogTitle>
            <DialogDescription>Choose how to provide the After Visit Summary to the patient.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 p-1 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setAvsMethod('print'); setAvsError(null); }}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                avsMethod === 'print' ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-muted/50',
              )}
            >
              <span className="flex items-center gap-2 font-medium"><Printer className="h-4 w-4" />Print</span>
              <span className="text-xs text-muted-foreground">Open the print dialog for a paper copy.</span>
            </button>
            <button
              type="button"
              onClick={() => { setAvsMethod('email'); setAvsError(null); }}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                avsMethod === 'email' ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-muted/50',
              )}
            >
              <span className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" />Email</span>
              <span className="text-xs text-muted-foreground">
                {header?.patient?.email ? `Send to ${header.patient.email}` : 'No email on file'}
              </span>
            </button>
          </div>
          {avsError && (
            <p className="flex items-start gap-2 px-1 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {avsError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAvsOpen(false)} disabled={delivering}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDeliverAvs} disabled={delivering} className="gap-2">
              {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : avsMethod === 'email' ? <Send className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
              {avsMethod === 'email' ? 'Send Email' : 'Print'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Checkout</DialogTitle>
            <DialogDescription>Provide a reason for reopening this completed checkout. This action will be logged.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} placeholder="Reason for reopening…" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleReopen} disabled={!reopenReason.trim() || saving}>Reopen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChartTabShell>
  );
}
