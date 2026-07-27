import { useEffect, useMemo, useState } from 'react';
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
import { formatPatientDisplayName } from '@/components/patients/listing/patientListUtils';

export function PatientPaymentModal({ open, onOpenChange, patient }) {
  const [encounters, setEncounters] = useState([]);
  const [amount, setAmount] = useState('');
  const [selectedEncounter, setSelectedEncounter] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    if (!open || !patient?.id) return;
    setAmount('');
    setGeneratedLink('');
    patientApi
      .getEncounters(patient.id)
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setEncounters(list);
        setSelectedEncounter(list[0]?.encounterNumber || '');
      })
      .catch(() => {
        setEncounters([]);
        setSelectedEncounter('');
      });
  }, [open, patient?.id]);

  const patientName = useMemo(() => formatPatientDisplayName(patient), [patient]);

  const handleGenerate = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      alert('Enter a valid payment amount');
      return;
    }
    const token = `${patient?.mrn || 'patient'}-${Date.now()}`;
    setGeneratedLink(`${window.location.origin}/payments/pay?token=${encodeURIComponent(token)}&amount=${amt}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Patient Name</Label>
              <Input value={patientName} readOnly disabled />
            </div>
            <div className="space-y-1">
              <Label>MRN</Label>
              <Input value={patient?.mrn || '—'} readOnly disabled />
            </div>
            <div className="space-y-1">
              <Label>Encounter Number</Label>
              <Input
                list="payment-encounters"
                value={selectedEncounter}
                onChange={(e) => setSelectedEncounter(e.target.value)}
              />
              <datalist id="payment-encounters">
                {encounters.map((enc) => (
                  <option key={enc.id} value={enc.encounterNumber || ''} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Patient Phone</Label>
              <Input value={patient?.contactNumber || patient?.cellPhone || '—'} readOnly disabled />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Patient Email</Label>
              <Input value={patient?.email || '—'} readOnly disabled />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          {generatedLink && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm break-all">
              <p className="font-medium mb-1">Payment link generated</p>
              <a href={generatedLink} className="text-primary underline" target="_blank" rel="noreferrer">
                {generatedLink}
              </a>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Payment Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
