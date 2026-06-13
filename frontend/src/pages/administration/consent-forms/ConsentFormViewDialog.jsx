import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormSection } from '@/components/ui/form-layout';
import { ConsentSignatureCapture } from '@/pages/administration/consent-forms/ConsentSignatureCapture';
import {
  formatConsentStatus,
  formatConsentType,
  formatSignaturePlacement,
} from '@/pages/administration/consent-forms/consentFormsConstants';
import {
  formatConsentDisplayDate,
  getConsentSignatureBlocks,
} from '@/pages/administration/consent-forms/consentFormViewUtils';

function ReadOnlyCheckbox({ id, label, checked }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={!!checked} disabled />
      <Label htmlFor={id} className="font-normal text-foreground">
        {label}
      </Label>
    </div>
  );
}

function SignaturePreviewSection({ record }) {
  const blocks = getConsentSignatureBlocks(record);
  if (!blocks.length) return null;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">Electronic signature preview</h3>
      <p className="text-xs text-muted-foreground">
        Signatures are captured electronically only, based on the required signature settings below.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {blocks.map((block) => (
          <ConsentSignatureCapture key={block.role} block={block} variant="simple" />
        ))}
      </div>
    </section>
  );
}

export function ConsentFormViewDialog({ record, open, onOpenChange, onEdit }) {
  if (!record) return null;

  const displayStatus = record.effectiveStatus || record.status;
  const effective = formatConsentDisplayDate(record.effectiveDate);
  const expiry = formatConsentDisplayDate(record.expiryDate);
  const showSignaturePlacement =
    record.isSignatureRequired ||
    record.requiresWitnessSignature ||
    record.requiresProviderSignature;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl w-[95vw]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-lg leading-snug pr-6">View Consent Form</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={displayStatus === 'active' ? 'default' : 'secondary'}>
              {formatConsentStatus(displayStatus)}
            </Badge>
            {record.isMandatory && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                Mandatory
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <FormSection title="Basic Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Consent Title">
                <Input value={record.consentTitle || ''} disabled readOnly className="bg-muted" />
              </FormField>
              <FormField label="Consent Type">
                <Input value={formatConsentType(record.consentType)} disabled readOnly className="bg-muted" />
              </FormField>
            </div>
            <FormField label="Description">
              <Textarea
                value={record.description || ''}
                disabled
                readOnly
                rows={2}
                className="bg-muted resize-none"
                placeholder="—"
              />
            </FormField>
            <FormField label="Consent Content">
              <div
                className="rounded-md border border-border bg-muted/20 px-4 py-4 prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-headings:text-foreground"
                dangerouslySetInnerHTML={{
                  __html: record.consentContent || '<p class="text-muted-foreground">No content.</p>',
                }}
              />
            </FormField>
          </FormSection>

          <FormSection title="Configuration">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadOnlyCheckbox id="viewIsSignatureRequired" label="Is Signature Required?" checked={record.isSignatureRequired !== false} />
              <ReadOnlyCheckbox id="viewRequiresWitness" label="Witness Signature Required" checked={record.requiresWitnessSignature} />
              <ReadOnlyCheckbox id="viewRequiresProvider" label="Provider Signature Required" checked={record.requiresProviderSignature} />
              <ReadOnlyCheckbox id="viewIsMandatory" label="Is Mandatory" checked={record.isMandatory} />
            </div>

            {showSignaturePlacement && (
              <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border bg-muted/25 p-4">
                <h4 className="text-sm font-semibold text-foreground">Signature Placement</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {record.isSignatureRequired !== false && (
                    <FormField label="Patient Signature Placement">
                      <Input
                        value={formatSignaturePlacement(record.patientSignaturePlacement)}
                        disabled
                        readOnly
                        className="bg-muted"
                      />
                    </FormField>
                  )}
                  {record.requiresWitnessSignature && (
                    <FormField label="Witness Signature Placement">
                      <Input
                        value={formatSignaturePlacement(record.witnessSignaturePlacement)}
                        disabled
                        readOnly
                        className="bg-muted"
                      />
                    </FormField>
                  )}
                  {record.requiresProviderSignature && (
                    <FormField label="Provider Signature Placement">
                      <Input
                        value={formatSignaturePlacement(record.providerSignaturePlacement)}
                        disabled
                        readOnly
                        className="bg-muted"
                      />
                    </FormField>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Effective Date">
                <Input value={effective || '—'} disabled readOnly className="bg-muted" />
              </FormField>
              <FormField label="Expiry Date">
                <Input value={expiry || '—'} disabled readOnly className="bg-muted" />
              </FormField>
              <FormField label="Status">
                <Input value={formatConsentStatus(displayStatus)} disabled readOnly className="bg-muted" />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Additional Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Department">
                <Input value={record.department || '—'} disabled readOnly className="bg-muted" />
              </FormField>
              <FormField label="Language">
                <Input value={record.language || '—'} disabled readOnly className="bg-muted" />
              </FormField>
              <FormField label="Version Number">
                <Input value={record.versionNumber || '—'} disabled readOnly className="bg-muted" />
              </FormField>
            </div>
          </FormSection>

          <SignaturePreviewSection record={record} />
        </div>

        <DialogFooter className="border-t border-border px-5 py-3 gap-2">
          {onEdit && (
            <Button type="button" variant="outline" onClick={() => onEdit(record)}>
              Edit
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
