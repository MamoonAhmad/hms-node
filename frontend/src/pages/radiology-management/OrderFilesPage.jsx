import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadRadiologyStore, getOrderById, getPatientById } from './radiologyStore';
import { ArrowLeft, FileText, Image } from 'lucide-react';

export function OrderFilesPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const store = useMemo(() => loadRadiologyStore(), []);
  const order = useMemo(() => getOrderById(store, orderId), [store, orderId]);
  const patient = useMemo(() => order ? getPatientById(store, order.patientId) : null, [store, order]);

  if (!order || !patient) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Order or patient not found.</p>
        <Button variant="link" onClick={() => window.close()}>
          Close
        </Button>
      </div>
    );
  }

  const files = order.files || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.close()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Files — {order.orderName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {patient.name} • MRN: {patient.mrn || 'N/A'}
          </p>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground">No files uploaded for this order.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50"
                >
                  {file.type === 'pdf' ? (
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  ) : (
                    <Image className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{file.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Supported file types: Images, PDFs, scan documents. In a full implementation, these would open or download.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
