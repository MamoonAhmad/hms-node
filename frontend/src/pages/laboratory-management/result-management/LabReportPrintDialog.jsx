import { Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LabReportView } from './LabReportView';

export function LabReportPrintDialog({ open, onOpenChange, labTest }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[720px] max-w-4xl max-h-[90vh] overflow-y-auto print:min-w-0 print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle>Laboratory Report</DialogTitle>
            <Button
              size="sm"
              onClick={() => window.print()}
              disabled={!labTest}
            >
              <Printer className="h-4 w-4 mr-2 icon-action-print" />
              Print
            </Button>
          </div>
        </DialogHeader>
        {labTest ? (
          <LabReportView labTest={labTest} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading report...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
