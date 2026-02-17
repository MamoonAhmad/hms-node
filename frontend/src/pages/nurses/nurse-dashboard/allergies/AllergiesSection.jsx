import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddAllergyDialog } from './AddAllergyDialog';

export function AllergiesSection() {
  const [noKnownAllergies, setNoKnownAllergies] = useState(false);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergies, setAllergies] = useState([]);
  const [allergyForm, setAllergyForm] = useState({
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

  const toggleNoKnownAllergies = (checked) => {
    setNoKnownAllergies(checked);
    if (checked) {
      setShowAllergyForm(false);
    }
  };

  const handleAllergySave = () => {
    const timestamp = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());
    setAllergies((prev) => [...prev, { ...allergyForm, timestamp }]);
    setAllergyForm({
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
    setShowAllergyForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold text-foreground">Patient Allergies</CardTitle>
          {!noKnownAllergies && (
            <Button variant="outline" size="sm" onClick={() => setShowAllergyForm(true)}>
              Add Allergy
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="no-known-allergies"
            checked={noKnownAllergies}
            onCheckedChange={(checked) => toggleNoKnownAllergies(!!checked)}
          />
          <Label htmlFor="no-known-allergies" className="text-sm">
            No known allergies
          </Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Input id="allergy-timestamp" className="hidden" disabled />

        <AddAllergyDialog
          open={showAllergyForm}
          onOpenChange={setShowAllergyForm}
          form={allergyForm}
          onFormChange={setAllergyForm}
          onSave={handleAllergySave}
        />

        {!noKnownAllergies && allergies.length > 0 && (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Allergen</TableHead>
                  <TableHead>Reaction</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((item, idx) => (
                  <TableRow key={`${item.allergen}-${idx}`}>
                    <TableCell className="font-medium">{item.allergen || '-'}</TableCell>
                    <TableCell>{item.reaction || '-'}</TableCell>
                    <TableCell>{item.severity || '-'}</TableCell>
                    <TableCell>{item.onset || '-'}</TableCell>
                    <TableCell>{item.active || '-'}</TableCell>
                    <TableCell>{item.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


