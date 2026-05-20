import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Pill,
  Calendar,
  DollarSign,
  Shield,
  Bell,
  ClipboardList,
  FileCheck,
  Stethoscope,
  FileText,
  Code,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatientChart } from './PatientChartContext';
import { NurseAssessmentSummaryContent } from './NurseAssessmentSummaryContent';
import { DocumentsSummaryContent } from './DocumentsSummaryContent';
import { ClaimForm } from './ClaimForm';
import { formatAppointmentLabel } from './patientChartUtils';

const SUMMARY_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'results', label: 'Results', icon: FileCheck },
  { id: 'nurse-assessment', label: 'Nurse assessment', icon: Stethoscope },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'diagnosis-codes', label: 'Diagnosis', icon: Code },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-panel)]">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function OrdersSummary({ onViewAll }) {
  const { orders } = usePatientChart();
  const recent = orders.slice(0, 5);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Orders</CardTitle>
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onViewAll}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders for this patient.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recent.map((o) => (
              <li key={o.id} className="flex justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 truncate">{o.procedureName}</span>
                <Badge variant="outline" className="shrink-0 font-normal">
                  {o.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ResultsSummary({ onViewAll }) {
  const { orders } = usePatientChart();
  const labs = orders.filter((o) => o.category === 'Lab');
  const pending = labs.filter((o) => o.status === 'Scheduled');
  const completed = labs.filter((o) => o.status === 'Completed');
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Results</CardTitle>
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onViewAll}>
          View all
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {pending.length > 0 && (
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Pending ({pending.length})
            </p>
            <ul className="mt-1.5 space-y-1 text-muted-foreground">
              {pending.slice(0, 4).map((o) => (
                <li key={o.id}>{o.procedureName}</li>
              ))}
            </ul>
          </div>
        )}
        {completed.length > 0 ? (
          <div>
            <p className="font-medium">Recent resulted</p>
            <ul className="mt-1.5 space-y-1 text-muted-foreground">
              {completed.slice(0, 4).map((o) => (
                <li key={o.id}>{o.procedureName}</li>
              ))}
            </ul>
          </div>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground">No lab orders on file.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PatientSummaryTab({ onNavigateTab }) {
  const { patient, appointments, orders } = usePatientChart();
  const [selectedSection, setSelectedSection] = useState('overview');

  const summary = useMemo(() => {
    if (!patient) return null;
    const sorted = [...appointments].sort((a, b) => {
      const da = new Date(a.appointmentDate).getTime();
      const db = new Date(b.appointmentDate).getTime();
      return db - da;
    });
    const past = sorted.filter((a) => a.status === 'Completed');
    const upcoming = sorted.filter((a) =>
      ['Scheduled', 'Checked-In', 'In Progress', 'Rescheduled'].includes(a.status),
    );
    return {
      insurance: {
        primary: patient.insuranceProvider?.name || '—',
        id: patient.policyNumber || '—',
      },
      lastVisit: past[0] ? formatAppointmentLabel(past[0]) : '—',
      upcoming: upcoming[0] ? formatAppointmentLabel(upcoming[0]) : 'None scheduled',
      outstandingBills:
        patient.copay != null ? `$${Number(patient.copay).toFixed(2)} copay on file` : '—',
      alerts: patient.generalNotes
        ? [{ type: 'Note', message: patient.generalNotes }]
        : orders.filter((o) => o.status === 'Scheduled').length
          ? [
              {
                type: 'Pending',
                message: `${orders.filter((o) => o.status === 'Scheduled').length} open order(s)`,
              },
            ]
          : [],
    };
  }, [patient, appointments, orders]);

  if (!summary) return null;

  const renderSection = () => {
    switch (selectedSection) {
      case 'billing':
        return <ClaimForm />;
      case 'nurse-assessment':
        return <NurseAssessmentSummaryContent patient={patient} />;
      case 'documents':
        return <DocumentsSummaryContent patientId={patient?.id} />;
      case 'orders':
        return <OrdersSummary onViewAll={() => onNavigateTab?.('orders')} />;
      case 'results':
        return <ResultsSummary onViewAll={() => onNavigateTab?.('results')} />;
      case 'diagnosis-codes':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Diagnosis codes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Active problem list will appear here when integrated with SOAP diagnoses.
              </p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Chart</p>
          <h2 className="text-xl font-bold text-foreground">Patient summary</h2>
        </div>
        {patient?.id && patient.id !== 'sample' && (
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to={`/patients/edit/${patient.id}`}>Edit registration</Link>
          </Button>
        )}
      </div>

      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1"
        aria-label="Summary sections"
      >
        {SUMMARY_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedSection(id)}
            className={cn(
              'shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              selectedSection === id
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {selectedSection === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Last visit" value={summary.lastVisit} icon={Calendar} />
            <StatTile label="Upcoming" value={summary.upcoming} icon={Calendar} />
            <StatTile
              label="Insurance"
              value={summary.insurance.primary}
              icon={Shield}
            />
            <StatTile label="Financial" value={summary.outstandingBills} icon={DollarSign} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-green-200/70 bg-green-50/50 dark:bg-green-950/15">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                  <AlertTriangle className="h-4 w-4" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No known allergies documented (NKA).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  View and manage medications on the prescriptions tab.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onNavigateTab?.('prescriptions')}
                >
                  Open prescriptions
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <OrdersSummary onViewAll={() => onNavigateTab?.('orders')} />
            <ResultsSummary onViewAll={() => onNavigateTab?.('results')} />
          </div>

          {summary.alerts.length > 0 && (
            <Card className="border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/15">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <Bell className="h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {summary.alerts.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Badge variant="outline" className="font-normal">
                        {a.type}
                      </Badge>
                      <span>{a.message}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Insurance details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Primary: </span>
                {summary.insurance.primary}
              </p>
              <p>
                <span className="text-muted-foreground">Member ID: </span>
                <span className="font-mono">{summary.insurance.id}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        renderSection()
      )}
    </div>
  );
}
