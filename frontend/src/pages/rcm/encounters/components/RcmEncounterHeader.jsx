import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRcmEncounter } from '../RcmEncounterContext';
import { billingStatusTone, formatDate, formatMoney } from '../rcmEncounterConstants';

export function RcmEncounterHeader() {
  const { encounter, refresh, saving, loading } = useRcmEncounter();
  if (!encounter) return null;

  const { patient, alerts = [], financials } = encounter;

  return (
    <header className="border-b border-border bg-card px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/encounters-work-list">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Work list
              </Link>
            </Button>
            <Badge variant="outline" className={cn('font-medium', billingStatusTone(encounter.billingStatus))}>
              {encounter.billingStatus}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              ENC {encounter.encounterNumber}
            </span>
          </div>
          <div>
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
              {patient.displayName}
            </h1>
            <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className="font-mono">MRN {patient.mrn}</span>
              <span>DOB {formatDate(patient.dateOfBirth)}</span>
              <span>{patient.gender}</span>
              <span>DOS {formatDate(encounter.dateOfService)}</span>
              <span>{encounter.provider?.name || 'Provider TBD'}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Financials
            </div>
            <div className="mt-1 flex gap-3 tabular-nums">
              <span>
                <span className="text-xs text-muted-foreground">Charges </span>
                <span className="font-semibold">{formatMoney(financials?.totalCharges)}</span>
              </span>
              <span>
                <span className="text-xs text-muted-foreground">Paid </span>
                <span className="font-semibold">{formatMoney(financials?.amountPaid)}</span>
              </span>
              <span>
                <span className="text-xs text-muted-foreground">Balance </span>
                <span className="font-semibold">{formatMoney(financials?.balanceDue)}</span>
              </span>
            </div>
          </div>
          <Button variant="default" size="sm" onClick={refresh} disabled={loading || saving}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {alerts.map((alert) => (
            <Badge
              key={alert.code}
              variant="outline"
              className={cn(
                'gap-1 font-normal',
                alert.type === 'danger' && 'border-red-200 bg-red-50 text-red-800',
                alert.type === 'warning' && 'border-amber-200 bg-amber-50 text-amber-900',
                alert.type === 'info' && 'border-teal-200 bg-teal-50 text-teal-900',
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {alert.message}
            </Badge>
          ))}
        </div>
      )}
    </header>
  );
}
