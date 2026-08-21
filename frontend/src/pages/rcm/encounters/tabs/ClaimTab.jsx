import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Activity, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRcmEncounter } from '../RcmEncounterContext';
import { formatDate, formatMoney, billingStatusTone } from '../rcmEncounterConstants';
import { cn } from '@/lib/utils';
import { rcmApi } from '@/services/api';
import { useState } from 'react';

function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

export function ClaimTab() {
  const { encounter, updateBillingStatus, saving, refresh } = useRcmEncounter();
  const [actionMsg, setActionMsg] = useState(null);
  if (!encounter) return null;
  const claim = encounter.claim || {};
  const claimDbId = claim.claimDbId;

  const run = async (label, fn) => {
    setActionMsg(null);
    try {
      await fn();
      await refresh();
      setActionMsg(label);
    } catch (err) {
      setActionMsg(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Claim</h2>
        <p className="text-sm text-muted-foreground">
          Build → scrub → submit (mock 837) → status. Forms and tracker stay linked to this claim.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Claim details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Claim ID" value={claim.claimId || 'Not created'} />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <Badge variant="outline" className={cn(billingStatusTone(encounter.billingStatus))}>
              {claim.status}
            </Badge>
          </div>
          <Field label="Form" value={claim.form} />
          <Field label="Submitted" value={formatDate(claim.submittedDate)} />
          <Field label="TCN" value={claim.tcn} />
          <Field label="Scrub" value={claim.scrubStatus} />
          <Field label="Total charge" value={formatMoney(claim.totalCharge)} />
          <Field label="Paid" value={formatMoney(claim.amountPaid)} />
          <Field label="Balance" value={formatMoney(claim.balanceDue)} />
          <Field label="Rejection / denial" value={claim.rejectionReason} />
        </CardContent>
      </Card>

      {actionMsg && <p className="text-sm text-muted-foreground">{actionMsg}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Claim actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={claim.cms1500Path || '/rcm/cms-1500'}>
              <FileText className="mr-1.5 h-4 w-4" />
              Open CMS-1500
              <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={claim.ub04Path || '/rcm/claim-ub04'}>
              <FileText className="mr-1.5 h-4 w-4" />
              Open UB-04
              <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={claim.trackerPath || '/rcm/claim-tracker'}>
              <Activity className="mr-1.5 h-4 w-4" />
              Claim tracker
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={claim.followUpPath || '/rcm/follow-up-management'}>
              <CalendarClock className="mr-1.5 h-4 w-4" />
              Follow-up management
            </Link>
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => updateBillingStatus('Ready to submit')}
          >
            Build & scrub
          </Button>
          <Button disabled={saving} onClick={() => updateBillingStatus('Submitted')}>
            Submit (837 mock)
          </Button>
          {claimDbId && (
            <>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => run('Scrub complete', () => rcmApi.scrubClaim(claimDbId))}
              >
                Re-scrub
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run('ERA posted', () => rcmApi.simulateEra(claimDbId, { paidRatio: 0.8 }))
                }
              >
                Simulate ERA (835)
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run('Denial ERA posted', () => rcmApi.simulateEra(claimDbId, { deny: true }))
                }
              >
                Simulate denial
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
