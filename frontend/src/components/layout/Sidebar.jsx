import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  Settings,
  Shield,
  Stethoscope,
  UserCheck,
  Building2,
  ClipboardList,
  MessageSquare,
  Code,
  FolderTree,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  FlaskConical,
  Camera,
  Pill,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Provider menu: visible to Admin, Super Admin, Credentialing/Provider Management (role check can be wired here)
const providersItems = [
  { name: "Provider List", href: "/providers", icon: UserCheck },
  { name: "Provider Schedule", href: "/providers/schedule", icon: Calendar },
  { name: "Departments", href: "/departments", icon: Building2 },
];

const administrationItems = [
  { name: "Payers Management", href: "/insurance-providers", icon: Shield },
  {
    name: "Chief Complaints",
    href: "/administration/chief-complaint",
    icon: MessageSquare,
  },
  {
    name: "Procedure Categories",
    href: "/administration/procedure-categories",
    icon: FolderTree,
  },
  {
    name: "Procedure Codes",
    href: "/administration/procedure-codes",
    icon: Code,
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

const patientManagementItems = [
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Nurses", href: "/nurse-assessment", icon: Stethoscope },
  {
    name: "Patient Dashboard",
    href: "/patient-dashboard",
    icon: ClipboardList,
  },
];

const laboratoryManagementItems = [
  {
    name: "Laboratory Dashboard",
    href: "/laboratory-management",
    icon: LayoutDashboard,
  },
  {
    name: "Specimen Collection",
    href: "/laboratory-management/specimen-collection",
    icon: FlaskConical,
  },
  {
    name: "Specimen Transport",
    href: "/laboratory-management/specimen-transport",
    icon: FlaskConical,
  },
  {
    name: "Specimen Receiver",
    href: "/laboratory-management/specimen-receiver",
    icon: FlaskConical,
  },
  {
    name: "Lab Order Transport",
    href: "/laboratory-management/lab-order-transport",
    icon: FlaskConical,
  },
  {
    name: "Lab Report Received",
    href: "/laboratory-management/lab-report-received",
    icon: FlaskConical,
  },
  {
    name: "Result Management",
    href: "/laboratory-management/result-management",
    icon: FlaskConical,
  },
  {
    name: "Test Catalog",
    href: "/laboratory-management/test-catalog",
    icon: FlaskConical,
  },
];

const radiologyManagementItems = [
  { name: "Radiology Dashboard", href: "/radiology-management", icon: Camera },
  {
    name: "Order Management",
    href: "/radiology-management/order-management",
    icon: Camera,
  },
];

const pharmacyItems = [
  { name: "Dashboard", href: "/pharmacy", icon: LayoutDashboard },
  {
    name: "Medication Analytics",
    href: "/pharmacy?report=medication",
    icon: Pill,
  },
  { name: "Inventory Reports", href: "/pharmacy?report=inventory", icon: Pill },
  {
    name: "Medication Prescriptions",
    href: "/pharmacy/e-prescribe-med-reconciliation",
    icon: Pill,
  },
];

const outsidePharmacyItems = [
  { name: "Outpatient Medicines", href: "/outpatient/medicines", icon: Pill },
];

// Sections for Lab/Radiology/Prescription (Laboratory, Pharmacy, Radiology)
const onsiteOrdersSections = [
  {
    title: "Laboratory Management",
    icon: FlaskConical,
    items: laboratoryManagementItems,
  },
  { title: "Pharmacy", icon: Pill, items: pharmacyItems },
  {
    title: "Radiology Management",
    icon: Camera,
    items: radiologyManagementItems,
  },
];

function MenuDropdown({ title, items, isCollapsed }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Check if any item in the dropdown is active (pathname match; hash/query ignored for nav)
  const isActive = items.some((item) => {
    const itemPath = item.href.split("?")[0];
    const locPath = location.pathname;
    return (
      locPath === itemPath || (itemPath !== "/" && locPath.startsWith(itemPath))
    );
  });

  // Auto-open if any item is active
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  // Auto-collapse when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          isCollapsed && "justify-center",
        )}
        title={isCollapsed ? title : ""}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {!isCollapsed && <span>{title}</span>}
        </div>
        {!isCollapsed &&
          (isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ))}
      </button>
      {isOpen && !isCollapsed && (
        <div className="mt-1 space-y-1 pl-4">
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )
                }
              >
                <ItemIcon className="h-4 w-4" />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NestedMenuDropdown({ title, sections, icon: Icon, isCollapsed }) {
  const [isParentOpen, setIsParentOpen] = useState(false);
  const [openSectionIndex, setOpenSectionIndex] = useState(null);
  const location = useLocation();

  const isActive = sections.some((section) =>
    section.items.some((item) => {
      const itemPath = item.href.split("?")[0];
      return (
        location.pathname === itemPath ||
        (itemPath !== "/" && location.pathname.startsWith(itemPath))
      );
    }),
  );

  useEffect(() => {
    if (isActive) {
      setIsParentOpen(true);
      const idx = sections.findIndex((section) =>
        section.items.some((item) => {
          const itemPath = item.href.split("?")[0];
          return (
            location.pathname === itemPath ||
            (itemPath !== "/" && location.pathname.startsWith(itemPath))
          );
        }),
      );
      if (idx >= 0) setOpenSectionIndex(idx);
    }
  }, [isActive, location.pathname, sections]);

  useEffect(() => {
    if (isCollapsed) {
      setIsParentOpen(false);
      setOpenSectionIndex(null);
    }
  }, [isCollapsed]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsParentOpen(!isParentOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          isCollapsed && "justify-center",
        )}
        title={isCollapsed ? title : ""}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {!isCollapsed && <span>{title}</span>}
        </div>
        {!isCollapsed &&
          (isParentOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ))}
      </button>
      {isParentOpen && !isCollapsed && (
        <div className="mt-1 space-y-1 pl-4">
          {sections.map((section, idx) => {
            const SectionIcon = section.icon;
            const isSectionOpen = openSectionIndex === idx;
            const isSectionActive = section.items.some((item) => {
              const itemPath = item.href.split("?")[0];
              return (
                location.pathname === itemPath ||
                (itemPath !== "/" && location.pathname.startsWith(itemPath))
              );
            });
            return (
              <div key={section.title} className="space-y-1">
                <button
                  onClick={() =>
                    setOpenSectionIndex(isSectionOpen ? null : idx)
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isSectionActive
                      ? "bg-sidebar-accent/80 text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className="h-4 w-4" />
                    {section.title}
                  </div>
                  {isSectionOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isSectionOpen && (
                  <div className="pl-4 space-y-0.5">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          className={({ isActive: itemActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                              itemActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            )
                          }
                        >
                          <ItemIcon className="h-4 w-4" />
                          {item.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-[17.6rem]",
      )}
    >
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        {!isCollapsed && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                H
              </span>
            </div>
            <span className="text-xl font-semibold text-sidebar-foreground tracking-tight">
              HMS
            </span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("ml-auto", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex flex-col gap-1 p-4 overflow-y-auto">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              isCollapsed && "justify-center",
            )
          }
          title={isCollapsed ? "Dashboard" : ""}
        >
          <LayoutDashboard className="h-5 w-5" />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        {!isCollapsed && (
          <div className="border-t border-sidebar-border py-2" />
        )}

        {/* Providers Dropdown */}
        <MenuDropdown
          title="Providers"
          items={providersItems}
          icon={UserCheck}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="border-t border-sidebar-border py-2" />
        )}

        {/* Administration Dropdown */}
        <MenuDropdown
          title="Administration"
          items={administrationItems}
          icon={Settings}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="border-t border-sidebar-border py-2" />
        )}

        {/* Patient Management Dropdown */}
        <MenuDropdown
          title="Patient Management"
          items={patientManagementItems}
          icon={Users}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="border-t border-sidebar-border py-2" />
        )}

        {/* Outside Pharmacy Dropdown (clinic outpatient - outside pharmacy section) */}
        <MenuDropdown
          title="Outside Pharmacy"
          items={outsidePharmacyItems}
          icon={Building2}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="border-t border-sidebar-border py-2" />
        )}

        {/* Lab/Radiology/Prescription Dropdown (Laboratory, Pharmacy, Radiology) */}
        <NestedMenuDropdown
          title="Lab/Radiology/Prescription"
          sections={onsiteOrdersSections}
          icon={ClipboardList}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="border-t border-sidebar-border py-2" />
        )}
      </nav>

      {/* User section at bottom */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
