import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FormSection, FormField } from '@/components/ui/form-layout';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CONSENT_LANGUAGE_OPTIONS,
  CONSENT_STATUS_OPTIONS,
  CONSENT_TYPE_OPTIONS,
  SIGNATURE_PLACEMENT_OPTIONS,
  emptyConsentForm,
  formatAuditDate,
  validateConsentForm,
} from '@/pages/administration/consent-forms/consentFormsConstants';

function SignaturePlacementSelect({ id, value, onChange, error }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className={`w-full ${error ? 'border-destructive' : ''}`}>
        <SelectValue placeholder="Select placement on form" />
      </SelectTrigger>
      <SelectContent>
        {SIGNATURE_PLACEMENT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ConsentFormDialog({ open, onOpenChange, record, auditUserName, onSave }) {
  const [form, setForm] = useState(emptyConsentForm());
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(record?.id);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        ...emptyConsentForm(),
        ...record,
        isMandatory: !!record.isMandatory,
        isSignatureRequired: record.isSignatureRequired !== false,
        requiresWitnessSignature: !!record.requiresWitnessSignature,
        requiresProviderSignature: !!record.requiresProviderSignature,
      });
    } else {
      setForm(emptyConsentForm());
    }
    setErrors({});
  }, [open, record]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const setSignatureRequirement = (checkboxField, placementField, checked) => {
    setForm((prev) => ({
      ...prev,
      [checkboxField]: !!checked,
      [placementField]: checked ? prev[placementField] : '',
    }));
    if (errors[checkboxField] || errors[placementField]) {
      setErrors((prev) => ({
        ...prev,
        [checkboxField]: null,
        [placementField]: null,
      }));
    }
  };

  const showSignaturePlacement =
    form.isSignatureRequired ||
    form.requiresWitnessSignature ||
    form.requiresProviderSignature;

  const handleAttachment = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setField('attachmentName', '');
      setField('attachmentDataUrl', '');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        attachmentName: file.name,
        attachmentDataUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fieldErrors = validateConsentForm(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[850px] max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Consent Form' : 'Add Consent Form'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Basic Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Consent Title" htmlFor="consentTitle" required error={errors.consentTitle}>
                <Input
                  id="consentTitle"
                  value={form.consentTitle}
                  onChange={(e) => setField('consentTitle', e.target.value)}
                  placeholder='e.g. "General Consent for Treatment"'
                  className={errors.consentTitle ? 'border-destructive' : ''}
                />
              </FormField>
              <FormField label="Consent Type" htmlFor="consentType" required error={errors.consentType}>
                <Select value={form.consentType} onValueChange={(v) => setField('consentType', v)}>
                  <SelectTrigger id="consentType" className={`w-full ${errors.consentType ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select consent type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField
              label="Description"
              htmlFor="description"
              hint="Short explanation of what this consent form is used for."
            >
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                placeholder="Brief description for staff"
              />
            </FormField>
            <FormField label="Consent Content" required error={errors.consentContent}>
              <RichTextEditor
                id="consentContent"
                value={form.consentContent}
                onChange={(html) => setField('consentContent', html)}
                placeholder="Full wording of the consent form…"
              />
            </FormField>
          </FormSection>

          <FormSection title="Configuration Fields">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSignatureRequired"
                  checked={form.isSignatureRequired}
                  onCheckedChange={(checked) =>
                    setSignatureRequirement('isSignatureRequired', 'patientSignaturePlacement', checked)
                  }
                />
                <Label htmlFor="isSignatureRequired" className="font-normal cursor-pointer">
                  Is Signature Required? <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="requiresWitnessSignature"
                  checked={form.requiresWitnessSignature}
                  onCheckedChange={(checked) =>
                    setSignatureRequirement(
                      'requiresWitnessSignature',
                      'witnessSignaturePlacement',
                      checked,
                    )
                  }
                />
                <Label htmlFor="requiresWitnessSignature" className="font-normal cursor-pointer">
                  Requires Witness Signature?
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="requiresProviderSignature"
                  checked={form.requiresProviderSignature}
                  onCheckedChange={(checked) =>
                    setSignatureRequirement(
                      'requiresProviderSignature',
                      'providerSignaturePlacement',
                      checked,
                    )
                  }
                />
                <Label htmlFor="requiresProviderSignature" className="font-normal cursor-pointer">
                  Requires Provider Signature?
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isMandatory"
                  checked={!!form.isMandatory}
                  onCheckedChange={(checked) => setField('isMandatory', !!checked)}
                />
                <Label htmlFor="isMandatory" className="font-normal cursor-pointer">
                  Is mandatory?
                </Label>
              </div>
            </div>

            {showSignaturePlacement && (
              <div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/25 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Signature field placement on consent form
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    For each checked signature type, choose where that signature block should appear when
                    the form is displayed or signed.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {form.isSignatureRequired && (
                    <FormField
                      label="Patient signature placement"
                      htmlFor="patientSignaturePlacement"
                      required
                      error={errors.patientSignaturePlacement}
                    >
                      <SignaturePlacementSelect
                        id="patientSignaturePlacement"
                        value={form.patientSignaturePlacement}
                        onChange={(v) => setField('patientSignaturePlacement', v)}
                        error={errors.patientSignaturePlacement}
                      />
                    </FormField>
                  )}
                  {form.requiresWitnessSignature && (
                    <FormField
                      label="Witness signature placement"
                      htmlFor="witnessSignaturePlacement"
                      required
                      error={errors.witnessSignaturePlacement}
                    >
                      <SignaturePlacementSelect
                        id="witnessSignaturePlacement"
                        value={form.witnessSignaturePlacement}
                        onChange={(v) => setField('witnessSignaturePlacement', v)}
                        error={errors.witnessSignaturePlacement}
                      />
                    </FormField>
                  )}
                  {form.requiresProviderSignature && (
                    <FormField
                      label="Provider signature placement"
                      htmlFor="providerSignaturePlacement"
                      required
                      error={errors.providerSignaturePlacement}
                    >
                      <SignaturePlacementSelect
                        id="providerSignaturePlacement"
                        value={form.providerSignaturePlacement}
                        onChange={(v) => setField('providerSignaturePlacement', v)}
                        error={errors.providerSignaturePlacement}
                      />
                    </FormField>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Effective Date" htmlFor="effectiveDate" hint="When the template becomes active.">
                <Input
                  id="effectiveDate"
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setField('effectiveDate', e.target.value)}
                />
              </FormField>
              <FormField label="Expiry Date" htmlFor="expiryDate" hint="Optional.">
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setField('expiryDate', e.target.value)}
                />
              </FormField>
              <FormField label="Status" htmlFor="status" required error={errors.status}>
                <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                  <SelectTrigger id="status" className={`w-full ${errors.status ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSENT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Optional Fields">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Department" htmlFor="department" hint="e.g. OPD, Radiology, Surgery">
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setField('department', e.target.value)}
                  placeholder="OPD, Radiology, Surgery"
                />
              </FormField>
              <FormField label="Language" htmlFor="language">
                <Select value={form.language} onValueChange={(v) => setField('language', v)}>
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSENT_LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Version Number" htmlFor="versionNumber" hint="e.g. 1.0, 2.0">
                <Input
                  id="versionNumber"
                  value={form.versionNumber}
                  onChange={(e) => setField('versionNumber', e.target.value)}
                  placeholder="1.0"
                />
              </FormField>
              <FormField label="Tags / Keywords" htmlFor="tags" hint="For quick search">
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => setField('tags', e.target.value)}
                  placeholder="treatment, outpatient, hipaa"
                />
              </FormField>
              <FormField label="Attachment" htmlFor="attachment" hint="Upload PDF or supporting document">
                <Input id="attachment" type="file" accept=".pdf,image/*" onChange={handleAttachment} />
                {form.attachmentName && (
                  <p className="text-xs text-muted-foreground mt-1">Selected: {form.attachmentName}</p>
                )}
              </FormField>
            </div>
          </FormSection>

          {isEdit && (
            <FormSection title="Audit Fields (Auto Generated)">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Created By">
                  <Input value={record?.createdBy || '—'} disabled className="bg-muted" />
                </FormField>
                <FormField label="Created Date">
                  <Input value={formatAuditDate(record?.createdDate)} disabled className="bg-muted" />
                </FormField>
                <FormField label="Updated By">
                  <Input value={record?.updatedBy || auditUserName || '—'} disabled className="bg-muted" />
                </FormField>
                <FormField label="Updated Date">
                  <Input value={formatAuditDate(record?.updatedDate)} disabled className="bg-muted" />
                </FormField>
              </div>
            </FormSection>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Consent Form'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
