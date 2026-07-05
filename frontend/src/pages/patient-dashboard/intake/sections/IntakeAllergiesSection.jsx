import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddAllergyDialog } from '@/pages/nurses/nurse-dashboard/allergies/AddAllergyDialog';
import { useIntake } from '../IntakeContext';

const emptyAllergyForm = () => ({
  allergen: '',
  adverseEvent: '',
  severity: '',
  reaction: '',
  onset: '',
  onsetDate: '',
  endDate: '',
  updated: '',
  redApplied: '',
  active: '',
  comment: '',
});

export function IntakeAllergiesSection() {
  const { loadSections, saveSection, canPersist } = useIntake();
  const [entries, setEntries] = useState([]);
  const [nkda, setNkda] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyAllergyForm());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const allergyEntries = entries.filter((e) => !e.data?.noKnownAllergies);
  const hasEntries = allergyEntries.length > 0;

  const refresh = async () => {
    if (!canPersist) return;
    setLoading(true);
    try {
      const rows = await loadSections('allergies');
      setEntries(rows);
      setNkda(rows.some((r) => r.data?.noKnownAllergies));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [canPersist]);

  const handleNkda = async (checked) => {
    if (!checked) {
      setNkda(false);
      return;
    }
    setNkda(true);
    if (!canPersist) return;
    setSaving(true);
    try {
      await saveSection('allergies', { noKnownAllergies: true, display: 'NKDA' });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllergy = async () => {
    if (!form.allergen?.trim()) return;
    setSaving(true);
    try {
      await saveSection('allergies', form, { isAddendum: hasEntries });
      setForm(emptyAllergyForm());
      setDialogOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="intake-section-allergies">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">Patient Allergies</CardTitle>
          {nkda && <Badge variant="secondary">NKDA</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {!nkda && (
            <Button type="button" size="sm" variant={hasEntries ? 'outline' : 'default'} onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {hasEntries ? 'Add addendum' : 'Add allergy'}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Checkbox id="intake-no-known-allergies" checked={nkda} onCheckedChange={(v) => handleNkda(!!v)} />
            <Label htmlFor="intake-no-known-allergies" className="text-sm">
              No known allergies
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddAllergyDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={form}
          onFormChange={setForm}
          onSave={handleSaveAllergy}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading allergies…</p>
        ) : nkda ? (
          <p className="text-sm text-muted-foreground">No known drug allergies (NKDA) recorded.</p>
        ) : hasEntries ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Allergen</TableHead>
                  <TableHead>Reaction</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergyEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.data.allergen || '—'}</TableCell>
                    <TableCell>{entry.data.reaction || '—'}</TableCell>
                    <TableCell>{entry.data.severity || '—'}</TableCell>
                    <TableCell>{entry.data.onset || '—'}</TableCell>
                    <TableCell>{entry.data.active || '—'}</TableCell>
                    <TableCell>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>{entry.isAddendum ? 'Addendum' : 'Entry'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No allergies recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}
