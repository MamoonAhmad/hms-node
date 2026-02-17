import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { loadRadiologyStore, getOrderById, getPatientById } from './radiologyStore';

export function PrintableReportPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const store = useMemo(() => loadRadiologyStore(), []);
  const order = useMemo(() => getOrderById(store, orderId), [store, orderId]);
  const patient = useMemo(() => order ? getPatientById(store, order.patientId) : null, [store, order]);

  const handlePrint = () => window.print();

  if (!order || !patient) {
    return (
      <div className="p-6 text-muted-foreground">
        Order or patient not found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex gap-4 mb-6 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => window.close()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Close
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="border rounded-lg p-6 space-y-6 print:border print:shadow-none">
        <h1 className="text-xl font-bold">Radiology Report</h1>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Patient Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Name: {patient.name}</div>
            <div>MRN: {patient.mrn || 'N/A'}</div>
            <div>DOB: {new Date(patient.dob).toLocaleDateString()}</div>
            <div>Age: {patient.age} • Gender: {patient.gender === 'M' ? 'Male' : 'Female'}</div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Order Details</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Order: {order.orderName}</div>
            <div>CPT Code: {order.cptCode}</div>
            <div>Modality: {order.modality}</div>
            <div>Department: {order.department}</div>
            <div>Order Date: {order.orderDateTime ? new Date(order.orderDateTime).toLocaleString() : '-'}</div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Findings</h2>
          <p className="text-sm whitespace-pre-wrap">{order.findings || 'No findings documented.'}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Provider</h2>
          <div className="text-sm">
            {order.providerName || order.lastUpdatedBy || 'N/A'}
            {order.lastUpdatedAt && (
              <span className="text-muted-foreground ml-2">
                — {new Date(order.lastUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
