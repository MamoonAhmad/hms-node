import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, FileText, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { departmentEncounterHref } from './departmentEncounterDepartments';

export function DepartmentSpecialtyPanel({ department }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const openTab = (tabId) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'patient-summary') {
      next.delete('tab');
    } else {
      next.set('tab', tabId);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{department.name} encounter</h2>
              <Badge variant="secondary" className="font-normal">
                Specialty workspace
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">{department.focus}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={departmentEncounterHref(department.slug)}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Back to list
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => openTab('intake')}>
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Intake
          </Button>
          <Button type="button" size="sm" onClick={() => openTab('notes')}>
            <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Notes
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clinical checklist
          </p>
          <ul className="mt-2 space-y-1.5">
            {(department.clinicalChecks || []).map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Common orders
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(department.commonOrders || []).map((order) => (
              <button
                key={order}
                type="button"
                onClick={() => openTab('orders')}
                className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                {order}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Click an order shortcut to jump to the Orders tab for this encounter.
          </p>
        </div>
      </div>
    </div>
  );
}
