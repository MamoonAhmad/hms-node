import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  DoorOpen,
  Eye,
  LogOut,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canRoomPatient } from '@/lib/appointmentEventStatus';
import {
  APPOINTMENT_STATUS,
  canCancelAppointment,
  canMarkNoShowAppointment,
  getNextAppointmentStatus,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatusWorkflow';
import { cn } from '@/lib/utils';

const NEXT_STATUS_ICONS = {
  [APPOINTMENT_STATUS.CHECKED_IN]: UserCheck,
  [APPOINTMENT_STATUS.IN_PROGRESS]: PlayCircle,
  [APPOINTMENT_STATUS.CHECKED_OUT]: LogOut,
  [APPOINTMENT_STATUS.COMPLETED]: CheckCircle2,
};

export function AppointmentActionMenu({
  appointment,
  onViewPatientAppointments,
  onAdvanceStatus,
  onCancelAppointment,
  onMarkNoShow,
  onRoomPatient,
  onView,
  onEditOrReschedule,
  onHistory,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const eventStatus = appointment?.eventStatus || 'Scheduled';
  const currentStatus = normalizeAppointmentStatus(appointment?.status);
  const nextStatus = getNextAppointmentStatus(currentStatus);
  const showCancel = canCancelAppointment(currentStatus);
  const showNoShow = canMarkNoShowAppointment(currentStatus);
  const NextStatusIcon = nextStatus ? NEXT_STATUS_ICONS[nextStatus] || PlayCircle : null;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const items = [
    {
      id: 'patient-appointments',
      label: 'View all patient appointments',
      icon: CalendarDays,
      onSelect: () => onViewPatientAppointments?.(appointment),
    },
    nextStatus && {
      id: 'next-status',
      label: nextStatus,
      icon: NextStatusIcon,
      onSelect: () => onAdvanceStatus?.(appointment, nextStatus),
    },
    showCancel && {
      id: 'cancel',
      label: 'Cancel appointment',
      icon: XCircle,
      iconClassName: 'text-destructive',
      className: 'text-destructive hover:text-destructive',
      onSelect: () => onCancelAppointment?.(appointment),
    },
    showNoShow && {
      id: 'no-show',
      label: 'No Show',
      icon: UserX,
      onSelect: () => onMarkNoShow?.(appointment),
    },
    canRoomPatient(eventStatus, appointment) && {
      id: 'room-patient',
      label: 'Room patient',
      icon: DoorOpen,
      onSelect: () => onRoomPatient?.(appointment),
    },
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      onSelect: () => onView?.(appointment),
    },
    {
      id: 'edit-reschedule',
      label: 'Edit / Reschedule',
      icon: Pencil,
      iconClassName: 'icon-action-edit',
      onSelect: () => onEditOrReschedule?.(appointment),
    },
    {
      id: 'history',
      label: 'Timeline history',
      icon: Clock,
      onSelect: () => onHistory?.(appointment),
    },
  ].filter(Boolean);

  const handleSelect = (item) => {
    setOpen(false);
    item.onSelect?.();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        className="h-8 w-8"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Appointment actions"
        title="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 flex w-64 flex-col rounded-md border bg-popover p-1 shadow-lg"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                role="menuitem"
                variant="ghost"
                size="sm"
                className={cn('h-auto w-full justify-start gap-2 px-2 py-2', item.className)}
                onClick={() => handleSelect(item)}
              >
                <Icon className={cn('h-4 w-4 shrink-0', item.iconClassName)} />
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
