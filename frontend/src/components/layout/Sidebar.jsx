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
  MessageSquare,
  Code,
  FolderTree,
  FileText,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  ListOrdered,
  Activity,
  FlaskConical,
  Camera,
  Pill,
  Calendar,
  CalendarClock,
  LogOut as LogoutIcon,
  BarChart2,
  Hospital,
  ListChecks,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Provider menu: visible to Admin, Super Admin, Credentialing/Provider Management (role check can be wired here)
const providersItems = [
  { name: "Provider List", href: "/providers", icon: UserCheck },
  { name: "Specialities", href: "/providers/specialities", icon: Stethoscope },
  { name: "Sub Specialities", href: "/providers/sub-specialities", icon: Stethoscope },
  { name: "Locations", href: "/providers/locations", icon: MapPin },
  {
    name: "Provider Scheduling",
    href: "/providers/schedule",
    icon: Calendar,
  },
];

const administrationItems = [
  {
    name: "Facility",
    href: "/administration/facility",
    icon: Building2,
  },
  { name: "Departments", href: "/departments", icon: Building2 },
  {
    name: "Rooms Management",
    icon: Hospital,
    children: [
      { name: "Rooms Type", href: "/patient-management/room-types" },
      { name: "Rooms", href: "/patient-management/rooms" },
      { name: "Beds", href: "/patient-management/beds" },
    ],
  },
  {
    name: "Appointment Types",
    href: "/administration/appointment-types",
    icon: CalendarClock,
  },
  {
    name: "Custom Order Set",
    href: "/custom-order-set",
    icon: ListOrdered,
  },
  { name: "Payers Management", href: "/insurance-providers", icon: Shield },
  {
    name: "Billing Providers",
    href: "/administration/billing-providers",
    icon: UserCheck,
  },
  {
    name: "Chief Complaints",
    href: "/administration/chief-complaint",
    icon: MessageSquare,
  },
  {
    name: "Consent Forms",
    href: "/administration/consent-forms",
    icon: FileText,
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
  {
    name: "Diagnosis Codes",
    href: "/administration/diagnosis-codes",
    icon: Stethoscope,
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

const patientManagementItems = [
  { name: "Patients", href: "/patients", icon: Users },
  {
    name: "Registration Queue",
    href: "/patient-management/registration-queue",
    icon: ListOrdered,
  },
  {
    name: "Waitlist",
    href: "/patient-management/waitlist",
    icon: CalendarClock,
  },
  {
    name: "Consent Worklist",
    href: "/patient-management/consent-worklist",
    icon: FileText,
  },
  {
    name: "Patient Tracking",
    href: "/outpatient_tracking_board",
    icon: Activity,
  },
  {
    name: "Patient Dashboard",
    href: "/patient-dashboard",
    icon: ClipboardList,
  },
  {
    name: "Encounters",
    href: "/patient-management/encounters",
    icon: ScrollText,
  },
];

const appointmentsItems = [
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Block Hours", href: "/appointments/block-hours", icon: CalendarClock },
  {
    name: "Appointment Status",
    href: "/appointments/appointment-status",
    icon: ListChecks,
  },
];

const laboratoryManagementItems = [
  {
    name: "Laboratory Master",
    href: "/laboratory-management/laboratory-master",
    icon: FlaskConical,
  },
  {
    name: "Specimen Collection",
    href: "/laboratory-management/specimen-collection",
    icon: FlaskConical,
  },
  {
    name: "Result Management",
    href: "/laboratory-management/result-management",
    icon: FlaskConical,
  },
  {
    name: "Outside Labs management",
    href: "/laboratory-management/outside-labs",
    icon: FlaskConical,
  },
];

const radiologyManagementItems = [
  {
    name: "Radiology Master",
    href: "/radiology-management/master",
    icon: Camera,
  },
  {
    name: "Radiology Order & Report Management",
    href: "/radiology-management/order-management",
    icon: Camera,
  },
  {
    name: "Outside radiology orders",
    href: "/radiology-management/outside-radiology-orders",
    icon: Camera,
  },
];

const pharmacyItems = [
  { name: "Inventory Reports", href: "/pharmacy?report=inventory", icon: Pill },
  {
    name: "Medication Prescriptions",
    href: "/pharmacy/e-prescribe-med-reconciliation",
    icon: Pill,
  },
  {
    name: "Medicines Master",
    href: "/pharmacy/medicines-master",
    icon: Pill,
  },
  {
    name: "Medication formulary",
    href: "/pharmacy/medication-formulary",
    icon: Pill,
  },
  {
    name: "Immunization / Vaccine Master",
    href: "/pharmacy/vaccine-master",
    icon: Pill,
  },
];

const ancillaryServicesItems = [
  {
    name: "Laboratory Management",
    icon: FlaskConical,
    children: laboratoryManagementItems.map(({ name, href }) => ({ name, href })),
  },
  {
    name: "Radiology Management",
    icon: Camera,
    children: radiologyManagementItems.map(({ name, href }) => ({ name, href })),
  },
  {
    name: "Pharmacy",
    icon: Pill,
    children: pharmacyItems.map(({ name, href }) => ({ name, href })),
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
  { name: "Claim Tracker", href: "/rcm/claim-tracker", icon: Activity },
  { name: "Claims listing", href: "/rcm/claims", icon: ClipboardList },
  { name: "Claims Worklist", href: "/rcm/claims-worklist", icon: ListChecks },
  { name: "Follow Up Management", href: "/rcm/follow-up-management", icon: CalendarClock },
  { name: "CMS 1500", href: "/rcm/cms-1500", icon: FileText },
  { name: "Claim UB-04", href: "/rcm/claim-ub04", icon: FileText },
  { name: "Charge Master", href: "/administration/charge-master", icon: ListOrdered },
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

  // Check if any item (or nested child) in the dropdown is active
  const isActive = items.some((item) => {
    const hrefs = getItemHrefs(item);
    const locPath = location.pathname;
    return hrefs.some((href) => {
      const itemPath = href.split("?")[0];
      return locPath === itemPath || (itemPath !== "/" && locPath.startsWith(itemPath));
    });
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
      setOpenNested(null);
    }
  }, [isCollapsed]);

  // Auto-open nested section (e.g. Reports) when a child route is active
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
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:shrink-0",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
          isCollapsed && "justify-center",
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
        <div className="mt-0.5 space-y-0.5 pl-3 ml-1 border-l border-sidebar-border/60">
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
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isNestedActive ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
                    )}
                  >
                    <NestedIcon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isNestedOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                  {isNestedOpen && (
                    <div className="pl-3 ml-1 space-y-0.5 border-l border-sidebar-border/60">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive: childActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              childActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:text-current",
                    linkActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
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

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar shadow-[var(--shadow-elevation-sm)] transition-all duration-300",
        isCollapsed ? "w-16" : "w-[17.6rem]",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-sm font-bold text-sidebar-primary-foreground">H</span>
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-sidebar-foreground">
                HMS
              </span>
              <span className="block truncate text-[0.625rem] font-medium uppercase tracking-widest text-sidebar-foreground/55">
                Clinical Platform
              </span>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "ml-auto text-sidebar-icon hover:text-sidebar-icon-hover hover:bg-sidebar-accent rounded-md transition-colors",
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
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:shrink-0",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-icon-hover"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-sidebar-icon hover:[&_svg]:text-sidebar-icon-hover",
              isCollapsed && "justify-center",
            )
          }
          title={isCollapsed ? "Dashboard" : ""}
        >
          <LayoutDashboard className="h-5 w-5" />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        {!isCollapsed && <div className="my-2 h-px bg-sidebar-border" />}

        {/* Patient Management — daily clinical ops */}
        <MenuDropdown
          title="Patient Management"
          items={patientManagementItems}
          icon={Users}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="my-2 h-px bg-sidebar-border" />}

        {/* Appointments — scheduling */}
        <MenuDropdown
          title="Appointments"
          items={appointmentsItems}
          icon={CalendarClock}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="my-2 h-px bg-sidebar-border" />}

        {/* Providers — directory & schedules */}
        <MenuDropdown
          title="Providers"
          items={providersItems}
          icon={UserCheck}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="my-2 h-px bg-sidebar-border" />}

        {/* Ancillary Services — lab, radiology, pharmacy */}
        <MenuDropdown
          title="Ancillary Services"
          items={ancillaryServicesItems}
          icon={Hospital}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="my-2 h-px bg-sidebar-border" />}

        {/* Claims — RCM */}
        <MenuDropdown
          title="Claims"
          items={claimsItems}
          icon={FileText}
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && <div className="my-2 h-px bg-sidebar-border" />}

        {/* Administration — masters & settings last */}
        <MenuDropdown
          title="Administration"
          items={administrationItems}
          icon={Settings}
          isCollapsed={isCollapsed}
        />
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogoutIcon className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
