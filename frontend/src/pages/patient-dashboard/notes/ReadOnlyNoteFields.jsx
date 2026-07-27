import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReadOnlyValue({ label, value, className = '' }) {
  const display =
    value == null || String(value).trim() === '' ? '—' : String(value);
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm font-medium text-foreground">{display}</p>
    </div>
  );
}

export function LockedNoteBanner({ noteTypeLabel, date, provider }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Signed &amp; locked</Badge>
      <span>
        {noteTypeLabel}
        {date ? ` · ${date}` : ''}
        {provider ? ` · ${provider}` : ''}
      </span>
      <span className="text-green-800/80">Fields below are read-only. Use Add addendum for changes.</span>
    </div>
  );
}

export function AddendumsList({ addendums }) {
  if (!addendums?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Addendums</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {addendums.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {a.addedBy || 'Provider'}
              {a.dateTime ? ` · ${new Date(a.dateTime).toLocaleString()}` : ''}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{a.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
