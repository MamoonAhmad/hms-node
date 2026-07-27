import { Outlet, useLocation } from 'react-router-dom';
import { FacilityConfigProvider } from '@/contexts/FacilityConfigContext';
import { TopbarDepartmentProvider } from '@/contexts/TopbarDepartmentContext';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

function LayoutContent() {
  const { isCollapsed } = useSidebar();
  const { pathname } = useLocation();
  const isFullBleedWorkspace = pathname.startsWith('/patient-dashboard');
  const isPrintView =
    /^\/laboratory-management\/result-management\/report\//.test(pathname);

  if (isPrintView) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <main
        className={cn(
          'flex h-screen flex-col overflow-hidden transition-all duration-300',
          isCollapsed ? 'pl-16' : 'pl-[17.6rem]'
        )}
      >
        <Topbar />
        <div
          className={cn(
            'app-shell-bg min-h-0 flex-1',
            isFullBleedWorkspace ? 'overflow-hidden' : 'overflow-auto',
          )}
        >
          <div
            className={
              isFullBleedWorkspace
                ? 'h-full w-full'
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
      <TopbarDepartmentProvider>
        <SidebarProvider>
          <LayoutContent />
        </SidebarProvider>
      </TopbarDepartmentProvider>
    </FacilityConfigProvider>
  );
}
