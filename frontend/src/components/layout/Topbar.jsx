import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Dummy notifications - description and date/time
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

export function Topbar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(notificationsRef, () => setNotificationsOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const handleLoadMoreNotifications = () => {
    setNotifications((prev) => [...prev, ...LOAD_MORE_NOTIFICATIONS]);
    setHasMoreNotifications(false);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    // TODO: wire to auth logout (e.g. clear token, redirect to login)
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-2 border-b border-primary/30 px-6 bg-primary text-primary-foreground">
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => {
              setNotificationsOpen((o) => !o);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell className="size-5 text-primary-foreground" />
          </Button>
          {notificationsOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg',
                'max-h-[min(24rem,70vh)] overflow-hidden flex flex-col'
              )}
            >
              <div className="border-b px-4 py-3">
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="border-b px-4 py-3 last:border-b-0 hover:bg-accent/50 transition-colors"
                  >
                    <p className="text-sm text-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.dateTime}</p>
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

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotificationsOpen(false);
            }}
            aria-label="Profile menu"
          >
            {/* Dummy profile pic - replace with real user avatar later */}
            <img
              src="https://placehold.co/36x36/1877F2/ffffff?text=U"
              alt="Profile"
              className="size-9 rounded-full object-cover"
            />
            <ChevronDown
              className={cn('size-4 text-primary-foreground/90 transition-transform', profileOpen && 'rotate-180')}
            />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border bg-background shadow-lg overflow-hidden">
              {/* User profile section */}
              <div className="border-b p-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://placehold.co/48x48/1877F2/ffffff?text=U"
                    alt="Profile"
                    className="size-12 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">User Name</p>
                    <p className="truncate text-sm text-muted-foreground">user@example.com</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
