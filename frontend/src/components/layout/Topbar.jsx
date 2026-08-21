import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown, Building2, Clock, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFacilityConfig } from '@/contexts/FacilityConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { getUserDisplayName, getUserSubtitle } from '@/lib/userDisplay';

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
  '/appointments/waitlist': 'Waitlist',
  '/providers': 'Providers',
  '/departments': 'Departments',
  '/encounters-work-list': 'Encounters Work List',
  '/rcm/worklist': 'RCM Worklist',
  '/rcm/claims': 'Claims Listing',
  '/rcm/claim-tracker': 'Claim Tracker',
  '/rcm/follow-up-management': 'Follow Up Management',
  '/rcm/cms-1500': 'CMS 1500',
  '/rcm/claim-ub04': 'Claim UB-04',
  '/rcm/reports': 'RCM Reports',
  '/profile': 'My Profile',
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

  const handleProfile = () => {
    setProfileOpen(false);
    navigate('/profile');
  };

  const displayName = getUserDisplayName(user);
  const displaySubtitle = getUserSubtitle(user);
  const displayEmail = user?.email || 'user@example.com';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        {/* Workspace context */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-medium text-muted-foreground">
              Clinical workspace
            </p>
            <p className="truncate text-[0.9375rem] font-semibold leading-tight text-foreground">
              {workspaceLabel}
            </p>
          </div>
          <div className="hidden h-8 w-px bg-border lg:block" aria-hidden />
          <div className="hidden items-center gap-2 text-muted-foreground md:flex">
            <Building2 className="size-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate text-sm font-medium text-foreground">
              {locationName || 'Main Facility'}
            </span>
          </div>
        </div>

        {/* Date / time + actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground sm:flex"
            aria-label="Current date and time"
          >
            <Clock className="size-3.5 opacity-80" aria-hidden />
            <span className="tabular-nums font-medium">{dateLabel}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="tabular-nums font-semibold">{timeLabel}</span>
          </div>

          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
              )}
            </Button>
            {notificationsOpen && (
              <div
                className={cn(
                  'absolute right-0 top-full z-50 mt-2 flex w-80 max-h-[min(24rem,70vh)] flex-col overflow-hidden rounded-lg border bg-background shadow-lg',
                )}
              >
                <div className="border-b bg-muted/40 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">System and clinical alerts</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="border-b px-4 py-3 last:border-b-0 transition-colors hover:bg-accent/50"
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
              className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1.5 text-left transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotificationsOpen(false);
              }}
              aria-label="Profile menu"
            >
              <UserAvatar user={user} className="size-8 shrink-0" />
              <div className="hidden min-w-0 max-w-[140px] sm:block">
                <p className="truncate text-xs font-semibold leading-tight">{displayName}</p>
                <p className="truncate text-[0.65rem] text-muted-foreground">
                  {displaySubtitle || displayEmail}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 opacity-80 transition-transform',
                  profileOpen && 'rotate-180',
                )}
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border bg-background shadow-lg">
                <div className="border-b bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} className="size-11 shrink-0 rounded-lg" imageClassName="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{displayName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {displaySubtitle || displayEmail}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                    onClick={handleProfile}
                  >
                    <UserCircle className="size-4" />
                    Profile
                  </Button>
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
