import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 0; // 12 AM (midnight)
const END_HOUR = 23; // 11 PM

const statusColors = {
  Scheduled: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  'Checked-In': 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  'In Progress': 'bg-purple-500 hover:bg-purple-600 border-purple-600',
  Completed: 'bg-green-500 hover:bg-green-600 border-green-600',
  Cancelled: 'bg-red-400 hover:bg-red-500 border-red-500 opacity-60',
  'No-Show': 'bg-gray-400 hover:bg-gray-500 border-gray-500 opacity-60',
  Rescheduled: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
};

export function AppointmentTimeline({
  appointments,
  selectedDate,
  onTimeSlotClick,
  onAppointmentClick,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const hours = useMemo(() => {
    const result = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
      result.push(i);
    }
    return result;
  }, []);

  const getTimeInMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getAppointmentPosition = (appointment) => {
    const startMinutes = getTimeInMinutes(appointment.appointmentTime) - START_HOUR * 60;
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (appointment.duration / 60) * HOUR_HEIGHT;
    return { top, height };
  };

  // Check if two appointments overlap in time
  const appointmentsOverlap = (apt1, apt2) => {
    const start1 = getTimeInMinutes(apt1.appointmentTime);
    const end1 = start1 + (apt1.duration || 30);
    const start2 = getTimeInMinutes(apt2.appointmentTime);
    const end2 = start2 + (apt2.duration || 30);
    return start1 < end2 && start2 < end1;
  };

  // Calculate layout for overlapping appointments
  const calculateAppointmentLayout = (appointments) => {
    if (!appointments.length) return [];

    // Sort by start time
    const sorted = [...appointments].sort((a, b) => 
      getTimeInMinutes(a.appointmentTime) - getTimeInMinutes(b.appointmentTime)
    );

    const layoutMap = new Map();

    sorted.forEach((apt) => {
      // Find all appointments that overlap with current one
      const overlapping = sorted.filter(other => 
        other.id !== apt.id && appointmentsOverlap(apt, other)
      );

      // Get already assigned columns for overlapping appointments
      const usedColumns = new Set();
      overlapping.forEach(other => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout !== undefined) {
          usedColumns.add(otherLayout.column);
        }
      });

      // Find first available column
      let column = 0;
      while (usedColumns.has(column)) {
        column++;
      }

      // Total columns needed = overlapping count + 1
      const totalColumns = overlapping.length + 1;

      layoutMap.set(apt.id, { column, totalColumns });
    });

    // Second pass: update totalColumns to be consistent within overlapping groups
    sorted.forEach((apt) => {
      const overlapping = sorted.filter(other => 
        other.id !== apt.id && appointmentsOverlap(apt, other)
      );

      // Find max totalColumns in the group
      let maxColumns = layoutMap.get(apt.id).totalColumns;
      overlapping.forEach(other => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout) {
          maxColumns = Math.max(maxColumns, otherLayout.totalColumns);
        }
      });

      // Also count max column index + 1
      let maxColumnIndex = layoutMap.get(apt.id).column;
      overlapping.forEach(other => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout) {
          maxColumnIndex = Math.max(maxColumnIndex, otherLayout.column);
        }
      });

      const finalTotalColumns = Math.max(maxColumns, maxColumnIndex + 1);

      // Update all in group
      layoutMap.get(apt.id).totalColumns = finalTotalColumns;
      overlapping.forEach(other => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout) {
          otherLayout.totalColumns = finalTotalColumns;
        }
      });
    });

    return sorted.map(apt => ({
      appointment: apt,
      ...layoutMap.get(apt.id),
    }));
  };

  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const handleTimeSlotClick = (hour) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    onTimeSlotClick?.(selectedDate, time);
  };

  const filteredAppointments = useMemo(() => {
    if (!appointments || !selectedDate) return [];
    
    const dateStr = selectedDate instanceof Date 
      ? selectedDate.toISOString().split('T')[0]
      : selectedDate;
    
    return appointments.filter((apt) => {
      const aptDate = apt.appointmentDate.split('T')[0];
      return aptDate === dateStr;
    });
  }, [appointments, selectedDate]);

  const appointmentLayout = useMemo(() => {
    return calculateAppointmentLayout(filteredAppointments);
  }, [filteredAppointments]);

  // Calculate current time line position
  const currentTimePosition = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    
    if (!isToday) return null;
    
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    const top = (totalMinutes / 60) * HOUR_HEIGHT;
    
    return top;
  }, [selectedDate, currentTime]);

  return (
    <div className="relative rounded-lg border bg-card">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <h3 className="font-semibold">
          {selectedDate
            ? new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Select a date'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {filteredAppointments.length} appointment(s)
        </span>
      </div>

      {/* Timeline */}
      <div className="relative flex pt-4">
        {/* Time labels */}
        <div className="w-20 flex-shrink-0 border-r bg-muted/30">
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative border-b border-dashed"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground">
                {formatHour(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Appointments area */}
        <div className="relative flex-1">
          {/* Current time indicator line */}
          {currentTimePosition !== null && currentTimePosition >= 0 && (
            <div
              className="absolute left-0 right-0 z-0 flex items-center pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}

          {/* Hour grid lines (clickable) */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative border-b border-dashed hover:bg-muted/50 cursor-pointer transition-colors"
              style={{ height: HOUR_HEIGHT }}
              onClick={() => handleTimeSlotClick(hour)}
            >
              {/* Half-hour line */}
              <div 
                className="absolute left-0 right-0 border-b border-dotted border-muted-foreground/20"
                style={{ top: HOUR_HEIGHT / 2 }}
              />
            </div>
          ))}

          {/* Appointments */}
          {appointmentLayout.map(({ appointment, column, totalColumns }) => {
            const { top, height } = getAppointmentPosition(appointment);
            const GAP = 4; // gap between appointments in pixels
            const widthPercent = 100 / totalColumns;
            const leftPercent = column * widthPercent;
            
            return (
              <div
                key={appointment.id}
                className={cn(
                  'absolute rounded-md border-l-4 px-2 py-1 cursor-pointer transition-all shadow-sm z-10',
                  'text-white text-sm overflow-hidden',
                  statusColors[appointment.status] || 'bg-blue-500'
                )}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 30)}px`,
                  minHeight: '30px',
                  width: `calc(${widthPercent}% - ${GAP * 2}px)`,
                  left: `calc(${leftPercent}% + ${GAP}px)`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick?.(appointment);
                }}
              >
                <div className="font-medium truncate">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </div>
                {height > 40 && (
                  <div className="text-xs opacity-90 truncate">
                    {appointment.appointmentTime} • {appointment.duration} min
                  </div>
                )}
                {height > 60 && appointment.visitReason && (
                  <div className="text-xs opacity-75 truncate">
                    {appointment.visitReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t px-4 py-3">
        {Object.entries(statusColors).map(([status, colorClass]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded-sm', colorClass.split(' ')[0])} />
            <span className="text-xs text-muted-foreground">{status}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="h-0.5 w-4 bg-red-500 rounded" />
          <span className="text-xs text-muted-foreground">Current time</span>
        </div>
      </div>
    </div>
  );
}
