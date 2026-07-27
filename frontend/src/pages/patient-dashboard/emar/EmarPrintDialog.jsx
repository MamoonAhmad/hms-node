import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { emarApi } from '@/services/api/emar.api';

const PRINT_TABS = [
  'active',
  'scheduled',
  'administered',
  'prn',
  'missed',
  'refused',
  'discontinued',
  'samples',
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function doseRouteLabel(entry) {
  return (
    [entry.dose, entry.unit, entry.route].filter(Boolean).join(' ') ||
    entry.sigPreview ||
    '—'
  );
}

export function EmarPrintDialog({
  open,
  onOpenChange,
  patientId,
  appointmentId,
  panel,
}) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !patientId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const paramsBase = appointmentId ? { appointmentId } : {};
        const results = await Promise.all(
          PRINT_TABS.map((tab) =>
            emarApi.getEntries(patientId, { ...paramsBase, tab }).catch(() => ({ data: [] })),
          ),
        );
        if (cancelled) return;

        const byId = new Map();
        results.forEach((res) => {
          (res.data || []).forEach((entry) => {
            if (entry?.id) byId.set(entry.id, entry);
          });
        });
        const merged = [...byId.values()].sort((a, b) =>
          String(a.medicationName || '').localeCompare(String(b.medicationName || '')),
        );
        setEntries(merged);
      } catch (err) {
        if (!cancelled) {
          setEntries([]);
          setError(err?.message || 'Failed to load medications for print');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, patientId, appointmentId]);

  const printedAt = useMemo(() => new Date().toLocaleString(), [open, entries.length]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #emar-print-area, #emar-print-area * { visibility: visible !important; }
          #emar-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.75rem 1rem;
            background: white;
            color: black;
          }
          #emar-print-area table { width: 100%; border-collapse: collapse; }
          #emar-print-area th, #emar-print-area td {
            border: 1px solid #ccc;
            padding: 6px 8px;
            text-align: left;
            font-size: 11px;
          }
          #emar-print-area th { background: #f3f4f6; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Print eMAR</DialogTitle>
          </DialogHeader>

          <DialogBody className="max-h-[min(70vh,720px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Preparing printable eMAR…
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <div id="emar-print-area" className="space-y-4 text-foreground">
                <div className="border-b border-border pb-3">
                  <h2 className="text-xl font-bold">Electronic Medication Administration Record</h2>
                  <p className="text-sm text-muted-foreground">Printed: {printedAt}</p>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Patient: </span>
                    <span className="font-medium">{panel?.patientName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">MRN: </span>
                    <span className="font-medium">{panel?.mrn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DOB: </span>
                    <span className="font-medium">{formatDate(panel?.dateOfBirth)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender: </span>
                    <span className="font-medium">{panel?.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Encounter: </span>
                    <span className="font-medium">
                      {panel?.encounterNumber ? `#${String(panel.encounterNumber).slice(0, 8)}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider: </span>
                    <span className="font-medium">{panel?.provider || '—'}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-muted-foreground">Allergies: </span>
                    <span className="font-medium">
                      {(panel?.allergies || []).length
                        ? panel.allergies.map((a) => a.allergenName || a.name).filter(Boolean).join(', ')
                        : 'None documented'}
                    </span>
                  </div>
                </div>

                {entries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No medications found for this encounter.
                  </p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-2 py-2 font-semibold">Medication</th>
                        <th className="px-2 py-2 font-semibold">Dose / Route</th>
                        <th className="px-2 py-2 font-semibold">Frequency</th>
                        <th className="px-2 py-2 font-semibold">MAR Status</th>
                        <th className="px-2 py-2 font-semibold">Next Due</th>
                        <th className="px-2 py-2 font-semibold">Last Administered</th>
                        <th className="px-2 py-2 font-semibold">Administered by</th>
                        <th className="px-2 py-2 font-semibold">Prescriber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-border/60">
                          <td className="px-2 py-2 align-top">
                            <div className="font-medium">{entry.medicationName}</div>
                            {(entry.strength || entry.dosageForm) && (
                              <div className="text-xs text-muted-foreground">
                                {[entry.strength, entry.dosageForm].filter(Boolean).join(' ')}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 align-top">{doseRouteLabel(entry)}</td>
                          <td className="px-2 py-2 align-top">
                            {entry.frequency || '—'}
                            {entry.prn ? ' PRN' : ''}
                          </td>
                          <td className="px-2 py-2 align-top font-medium">{entry.marStatus || '—'}</td>
                          <td className="px-2 py-2 align-top">{formatDateTime(entry.nextDueAt)}</td>
                          <td className="px-2 py-2 align-top">{formatDateTime(entry.lastAdministeredAt)}</td>
                          <td className="px-2 py-2 align-top">
                            {entry.lastAdministration?.administeredByName ||
                              entry.administeredByName ||
                              '—'}
                          </td>
                          <td className="px-2 py-2 align-top">{entry.prescriber || entry.signedBy || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <p className="pt-2 text-xs text-muted-foreground">
                  Total medications: {entries.length}
                </p>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} disabled={loading || Boolean(error)}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
