import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, RefreshCw, X } from 'lucide-react';

// Static data
const appointments = [
  {
    id: 1,
    date: '2025-02-05',
    time: '10:00 AM',
    provider: 'Dr. Sarah Smith',
    status: 'Scheduled',
  },
  {
    id: 2,
    date: '2025-01-20',
    time: '10:30 AM',
    provider: 'Dr. Sarah Smith',
    status: 'Completed',
  },
  {
    id: 3,
    date: '2025-01-15',
    time: '2:00 PM',
    provider: 'Dr. John Williams',
    status: 'Completed',
  },
  {
    id: 4,
    date: '2025-01-10',
    time: '11:00 AM',
    provider: 'Dr. Sarah Smith',
    status: 'No-show',
  },
];

export function AppointmentsTab({ patient }) {
  const [appts, setAppts] = useState(appointments);

  const getStatusBadge = (status) => {
    const variants = {
      Scheduled: 'default',
      'Checked-in': 'default',
      'No-show': 'destructive',
      Completed: 'default',
      Cancelled: 'secondary',
    };
    return variants[status] || 'secondary';
  };

  const handleReschedule = (apptId) => {
    // Mock: Reschedule appointment
    setAppts(
      appts.map((a) =>
        a.id === apptId ? { ...a, date: '2025-02-10', time: '11:00 AM' } : a
      )
    );
  };

  const handleCancel = (apptId) => {
    // Mock: Cancel appointment
    setAppts(appts.map((a) => (a.id === apptId ? { ...a, status: 'Cancelled' } : a)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Appointments</h2>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appts.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">
                      {new Date(appt.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{appt.time}</TableCell>
                    <TableCell>{appt.provider}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(appt.status)}>{appt.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {appt.status === 'Scheduled' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(appt.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleCancel(appt.id)}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
