import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  ChevronDown,
  FilePlus2,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Printer,
  Send,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChartQuickActions({ patient, onNavigateSection }) {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  const primary = [
    {
      id: 'dashboard',
      label: 'Open Dashboard',
      icon: LayoutDashboard,
      onClick: () => navigate(`/patient-dashboard/${patient.id}`),
    },
    {
      id: 'appointment',
      label: 'Schedule',
      icon: CalendarPlus,
      onClick: () => navigate(`/appointments?patientId=${patient.id}`),
    },
    {
      id: 'note',
      label: 'Add Note',
      icon: FilePlus2,
      onClick: () => onNavigateSection('clinical-notes'),
    },
  ];

  const more = [
    { id: 'document', label: 'Upload Document', icon: Upload, onClick: () => onNavigateSection('documents') },
    { id: 'referral', label: 'Create Referral', icon: Send, onClick: () => onNavigateSection('referrals') },
    { id: 'edit', label: 'Edit Patient', icon: Pencil, onClick: () => navigate(`/patients/edit/${patient.id}`) },
    { id: 'insurance', label: 'Insurance', icon: FileText, onClick: () => onNavigateSection('insurance') },
    { id: 'facesheet', label: 'Print Face Sheet', icon: Printer, onClick: () => window.print() },
    { id: 'audit', label: 'View Audit History', icon: FileText, onClick: () => onNavigateSection('audit') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3 sm:px-6 lg:px-8 print:hidden">
      <p className="mr-1 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:block">
        Actions
      </p>
      {primary.map((action) => {
        const Icon = action.icon;
        return (
          <Button key={action.id} variant="outline" size="sm" className="h-9 gap-2 bg-card" onClick={action.onClick}>
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        );
      })}

      <div className="relative ml-auto sm:ml-0" ref={moreRef}>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <MoreHorizontal className="h-4 w-4" />
          More
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
        {moreOpen && (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-1 flex w-56 flex-col rounded-xl border bg-popover p-1.5 shadow-lg"
          >
            {more.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  role="menuitem"
                  variant="ghost"
                  size="sm"
                  className={cn('h-auto w-full justify-start gap-2 rounded-lg px-2.5 py-2')}
                  onClick={() => {
                    setMoreOpen(false);
                    action.onClick();
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
