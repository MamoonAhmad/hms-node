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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { useIntake } from '../IntakeContext';

export function IntakeSignatureSection() {
  const {
    intakeStatus,
    isCertified,
    isCompleted,
    certifyIntake,
    completeIntake,
    saving,
  } = useIntake();

  const [certifyChecked, setCertifyChecked] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const handleCertify = async () => {
    if (!certifyChecked) return;
    await certifyIntake();
    setCertifyChecked(false);
  };

  const handleComplete = async () => {
    if (!accepted) return;
    await completeIntake(completionNotes);
    setCompleteOpen(false);
    setCompletionNotes('');
    setAccepted(false);
  };

  return (
    <IntakeSectionCard id="assessment-signature" title="Signature" showAdd={false}>
      <div className="space-y-6">
        {!isCertified && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="certify-intake"
                checked={certifyChecked}
                onCheckedChange={(c) => setCertifyChecked(!!c)}
              />
              <Label htmlFor="certify-intake" className="leading-relaxed">
                I certify that the intake information entered is accurate, complete to the best of my knowledge, and ready for provider review.
              </Label>
            </div>
            <Button onClick={handleCertify} disabled={!certifyChecked || saving}>
              Sign Intake
            </Button>
          </div>
        )}

        {isCertified && !isCompleted && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Signed</Badge>
              <span className="text-sm text-muted-foreground">
                {intakeStatus?.certifiedByName || 'Nurse'} — {intakeStatus?.certifiedAt ? new Date(intakeStatus.certifiedAt).toLocaleString() : ''}
              </span>
            </div>
            <Button onClick={() => setCompleteOpen(true)}>Intake Completed</Button>
          </div>
        )}

        {isCompleted && (
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <Badge className="mb-2">Intake Completed</Badge>
              <p className="text-sm">
                Completed by {intakeStatus?.completedByName || 'Nurse'} on{' '}
                {intakeStatus?.completedAt ? new Date(intakeStatus.completedAt).toLocaleString() : '—'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setViewOpen(true)}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        )}
      </div>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Intake</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Intake Notes</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Optional intake completion notes..."
                rows={4}
              />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} />
              <Label className="leading-relaxed">
                I hereby accept that the patient intake is completed.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={!accepted || saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Intake Completion Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">RN:</span> {intakeStatus?.completedByName || '—'}</p>
            <p><span className="font-medium">Completed:</span> {intakeStatus?.completedAt ? new Date(intakeStatus.completedAt).toLocaleString() : '—'}</p>
            <p><span className="font-medium">Notes:</span> {intakeStatus?.completionNotes || '—'}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </IntakeSectionCard>
  );
}
