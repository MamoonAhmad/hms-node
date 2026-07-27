import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChartTabShell, SectionCard } from '@/pages/patient-dashboard/components/chart-ui';
import { useSpecialtyEncounter } from './SpecialtyEncounterContext';

function FieldControl({ field, value, onChange }) {
  const id = `specialty-field-${field.key}`;

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          value={value || ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        <select
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="border-gray-300 h-8 w-full rounded-md border bg-white px-2.5 text-[13px] text-black outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20"
        >
          <option value="">Select…</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.unit ? ` (${field.unit})` : ''}
      </Label>
      <Input
        id={id}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={value || ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SpecialtyWorkspaceTab({ tabDef, onNavigateTab }) {
  const { values, setField, department } = useSpecialtyEncounter();

  if (!tabDef) return null;

  const filledCount = (tabDef.sections || []).reduce((acc, section) => {
    return (
      acc +
      (section.fields || []).filter((f) => String(values[f.key] || '').trim()).length
    );
  }, 0);
  const totalFields = (tabDef.sections || []).reduce(
    (acc, section) => acc + (section.fields || []).length,
    0,
  );

  return (
    <ChartTabShell
      eyebrow={department?.name || 'Specialty'}
      title={tabDef.title || tabDef.label}
      description={tabDef.description}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigateTab?.('specialty-overview')}>
            Overview
          </Button>
          <Button type="button" size="sm" onClick={() => onNavigateTab?.('notes')}>
            Open Notes
          </Button>
        </div>
      }
    >
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Documenting <span className="font-medium text-foreground">{filledCount}</span> of{' '}
        <span className="font-medium text-foreground">{totalFields}</span> specialty fields for this
        encounter. Values save automatically for the demo patient.
      </div>

      {(tabDef.sections || []).map((section) => (
        <SectionCard
          key={section.title}
          title={section.title}
          description={section.description}
          accent={section.accent || 'default'}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(section.fields || []).map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(next) => setField(field.key, next)}
              />
            ))}
          </div>
        </SectionCard>
      ))}
    </ChartTabShell>
  );
}
