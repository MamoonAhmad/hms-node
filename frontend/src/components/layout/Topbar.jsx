import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown, Building2, Clock, Hospital } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacilityConfig } from '@/contexts/FacilityConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ALL_DEPARTMENTS_VALUE,
  useTopbarDepartment,
} from '@/contexts/TopbarDepartmentContext';

const INITIAL_NOTIFICATIONS = [
  { id: 1, message: 'New appointment scheduled for John Doe', dateTime: '2025-02-12 09:30 AM' },
  { id: 2, message: 'Lab results are ready for review', dateTime: '2025-02-12 08:15 AM' },
  { id: 3, message: 'Patient check-in: Jane Smith', dateTime: '2025-02-12 08:00 AM' },
  { id: 4, message: 'Reminder: Staff meeting at 2:00 PM', dateTime: '2025-02-11 04:45 PM' },
];

const LOAD_MORE_NOTIFICATIONS = [
  { id: 5, message: 'Inventory alert: Low stock on medication', dateTime: '2025-02-11 02:20 PM' },
  { id: 6, message: 'New message from Dr. Williams', dateTime: '2025-02-11 11:00 AM' },
  { id: 7, message: 'System maintenance scheduled tonight', dateTime: '2025-02-10 06:00 PM' },
];

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/patients': 'Patient Management',
  '/appointments': 'Appointments',
  '/appointments/new': 'New Appointment',
  '/providers': 'Providers',
  '/departments': 'Departments',
  '/patient-dashboard': 'Patient Dashboard',
  '/rcm/claims': 'Claims Listing',
  '/rcm/claim-tracker': 'Claim Tracker',
};

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function resolveRouteLabel(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  const match = Object.entries(ROUTE_LABELS).find(
    ([path]) => path !== '/' && pathname.startsWith(path)
  );
  if (match) return match[1];
  const segment = pathname.split('/').filter(Boolean).pop();
  if (!segment) return 'Workspace';
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locationName } = useFacilityConfig();
  const { user, logout } = useAuth();
  const {
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
  } = useTopbarDepartment();
  const now = useLiveClock();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(notificationsRef, () => setNotificationsOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const workspaceLabel = resolveRouteLabel(location.pathname);
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleLoadMoreNotifications = () => {
    setNotifications((prev) => [...prev, ...LOAD_MORE_NOTIFICATIONS]);
    setHasMoreNotifications(false);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initials =
    user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--primary-hover)] bg-primary text-primary-foreground">
      <div className="flex h-14 items-center justify-between gap-4 px-5 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight text-primary-foreground">
              {workspaceLabel}
            </p>
            <p className="truncate text-xs text-primary-foreground/75">
              Clinical workspace
            </p>
          </div>
          <div className="hidden h-6 w-px bg-primary-foreground/25 lg:block" aria-hidden />
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <Building2 className="size-3.5 shrink-0 text-primary-foreground/75" aria-hidden />
            <span className="truncate text-sm text-primary-foreground/85">
              {locationName || 'Main Facility'}
            </span>
          </div>
          <div className="hidden h-6 w-px bg-primary-foreground/25 sm:block" aria-hidden />
          <div className="min-w-0 max-w-[220px]">
            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
              <SelectTrigger
                size="sm"
                aria-label="Select department"
                className="h-8 w-full min-w-[160px] border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground shadow-none hover:border-primary-foreground/40 hover:bg-primary-foreground/15 focus-visible:border-primary-foreground/50 focus-visible:ring-primary-foreground/25 data-[placeholder]:text-primary-foreground/70 [&_svg:not([class*='text-'])]:text-primary-foreground/75"
              >
                <Hospital className="size-3.5 shrink-0 text-primary-foreground/75" aria-hidden />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent align="start" className="max-h-72">
                <SelectItem value={ALL_DEPARTMENTS_VALUE}>All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.departmentName || 'Untitled department'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/85 sm:flex"
            aria-label="Current date and time"
          >
            <Clock className="size-3.5" aria-hidden />
            <span className="tabular-nums">{dateLabel}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums font-medium text-primary-foreground">{timeLabel}</span>
          </div>

          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary-foreground" />
              )}
            </Button>
            {notificationsOpen && (
              <div
                className={cn(
                  'absolute right-0 top-full z-50 mt-2 flex w-80 max-h-[min(24rem,70vh)] flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-[var(--shadow-elevation-lg)]',
                )}
              >
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">System and clinical alerts</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="border-b px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/50"
                    >
                      <p className="text-sm text-foreground">{n.message}</p>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        {n.dateTime}
                      </p>
                    </div>
                  ))}
                </div>
                {hasMoreNotifications && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleLoadMoreNotifications}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-primary-foreground/25 px-2 py-1.5 text-left text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotificationsOpen(false);
              }}
              aria-label="Profile menu"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary-foreground text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="hidden min-w-0 max-w-[120px] sm:block">
                <p className="truncate text-xs font-medium leading-tight text-primary-foreground">
                  {displayName}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-3.5 shrink-0 text-primary-foreground/75 transition-transform',
                  profileOpen && 'rotate-180',
                )}
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-[var(--shadow-elevation-lg)]">
                <div className="border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
