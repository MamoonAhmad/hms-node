import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function ChartBreadcrumb({ patientName }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/patients" className="rounded px-1 font-medium transition-colors hover:text-foreground">
        Patients
      </Link>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
      <span className="px-1">Patient Chart</span>
      {patientName && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          <span className="truncate px-1 font-semibold text-foreground">{patientName}</span>
        </>
      )}
    </nav>
  );
}
