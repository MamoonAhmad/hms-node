import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatDisplayDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function ViewResultDialog({ open, onOpenChange, labTest }) {
  if (!labTest) return null;

  const params = labTest.parameters && labTest.parameters.length ? labTest.parameters : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Result Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Specimen status - all disabled */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Specimen status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Collection Site *</Label>
                <Input value={labTest.collectionSite || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Lab Room</Label>
                <Input value={labTest.labRoom || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Specimen Type *</Label>
                <Input value={labTest.specimenType || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Specimen Status *</Label>
                <Input value={labTest.specimenStatus || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Collected By *</Label>
                <Input value={labTest.collectedBy || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Collection Date & Time *</Label>
                <Input value={formatDisplayDateTime(labTest.collectionDateTime)} readOnly className="bg-background" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Specimen Collection Notes *</Label>
                <Textarea value={labTest.collectionNotes || ''} readOnly className="bg-background resize-none" rows={2} />
              </div>
            </div>
          </div>

          {/* Lab Order - all disabled */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Lab Order</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Lab Order Name</Label>
                <Input value={labTest.testName || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Method</Label>
                <Input value={labTest.method || 'N/A'} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Department</Label>
                <Input value={labTest.department || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created By</Label>
                <Input value={labTest.createdBy || ''} readOnly className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created At</Label>
                <Input value={formatDisplayDateTime(labTest.createdAt)} readOnly className="bg-background" />
              </div>
            </div>
          </div>

          {/* Test Results - disabled */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Test Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">Result Generated Date/Time</Label>
                <Input value={formatDisplayDateTime(labTest.resultDate)} readOnly className="bg-muted" />
              </div>
              <div>
                <Label className="text-muted-foreground">Test Result Status</Label>
                <Input value={labTest.resultStatus || 'Pending'} readOnly className="bg-muted" />
              </div>
            </div>
          </div>

          {/* Parameters table - all disabled */}
          <div>
            <Label className="text-sm font-medium">Result parameters</Label>
            <div className="rounded-md border overflow-x-auto mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Results *</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Critical Range</TableHead>
                    <TableHead>Reportable Range</TableHead>
                    <TableHead>Analytical Range</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {params.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">No parameters</TableCell>
                    </TableRow>
                  ) : (
                    params.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.resultValue}</TableCell>
                        <TableCell className="text-muted-foreground">{p.flag}</TableCell>
                        <TableCell className="text-muted-foreground">{p.units}</TableCell>
                        <TableCell className="text-muted-foreground">{p.referenceRange}</TableCell>
                        <TableCell className="text-muted-foreground">{p.criticalRange}</TableCell>
                        <TableCell className="text-muted-foreground">{p.reportableRange}</TableCell>
                        <TableCell className="text-muted-foreground">{p.analyticalRange}</TableCell>
                        <TableCell className="text-muted-foreground">{p.method}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Result notes</Label>
            <Textarea value={labTest.resultNotes || ''} readOnly className="bg-muted resize-none" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
