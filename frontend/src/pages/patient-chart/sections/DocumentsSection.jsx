import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patientApi } from '@/services/api/patient.api';
import { ChartTabShell, EmptyState, SimpleTable, StatusBadge, TableCell } from './_shared';
import { formatDate } from '../patientChartHelpers';

export function DocumentsSection({ patientId, searchTerm }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getDocuments(patientId);
      setDocuments(res?.data?.documents || res?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (!searchTerm) return documents;
    const t = searchTerm.toLowerCase();
    return documents.filter((d) =>
      [d.title, d.documentType, d.category, d.source, d.uploadedByName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [documents, searchTerm]);

  return (
    <ChartTabShell
      title="Documents"
      description="All patient documents, including files uploaded during registration."
      loading={loading}
      loadingMessage="Loading documents…"
      error={error}
      onRetry={load}
    >
      <SimpleTable
        columns={[
          { label: 'Document' },
          { label: 'Category' },
          { label: 'Type' },
          { label: 'Source' },
          { label: 'Uploaded' },
          { label: 'Uploaded by' },
          { label: 'Status' },
        ]}
        rows={rows}
        empty={<EmptyState icon={FolderOpen} title="No documents uploaded." description="Documents uploaded from registration or the chart will appear here." />}
        renderRow={(d) => (
          <>
            <TableCell className="font-medium">{d.title || d.documentName}</TableCell>
            <TableCell>{d.category || '—'}</TableCell>
            <TableCell>{d.documentType || '—'}</TableCell>
            <TableCell>{d.source || '—'}</TableCell>
            <TableCell>{formatDate(d.uploadedOn || d.createdAt)}</TableCell>
            <TableCell>{d.uploadedByName || '—'}</TableCell>
            <TableCell><StatusBadge status={d.status} /></TableCell>
          </>
        )}
      />
    </ChartTabShell>
  );
}
