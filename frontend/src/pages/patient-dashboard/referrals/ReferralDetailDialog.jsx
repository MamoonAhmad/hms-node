import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DELIVERY_METHODS,
  NOTE_TYPES,
  PRIORITY_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
  TIMELINE_EVENT_LABELS,
} from './referralConstants';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={cn('border', STATUS_BADGE_CLASSES[status] || '')}>
      {status}
    </Badge>
  );
}

export function ReferralDetailDialog({
  open,
  onOpenChange,
  referral,
  onSend,
  onCancel,
  onClose,
  onAddNote,
  onEdit,
  onPrint,
  loading,
}) {
  const [deliveryMethod, setDeliveryMethod] = useState('Internal Routing');
  const [noteType, setNoteType] = useState('General');
  const [noteContent, setNoteContent] = useState('');
  const [closeData, setCloseData] = useState({ outcome: '', recommendations: '', followUpPlan: '' });
  const [actionLoading, setActionLoading] = useState(false);

  if (!referral) return null;

  const runAction = async (fn) => {
    setActionLoading(true);
    try {
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <DialogTitle>{referral.referralNumber}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {referral.referralType} · {referral.specialty}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={referral.status} />
              <Badge variant="outline" className={cn('border', PRIORITY_BADGE_CLASSES[referral.priority])}>
                {referral.priority}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {(referral.alerts || []).length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3">
            {referral.alerts.map((alert) => (
              <div key={alert.type} className="flex items-center gap-2 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {alert.type}
                {alert.daysLeft != null && ` (${alert.daysLeft} days)`}
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="letter">Letter</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div><span className="text-muted-foreground">Referral Date:</span> {formatDate(referral.referralDate)}</div>
              <div><span className="text-muted-foreground">Expiration:</span> {formatDate(referral.expirationDate)}</div>
              <div><span className="text-muted-foreground">Auth Status:</span> {referral.authorizationStatus}</div>
              <div><span className="text-muted-foreground">Referred To:</span> {referral.referredToName || '—'}</div>
              <div><span className="text-muted-foreground">Organization:</span> {referral.referredToOrganization || '—'}</div>
              <div><span className="text-muted-foreground">Referring Provider:</span> {referral.referringProviderName || '—'}</div>
              <div><span className="text-muted-foreground">Appointment:</span> {formatDateTime(referral.appointmentScheduledDate)}</div>
              <div><span className="text-muted-foreground">Created By:</span> {referral.createdByName}</div>
              <div><span className="text-muted-foreground">Delivery:</span> {referral.deliveryMethod || '—'}</div>
            </div>
            <div>
              <h4 className="font-medium">Reason</h4>
              <p className="text-sm text-muted-foreground">{referral.referralReason}</p>
            </div>
            {(referral.diagnoses || []).length > 0 && (
              <div>
                <h4 className="font-medium">Diagnoses</h4>
                <ul className="text-sm text-muted-foreground">
                  {referral.diagnoses.map((d, i) => (
                    <li key={i}>
                      {d.isPrimary ? '[Primary] ' : ''}{d.icd10Code} — {d.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            {(referral.timeline || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline events yet.</p>
            ) : (
              referral.timeline.map((event) => (
                <div key={event.id} className="rounded-lg border-l-4 border-primary/40 bg-muted/30 px-4 py-3">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {TIMELINE_EVENT_LABELS[event.eventType] || event.eventType}
                    </p>
                    <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                  </div>
                  {event.userName && <p className="text-xs text-muted-foreground">{event.userName}</p>}
                  {event.notes && <p className="mt-1 text-sm">{event.notes}</p>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-2 rounded-lg border p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Note Type</Label>
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea rows={3} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Add a note..." />
              <Button
                size="sm"
                disabled={!noteContent.trim() || actionLoading}
                onClick={() => runAction(async () => {
                  await onAddNote?.({ noteType, content: noteContent });
                  setNoteContent('');
                })}
              >
                Add Note
              </Button>
            </div>
            {(referral.notes || []).map((note) => (
              <div key={note.id} className="rounded-lg border p-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{note.noteType} · {note.authorName}</span>
                  <span>{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm">{note.content}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="letter">
            <Textarea
              readOnly
              rows={16}
              className="font-mono text-xs"
              value={referral.referralLetter?.body || 'No letter generated.'}
            />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>Date Sent: {formatDateTime(referral.tracking?.dateSent || referral.sentAt)}</div>
              <div>Sent By: {referral.tracking?.sentBy || referral.sentBy || '—'}</div>
              <div>Date Received: {formatDateTime(referral.tracking?.dateReceived)}</div>
              <div>Appointment Scheduled: {formatDateTime(referral.tracking?.appointmentScheduled)}</div>
              <div>Appointment Date: {formatDateTime(referral.referralAppointment?.appointmentDate)}</div>
              <div>Report Received: {formatDateTime(referral.consultationReport?.reportReceivedDate)}</div>
            </div>
            {referral.consultationReport?.findings && (
              <div>
                <h4 className="font-medium">Findings</h4>
                <p className="text-muted-foreground">{referral.consultationReport.findings}</p>
              </div>
            )}
            {referral.consultationReport?.recommendations && (
              <div>
                <h4 className="font-medium">Recommendations</h4>
                <p className="text-muted-foreground">{referral.consultationReport.recommendations}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-2">
            {(referral.auditLogs || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries loaded.</p>
            ) : (
              referral.auditLogs.map((log) => (
                <div key={log.id} className="rounded border px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                  </div>
                  {log.userName && <p className="text-xs text-muted-foreground">{log.userName}</p>}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {referral.status !== 'Completed' && referral.status !== 'Cancelled' && (
          <div className="rounded-lg border p-3 space-y-2">
            <Label>Send Referral</Label>
            <div className="flex flex-wrap gap-2">
              <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                disabled={actionLoading || loading}
                onClick={() => runAction(() => onSend?.({ deliveryMethod }))}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {referral.status !== 'Completed' && referral.status !== 'Cancelled' && (
          <div className="rounded-lg border p-3 space-y-2">
            <Label>Close Referral</Label>
            <Textarea
              rows={2}
              placeholder="Outcome"
              value={closeData.outcome}
              onChange={(e) => setCloseData((p) => ({ ...p, outcome: e.target.value }))}
            />
            <Textarea
              rows={2}
              placeholder="Recommendations"
              value={closeData.recommendations}
              onChange={(e) => setCloseData((p) => ({ ...p, recommendations: e.target.value }))}
            />
            <Textarea
              rows={2}
              placeholder="Follow-up plan"
              value={closeData.followUpPlan}
              onChange={(e) => setCloseData((p) => ({ ...p, followUpPlan: e.target.value }))}
            />
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => runAction(() => onClose?.({
                completion: closeData,
                ...closeData,
              }))}
            >
              Close Referral
            </Button>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={() => onPrint?.(referral)}>Print</Button>
          <Button variant="outline" onClick={() => onEdit?.(referral)}>Edit</Button>
          {referral.status !== 'Cancelled' && (
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => runAction(() => onCancel?.())}
            >
              Cancel Referral
            </Button>
          )}
          {(loading || actionLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
