import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Beaker,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Pill,
  Scan,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/pages/patient-dashboard/components/chart-ui';
import {
  ChartTabShell,
  EmptyState,
  Field,
  KeyValueGrid,
  SectionCard,
  SimpleTable,
  StatusBadge,
  TableCell,
} from './_shared';
import {
  calcAge,
  formatDate,
  formatDateTime,
  fullAddress,
  isHighSeverity,
  normalizeInsurances,
  primaryPhone,
} from '../patientChartHelpers';

function pickCurrentVisit(appointments) {
  const open = (appointments || []).filter((a) =>
    [
      'Scheduled',
      'Checked In',
      'Checked-In',
      'In Progress',
      'In Intake',
      'With Provider',
      'Provider Out',
      'Rescheduled',
    ].includes(a.status),
  );
  const today = new Date().toISOString().slice(0, 10);
  return (
    open.find((a) => String(a.appointmentDate).slice(0, 10) === today) || open[0] || null
  );
}

function QuickLink({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

export function OverviewSection({ patient, summary, appointments, orders, onOpenSection }) {
  const age = calcAge(patient.dateOfBirth);
  const insurances = normalizeInsurances(patient);
  const primaryInsurance = insurances.find((i) => i.type === 'Primary') || insurances[0];
  const allergies = summary?.allergies || [];
  const nkda = summary?.noKnownDrugAllergies;
  const problems = (summary?.problems || []).filter((p) => (p.status || '').toLowerCase() !== 'resolved');
  const openOrders = (orders || []).filter((o) => !['Completed', 'Cancelled', 'Resulted'].includes(o.status));
  const currentVisit = pickCurrentVisit(appointments);
  const upcoming = summary?.upcomingVisit;
  const lastVisit = summary?.lastVisit;

  return (
    <ChartTabShell
      eyebrow="Chart"
      title="Overview"
      description="A calm clinical snapshot — open any card for full detail."
      actions={
        patient?.id ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/patients/edit/${patient.id}`}>Edit Demographics</Link>
          </Button>
        ) : null
      }
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Problems"
            value={problems.length}
            icon={Stethoscope}
            accent="info"
            onClick={() => onOpenSection('problems')}
          />
          <StatCard
            label="Allergies"
            value={nkda ? 'NKDA' : allergies.length}
            icon={AlertTriangle}
            accent={allergies.length ? 'danger' : 'success'}
            onClick={() => onOpenSection('allergies')}
          />
          <StatCard
            label="Outstanding Orders"
            value={openOrders.length}
            icon={ClipboardList}
            accent="warning"
            onClick={() => onOpenSection('orders')}
          />
          <StatCard
            label="Insurance"
            value={primaryInsurance?.eligibilityStatus || summary?.insuranceEligibilityStatus || 'Not Verified'}
            icon={ShieldCheck}
            accent="info"
            onClick={() => onOpenSection('insurance')}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Patient Snapshot" icon={User} accent="primary">
            <KeyValueGrid columns={2}>
              <Field label="MRN" value={patient.mrn} mono />
              <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <Field label="Age" value={age != null ? `${age}` : '—'} />
              <Field label="Legal sex" value={patient.gender || patient.legalSex} />
              <Field label="Phone" value={primaryPhone(patient)} />
              <Field label="Email" value={patient.email} />
              <Field label="Address" value={fullAddress(patient)} className="sm:col-span-2" />
              <Field label="Primary provider" value={summary?.provider?.name || patient.primaryCarePhysician} />
              <Field label="Preferred language" value={patient.preferredLanguage} />
            </KeyValueGrid>
          </SectionCard>

          <SectionCard
            title="Current Visit"
            icon={Stethoscope}
            accent="info"
            actions={
              currentVisit ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/patient-dashboard/${patient.id}?appointmentId=${currentVisit.id}`}>
                    Open Encounter
                  </Link>
                </Button>
              ) : null
            }
          >
            {currentVisit ? (
              <KeyValueGrid columns={2}>
                <Field label="Encounter #" value={currentVisit.encounterNumber} mono />
                <Field label="Date" value={formatDate(currentVisit.appointmentDate)} />
                <Field label="Time" value={currentVisit.appointmentTime} />
                <Field label="Visit type" value={currentVisit.appointmentType} />
                <Field label="Provider" value={currentVisit.provider} />
                <Field label="Department" value={currentVisit.department} />
                <Field
                  label="Chief complaint"
                  value={currentVisit.visitReason || summary?.chiefComplaint}
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <StatusBadge status={currentVisit.status} />
                </div>
              </KeyValueGrid>
            ) : (
              <EmptyState title="No active encounter is currently in progress." />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Visit Timeline"
            icon={CalendarClock}
            actions={
              <Button variant="outline" size="sm" asChild>
                <Link to={`/appointments/patient/${patient.id}`}>Schedule</Link>
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</p>
                {upcoming ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">
                      {formatDate(upcoming.appointmentDate)} {upcoming.appointmentTime || ''}
                    </p>
                    <p className="text-muted-foreground">
                      {[upcoming.visitType, upcoming.providerName, upcoming.location].filter(Boolean).join(' · ')}
                    </p>
                    <StatusBadge status={upcoming.status} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No upcoming appointment scheduled.</p>
                )}
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last visit</p>
                {lastVisit ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">
                      {formatDate(lastVisit.encounterDate || lastVisit.appointmentDate)}
                    </p>
                    <p className="text-muted-foreground">
                      {[lastVisit.visitType, lastVisit.providerName, lastVisit.location].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No previous visit found.</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Allergies"
            icon={AlertTriangle}
            accent={nkda ? 'success' : allergies.length ? 'danger' : 'default'}
            actions={
              <Button variant="link" size="sm" className="h-auto px-0" onClick={() => onOpenSection('allergies')}>
                View all
              </Button>
            }
          >
            {nkda ? (
              <StatusBadge status="Verified">No Known Allergies</StatusBadge>
            ) : (
              <SimpleTable
                columns={[{ label: 'Allergen' }, { label: 'Reaction' }, { label: 'Severity' }]}
                rows={allergies.slice(0, 5)}
                empty="Allergy status not reviewed."
                renderRow={(a) => (
                  <>
                    <TableCell className="font-medium">{a.allergenName}</TableCell>
                    <TableCell>{a.reaction || '—'}</TableCell>
                    <TableCell>
                      <span className={isHighSeverity(a.severity) ? 'font-semibold text-red-600 dark:text-red-400' : ''}>
                        {a.severity || '—'}
                      </span>
                    </TableCell>
                  </>
                )}
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Active Problems"
          icon={Stethoscope}
          accent="info"
          actions={
            <Button variant="link" size="sm" className="h-auto px-0" onClick={() => onOpenSection('problems')}>
              View all problems
            </Button>
          }
        >
          <SimpleTable
            columns={[{ label: 'Code' }, { label: 'Diagnosis' }, { label: 'Onset' }, { label: 'Status' }]}
            rows={problems.slice(0, 8)}
            empty="No active problems recorded."
            renderRow={(p) => (
              <>
                <TableCell className="font-mono text-xs">{p.icd10Code || p.problemCode || '—'}</TableCell>
                <TableCell className="font-medium">{p.diagnosisDescription || p.problemDescription}</TableCell>
                <TableCell>{formatDate(p.onsetDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
              </>
            )}
          />
        </SectionCard>

        <SectionCard
          title="Outstanding Orders"
          icon={ClipboardList}
          accent="warning"
          actions={
            <Button variant="link" size="sm" className="h-auto px-0" onClick={() => onOpenSection('orders')}>
              View all orders
            </Button>
          }
        >
          <SimpleTable
            columns={[
              { label: 'Order' },
              { label: 'Type' },
              { label: 'Ordered' },
              { label: 'Status' },
            ]}
            rows={openOrders.slice(0, 8)}
            empty="No outstanding orders."
            renderRow={(o) => (
              <>
                <TableCell className="font-medium">{o.procedureName || o.orderName}</TableCell>
                <TableCell>{o.category || o.orderType || '—'}</TableCell>
                <TableCell>{formatDateTime(o.orderDateTime || o.orderedDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
              </>
            )}
          />
        </SectionCard>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explore chart
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink icon={Pill} label="Medications" onClick={() => onOpenSection('medications')} />
            <QuickLink icon={HeartPulse} label="Vitals" onClick={() => onOpenSection('vitals')} />
            <QuickLink icon={Beaker} label="Laboratory" onClick={() => onOpenSection('laboratory')} />
            <QuickLink icon={Scan} label="Imaging" onClick={() => onOpenSection('imaging')} />
          </div>
        </div>
      </div>
    </ChartTabShell>
  );
}
