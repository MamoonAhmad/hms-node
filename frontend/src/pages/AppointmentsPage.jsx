import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppointmentFormDialog } from '@/components/appointments/AppointmentFormDialog';
import { DeleteAppointmentDialog } from '@/components/appointments/DeleteAppointmentDialog';
import { AppointmentTimeline } from '@/components/appointments/AppointmentTimeline';
import { appointmentApi, patientApi } from '@/services/api';
import { cn } from '@/lib/utils';

const appointmentStatuses = [
  'Scheduled',
  'Checked-In',
  'In Progress',
  'Completed',
  'Cancelled',
  'No-Show',
  'Rescheduled',
];

const appointmentTypes = ['New', 'Follow-up', 'Televisit'];

const statusColors = {
  Scheduled: 'bg-blue-100 text-blue-800',
  'Checked-In': 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'No-Show': 'bg-gray-100 text-gray-800',
  Rescheduled: 'bg-orange-100 text-orange-800',
};

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'list' or 'timeline'
  const [viewMode, setViewMode] = useState('timeline');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
    // Default to today's date
    return new Date().toISOString().split('T')[0];
  });

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For pre-filling form from timeline click
  const [initialDate, setInitialDate] = useState('');
  const [initialTime, setInitialTime] = useState('');

  // Fetch patients for the form dropdown
  const fetchPatients = useCallback(async () => {
    try {
      const response = await patientApi.getAll({ limit: 100 });
      setPatients(response.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: viewMode === 'timeline' ? 100 : pagination.limit, // Fetch more for timeline
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.appointmentType = typeFilter;
      if (dateFilter && viewMode === 'timeline') params.date = dateFilter;

      const response = await appointmentApi.getAll(params);
      setAppointments(response.data);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, typeFilter, dateFilter, viewMode]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (filterType, value) => {
    const actualValue = value === 'all' ? '' : value;
    switch (filterType) {
      case 'status':
        setStatusFilter(actualValue);
        break;
      case 'type':
        setTypeFilter(actualValue);
        break;
      case 'date':
        setDateFilter(actualValue);
        break;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreate = () => {
    setSelectedAppointment(null);
    setInitialDate('');
    setInitialTime('');
    setIsFormOpen(true);
  };

  const handleTimeSlotClick = (date, time) => {
    setSelectedAppointment(null);
    setInitialDate(date);
    setInitialTime(time);
    setIsFormOpen(true);
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setInitialDate('');
    setInitialTime('');
    setIsFormOpen(true);
  };

  const handleDelete = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedAppointment) {
        await appointmentApi.update(selectedAppointment.id, data);
      } else {
        await appointmentApi.create(data);
      }
      setIsFormOpen(false);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await appointmentApi.delete(selectedAppointment.id);
      setIsDeleteOpen(false);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentApi.updateStatus(appointmentId, newStatus);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  const navigateDate = (direction) => {
    const current = new Date(dateFilter);
    current.setDate(current.getDate() + direction);
    setDateFilter(current.toISOString().split('T')[0]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-1">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              Timeline
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1.5"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {viewMode === 'list' && (
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient, provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
        )}

        {viewMode === 'timeline' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
            >
              Today
            </Button>
          </div>
        )}

        <Select value={statusFilter || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {appointmentStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter || 'all'} onValueChange={(v) => handleFilterChange('type', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {appointmentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {viewMode === 'list' && (
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-40"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('date', '')}
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <AppointmentTimeline
          appointments={appointments}
          selectedDate={dateFilter}
          onTimeSlotClick={handleTimeSlotClick}
          onAppointmentClick={handleEdit}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {formatDate(appointment.appointmentDate)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(appointment.appointmentTime)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {appointment.patient?.mrn}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                        {appointment.appointmentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {appointment.duration} min
                    </TableCell>
                    <TableCell>
                      {appointment.provider || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(value) =>
                          handleStatusChange(appointment.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              statusColors[appointment.status] || ''
                            )}
                          >
                            {appointment.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                  statusColors[status] || ''
                                )}
                              >
                                {status}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(appointment)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} appointments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AppointmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={selectedAppointment}
        patients={patients}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        initialDate={initialDate}
        initialTime={initialTime}
      />

      <DeleteAppointmentDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        appointment={selectedAppointment}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
}
