import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { labApi } from '@/services/api';

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
    if (ids.length === 1) {
      labApi.getLabTestById(ids[0]).then((data) => {
        setSpecimen(data);
        setSpecimens([]);
        setLoading(false);
      });
    } else {
      Promise.all(ids.map((id) => labApi.getLabTestById(id))).then((results) => {
        setSpecimens(results.filter(Boolean));
        setSpecimen(null);
        setLoading(false);
      });
    }
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
  const specimenNo = specimen.specimenNo || `SP-${specimen.id}`;
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
