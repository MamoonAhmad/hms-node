import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculatePatientAge,
  formatGenderLabel,
  formatPatientWristbandName,
  renderBarcodeSvg,
} from '@/components/patients/listing/patientListUtils';

function formatDob(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function WristbandPreview({ patient, index }) {
  const barcodeValue = `${patient?.mrn || patient?.id || 'PAT'}-${index + 1}`;
  const barcodeHtml = renderBarcodeSvg(barcodeValue, { width: 200, height: 44 });

  return (
    <div className="wristband-preview rounded border border-dashed border-border bg-white p-4 space-y-2 print:break-inside-avoid">
      <div
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: barcodeHtml }}
        aria-hidden
      />
      <p className="text-center font-mono text-[10px] text-muted-foreground">{barcodeValue}</p>
      <p className="text-center font-semibold text-sm leading-tight">
        {formatPatientWristbandName(patient)}
      </p>
      <div className="flex justify-center gap-4 text-xs">
        <span>Age: {calculatePatientAge(patient?.dateOfBirth) ?? '—'}</span>
        <span>Gender: {formatGenderLabel(patient?.gender)}</span>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        DOB: {formatDob(patient?.dateOfBirth)}
      </p>
    </div>
  );
}

export function PatientWristbandModal({ open, onOpenChange, patient }) {
  const [count, setCount] = useState('1');

  useEffect(() => {
    if (open) setCount('1');
  }, [open, patient?.id]);

  const wristbandCount = useMemo(() => {
    const n = Number(count);
    if (!Number.isFinite(n)) return 1;
    return Math.min(10, Math.max(1, n));
  }, [count]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #wristband-print-area, #wristband-print-area * { visibility: visible; }
          #wristband-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5rem;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Print Wristband</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 min-h-0">
            <div className="flex items-center gap-3">
              <Label htmlFor="wristband-count" className="shrink-0">
                Number of Wristbands
              </Label>
              <Select value={String(wristbandCount)} onValueChange={setCount}>
                <SelectTrigger id="wristband-count" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              id="wristband-print-area"
              className="grid gap-3 max-h-[50vh] overflow-y-auto sm:grid-cols-2"
            >
              {Array.from({ length: wristbandCount }, (_, i) => (
                <WristbandPreview key={`${patient?.id}-${i}`} patient={patient} index={i} />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
