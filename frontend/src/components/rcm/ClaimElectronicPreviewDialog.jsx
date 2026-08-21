import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="rounded-md border bg-muted/20 p-3 text-sm">{children}</div>
    </section>
  );
}

function Field({ label, value }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      {value || '—'}
    </p>
  );
}

export function ClaimElectronicPreviewDialog({ open, onOpenChange, preview, loading, error, onRetry }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Electronic claim preview (837P)</DialogTitle>
        </DialogHeader>
        <DialogBody>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading preview…</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            {onRetry && <Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
          </div>
        ) : !preview ? (
          <p className="text-sm text-muted-foreground">Save the claim to preview the electronic claim.</p>
        ) : (
          <div className="max-h-[32rem] space-y-4 overflow-auto">
            <p className="text-xs text-muted-foreground">
              Read-only preview. This does not submit the claim to a clearinghouse.
            </p>
            <Section title="Claim information">
              <Field label="Claim #" value={preview.claimInformation?.claimNumber} />
              <Field label="Status" value={preview.claimInformation?.claimStatus} />
              <Field label="DOS" value={preview.claimInformation?.dateOfService} />
              <Field label="Total" value={preview.claimInformation?.totalCharge} />
            </Section>
            <Section title="Subscriber information">
              <Field label="Name" value={preview.subscriberInformation?.subscriberName} />
              <Field label="DOB" value={preview.subscriberInformation?.subscriberDob} />
              <Field label="Relationship" value={preview.subscriberInformation?.relationship} />
              <Field label="Member ID" value={preview.subscriberInformation?.memberId} />
              <Field label="Group" value={preview.subscriberInformation?.groupNumber} />
            </Section>
            <Section title="Payer information">
              <Field label="Primary" value={preview.payerInformation?.primary?.name} />
              <Field label="Secondary" value={preview.payerInformation?.secondary?.name} />
              <Field label="Tertiary" value={preview.payerInformation?.tertiary?.name} />
            </Section>
            <Section title="Provider information">
              <Field label="Rendering" value={preview.providerInformation?.rendering?.name} />
              <Field label="Billing" value={preview.providerInformation?.billing?.name} />
              <Field label="Facility" value={preview.providerInformation?.facility?.name} />
            </Section>
            <Section title="Diagnosis">
              {(preview.diagnosis || []).length === 0 ? '—' : (
                <ul className="list-disc pl-5">
                  {(preview.diagnosis || []).map((dx) => (
                    <li key={`${dx.pointer}-${dx.code}`}>{dx.pointer}: {dx.code} {dx.description}</li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Service lines / charges">
              {(preview.serviceLines || []).length === 0 ? '—' : (
                <ul className="list-disc pl-5">
                  {(preview.serviceLines || []).map((line) => (
                    <li key={line.id || line.lineNumber}>
                      {line.procedureCode || line.cptCode} · {line.units} × ${Number(line.unitCharge || 0).toFixed(2)} = ${Number(line.chargeAmount || 0).toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
              <Field label="Total charge" value={preview.charges?.totalCharge} />
            </Section>
          </div>
        )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
