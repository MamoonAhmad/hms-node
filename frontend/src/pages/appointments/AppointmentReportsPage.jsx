import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appointmentApi } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AppointmentReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentApi.getReports({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ehr-page space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Appointment & RCM Reports"
        description="Volume, cancellation, no-show, eligibility, and copay collection from live data."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Appointment volume" value={data.appointmentVolume} />
          <Metric label="Completed" value={data.completed} />
          <Metric label="Cancellation rate %" value={data.cancellationRate} />
          <Metric label="No-show rate %" value={data.noShowRate} />
          <Metric label="Reschedule rate %" value={data.rescheduleRate} />
          <Metric label="Eligibility verifications" value={data.eligibilityVerifications} />
          <Metric label="Copay transactions" value={data.copayTransactions} />
          <Metric
            label="Copay collected"
            value={`$${Number(data.copayCollected || 0).toFixed(2)}`}
          />
        </div>
      )}

      {data?.statusBreakdown && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">Status breakdown</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span>{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.waitlistByStatus && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">Waitlist by status</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.waitlistByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span>{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
