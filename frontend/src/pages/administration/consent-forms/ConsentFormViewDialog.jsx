import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConsentSignatureCapture } from '@/pages/administration/consent-forms/ConsentSignatureCapture';
import {
  formatConsentStatus,
  formatConsentType,
} from '@/pages/administration/consent-forms/consentFormsConstants';
import {
  formatConsentDisplayDate,
  getConsentSignatureBlocks,
} from '@/pages/administration/consent-forms/consentFormViewUtils';

function SimpleSignatureSection({ record }) {
  const blocks = getConsentSignatureBlocks(record);
  if (!blocks.length) return null;

  return (
    <section className="space-y-3 border-t border-border pt-6">
      <h3 className="text-sm font-semibold text-foreground">Signatures</h3>
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

  const effective = formatConsentDisplayDate(record.effectiveDate);
  const expiry = formatConsentDisplayDate(record.expiryDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl w-[95vw]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-lg leading-snug pr-6">{record.consentTitle}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
            <span>{formatConsentType(record.consentType)}</span>
            <span className="text-muted-foreground">·</span>
            <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
              {formatConsentStatus(record.status)}
            </Badge>
            {record.isMandatory && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                Mandatory
              </Badge>
            )}
            {record.versionNumber && (
              <span className="text-muted-foreground">v{record.versionNumber}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {(record.department || record.language || effective || expiry) && (
            <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              {record.department && (
                <>
                  <dt className="text-muted-foreground">Department</dt>
                  <dd>{record.department}</dd>
                </>
              )}
              {record.language && (
                <>
                  <dt className="text-muted-foreground">Language</dt>
                  <dd>{record.language}</dd>
                </>
              )}
              {effective && (
                <>
                  <dt className="text-muted-foreground">Effective</dt>
                  <dd>{effective}</dd>
                </>
              )}
              {expiry && (
                <>
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd>{expiry}</dd>
                </>
              )}
            </dl>
          )}

          {record.description && (
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{record.description}</p>
          )}

          <div
            className="rounded-md border border-border bg-muted/20 px-4 py-4 prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-headings:text-foreground"
            dangerouslySetInnerHTML={{
              __html: record.consentContent || '<p class="text-muted-foreground">No content.</p>',
            }}
          />

          <SimpleSignatureSection record={record} />
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
