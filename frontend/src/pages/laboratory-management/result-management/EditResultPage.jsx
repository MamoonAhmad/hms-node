import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { orderApi } from '@/services/api';
import { mapOrderToLabRow } from '@/lib/orderWorklist';
import { EditResultsForm } from './EditResultsForm';
import { LabReportPrintDialog } from './LabReportPrintDialog';

function PdfIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 16.5v-4H10a1.25 1.25 0 0 1 0 2.5H8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.25 12.5v4h.75a1.25 1.25 0 0 0 0-2.5h-.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 16.5v-4H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EditResultPage() {
  const { patientId, labTestId } = useParams();
  const navigate = useNavigate();
  const [labTest, setLabTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (patientId) {
      navigate(`/laboratory-management/result-management/patient/${patientId}`);
      return;
    }
    navigate('/laboratory-management/result-management');
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!labTestId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await orderApi.getOrderById(labTestId);
        const order = res?.data ?? res;
        if (!cancelled) {
          setLabTest(mapOrderToLabRow(order));
        }
      } catch (err) {
        if (!cancelled) {
          setLabTest(null);
          setError(err.message || 'Failed to load lab result');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [labTestId]);

  const handleSaved = async (updated) => {
    if (updated?.id && updated?.resultStatus) {
      const statusMap = {
        Pending: 'Pending',
        'In Progress': 'In Progress',
        Completed: 'Resulted',
        Resulted: 'Resulted',
        Cancelled: 'Cancelled',
      };
      try {
        await orderApi.updateOrderStatus(
          updated.id,
          statusMap[updated.resultStatus] || updated.resultStatus
        );
      } catch (err) {
        alert(err.message || 'Failed to update order status');
        return;
      }
    }
    goBack();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          title="Back to previous page"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Result Information</h1>
          <p className="text-muted-foreground">Update test results for this lab order</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setReportOpen(true)}
          title="View PDF report"
          aria-label="View PDF report"
          disabled={!labTest}
          className="text-red-600 hover:text-red-700"
        >
          <PdfIcon className="h-5 w-5" />
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && labTest && (
        <Card>
          <CardContent className="pt-6">
            <EditResultsForm
              labTest={labTest}
              onSaved={handleSaved}
              onCancel={goBack}
            />
          </CardContent>
        </Card>
      )}

      <LabReportPrintDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        labTest={labTest}
      />
    </div>
  );
}
