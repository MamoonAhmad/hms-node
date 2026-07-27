import { useCallback, useEffect, useMemo, useState } from 'react';
import { Waypoints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { patientApi } from '@/services/api/patient.api';
import { ChartTabShell, EmptyState } from './_shared';
import { formatDateTime } from '../patientChartHelpers';

const PAGE_SIZE = 25;

export function TimelineSection({ patientId, searchTerm }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState('All');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getTimeline(patientId);
      setEvents(res?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load timeline.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => {
    const set = new Set(events.map((e) => e.section).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(() => {
    let data = events;
    if (section !== 'All') data = data.filter((e) => e.section === section);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      data = data.filter((e) =>
        [e.action, e.userName, e.section, e.tabName].filter(Boolean).some((v) => String(v).toLowerCase().includes(t)),
      );
    }
    return data;
  }, [events, section, searchTerm]);

  const shown = filtered.slice(0, visible);

  return (
    <ChartTabShell
      title="Patient Timeline"
      description="Chronological log of important patient activities."
      loading={loading}
      loadingMessage="Loading timeline…"
      error={error}
      onRetry={load}
    >
      {sections.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {sections.map((s) => (
            <Button key={s} variant={section === s ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => setSection(s)}>
              {s}
            </Button>
          ))}
        </div>
      )}

      {shown.length ? (
        <>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {shown.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden />
                <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{e.action}</p>
                    {e.section && <Badge variant="outline" className="text-[10px]">{e.section}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(e.dateTime)} · {e.userName || 'System'}
                    {e.userRole ? ` (${e.userRole})` : ''}
                  </p>
                  {Array.isArray(e.changes) && e.changes.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                      {e.changes.slice(0, 4).map((c, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{c.label || c.field}:</span>{' '}
                          {c.previousValue ?? c.from ?? '—'} → {c.newValue ?? c.to ?? '—'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {visible < filtered.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Waypoints} title="No timeline events found." />
      )}
    </ChartTabShell>
  );
}
