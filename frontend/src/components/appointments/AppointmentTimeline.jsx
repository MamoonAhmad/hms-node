import { useMemo, useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDob } from '@/pages/patient-dashboard/patientChartUtils';
import { statusChipStyle } from '@/lib/appointmentStatuses';
import { isHiddenFromTimeline } from '@/lib/appointmentUtils';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 80;
const MIN_CARD_HEIGHT = 8;
const START_HOUR = 5;
const END_HOUR = 17;

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

function getTimeInMinutes(timeString) {
  const [h, minutes] = (timeString || '00:00').split(':').map(Number);
  return h * 60 + (minutes || 0);
}

function getAppointmentEndMinutes(appointment) {
  const start = getTimeInMinutes(appointment.appointmentTime);
  const endFromField = appointment.appointmentEndTime
    ? getTimeInMinutes(appointment.appointmentEndTime)
    : null;
  if (endFromField != null && endFromField > start) return endFromField;
  return start + (appointment.duration || 30);
}

function appointmentsOverlap(apt1, apt2) {
  const start1 = getTimeInMinutes(apt1.appointmentTime);
  const end1 = getAppointmentEndMinutes(apt1);
  const start2 = getTimeInMinutes(apt2.appointmentTime);
  const end2 = getAppointmentEndMinutes(apt2);
  // Touching boundaries (e.g. 9:30 end / 9:30 start) are not overlaps.
  return start1 < end2 && start2 < end1;
}

function calculateAppointmentLayout(apts) {
  if (!apts.length) return [];

  const sorted = [...apts].sort(
    (a, b) => getTimeInMinutes(a.appointmentTime) - getTimeInMinutes(b.appointmentTime),
  );

  const clusters = [];
  const visited = new Set();

  for (const apt of sorted) {
    if (visited.has(apt.id)) continue;

    const cluster = [];
    const queue = [apt];

    while (queue.length) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      cluster.push(current);

      for (const other of sorted) {
        if (!visited.has(other.id) && appointmentsOverlap(current, other)) {
          queue.push(other);
        }
      }
    }

    cluster.sort(
      (a, b) => getTimeInMinutes(a.appointmentTime) - getTimeInMinutes(b.appointmentTime),
    );
    clusters.push(cluster);
  }

  const layout = [];

  for (const cluster of clusters) {
    const columns = [];

    for (const apt of cluster) {
      let placed = false;
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const overlapsColumn = columns[colIndex].some((other) => appointmentsOverlap(apt, other));
        if (!overlapsColumn) {
          columns[colIndex].push(apt);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([apt]);
      }
    }

    const totalColumns = columns.length;
    columns.forEach((columnAppointments, column) => {
      columnAppointments.forEach((appointment) => {
        layout.push({ appointment, column, totalColumns });
      });
    });
  }

  return layout;
}

function DayTimelineView({
  appointments,
  selectedDate,
  onTimeSlotClick,
  onAppointmentClick,
  statusCatalog = [],
  onStatusChange,
}) {
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

  const getAppointmentPosition = (appointment) => {
    const startMinutes = getTimeInMinutes(appointment.appointmentTime) - START_HOUR * 60;
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const durationMinutes =
      getAppointmentEndMinutes(appointment) - getTimeInMinutes(appointment.appointmentTime);
    const height = (durationMinutes / 60) * HOUR_HEIGHT;
    return { top, height };
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
    return appointments.filter(
      (apt) => getAppointmentDateKey(apt) === dateStr && !isHiddenFromTimeline(apt.status),
    );
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
          const columnWidth = 100 / totalColumns;
          const cardHeight = Math.max(height - 1, MIN_CARD_HEIGHT);
          const isCompact = cardHeight < 44;
          const cardStyle = statusChipStyle(appointment.status, statusCatalog);

          return (
            <div
              key={appointment.id}
              className={cn(
                'absolute z-10 overflow-hidden rounded-md border-l-4 shadow-sm transition-all',
                isCompact ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-sm',
              )}
              style={{
                top: `${top}px`,
                height: `${cardHeight}px`,
                width: `calc(${columnWidth}% - ${GAP}px)`,
                left: `calc(${column * columnWidth}% + ${GAP / 2}px)`,
                backgroundColor: cardStyle.backgroundColor,
                color: cardStyle.color,
                borderLeftColor: cardStyle.borderColor,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="w-full text-left leading-tight"
                onClick={() => onAppointmentClick?.(appointment)}
                title={`${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''} · ${appointment.appointmentTime}`}
              >
                <div className="truncate font-medium">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </div>
                {!isCompact && appointment.patient?.dateOfBirth && (
                  <div className="truncate text-xs opacity-90">
                    DOB: {formatDob(appointment.patient.dateOfBirth)}
                  </div>
                )}
              </button>
              {!isCompact && cardHeight > 56 && onStatusChange && (
                <Select
                  value={appointment.status}
                  onValueChange={(value) => onStatusChange(appointment.id, value)}
                >
                  <SelectTrigger className="mt-1 h-6 border-0 bg-black/10 text-xs text-inherit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusCatalog.map((statusRow) => (
                      <SelectItem key={statusRow.id || statusRow.name} value={statusRow.name}>
                        {statusRow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

function TimelineLegend({ statusCatalog = [] }) {
  return (
    <div className="flex flex-wrap gap-3 border-t px-4 py-3">
      {statusCatalog.map((statusRow) => {
        const chip = statusChipStyle(statusRow.name, statusCatalog);
        return (
          <div key={statusRow.id || statusRow.name} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: chip.backgroundColor }} />
            <span className="text-xs text-muted-foreground">{statusRow.name}</span>
          </div>
        );
      })}
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
  statusCatalog = [],
  onStatusChange,
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
          statusCatalog={statusCatalog}
          onStatusChange={onStatusChange}
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

      {rangeMode === 'day' && <TimelineLegend statusCatalog={statusCatalog} />}
    </div>
  );
}
