import { Outlet } from 'react-router-dom';
import { FacilityConfigProvider } from '@/contexts/FacilityConfigContext';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

function LayoutContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300 flex flex-col',
          isCollapsed ? 'pl-16' : 'pl-[17.6rem]'
        )}
      >
        <Topbar />
        <div className="flex-1 p-8 overflow-auto min-h-0">
          <Outlet />
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



