import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { useIntake } from '../IntakeContext';
import { intakeApi } from '@/services/api';

export function IntakeSignatureSection() {
  const { patientId, appointmentId, canPersist, completeIntake } = useIntake();
  const [certified, setCertified] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const loadCompletion = async () => {
    if (!canPersist) return;
    try {
      const res = await intakeApi.getCompletion(patientId, {
        appointmentId: appointmentId || undefined,
      });
      setCompletion(res.data);
    } catch {
      setCompletion(null);
    }
  };

  useEffect(() => {
    loadCompletion();
  }, [patientId, appointmentId, canPersist]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      const data = await completeIntake({ intakeNotes, certificationAccepted: accepted });
      setCompletion(data);
      setModalOpen(false);
      setCertified(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="intake-section-intake_signature">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Signature & Complete Intake</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Checkbox
            id="intake-certify"
            checked={certified || completion?.completed}
            onCheckedChange={(v) => setCertified(!!v)}
            disabled={completion?.completed}
          />
          <Label htmlFor="intake-certify" className="text-sm leading-relaxed">
            I certify that the intake information entered is accurate, complete to the best of my
            knowledge, and ready for provider review.
          </Label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={completion?.completed}
          >
            Intake completed
          </Button>
          {completion?.completed && (
            <Button type="button" variant="outline" onClick={() => setViewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              View signature
            </Button>
          )}
        </div>

        {completion?.completed && (
          <p className="text-sm text-muted-foreground">
            Signed by {completion.signedByName || 'RN'} on{' '}
            {completion.signedAt ? new Date(completion.signedAt).toLocaleString() : '—'}. Visit
            status updated to With Provider.
          </p>
        )}
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete intake</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Intake notes</Label>
              <Textarea
                rows={4}
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                placeholder="Optional intake notes…"
              />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="intake-accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(!!v)}
              />
              <Label htmlFor="intake-accept" className="text-sm">
                I hereby accept that the patient intake is completed.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleComplete} disabled={!accepted || saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Intake signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Signed by: </span>
              {completion?.signedByName || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Signed at: </span>
              {completion?.signedAt ? new Date(completion.signedAt).toLocaleString() : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Notes: </span>
              {completion?.intakeNotes || '—'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
