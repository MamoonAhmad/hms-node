import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

export function EmarPatientPanel({ panel, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Loading patient information…</CardContent>
      </Card>
    );
  }

  if (!panel) return null;

  return (
    <Card className="border-primary/20">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Field label="Patient Name" value={panel.patientName} />
        <Field label="MRN" value={panel.mrn} />
        <Field label="DOB" value={formatDate(panel.dateOfBirth)} />
        <Field label="Age" value={panel.age != null ? `${panel.age} yrs` : '—'} />
        <Field label="Gender" value={panel.gender} />
        <Field label="Encounter" value={panel.encounterNumber ? `#${panel.encounterNumber.slice(0, 8)}` : '—'} />
        <Field label="Provider" value={panel.provider} />
        <Field label="Weight" value={panel.weight ? `${panel.weight}` : '—'} />
        <Field label="Height" value={panel.height ? `${panel.height}` : '—'} />
        <Field label="Location" value={panel.currentLocation} />
        <Field label="Visit Type" value={panel.visitType} />
        <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Allergies</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {(panel.allergies || []).length === 0 ? (
              <span className="text-sm text-muted-foreground">None documented</span>
            ) : (
              panel.allergies.map((a) => (
                <Badge
                  key={a.id || a.allergenName}
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-800"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {a.allergenName}
                  {a.severity ? ` (${a.severity})` : ''}
                </Badge>
              ))
            )}
          </dd>
        </div>
      </CardContent>
    </Card>
  );
}
