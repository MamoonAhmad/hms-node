import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRcmEncounter } from '../RcmEncounterContext';
import { billingStatusTone, formatDate, formatMoney } from '../rcmEncounterConstants';
import { cn } from '@/lib/utils';

function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

export function SummaryTab() {
  const { encounter } = useRcmEncounter();
  if (!encounter) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Encounter summary</h2>
        <p className="text-sm text-muted-foreground">
          Billing workspace overview for this date of service.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Encounter #" value={encounter.encounterNumber} />
            <Field label="DOS" value={formatDate(encounter.dateOfService)} />
            <Field label="Time" value={encounter.appointmentTime} />
            <Field label="Visit type" value={encounter.visitType} />
            <Field label="Department" value={encounter.department} />
            <Field label="Place of service" value={encounter.placeOfService} />
            <Field label="Chief complaint" value={encounter.visitReason} />
            <Field label="Appt status" value={encounter.appointmentStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provider & payer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Rendering provider" value={encounter.provider?.name} />
            <Field label="NPI" value={encounter.provider?.npi} />
            <Field label="Primary payer" value={encounter.coverage?.primaryPayer} />
            <Field label="Billing type" value={encounter.coverage?.billingType} />
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Billing status</p>
              <Badge variant="outline" className={cn(billingStatusTone(encounter.billingStatus))}>
                {encounter.billingStatus}
              </Badge>
            </div>
            <Field label="Eligibility" value={encounter.coverage?.eligibility?.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Claim financials</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Claim ID" value={encounter.claim?.claimId || 'Not created'} />
            <Field label="Claim status" value={encounter.claim?.status} />
            <Field label="Total charges" value={formatMoney(encounter.financials?.totalCharges)} />
            <Field label="Amount paid" value={formatMoney(encounter.financials?.amountPaid)} />
            <Field label="Balance due" value={formatMoney(encounter.financials?.balanceDue)} />
            <Field label="ICD count" value={String(encounter.diagnoses?.length || 0)} />
            <Field label="CPT lines" value={String(encounter.charges?.length || 0)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
