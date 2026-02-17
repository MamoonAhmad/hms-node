import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { loadRadiologyStore, getOrderById, getPatientById } from './radiologyStore';

export function PrintableLabelsPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const count = Math.max(1, parseInt(searchParams.get('count') || '1', 10));

  const store = useMemo(() => loadRadiologyStore(), []);
  const order = useMemo(() => getOrderById(store, orderId), [store, orderId]);
  const patient = useMemo(() => order ? getPatientById(store, order.patientId) : null, [store, order]);

  if (!order || !patient) {
    return (
      <div className="p-6 text-muted-foreground">
        Order or patient not found.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2" style={{ gap: '1.5rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="border-2 border-black rounded-lg p-4 space-y-2 print:break-inside-avoid"
            style={{ minHeight: '120px' }}
          >
            <div className="font-bold text-lg">{order.orderName}</div>
            <div className="text-sm">
              <div><strong>Patient:</strong> {patient.name}</div>
              <div><strong>MRN:</strong> {patient.mrn || 'N/A'}</div>
              <div><strong>DOB:</strong> {new Date(patient.dob).toLocaleDateString()}</div>
              <div><strong>CPT:</strong> {order.cptCode} • <strong>Modality:</strong> {order.modality}</div>
              <div><strong>Department:</strong> {order.department}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
