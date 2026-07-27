import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { useIntake } from '../IntakeContext';
import { intakeApi } from '@/services/api/intake.api';

const FIELD_CONTROL = 'h-9 w-full';

const defaultAllergyForm = () => ({
  allergen: '',
  adverseEvent: '',
  severity: '',
  reaction: '',
  onset: '',
  onsetDate: '',
  endDate: '',
  updated: '',
  redApplied: '',
  active: 'active',
  comment: '',
});

function allergyToForm(a) {
  return {
    ...defaultAllergyForm(),
    allergen: a.allergenName || '',
    reaction: a.reaction || '',
    severity: a.severity || '',
    onsetDate: a.onsetDate ? new Date(a.onsetDate).toISOString().slice(0, 10) : '',
    active: String(a.status || 'Active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
    comment: a.comment || '',
  };
}

function Field({ label, htmlFor, children, className }) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Label htmlFor={htmlFor} className="block text-sm font-medium leading-none">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function AllergiesIntakeSection() {
  const { patientId, isLive, allergies, noKnownDrugAllergies, loadIntake, isCertified } = useIntake();
  const [nkda, setNkda] = useState(noKnownDrugAllergies);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultAllergyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNkda(noKnownDrugAllergies);
  }, [noKnownDrugAllergies]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNkda = async (checked) => {
    setNkda(checked);
    if (isLive && patientId) {
      await intakeApi.setNkda(patientId, checked);
      await loadIntake();
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultAllergyForm());
    setShowForm(true);
  };

  const openEdit = (allergy) => {
    setEditingId(allergy.id);
    setForm(allergyToForm(allergy));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.allergen?.trim()) return;
    setSaving(true);
    try {
      if (isLive && patientId) {
        const data = {
          allergenName: form.allergen,
          reaction: form.reaction,
          severity: form.severity,
          onsetDate: form.onsetDate || null,
          status: form.active === 'inactive' ? 'Inactive' : 'Active',
          comment: form.comment,
        };
        if (editingId) {
          await intakeApi.updateAllergy(patientId, editingId, data);
        } else {
          await intakeApi.createAllergy(patientId, { ...data, clearNkda: true });
        }
        await loadIntake();
      }
      setForm(defaultAllergyForm());
      setEditingId(null);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isLive || !patientId) return;
    await intakeApi.deleteAllergy(patientId, id);
    await loadIntake();
  };

  const dialogTitle = editingId ? (isCertified ? 'Amend Allergy' : 'Edit Allergy') : 'Add Allergy';

  return (
    <IntakeSectionCard
      id="assessment-allergies"
      title="Allergies"
      onAdd={nkda ? undefined : openCreate}
      showAdd={!nkda}
      headerExtra={
        <div className="flex items-center gap-2">
          {nkda && <Badge variant="secondary">NKDA</Badge>}
          <Checkbox id="nkda" checked={nkda} onCheckedChange={(c) => handleNkda(!!c)} />
          <Label htmlFor="nkda" className="text-sm">No known allergies</Label>
        </div>
      }
    >
      <IntakeInlineFormPanel
        open={showForm}
        onOpenChange={setShowForm}
        title={dialogTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.allergen?.trim()}>
              Save Allergy
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Allergen Name" htmlFor="allergen-name">
              <Input
                id="allergen-name"
                className={FIELD_CONTROL}
                placeholder="Search and select allergen..."
                value={form.allergen}
                onChange={(e) => handleChange('allergen', e.target.value)}
              />
            </Field>
            <Field label="Adverse Event Description" htmlFor="adverse-event">
              <Select value={form.adverseEvent} onValueChange={(value) => handleChange('adverseEvent', value)}>
                <SelectTrigger id="adverse-event" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Select Adverse Event Description" />
                </SelectTrigger>
                <SelectContent>
                  {['Rash', 'Swelling', 'Anaphylaxis', 'GI upset'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase().replace(/\s+/g, '-')}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Severity" htmlFor="severity">
              <Select value={form.severity} onValueChange={(value) => handleChange('severity', value)}>
                <SelectTrigger id="severity" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  {['Mild', 'Moderate', 'Severe'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reaction" htmlFor="reaction">
              <Select value={form.reaction} onValueChange={(value) => handleChange('reaction', value)}>
                <SelectTrigger id="reaction" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Select Reaction" />
                </SelectTrigger>
                <SelectContent>
                  {['Hives', 'Itching', 'Anaphylaxis', 'Nausea'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Onset" htmlFor="onset">
              <Select value={form.onset} onValueChange={(value) => handleChange('onset', value)}>
                <SelectTrigger id="onset" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Select Onset" />
                </SelectTrigger>
                <SelectContent>
                  {['Immediate', 'Delayed', 'Unknown'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Onset Date" htmlFor="onset-date">
              <Input
                id="onset-date"
                type="date"
                className={FIELD_CONTROL}
                value={form.onsetDate}
                onChange={(e) => handleChange('onsetDate', e.target.value)}
              />
            </Field>
            <Field label="End Date" htmlFor="end-date">
              <Input
                id="end-date"
                type="date"
                className={FIELD_CONTROL}
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </Field>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Has allergy been updated?" htmlFor="allergy-updated">
              <Select value={form.updated} onValueChange={(value) => handleChange('updated', value)}>
                <SelectTrigger id="allergy-updated" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Yes / No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Has the red allergy been applied?" htmlFor="red-allergy">
              <Select value={form.redApplied} onValueChange={(value) => handleChange('redApplied', value)}>
                <SelectTrigger id="red-allergy" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Yes / No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Active" htmlFor="active">
              <Select value={form.active} onValueChange={(value) => handleChange('active', value)}>
                <SelectTrigger id="active" className={FIELD_CONTROL}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Row 4 */}
          <Field label="Comment" htmlFor="allergy-comment">
            <Textarea
              id="allergy-comment"
              placeholder="Add comment"
              rows={3}
              className="min-h-[5.5rem] w-full resize-y"
              value={form.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
            />
          </Field>
        </div>
      </IntakeInlineFormPanel>

      {!nkda && allergies.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allergen</TableHead>
              <TableHead>Reaction</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onset</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allergies.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.allergenName}</TableCell>
                <TableCell>{a.reaction || '—'}</TableCell>
                <TableCell>{a.severity || '—'}</TableCell>
                <TableCell>{a.status}</TableCell>
                <TableCell>{a.onsetDate ? new Date(a.onsetDate).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right">
                  <IntakeRecordActions
                    isCertified={isCertified}
                    onEdit={() => openEdit(a)}
                    onAmend={() => openEdit(a)}
                    onDelete={() => handleDelete(a.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : !nkda ? (
        <p className="text-sm text-muted-foreground">No allergies recorded yet. Use the + button to add.</p>
      ) : null}

      {saving && <p className="text-sm text-muted-foreground">Saving...</p>}
    </IntakeSectionCard>
  );
}
