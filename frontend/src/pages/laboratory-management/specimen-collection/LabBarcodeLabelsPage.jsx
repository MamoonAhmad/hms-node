import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { orderApi } from '@/services/api';
import { mapOrderToLabRow } from '@/lib/orderWorklist';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadSpecimenById(id) {
  if (!UUID_RE.test(String(id))) return null;
  const res = await orderApi.getOrderById(id);
  const order = res?.data || res;
  if (!order?.id) return null;
  return mapOrderToLabRow(order);
}

export function LabBarcodeLabelsPage() {
  const [searchParams] = useSearchParams();
  const specimenId = searchParams.get('specimenId');
  const specimenIdsParam = searchParams.get('specimenIds');
  const count = Math.max(1, parseInt(searchParams.get('count'), 10) || 1);
  const [specimen, setSpecimen] = useState(null);
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(false);

  const ids = specimenIdsParam
    ? specimenIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : specimenId ? [specimenId] : [];

  useEffect(() => {
    if (ids.length === 0) return;
    setLoading(true);
    Promise.all(ids.map((id) => loadSpecimenById(id).catch(() => null)))
      .then((results) => {
        const found = results.filter(Boolean);
        if (ids.length === 1) {
          setSpecimen(found[0] || null);
          setSpecimens([]);
        } else {
          setSpecimens(found);
          setSpecimen(null);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  const handlePrint = () => window.print();

  if (ids.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No specimen selected. Open labels from Specimen Collection or Patient Specimen Detail.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  const list = ids.length === 1 ? (specimen ? [specimen] : []) : specimens;

  if (list.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">No specimens found.</div>;
  }

  return (
    <div className="space-y-4 p-6 print:p-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button onClick={handlePrint}>Print</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2" style={{ breakInside: 'avoid' }}>
        {ids.length === 1 && specimen
          ? Array.from({ length: count }, (_, i) => (
              <LabelCard key={i} specimen={specimen} />
            ))
          : list.map((s, i) => (
              <LabelCard key={s.id || i} specimen={s} />
            ))}
      </div>
    </div>
  );
}

function LabelCard({ specimen }) {
  const specimenNo = specimen.specimenNo || `SP-${String(specimen.id || '').slice(0, 8)}`;
  const mrn = specimen.patient?.mrn || '';
  return (
    <div className="rounded border border-border p-4 space-y-2 print:break-inside-avoid">
      <div className="text-xs text-muted-foreground">Specimen ID</div>
      <div className="font-mono text-lg font-bold">{specimenNo}</div>
      <div className="text-xs text-muted-foreground">Test ID</div>
      <div className="font-mono font-medium">{specimen.testId}</div>
      <div className="text-xs text-muted-foreground">Patient MRN</div>
      <div className="font-mono font-medium">{mrn}</div>
      <div className="mt-2 h-12 flex items-center justify-center bg-muted rounded font-mono text-sm">
        ||| {specimenNo} | {specimen.testId} | {mrn} |||
      </div>
    </div>
  );
}
