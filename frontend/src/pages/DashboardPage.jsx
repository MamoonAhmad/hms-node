import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Users, Calendar, Clock, CheckCircle2, XCircle, UserX, CalendarClock } from 'lucide-react';
import { appointmentApi } from '@/services/api';

export function DashboardPage() {
  const [statusCounts, setStatusCounts] = useState({
    Scheduled: 0,
    'Checked-In': 0,
    'In Progress': 0,
    Completed: 0,
    Cancelled: 0,
    'No-Show': 0,
    Rescheduled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        setIsLoading(true);
        const response = await appointmentApi.getAll({ limit: 1000 });
        const appointments = response.data || [];

        const counts = {
          Scheduled: 0,
          'Checked-In': 0,
          'In Progress': 0,
          Completed: 0,
          Cancelled: 0,
          'No-Show': 0,
          Rescheduled: 0,
        };

        appointments.forEach((apt) => {
          if (counts.hasOwnProperty(apt.status)) {
            counts[apt.status]++;
          }
        });

        setStatusCounts(counts);
      } catch (err) {
        console.error('Failed to fetch appointment counts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatusCounts();
    const interval = setInterval(fetchStatusCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusIcons = {
    Scheduled: Calendar,
    'Checked-In': Clock,
    'In Progress': Clock,
    Completed: CheckCircle2,
    Cancelled: XCircle,
    'No-Show': UserX,
    Rescheduled: CalendarClock,
  };

  const statusColors = {
    Scheduled: 'text-primary',
    'Checked-In': 'text-amber-600',
    'In Progress': 'text-teal-700',
    Completed: 'text-emerald-600',
    Cancelled: 'text-red-600',
    'No-Show': 'text-slate-600',
    Rescheduled: 'text-orange-600',
  };

  return (
    <div className="ehr-page">
      <PageHeader
        title="Operations Dashboard"
        description="Real-time overview of patient volume, scheduling, and encounter status across your facility."
        breadcrumbs="Overview"
      />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Key metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-muted/20 px-5 py-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="tabular-nums text-3xl font-semibold tracking-tight">--</div>
              <p className="mt-1 text-xs text-muted-foreground">Registered patients</p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-muted/20 px-5 py-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="tabular-nums text-3xl font-semibold tracking-tight">--</div>
              <p className="mt-1 text-xs text-muted-foreground">Today&apos;s appointments</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Appointment status
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const Icon = statusIcons[status];
            return (
              <Card key={status} className="gap-0 py-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-muted/20 px-5 py-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {status}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${statusColors[status]}`} />
                </CardHeader>
                <CardContent className="px-5 py-4">
                  <div className="tabular-nums text-3xl font-semibold tracking-tight">
                    {isLoading ? '--' : count}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Appointments</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
