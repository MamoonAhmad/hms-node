import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditResultsForm } from './EditResultsForm';

export function EditResultsDialog({ open, onOpenChange, labTest, onSaved }) {
  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Result Information</DialogTitle>
        </DialogHeader>
        <EditResultsForm
          labTest={labTest}
          onSaved={async (payload) => {
            await onSaved?.(payload);
            onOpenChange?.(false);
          }}
          onCancel={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
