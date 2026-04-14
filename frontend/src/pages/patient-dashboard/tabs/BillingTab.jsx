import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Static data
const insuranceInfo = {
  insuranceType: 'Primary',
  policyNumber: 'BC123456789',
  payerName: 'Blue Cross Blue Shield',
  groupNumber: 'GRP-001',
  effectiveDate: '2024-01-01',
  expiryDate: '2024-12-31',
};

const claims = [
  {
    id: 1,
    claimId: 'CLM-2025-001',
    status: 'Accepted',
    amount: '$250.00',
    date: '2025-01-16',
  },
  {
    id: 2,
    claimId: 'CLM-2025-002',
    status: 'Paid',
    amount: '$150.00',
    date: '2025-01-11',
    paidDate: '2025-01-18',
  },
  {
    id: 3,
    claimId: 'CLM-2024-150',
    status: 'Rejected',
    amount: '$300.00',
    date: '2024-12-21',
    rejectionReason: 'Duplicate claim',
  },
  {
    id: 4,
    claimId: 'CLM-2024-149',
    status: 'Paid',
    amount: '$200.00',
    date: '2024-12-15',
    paidDate: '2024-12-20',
  },
];

const balanceSummary = {
  totalBilled: '$900.00',
  paid: '$350.00',
  outstanding: '$550.00',
};

export function BillingTab({ patient }) {
  const getStatusBadge = (status) => {
    const variants = {
      Accepted: 'default',
      Rejected: 'destructive',
      Paid: 'default',
      Denied: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Billing & Insurance</h2>

      {/* Insurance Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Insurance Type</p>
              <Badge variant="secondary">{insuranceInfo.insuranceType}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Policy Number</p>
              <p className="font-semibold font-mono">{insuranceInfo.policyNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Payer Name</p>
              <p className="font-semibold">{insuranceInfo.payerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Group Number</p>
              <p className="font-semibold">{insuranceInfo.groupNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Effective Date</p>
              <p className="font-semibold">
                {new Date(insuranceInfo.effectiveDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
              <p className="font-semibold">
                {new Date(insuranceInfo.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balanceSummary.totalBilled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{balanceSummary.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{balanceSummary.outstanding}</p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono text-xs">{claim.claimId}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(claim.status)}>{claim.status}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{claim.amount}</TableCell>
                    <TableCell>{new Date(claim.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {claim.paidDate ? new Date(claim.paidDate).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
