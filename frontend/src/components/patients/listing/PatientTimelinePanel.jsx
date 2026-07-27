import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { patientApi } from '@/services/api';
import { formatDateTime } from '@/components/patients/listing/patientListUtils';

export function PatientTimelinePanel({ open, onOpenChange, patient }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTimeline = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getTimeline(patient.id);
      setEvents(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load timeline');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    if (open && patient?.id) loadTimeline();
  }, [open, patient?.id, loadTimeline]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Timeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading timeline...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          )}
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{event.action}</p>
                <p className="text-xs text-muted-foreground shrink-0">{formatDateTime(event.dateTime)}</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>User: {event.userName || '—'}{event.userRole ? ` (${event.userRole})` : ''}</p>
                {event.tabName && <p>Tab: {event.tabName}</p>}
                {event.section && <p>Section: {event.section}</p>}
              </div>
              {Array.isArray(event.changes) && event.changes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-1 pr-2 font-medium">Field</th>
                        <th className="py-1 pr-2 font-medium">Previous</th>
                        <th className="py-1 font-medium">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.changes.map((change, idx) => (
                        <tr key={`${event.id}-${idx}`} className="border-b border-border/50">
                          <td className="py-1 pr-2">{change.label || change.field}</td>
                          <td className="py-1 pr-2 text-muted-foreground">{change.previousValue ?? '—'}</td>
                          <td className="py-1">{change.newValue ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {event.summary && <p className="text-xs text-muted-foreground">{event.summary}</p>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
