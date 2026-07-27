import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  Stethoscope,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartTabShell, SectionCard } from '@/pages/patient-dashboard/components/chart-ui';
import { formatPatientName } from '@/pages/patient-dashboard/patientChartUtils';
import { useSpecialtyEncounter } from './SpecialtyEncounterContext';

export function SpecialtyOverviewTab({ onNavigateTab }) {
  const {
    department,
    specialtyConfig,
    patient,
    appointment,
    checks,
    toggleCheck,
    queuedOrders,
    queueOrder,
    clearQueuedOrder,
    checkProgress,
    savedAt,
    resetAll,
  } = useSpecialtyEncounter();

  if (!department) return null;

  const specialtyTabs = (specialtyConfig?.specialtyTabs || []).filter(
    (t) => t.id !== 'specialty-overview',
  );

  return (
    <ChartTabShell
      eyebrow={specialtyConfig?.accentLabel || department.name}
      title={`${department.name} encounter overview`}
      description={department.focus}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={resetAll}>
          Reset demo data
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title="Patient" accent="primary">
          <p className="text-sm font-medium text-foreground">
            {patient ? formatPatientName(patient) : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{patient?.mrn || '—'}</p>
        </SectionCard>
        <SectionCard title="Encounter" accent="info">
          <p className="font-mono text-sm font-medium text-foreground">
            {appointment?.encounterNumber || '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {appointment?.appointmentType || 'Visit'} · {appointment?.status || '—'}
          </p>
        </SectionCard>
        <SectionCard title="Checklist progress" accent="success">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {checkProgress.percent}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {checkProgress.done} of {checkProgress.total} items complete
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Specialty clinical checklist"
          description="Toggle items as you complete them — saved for this encounter."
          icon={Stethoscope}
          accent="primary"
        >
          <ul className="space-y-2">
            {(department.clinicalChecks || []).map((item) => {
              const done = Boolean(checks[item]);
              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(item)}
                    className="flex w-full items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-left text-sm hover:bg-muted/40"
                  >
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className={done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                      {item}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Common specialty orders"
          description="Queue department-specific orders, then open the Orders tab."
          icon={ClipboardList}
        >
          <div className="flex flex-wrap gap-1.5">
            {(department.commonOrders || []).map((order) => {
              const queued = queuedOrders.includes(order);
              return (
                <Button
                  key={order}
                  type="button"
                  size="sm"
                  variant={queued ? 'default' : 'outline'}
                  onClick={() => (queued ? clearQueuedOrder(order) : queueOrder(order))}
                >
                  {queued ? 'Queued: ' : ''}
                  {order}
                </Button>
              );
            })}
          </div>
          {queuedOrders.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                {queuedOrders.length} order(s) queued for this specialty visit.
              </p>
              <Button type="button" size="sm" onClick={() => onNavigateTab?.('orders')}>
                Open Orders tab
              </Button>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Specialty workspaces"
        description="Department-specific tabs for this encounter."
        icon={FileText}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {specialtyTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigateTab?.(tab.id)}
              className="rounded-lg border border-border bg-card px-3 py-3 text-left hover:bg-muted/40"
            >
              <p className="text-sm font-semibold text-foreground">{tab.label}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {tab.description || tab.title}
              </p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigateTab?.('intake')}>
            Intake
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigateTab?.('notes')}>
            Notes
          </Button>
          <Button type="button" size="sm" onClick={() => onNavigateTab?.('orders')}>
            Orders
          </Button>
        </div>
        {savedAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            Demo specialty data last saved{' '}
            <Badge variant="secondary" className="font-normal">
              {new Date(savedAt).toLocaleTimeString()}
            </Badge>
          </p>
        )}
      </SectionCard>
    </ChartTabShell>
  );
}
