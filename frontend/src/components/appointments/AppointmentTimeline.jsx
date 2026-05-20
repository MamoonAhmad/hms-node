import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 60;
const START_HOUR = 0;
const END_HOUR = 23;

const statusColors = {
  Scheduled: 'bg-primary hover:bg-primary/90 border-primary',
  'Checked-In': 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  'In Progress': 'bg-purple-500 hover:bg-purple-600 border-purple-600',
  Completed: 'bg-green-500 hover:bg-green-600 border-green-600',
  Cancelled: 'bg-red-400 hover:bg-red-500 border-red-500 opacity-60',
  'No-Show': 'bg-gray-400 hover:bg-gray-500 border-gray-500 opacity-60',
  Rescheduled: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
};

const statusBadgeColors = {
  Scheduled: 'bg-primary/10 text-primary',
  'Checked-In': 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'No-Show': 'bg-gray-100 text-gray-800',
  Rescheduled: 'bg-orange-100 text-orange-800',
};

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getAppointmentDateKey(appointment) {
  return appointment.appointmentDate.split('T')[0];
}

function formatTimeShort(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getWeekDays(anchorDate) {
  const anchor = parseLocalDate(anchorDate);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

function getMonthGridDays(anchorDate) {
  const anchor = parseLocalDate(anchorDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

function DayTimelineView({ appointments, selectedDate, onTimeSlotClick, onAppointmentClick }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = useMemo(() => {
    const result = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) result.push(i);
    return result;
  }, []);

  const getTimeInMinutes = (timeString) => {
    const [h, minutes] = timeString.split(':').map(Number);
    return h * 60 + minutes;
  };

  const getAppointmentPosition = (appointment) => {
    const startMinutes = getTimeInMinutes(appointment.appointmentTime) - START_HOUR * 60;
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (appointment.duration / 60) * HOUR_HEIGHT;
    return { top, height };
  };

  const appointmentsOverlap = (apt1, apt2) => {
    const start1 = getTimeInMinutes(apt1.appointmentTime);
    const end1 = start1 + (apt1.duration || 30);
    const start2 = getTimeInMinutes(apt2.appointmentTime);
    const end2 = start2 + (apt2.duration || 30);
    return start1 < end2 && start2 < end1;
  };

  const calculateAppointmentLayout = (apts) => {
    if (!apts.length) return [];
    const sorted = [...apts].sort(
      (a, b) => getTimeInMinutes(a.appointmentTime) - getTimeInMinutes(b.appointmentTime),
    );
    const layoutMap = new Map();

    sorted.forEach((apt) => {
      const overlapping = sorted.filter(
        (other) => other.id !== apt.id && appointmentsOverlap(apt, other),
      );
      const usedColumns = new Set();
      overlapping.forEach((other) => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout !== undefined) usedColumns.add(otherLayout.column);
      });
      let column = 0;
      while (usedColumns.has(column)) column++;
      layoutMap.set(apt.id, { column, totalColumns: overlapping.length + 1 });
    });

    sorted.forEach((apt) => {
      const overlapping = sorted.filter(
        (other) => other.id !== apt.id && appointmentsOverlap(apt, other),
      );
      let maxColumns = layoutMap.get(apt.id).totalColumns;
      let maxColumnIndex = layoutMap.get(apt.id).column;
      overlapping.forEach((other) => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout) {
          maxColumns = Math.max(maxColumns, otherLayout.totalColumns);
          maxColumnIndex = Math.max(maxColumnIndex, otherLayout.column);
        }
      });
      const finalTotalColumns = Math.max(maxColumns, maxColumnIndex + 1);
      layoutMap.get(apt.id).totalColumns = finalTotalColumns;
      overlapping.forEach((other) => {
        const otherLayout = layoutMap.get(other.id);
        if (otherLayout) otherLayout.totalColumns = finalTotalColumns;
      });
    });

    return sorted.map((apt) => ({ appointment: apt, ...layoutMap.get(apt.id) }));
  };

  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const filteredAppointments = useMemo(() => {
    if (!appointments || !selectedDate) return [];
    const dateStr =
      selectedDate instanceof Date ? toDateKey(selectedDate) : selectedDate;
    return appointments.filter((apt) => getAppointmentDateKey(apt) === dateStr);
  }, [appointments, selectedDate]);

  const appointmentLayout = useMemo(
    () => calculateAppointmentLayout(filteredAppointments),
    [filteredAppointments],
  );

  const currentTimePosition = useMemo(() => {
    const today = toDateKey(new Date());
    if (selectedDate !== today) return null;
    const h = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (h - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  }, [selectedDate, currentTime]);

  return (
    <div className="relative flex pt-4">
      <div className="w-20 shrink-0 border-r bg-muted/30">
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

      <div className="relative flex-1">
        {currentTimePosition !== null && currentTimePosition >= 0 && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-0 flex items-center"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
            <div className="h-0.5 flex-1 bg-red-500" />
          </div>
        )}

        {hours.map((hour) => (
          <div
            key={hour}
            className="relative cursor-pointer border-b border-dashed transition-colors hover:bg-muted/50"
            style={{ height: HOUR_HEIGHT }}
            onClick={() =>
              onTimeSlotClick?.(
                selectedDate,
                `${hour.toString().padStart(2, '0')}:00`,
              )
            }
          >
            <div
              className="absolute left-0 right-0 border-b border-dotted border-muted-foreground/20"
              style={{ top: HOUR_HEIGHT / 2 }}
            />
          </div>
        ))}

        {appointmentLayout.map(({ appointment, column, totalColumns }) => {
          const { top, height } = getAppointmentPosition(appointment);
          const GAP = 4;
          const widthPercent = 100 / totalColumns;
          const leftPercent = column * widthPercent;

          return (
            <div
              key={appointment.id}
              className={cn(
                'absolute z-10 cursor-pointer overflow-hidden rounded-md border-l-4 px-2 py-1 text-sm text-white shadow-sm transition-all',
                statusColors[appointment.status] || 'bg-primary',
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
              <div className="truncate font-medium">
                {appointment.patient?.firstName} {appointment.patient?.lastName}
              </div>
              {height > 40 && (
                <div className="truncate text-xs opacity-90">
                  {appointment.appointmentTime} • {appointment.duration} min
                </div>
              )}
              {height > 60 && appointment.visitReason && (
                <div className="truncate text-xs opacity-75">{appointment.visitReason}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekTimelineView({ appointments, selectedDate, onAppointmentClick, onDayClick }) {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const anchorMonth = parseLocalDate(selectedDate).getMonth();

  const appointmentsByDay = useMemo(() => {
    const map = new Map();
    weekDays.forEach((day) => map.set(toDateKey(day), []));
    (appointments || []).forEach((apt) => {
      const key = getAppointmentDateKey(apt);
      if (map.has(key)) map.get(key).push(apt);
    });
    map.forEach((list) =>
      list.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime)),
    );
    return map;
  }, [appointments, weekDays]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {weekDays.map((day) => {
          const key = toDateKey(day);
          const dayAppointments = appointmentsByDay.get(key) || [];
          const isToday = key === toDateKey(new Date());
          const isSelected = key === selectedDate;

          return (
            <div
              key={key}
              className={cn(
                'flex min-h-[220px] flex-col rounded-lg border bg-background',
                isSelected && 'ring-2 ring-primary',
                isToday && !isSelected && 'border-primary/40',
              )}
            >
              <button
                type="button"
                className="border-b px-3 py-2 text-left hover:bg-muted/50"
                onClick={() => onDayClick?.(key)}
              >
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    day.getMonth() !== anchorMonth && 'text-muted-foreground',
                  )}
                >
                  {day.getDate()}
                </div>
              </button>
              <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
                {dayAppointments.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No appointments</p>
                ) : (
                  dayAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      className={cn(
                        'w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:opacity-90',
                        statusBadgeColors[apt.status] || 'bg-muted',
                      )}
                      onClick={() => onAppointmentClick?.(apt)}
                    >
                      <div className="font-medium truncate">
                        {formatTimeShort(apt.appointmentTime)}
                      </div>
                      <div className="truncate text-muted-foreground">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthTimelineView({ appointments, selectedDate, onAppointmentClick, onDayClick }) {
  const gridDays = useMemo(() => getMonthGridDays(selectedDate), [selectedDate]);
  const anchor = parseLocalDate(selectedDate);
  const month = anchor.getMonth();
  const year = anchor.getFullYear();

  const appointmentsByDay = useMemo(() => {
    const map = new Map();
    (appointments || []).forEach((apt) => {
      const key = getAppointmentDateKey(apt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(apt);
    });
    return map;
  }, [appointments]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4">
      <div className="mb-3 grid grid-cols-7 gap-px text-center text-xs font-medium uppercase text-muted-foreground">
        {weekdays.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
        {gridDays.map((day) => {
          const key = toDateKey(day);
          const dayAppointments = appointmentsByDay.get(key) || [];
          const inMonth = day.getMonth() === month && day.getFullYear() === year;
          const isToday = key === toDateKey(new Date());
          const isSelected = key === selectedDate;

          return (
            <button
              key={key}
              type="button"
              className={cn(
                'flex min-h-[100px] flex-col bg-card p-2 text-left transition-colors hover:bg-muted/40',
                !inMonth && 'bg-muted/20 text-muted-foreground',
                isSelected && 'ring-2 ring-inset ring-primary',
                isToday && !isSelected && 'bg-primary/5',
              )}
              onClick={() => onDayClick?.(key)}
            >
              <span
                className={cn(
                  'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                  isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <span
                    key={apt.id}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[10px] leading-tight',
                      statusBadgeColors[apt.status] || 'bg-muted',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(apt);
                    }}
                  >
                    {formatTimeShort(apt.appointmentTime)}{' '}
                    {apt.patient?.lastName}
                  </span>
                ))}
                {dayAppointments.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayAppointments.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimelineLegend() {
  return (
    <div className="flex flex-wrap gap-3 border-t px-4 py-3">
      {Object.entries(statusColors).map(([status, colorClass]) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className={cn('h-3 w-3 rounded-sm', colorClass.split(' ')[0])} />
          <span className="text-xs text-muted-foreground">{status}</span>
        </div>
      ))}
      <div className="ml-4 flex items-center gap-1.5">
        <div className="h-0.5 w-4 rounded bg-red-500" />
        <span className="text-xs text-muted-foreground">Current time</span>
      </div>
    </div>
  );
}

export function AppointmentTimeline({
  appointments,
  selectedDate,
  rangeMode = 'day',
  onTimeSlotClick,
  onAppointmentClick,
  onDayClick,
}) {
  const headerLabel = useMemo(() => {
    if (!selectedDate) return 'Select a date';
    const date = parseLocalDate(selectedDate);

    if (rangeMode === 'week') {
      const days = getWeekDays(selectedDate);
      return `${days[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }

    if (rangeMode === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate, rangeMode]);

  const visibleCount = useMemo(() => {
    if (!appointments || !selectedDate) return 0;

    if (rangeMode === 'day') {
      return appointments.filter((apt) => getAppointmentDateKey(apt) === selectedDate).length;
    }

    if (rangeMode === 'week') {
      const keys = new Set(getWeekDays(selectedDate).map(toDateKey));
      return appointments.filter((apt) => keys.has(getAppointmentDateKey(apt))).length;
    }

    const anchor = parseLocalDate(selectedDate);
    const month = anchor.getMonth();
    const year = anchor.getFullYear();
    return appointments.filter((apt) => {
      const d = parseLocalDate(getAppointmentDateKey(apt));
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  }, [appointments, selectedDate, rangeMode]);

  return (
    <div className="relative rounded-lg border bg-card">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <h3 className="font-semibold">{headerLabel}</h3>
        <span className="text-sm text-muted-foreground">
          {visibleCount} appointment(s)
        </span>
      </div>

      {rangeMode === 'day' && (
        <DayTimelineView
          appointments={appointments}
          selectedDate={selectedDate}
          onTimeSlotClick={onTimeSlotClick}
          onAppointmentClick={onAppointmentClick}
        />
      )}
      {rangeMode === 'week' && (
        <WeekTimelineView
          appointments={appointments}
          selectedDate={selectedDate}
          onAppointmentClick={onAppointmentClick}
          onDayClick={onDayClick}
        />
      )}
      {rangeMode === 'month' && (
        <MonthTimelineView
          appointments={appointments}
          selectedDate={selectedDate}
          onAppointmentClick={onAppointmentClick}
          onDayClick={onDayClick}
        />
      )}

      {rangeMode === 'day' && <TimelineLegend />}
    </div>
  );
}
