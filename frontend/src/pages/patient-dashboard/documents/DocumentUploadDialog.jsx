import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ACCEPTED_DOCUMENT_INPUT,
  formatFileSize,
  readFileAsDataUrl,
  validateDocumentFile,
} from '@/lib/fileUpload';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  PATIENT_VISIBLE_TYPES,
  emptyUploadForm,
  parseTagsInput,
} from './patientDocumentConstants';

function buildPendingFile(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    progress: 0,
    status: 'pending',
    error: null,
  };
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  encounters = [],
  defaultEncounterId = '',
  existingDocuments = [],
  onUpload,
}) {
  const [form, setForm] = useState(() => emptyUploadForm(defaultEncounterId));
  const [pendingFiles, setPendingFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const encounterOptions = useMemo(
    () =>
      encounters.map((enc) => ({
        value: enc.id,
        label: enc.encounterNumber || enc.id,
      })),
    [encounters],
  );

  const resetState = () => {
    setForm(emptyUploadForm(defaultEncounterId));
    setPendingFiles([]);
    setErrors({});
    setDuplicateWarning('');
    setUploading(false);
  };

  const handleClose = (nextOpen) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'This field is required.';
    if (!form.documentType) nextErrors.documentType = 'This field is required.';
    if (!form.category) nextErrors.category = 'This field is required.';
    if (!pendingFiles.length) nextErrors.files = 'Please select a file to upload.';
    if (form.isConfidential && form.patientVisible) {
      nextErrors.patientVisible = 'Confidential documents cannot be patient visible.';
    }
    if (form.patientVisible && form.documentType && !PATIENT_VISIBLE_TYPES.has(form.documentType)) {
      nextErrors.patientVisible = 'This document type is not approved for patient visibility.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const nextPending = [];
    const fileErrors = [];

    files.forEach((file) => {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        fileErrors.push(`${file.name}: ${validation.message}`);
        return;
      }
      nextPending.push(buildPendingFile(file));
    });

    if (fileErrors.length) {
      setErrors((prev) => ({ ...prev, files: fileErrors[0] }));
    } else {
      setErrors((prev) => ({ ...prev, files: undefined }));
    }

    setPendingFiles((prev) => {
      const merged = [...prev];
      nextPending.forEach((item) => {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item);
        }
      });
      return merged;
    });

    const duplicateNames = files
      .map((f) => f.name)
      .filter((name) => existingDocuments.some((doc) => doc.fileName === name));
    setDuplicateWarning(
      duplicateNames.length
        ? `A file named "${duplicateNames[0]}" already exists for this patient. Uploading will create a separate document record.`
        : '',
    );
  };

  const removePendingFile = (id) => {
    setPendingFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploading(true);
    const tags = parseTagsInput(form.tags);
    const payloads = [];

    try {
      for (const item of pendingFiles) {
        setPendingFiles((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'uploading', progress: 30 } : entry,
          ),
        );

        const fileData = await readFileAsDataUrl(item.file);
        payloads.push({
          title: pendingFiles.length > 1 ? `${form.title.trim()} — ${item.fileName}` : form.title.trim(),
          documentType: form.documentType,
          category: form.category,
          source: 'Patient Dashboard',
          encounterId: form.encounterId || null,
          description: form.description.trim() || null,
          documentDate: form.documentDate || null,
          expirationDate: form.expirationDate || null,
          isConfidential: form.isConfidential,
          patientVisible: form.patientVisible,
          tags,
          fileName: item.fileName,
          fileData,
          mimeType: item.mimeType || 'application/octet-stream',
          fileSize: item.fileSize,
        });

        setPendingFiles((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, progress: 70 } : entry,
          ),
        );
      }

      await onUpload(payloads);

      setPendingFiles((prev) =>
        prev.map((entry) => ({ ...entry, status: 'done', progress: 100 })),
      );
      handleClose(false);
    } catch (err) {
      setErrors({ submit: err?.message || 'Document upload failed. Please try again.' });
      setPendingFiles((prev) =>
        prev.map((entry) =>
          entry.status === 'uploading'
            ? { ...entry, status: 'error', error: err?.message || 'Upload failed' }
            : entry,
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="doc-title">Document Title *</Label>
            <Input
              id="doc-title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label>Document Type *</Label>
            <Select value={form.documentType} onValueChange={(v) => setField('documentType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.documentType && <p className="text-sm text-destructive">{errors.documentType}</p>}
          </div>

          <div className="space-y-2">
            <Label>Document Category *</Label>
            <Select value={form.category} onValueChange={(v) => setField('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Input value={form.source} readOnly disabled />
          </div>

          <div className="space-y-2">
            <Label>Encounter</Label>
            <Select
              value={form.encounterId || '__none__'}
              onValueChange={(v) => setField('encounterId', v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional encounter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {encounterOptions.map((enc) => (
                  <SelectItem key={enc.value} value={enc.value}>
                    {enc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="doc-description">Description</Label>
            <Textarea
              id="doc-description"
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-date">Document Date</Label>
            <Input
              id="doc-date"
              type="date"
              value={form.documentDate}
              onChange={(e) => setField('documentDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-expiration">Expiration Date</Label>
            <Input
              id="doc-expiration"
              type="date"
              value={form.expirationDate}
              onChange={(e) => setField('expirationDate', e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="doc-tags">Tags</Label>
            <Input
              id="doc-tags"
              placeholder="Comma-separated tags"
              value={form.tags}
              onChange={(e) => setField('tags', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="doc-confidential"
              checked={form.isConfidential}
              onCheckedChange={(checked) => setField('isConfidential', !!checked)}
            />
            <Label htmlFor="doc-confidential">Mark as Confidential</Label>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="doc-patient-visible"
              checked={form.patientVisible}
              onCheckedChange={(checked) => setField('patientVisible', !!checked)}
            />
            <Label htmlFor="doc-patient-visible">Patient Visible</Label>
          </div>
          {errors.patientVisible && (
            <p className="text-sm text-destructive sm:col-span-2">{errors.patientVisible}</p>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="doc-files">Upload File *</Label>
            <Input
              id="doc-files"
              type="file"
              multiple
              accept={ACCEPTED_DOCUMENT_INPUT}
              onChange={handleFileChange}
            />
            {errors.files && <p className="text-sm text-destructive">{errors.files}</p>}
            {duplicateWarning && (
              <p className="text-sm text-amber-600">{duplicateWarning}</p>
            )}
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-2 sm:col-span-2">
              {pendingFiles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.fileName}</div>
                    <div className="text-muted-foreground">{formatFileSize(item.fileSize)}</div>
                    {item.status === 'uploading' && (
                      <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.error && <p className="text-destructive">{item.error}</p>}
                  </div>
                  {!uploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removePendingFile(item.id)}
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
