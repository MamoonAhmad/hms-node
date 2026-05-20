import { useRef } from 'react';
import { User, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const PATIENT_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PATIENT_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/**
 * Patient profile photo picker (stores a data URL for form state / API).
 */
export function PatientPhotoUpload({
  value,
  fileName,
  onChange,
  onClear,
  error,
  disabled = false,
  id = 'patientPhoto',
}) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onChange({ photo: '', fileName: '', error: 'Please select a JPEG, PNG, WebP, or GIF image.' });
      return;
    }
    if (file.size > PATIENT_PHOTO_MAX_BYTES) {
      onChange({
        photo: '',
        fileName: '',
        error: 'Image must be 2 MB or smaller.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        photo: typeof reader.result === 'string' ? reader.result : '',
        fileName: file.name,
        error: null,
      });
    };
    reader.onerror = () => {
      onChange({ photo: '', fileName: '', error: 'Could not read the image file.' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Patient photo</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            'flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40',
            error && 'border-destructive',
          )}
        >
          {value ? (
            <img
              src={value}
              alt="Patient preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-muted-foreground/60" aria-hidden />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={PATIENT_PHOTO_ACCEPT}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {value ? 'Change photo' : 'Upload photo'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onClear?.()}
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or GIF · max 2 MB
            {fileName ? (
              <>
                {' '}
                · <span className="font-medium text-foreground/80">{fileName}</span>
              </>
            ) : null}
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
