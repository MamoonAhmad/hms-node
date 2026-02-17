import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const mockBilling = [
  {
    id: 1,
    claimNumber: 'CLM-001',
    date: '2025-01-15',
    totalAmount: 1250.00,
    status: 'Pending',
  },
];

export function BillingSection({ patientId }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Encounter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Billing Summary</h3>
          <p className="text-sm text-muted-foreground">Total Claims: {mockBilling.length}</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockBilling.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                <TableCell>{new Date(claim.date).toLocaleDateString()}</TableCell>
                <TableCell>${claim.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{claim.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Claim Details</DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4 py-4">
                <p>Claim Number: {selectedClaim.claimNumber}</p>
                <p>Date: {new Date(selectedClaim.date).toLocaleDateString()}</p>
                <p>Amount: ${selectedClaim.totalAmount.toFixed(2)}</p>
                <p>Status: {selectedClaim.status}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4 py-4">
                <p>Pay ${selectedClaim.totalAmount.toFixed(2)} for claim {selectedClaim.claimNumber}</p>
                <p className="text-sm text-muted-foreground">Payment form would appear here</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Submit Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}


