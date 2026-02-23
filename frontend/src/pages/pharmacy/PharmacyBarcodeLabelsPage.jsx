import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { prescriptionPatientsMock } from './pharmacyMockData';

export function PharmacyBarcodeLabelsPage() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const medicationId = searchParams.get('medicationId');
  const count = Math.max(1, parseInt(searchParams.get('count'), 10) || 1);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    if (patientId) {
      const p = prescriptionPatientsMock.find((x) => x.id === patientId);
      setPatient(p || null);
    }
  }, [patientId]);

  const handlePrint = () => window.print();

  if (!patientId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No patient selected. Open labels from Medication Prescriptions or Patient Medications.</p>
      </div>
    );
  }

  if (!patient) return <div className="p-6 text-center">Loading...</div>;

  const barcodeId = medicationId ? `MED-${medicationId}` : `PAT-${patient.id}`;

  return (
    <div className="space-y-4 p-6 print:p-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button onClick={handlePrint}>Print</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2" style={{ breakInside: 'avoid' }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded border border-border p-4 space-y-2 print:break-inside-avoid">
            <div className="text-xs text-muted-foreground">Patient</div>
            <div className="font-medium">{patient.name}</div>
            <div className="text-xs text-muted-foreground">MRN</div>
            <div className="font-mono">{patient.mrn}</div>
            {medicationId && (
              <>
                <div className="text-xs text-muted-foreground">Medication ID</div>
                <div className="font-mono">{barcodeId}</div>
              </>
            )}
            <div className="mt-2 h-10 flex items-center justify-center bg-muted rounded font-mono text-sm">
              ||| {barcodeId} | {patient.mrn} |||
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
