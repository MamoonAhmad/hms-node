import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRcmEncounter } from '../RcmEncounterContext';
import { formatDate, formatMoney } from '../rcmEncounterConstants';

export function CoverageTab() {
  const { encounter, verifyEligibility, saving } = useRcmEncounter();
  const [msg, setMsg] = useState(null);
  if (!encounter) return null;
  const { coverage } = encounter;
  const eligibility = coverage?.eligibility;

  const onVerify = async () => {
    setMsg(null);
    try {
      const data = await verifyEligibility();
      setMsg(data?.response?.message || 'Eligibility checked (mock 270/271)');
    } catch (err) {
      setMsg(err.message || 'Eligibility check failed');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Coverage / eligibility</h2>
        <p className="text-sm text-muted-foreground">Payer plans and eligibility status for this encounter.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Eligibility</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline">{eligibility?.status || 'Not Verified'}</Badge>
          <span className="text-muted-foreground">
            Payer: <span className="text-foreground">{eligibility?.payerName || coverage?.primaryPayer || '—'}</span>
          </span>
          <span className="text-muted-foreground">
            Member ID: <span className="font-mono text-foreground">{eligibility?.memberId || '—'}</span>
          </span>
          <span className="text-muted-foreground">
            Verified: <span className="text-foreground">{formatDate(eligibility?.verifiedAt)}</span>
          </span>
          <Button size="sm" variant="secondary" disabled={saving} onClick={onVerify}>
            Verify eligibility
          </Button>
          {msg && <span className="w-full text-muted-foreground">{msg}</span>}
          {eligibility?.notes && <span className="w-full text-muted-foreground">{eligibility.notes}</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Insurance coverages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Copay</TableHead>
                  <TableHead>Auth #</TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(coverage?.insurances || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      {coverage?.billingType === 'Self-Pay'
                        ? 'Self-pay encounter — no insurance on file.'
                        : 'No insurance coverages on file.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  coverage.insurances.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell>{ins.insuranceType}</TableCell>
                      <TableCell>{ins.payerName}</TableCell>
                      <TableCell className="font-mono text-xs">{ins.memberId}</TableCell>
                      <TableCell>{ins.groupNumber || '—'}</TableCell>
                      <TableCell>{ins.planName || '—'}</TableCell>
                      <TableCell>{ins.copay != null ? formatMoney(ins.copay) : '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{ins.authorizationNumber || '—'}</TableCell>
                      <TableCell>
                        {formatDate(ins.coverageStartDate)}
                        {ins.coverageEndDate ? ` – ${formatDate(ins.coverageEndDate)}` : ''}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
