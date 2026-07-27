import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className }) {
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      <div className="h-24 rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  );
}

export function ChartErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="text-base font-semibold text-foreground">
        {message || 'Unable to load patient information. Please try again.'}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="default" size="sm" className="gap-1.5" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        )}
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link to="/patients">
            <ArrowLeft className="h-4 w-4" />
            Back to Patient Listing
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function PatientNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="text-base font-semibold text-foreground">Patient record not found.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The requested patient could not be located or you do not have access to it.
      </p>
      <Button variant="default" size="sm" className="mt-5 gap-1.5" asChild>
        <Link to="/patients">
          <ArrowLeft className="h-4 w-4" />
          Back to Patient Listing
        </Link>
      </Button>
    </div>
  );
}
