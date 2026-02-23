import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        // Fetch all appointments to count by status
        const response = await appointmentApi.getAll({ limit: 1000 });
        const appointments = response.data || [];
        
        // Count appointments by status
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
    // Refresh every 30 seconds for real-time updates
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
    Scheduled: 'text-blue-600',
    'Checked-In': 'text-yellow-600',
    'In Progress': 'text-purple-600',
    Completed: 'text-green-600',
    Cancelled: 'text-red-600',
    'No-Show': 'text-gray-600',
    Rescheduled: 'text-orange-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Hospital Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Today's appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Status Counters */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Appointment Status</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const Icon = statusIcons[status];
            return (
              <Card key={status}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{status}</CardTitle>
                  <Icon className={`h-4 w-4 ${statusColors[status]}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? '--' : count}
                  </div>
                  <p className="text-xs text-muted-foreground">Appointments</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}



