import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CreditCard,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  MoreVertical,
  Pencil,
  Pill,
  Printer,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  { id: 'edit', label: 'Edit Patient', icon: Pencil },
  { id: 'chart', label: 'View Chart', icon: FolderOpen },
  { id: 'appointment-history', label: 'View Appointment History', icon: Calendar },
  { id: 'dashboard', label: 'Patient Dashboard', icon: LayoutDashboard },
  { id: 'encounters', label: 'Open Encounter', icon: Stethoscope },
  { id: 'med-refill', label: 'Med Refill', icon: Pill, disabled: true },
  { id: 'documents', label: 'View Documents', icon: FileText },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'delete', label: 'Delete Patient', icon: Trash2, destructive: true },
  { id: 'timeline', label: 'View Timeline', icon: History },
  { id: 'wristband', label: 'Print Wristband', icon: Printer },
];

export function PatientActionMenu({ patient, onAction, disabled = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

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

  const handleSelect = (actionId) => {
    setOpen(false);
    onAction?.(actionId, patient);
  };

  const visibleItems = patient?._isQueueDraft
    ? MENU_ITEMS.filter((item) => item.id === 'edit')
    : MENU_ITEMS;

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
        aria-label="Patient actions"
        title="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 flex w-56 flex-col rounded-md border bg-popover p-1 shadow-lg"
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                role="menuitem"
                variant="ghost"
                size="sm"
                disabled={item.disabled}
                className={cn(
                  'h-auto w-full justify-start gap-2 px-2 py-2',
                  item.destructive && 'text-destructive hover:text-destructive',
                )}
                onClick={() => !item.disabled && handleSelect(item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
