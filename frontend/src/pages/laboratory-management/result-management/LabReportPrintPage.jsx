import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { orderApi } from '@/services/api';
import { mapOrderToLabRow } from '@/lib/orderWorklist';
import { LabReportView } from './LabReportView';

export function LabReportPrintPage() {
  const { labTestId } = useParams();
  const navigate = useNavigate();
  const [labTest, setLabTest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!labTestId) return;
    orderApi
      .getOrderById(labTestId)
      .then((res) => {
        const order = res?.data || res;
        setLabTest(order ? mapOrderToLabRow(order) : null);
      })
      .catch((err) => {
        setError(err.message || 'Order not found');
        setLabTest(null);
      });
  }, [labTestId]);

  if (error) return <div className="p-6 text-muted-foreground">{error}</div>;
  if (!labTest) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6 print:p-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2 icon-action-print" />
          Print
        </Button>
      </div>
      <LabReportView labTest={labTest} />
    </div>
  );
}
