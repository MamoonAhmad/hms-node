import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { loadRadiologyStore, getPatientById, getOrdersByPatientId } from './radiologyStore';

export function PatientLabelsPreviewPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const store = useMemo(() => loadRadiologyStore(), []);
  const patient = useMemo(() => getPatientById(store, patientId), [store, patientId]);
  const orders = useMemo(() => getOrdersByPatientId(store, patientId), [store, patientId]);

  const handlePrint = () => window.print();

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button variant="link" onClick={() => navigate('/radiology-management')}>
          Back to Radiology Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate('/radiology-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
        </div>

        <Card className="print:shadow-none print:border">
          <CardHeader className="print:pb-2">
            <CardTitle>Radiology Labels — {patient.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              All labels for associated radiology orders. Use for patient identification and physical imaging documentation.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 space-y-2 print:break-inside-avoid"
                >
                  <div className="font-semibold">{order.orderName}</div>
                  <div className="text-sm">
                    <div>Patient: {patient.name}</div>
                    <div>MRN: {patient.mrn || 'N/A'}</div>
                    <div>DOB: {new Date(patient.dob).toLocaleDateString()}</div>
                    <div>CPT: {order.cptCode} • {order.modality}</div>
                    <div>Department: {order.department}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
