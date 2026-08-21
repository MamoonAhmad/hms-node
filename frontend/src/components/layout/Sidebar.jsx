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
  MapPin,
  ClipboardList,
  Code,
  FolderTree,
  FileText,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Activity,
  Calendar,
  CalendarClock,
  LogOut as LogoutIcon,
  BarChart2,
  ListChecks,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const providersItems = [
  { name: "Provider List", href: "/providers", icon: UserCheck },
  { name: "Specialities", href: "/providers/specialities", icon: Stethoscope },
  { name: "Sub Specialities", href: "/providers/sub-specialities", icon: Stethoscope },
];

const administrationItems = [
  { name: "Payers Management", href: "/insurance-providers", icon: Shield },
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
  {
    name: "HCPCS Codes",
    href: "/administration/hcpcs-codes",
    icon: ClipboardList,
  },
  {
    name: "Diagnosis Codes",
    href: "/administration/diagnosis-codes",
    icon: Stethoscope,
  },
  {
    name: "Place of Service",
    href: "/administration/place-of-service",
    icon: MapPin,
  },
  {
    name: "Charge Master",
    href: "/administration/charge-master",
    icon: ClipboardList,
  },
  {
    name: "Billing Providers",
    href: "/administration/billing-providers",
    icon: UserCheck,
  },
  {
    name: "Facility",
    href: "/administration/facility",
    icon: Building2,
  },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Locations", href: "/providers/locations", icon: MapPin },
  { name: "Users", href: "/administration/users", icon: Users },
  { name: "Roles", href: "/administration/roles", icon: Shield },
  { name: "Permissions", href: "/administration/permissions", icon: Shield },
  { name: "Permission Headers", href: "/administration/permission-headers", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

const patientManagementItems = [
  { name: "Patients", href: "/patients", icon: Users },
  { name: "RCM Worklists", href: "/patients/worklists", icon: ListChecks },
  {
    name: "Encounters Work List",
    href: "/encounters-work-list",
    icon: ListChecks,
  },
];

const appointmentsItems = [
  {
    name: "Appointment Types",
    href: "/administration/appointment-types",
    icon: CalendarClock,
  },
  {
    name: "Provider Scheduling",
    href: "/providers/schedule",
    icon: Calendar,
  },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Waitlist", href: "/appointments/waitlist", icon: ListOrdered },
  { name: "Appointment Policy", href: "/appointments/policy", icon: Settings },
  { name: "Appointment Reports", href: "/appointments/reports", icon: BarChart2 },
  { name: "Block Hours", href: "/appointments/block-hours", icon: CalendarClock },
  {
    name: "Appointment Status",
    href: "/appointments/appointment-status",
    icon: ListChecks,
  },
];

const claimsReportItems = [
  { name: "Reporting Dashboard", href: "/rcm/reports/dashboard" },
  { name: "Claim Summary Report", href: "/rcm/reports/claim-summary" },
  { name: "Claim Status Report", href: "/rcm/reports/claim-status" },
  { name: "Patient Statement / Billing Report", href: "/rcm/reports/patient-statement-billing" },
  { name: "Provider Performance Report", href: "/rcm/reports/provider-performance" },
  { name: "Denial Report", href: "/rcm/reports/denial" },
  { name: "Payment Reconciliation Report", href: "/rcm/reports/payment-reconciliation" },
  { name: "ICD / CPT Mapping Report", href: "/rcm/reports/icd-cpt-mapping" },
  { name: "Encounter / Visit Report", href: "/rcm/reports/encounter-visit" },
  { name: "Aging Report", href: "/rcm/reports/aging" },
  { name: "Claim Adjustment Report", href: "/rcm/reports/claim-adjustment" },
  { name: "Audit / Compliance Report", href: "/rcm/reports/audit-compliance" },
  { name: "Top Procedure Report", href: "/rcm/reports/top-procedure" },
  { name: "Insurance Payer Analysis Report", href: "/rcm/reports/insurance-payer-analysis" },
  { name: "Claim Trend Report", href: "/rcm/reports/claim-trend" },
  { name: "Revenue by Department / Facility", href: "/rcm/reports/revenue-by-department-facility" },
  { name: "Claim Resubmission Report", href: "/rcm/reports/claim-resubmission" },
  { name: "Pending Authorizations Report", href: "/rcm/reports/pending-authorizations" },
  { name: "Duplicate Claims Report", href: "/rcm/reports/duplicate-claims" },
  { name: "Write-Off / Adjustment Analysis", href: "/rcm/reports/write-off-adjustment-analysis" },
  { name: "Patient Balance Report", href: "/rcm/reports/patient-balance" },
  { name: "Provider Compliance Report", href: "/rcm/reports/provider-compliance" },
  { name: "Rejected Claims Summary", href: "/rcm/reports/rejected-claims-summary" },
  { name: "Attachment / Document Report", href: "/rcm/reports/attachment-document" },
];

const claimsItems = [
  { name: "RCM Worklist", href: "/rcm/worklist", icon: ListChecks },
  { name: "RCM Encounters", href: "/encounters-work-list", icon: ListChecks },
  { name: "Claim Tracker", href: "/rcm/claim-tracker", icon: Activity },
  { name: "Claims listing", href: "/rcm/claims", icon: ClipboardList },
  { name: "Follow Up Management", href: "/rcm/follow-up-management", icon: CalendarClock },
  { name: "CMS 1500", href: "/rcm/cms-1500", icon: FileText },
  { name: "Claim UB-04", href: "/rcm/claim-ub04", icon: FileText },
  { name: "Reports", icon: BarChart2, children: claimsReportItems },
];

function getItemHrefs(item) {
  if (item.href) return [item.href];
  if (item.children) return item.children.map((c) => c.href);
  return [];
}

function MenuDropdown({ title, items, icon: Icon, isCollapsed }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openNested, setOpenNested] = useState(null);
  const location = useLocation();
  const ResolvedIcon = Icon ?? LayoutDashboard;

  const isActive = items.some((item) => {
    const hrefs = getItemHrefs(item);
    const locPath = location.pathname;
    return hrefs.some((href) => {
      const itemPath = href.split("?")[0];
      return locPath === itemPath || (itemPath !== "/" && locPath.startsWith(itemPath));
    });
  });

  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
      setOpenNested(null);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const activeNested = items.find((item) => {
      if (!item.children) return false;
      return item.children.some((c) => {
        const p = c.href.split("?")[0];
        return location.pathname === p || (p !== "/" && location.pathname.startsWith(p));
      });
    });
    if (activeNested) setOpenNested(activeNested.name);
  }, [location.pathname, items]);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 [&_svg]:shrink-0 border-l-[3px] border-transparent",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover border-l-sidebar-active-bar"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
          isCollapsed && "justify-center border-l-0",
        )}
        title={isCollapsed ? title : ""}
      >
        <div className="flex items-center gap-3">
          <ResolvedIcon className="h-5 w-5" />
          {!isCollapsed && <span>{title}</span>}
        </div>
        {!isCollapsed &&
          (isOpen ? (
            <ChevronDown className="h-4 w-4 opacity-70" />
          ) : (
            <ChevronRight className="h-4 w-4 opacity-70" />
          ))}
      </button>
      {isOpen && !isCollapsed && (
        <div className="mt-0.5 space-y-0.5 pl-2 ml-2 border-l border-sidebar-border">
          {items.map((item) => {
            if (item.children) {
              const isNestedOpen = openNested === item.name;
              const isNestedActive = item.children.some((c) => {
                const itemPath = c.href.split("?")[0];
                return location.pathname === itemPath || (itemPath !== "/" && location.pathname.startsWith(itemPath));
              });
              const NestedIcon = item.icon ?? BarChart2;
              return (
                <div key={item.name} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setOpenNested(isNestedOpen ? null : item.name)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 border-l-[3px] -ml-[2px] pl-[11px]",
                      isNestedActive ? "border-l-sidebar-active-bar bg-sidebar-accent/80 text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover" : "border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
                    )}
                  >
                    <NestedIcon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isNestedOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                  {isNestedOpen && (
                    <div className="pl-2 ml-2 space-y-0.5 border-l border-sidebar-border">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive: childActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 -ml-[2px] pl-[11px]",
                              childActive
                                ? "bg-sidebar-accent/80 text-sidebar-accent-foreground border-l-sidebar-active-bar border-l-[3px]"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            )
                          }
                        >
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const ItemIcon = item.icon ?? LayoutDashboard;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: linkActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 [&_svg]:text-current border-l-[3px] border-transparent -ml-[2px] pl-[11px]",
                    linkActive
                      ? "bg-sidebar-accent/80 text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover border-l-sidebar-active-bar"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
                  )
                }
              >
                <ItemIcon className="h-4 w-4 shrink-0" />
                {item.name}
              </NavLink>
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
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar shadow-[1px_0_2px_rgba(0,0,0,0.1)] transition-all duration-300",
        isCollapsed ? "w-16" : "w-[17.6rem]",
      )}
    >
      <div className="flex h-[3.25rem] shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
        {!isCollapsed && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm">
              <span className="text-base font-bold text-primary-foreground">R</span>
            </div>
            <div className="min-w-0">
              <span className="block text-base font-semibold tracking-tight text-sidebar-foreground">
                RCM
              </span>
              <span className="block truncate text-[0.65rem] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Revenue Cycle
              </span>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "ml-auto text-sidebar-icon hover:text-sidebar-icon-hover hover:bg-sidebar-accent/60 rounded-lg transition-colors",
            isCollapsed && "mx-auto",
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex flex-1 min-h-0 flex-col gap-0.5 p-3 overflow-y-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 [&_svg]:shrink-0 border-l-[3px] border-transparent",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover border-l-sidebar-active-bar"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
              isCollapsed && "justify-center border-l-0",
            )
          }
          title={isCollapsed ? "Dashboard" : ""}
        >
          <LayoutDashboard className="h-5 w-5" />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        {!isCollapsed && <div className="border-t border-sidebar-border my-2" />}

        <MenuDropdown
          title="Providers"
          items={providersItems}
          icon={UserCheck}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="border-t border-sidebar-border my-2" />}

        <MenuDropdown
          title="Appointments"
          items={appointmentsItems}
          icon={CalendarClock}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="border-t border-sidebar-border my-2" />}

        <MenuDropdown
          title="Administration"
          items={administrationItems}
          icon={Settings}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="border-t border-sidebar-border my-2" />}

        <MenuDropdown
          title="Patient Management"
          items={patientManagementItems}
          icon={Users}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="border-t border-sidebar-border my-2" />}

        <MenuDropdown
          title="Claims"
          items={claimsItems}
          icon={FileText}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="border-t border-sidebar-border my-2" />}
      </nav>

      <div className="shrink-0 p-3 border-t border-sidebar-border bg-sidebar/80">
        <div className="rounded-xl bg-sidebar-accent/50 p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm ring-2 ring-primary/20">
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
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 rounded-xl text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <LogoutIcon className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
