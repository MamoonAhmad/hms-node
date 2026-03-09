import { useState, useEffect, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Scan, X, FileText } from 'lucide-react';
import { labApi, patientApi } from '@/services/api';
import { LAB_REPORT_SOURCES } from '@/lib/labConstants';

const ACCEPTED_FILE_TYPES = '.pdf,image/*';
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ReceiveLabReportDialog({ open, onOpenChange, onSaved }) {
  const fileInputRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    source: 'Patient brought',
    receivedBy: '',
    reportDate: '',
    performingLab: '',
    description: '',
    fileName: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        patientId: '',
        source: 'Patient brought',
        receivedBy: '',
        reportDate: '',
        performingLab: '',
        description: '',
        fileName: '',
      });
      setSelectedFile(null);
      setFileError('');
      patientApi.getAll({ limit: 200 }).then((res) => setPatients(res.data || []));
    }
  }, [open]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileError('');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File must be under ${MAX_FILE_SIZE_MB} MB`);
      setSelectedFile(null);
      return;
    }
    setFileError('');
    setSelectedFile(file);
    setFormData((f) => ({ ...f, fileName: file.name }));
    e.target.value = '';
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFormData((f) => ({ ...f, fileName: '' }));
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = (capture = false) => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      if (capture) fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const selectedPatient = patients.find((p) => p.id === Number(formData.patientId));

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    if (!formData.patientId) {
      alert('Please select a patient.');
      return;
    }
    setSaving(true);
    try {
      let attachmentData = null;
      if (selectedFile) {
        try {
          attachmentData = await readFileAsBase64(selectedFile);
        } catch (_) {
          alert('Could not read the selected file.');
          setSaving(false);
          return;
        }
      }
      await labApi.createLabReportReceived({
        patientId: selectedPatient.id,
        patient: {
          name: selectedPatient.name || `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() || 'Unknown',
          mrn: selectedPatient.mrn || selectedPatient.id,
          dob: selectedPatient.dob,
          gender: selectedPatient.gender,
        },
        source: formData.source,
        receivedDate: new Date().toISOString(),
        receivedBy: formData.receivedBy,
        reportDate: formData.reportDate ? new Date(formData.reportDate).toISOString() : null,
        performingLab: formData.performingLab,
        description: formData.description,
        fileName: formData.fileName || selectedFile?.name || null,
        attachmentData: attachmentData || undefined,
      });
      onSaved?.();
      onOpenChange?.(false);
    } catch (e) {
      alert(e?.message || 'Failed to receive report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive lab report</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Patient has brought (or sent) lab reports from another facility. Record and attach to the chart.
        </p>
        <div className="space-y-4">
          <div>
            <Label>Patient *</Label>
            <Select
              value={formData.patientId ? String(formData.patientId) : ''}
              onValueChange={(v) => setFormData((f) => ({ ...f, patientId: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => {
                  const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || `Patient ${p.id}`;
                  return (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {name} {p.mrn ? `(${p.mrn})` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select
              value={formData.source}
              onValueChange={(v) => setFormData((f) => ({ ...f, source: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAB_REPORT_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Received by</Label>
            <Input
              value={formData.receivedBy}
              onChange={(e) => setFormData((f) => ({ ...f, receivedBy: e.target.value }))}
              placeholder="Staff name"
            />
          </div>
          <div>
            <Label>Report date (when the lab performed the test)</Label>
            <Input
              type="date"
              value={formData.reportDate}
              onChange={(e) => setFormData((f) => ({ ...f, reportDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>Performing lab</Label>
            <Input
              value={formData.performingLab}
              onChange={(e) => setFormData((f) => ({ ...f, performingLab: e.target.value }))}
              placeholder="e.g. Quest Diagnostics"
            />
          </div>

          <div className="space-y-2">
            <Label>Upload or scan lab report</Label>
            <p className="text-xs text-muted-foreground">
              Attach the report as PDF or image (max {MAX_FILE_SIZE_MB} MB). You can upload a file or use your device camera to scan.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={removeFile} title="Remove file">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => triggerFileInput(false)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF or image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => triggerFileInput(true)}
                  title="On mobile this may open the camera"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan / use camera
                </Button>
              </div>
            )}
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          </div>

          <div>
            <Label>Document title (optional)</Label>
            <Input
              value={formData.fileName}
              onChange={(e) => setFormData((f) => ({ ...f, fileName: e.target.value }))}
              placeholder="e.g. CBC report – for display only if no file uploaded"
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Any additional notes"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Receive report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
