import { Outlet, useLocation } from 'react-router-dom';
import { FacilityConfigProvider } from '@/contexts/FacilityConfigContext';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

function LayoutContent() {
  const { isCollapsed } = useSidebar();
  const { pathname } = useLocation();
  const isFullBleedWorkspace = pathname.startsWith('/patient-dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300 flex min-h-screen flex-col',
          isCollapsed ? 'pl-16' : 'pl-[17.6rem]'
        )}
      >
        <Topbar />
        <div className="app-shell-bg flex-1 overflow-auto min-h-0">
          <div
            className={
              isFullBleedWorkspace
                ? 'mx-auto w-full max-w-[1600px]'
                : 'mx-auto w-full max-w-[1600px] p-5 lg:p-7'
            }
          >
            {isFullBleedWorkspace ? <Outlet /> : <div className="ehr-page"><Outlet /></div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Layout() {
  return (
    <FacilityConfigProvider>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </FacilityConfigProvider>
  );
}
