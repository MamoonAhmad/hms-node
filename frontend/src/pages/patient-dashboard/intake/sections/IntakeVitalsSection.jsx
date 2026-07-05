import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VitalsForm, getDefaultVitalsData } from '@/pages/nurses/nurse-dashboard/vitals/VitalsForm';
import { useIntake } from '../IntakeContext';

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function vitalsSummary(data) {
  const bp =
    data.bpSys || data.bpDia ? `${data.bpSys || '—'}/${data.bpDia || '—'} mmHg` : null;
  const parts = [
    bp,
    data.pulse ? `Pulse ${data.pulse}` : null,
    data.temperature ? `Temp ${data.temperature}°F` : null,
    data.respiratoryRate ? `RR ${data.respiratoryRate}` : null,
  ].filter(Boolean);
  return parts.join(' · ') || 'Vitals entry';
}

function validateVitals(data) {
  const errors = [];
  if (!data.bpSys?.trim()) errors.push('Systolic blood pressure is required.');
  if (!data.bpDia?.trim()) errors.push('Diastolic blood pressure is required.');
  if (!data.pulse?.trim()) errors.push('Pulse is required.');
  if (!data.temperature?.trim()) errors.push('Temperature is required.');

  const sys = Number(data.bpSys);
  const dia = Number(data.bpDia);
  if (data.bpSys && (Number.isNaN(sys) || sys < 60 || sys > 250)) {
    errors.push('Systolic BP must be between 60 and 250.');
  }
  if (data.bpDia && (Number.isNaN(dia) || dia < 40 || dia > 150)) {
    errors.push('Diastolic BP must be between 40 and 150.');
  }
  return errors;
}

export function IntakeVitalsSection() {
  const { loadSections, saveSection, canPersist } = useIntake();
  const [entries, setEntries] = useState([]);
  const [vitalsData, setVitalsData] = useState(getDefaultVitalsData());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasEntries = entries.length > 0;

  const refresh = async () => {
    if (!canPersist) return;
    setLoading(true);
    try {
      const rows = await loadSections('vitals');
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [canPersist]);

  const handleSave = async (isAddendum = false) => {
    const validationErrors = validateVitals(vitalsData);
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await saveSection('vitals', { ...vitalsData, recordedAt: new Date().toISOString() }, { isAddendum });
      setVitalsData(getDefaultVitalsData());
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddendum = () => {
    setVitalsData(getDefaultVitalsData());
    document.getElementById('intake-vitals-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Card id="intake-section-vitals">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg font-semibold">Patient Vitals</CardTitle>
        {hasEntries && (
          <Button type="button" size="sm" variant="outline" onClick={handleAddAddendum}>
            <Plus className="mr-1 h-4 w-4" />
            Add addendum
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div id="intake-vitals-form">
          <VitalsForm data={vitalsData} onChange={setVitalsData} showTimestamp />
          {errors.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-destructive">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => handleSave(hasEntries)} disabled={saving || !canPersist}>
              {saving ? 'Saving…' : hasEntries ? 'Save addendum' : 'Save vitals'}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading vitals history…</p>
        ) : entries.length > 0 ? (
          <Accordion type="single" collapsible className="rounded-md border">
            <AccordionItem value="vitals-history" className="border-0">
              <AccordionTrigger className="px-4 hover:no-underline">
                Vitals history ({entries.length})
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Summary</TableHead>
                        <TableHead>Recorded by</TableHead>
                        <TableHead>Date / time</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...entries].reverse().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{vitalsSummary(entry.data)}</TableCell>
                          <TableCell>{entry.createdByName || '—'}</TableCell>
                          <TableCell>{formatWhen(entry.createdAt)}</TableCell>
                          <TableCell>{entry.isAddendum ? 'Addendum' : 'Entry'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
