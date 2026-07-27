import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Registration waitlist — patients waiting for an available slot / registration capacity.
 * Listing shell matches the patients registration views; data source can be wired later.
 */
export function WaitlistPage() {
  return (
    <div className="ehr-page">
      <PageHeader
        title="Waitlist"
        description="Patients waiting for registration or an available appointment slot."
        breadcrumbs="Patient Management / Registration Queue / Waitlist"
      />

      <div className="content-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 bg-muted/40">Sr No.</TableHead>
              <TableHead className="bg-muted/40">MRN</TableHead>
              <TableHead className="bg-muted/40">Patient</TableHead>
              <TableHead className="bg-muted/40">Contacts</TableHead>
              <TableHead className="bg-muted/40">Registration Status</TableHead>
              <TableHead className="bg-muted/40">Consent Status</TableHead>
              <TableHead className="bg-muted/40">Insurance Information</TableHead>
              <TableHead className="bg-muted/40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium text-foreground">No patients on the waitlist</p>
                  <p className="max-w-sm text-xs">
                    Patients added to the waitlist will appear here.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
