import { useState } from 'react';
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
import { patientApi } from '@/services/api';

export function PatientDeleteConfirmDialog({ open, onOpenChange, patient, onDeleted }) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setError(null);
  };

  const handleClose = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!patient?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      await patientApi.deleteWithConfirmation(patient.id, {
        firstName,
        middleName,
        lastName,
      });
      onDeleted?.();
      handleClose(false);
    } catch (err) {
      setError(err?.message || 'Failed to delete patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Patient</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          To confirm deletion, enter the patient&apos;s name exactly as recorded, then click Confirm.
        </p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="delete-first-name">First Name</Label>
            <Input id="delete-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-middle-name">Middle Name</Label>
            <Input id="delete-middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-last-name">Last Name</Label>
            <Input id="delete-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
