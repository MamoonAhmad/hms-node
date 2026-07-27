import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SideUpload({ id, label, value, onChange, error }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
          <label htmlFor={id} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload
            <input
              id={id}
              type="file"
              accept={ACCEPTED_TYPES}
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (!ACCEPTED_MIME.includes(file.type)) {
                  onChange({ error: 'Supported types: PDF, JPG, JPEG, PNG' });
                  return;
                }
                const dataUrl = await readFileAsDataUrl(file);
                onChange({
                  fileName: file.name,
                  fileData: dataUrl,
                  mimeType: file.type,
                  error: null,
                });
              }}
            />
          </label>
        </Button>
        {value?.fileName && (
          <span className="truncate text-sm text-muted-foreground">{value.fileName}</span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function InsuranceCardUploadModal({
  open,
  onOpenChange,
  insuranceType,
  onSave,
}) {
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [frontError, setFrontError] = useState(null);
  const [backError, setBackError] = useState(null);

  const typeLabel =
    insuranceType === 'primary'
      ? 'Primary'
      : insuranceType === 'secondary'
        ? 'Secondary'
        : insuranceType === 'tertiary'
          ? 'Tertiary'
          : 'Insurance';

  const handleClose = (nextOpen) => {
    if (!nextOpen) {
      setFront(null);
      setBack(null);
      setFrontError(null);
      setBackError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if (!front && !back) {
      setFrontError('Upload at least one side or cancel');
      return;
    }
    onSave?.({
      insuranceType,
      front,
      back,
    });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {typeLabel} Insurance Documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SideUpload
            id="insurance-card-front"
            label="Front Side"
            value={front}
            error={frontError}
            onChange={(next) => {
              if (next.error) {
                setFrontError(next.error);
                return;
              }
              setFront(next);
              setFrontError(null);
            }}
          />
          <SideUpload
            id="insurance-card-back"
            label="Back Side"
            value={back}
            error={backError}
            onChange={(next) => {
              if (next.error) {
                setBackError(next.error);
                return;
              }
              setBack(next);
              setBackError(null);
            }}
          />
          <div className="rounded-md border border-dashed p-3">
            <Button type="button" variant="outline" disabled className="w-full">
              Scan Documents
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Document scanning is not available in this release.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Add to Documents
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
