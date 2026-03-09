import { useState, useEffect } from 'react';
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

const MAX_FILE_SIZE_MB = 10;
const ACCEPT = '.pdf,image/*';

export function UploadReportDialog({ open, onOpenChange, order, onSubmit, isLoading }) {
  const [reportType, setReportType] = useState('PDF');
  const [file, setFile] = useState(null);
  const [testDate, setTestDate] = useState('');
  const [reportReceivedDate, setReportReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && order) {
      setReportType('PDF');
      setFile(null);
      setTestDate('');
      setReportReceivedDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setErrors({});
    }
  }, [open, order]);

  const validate = () => {
    const newErrors = {};
    if (!reportType) newErrors.reportType = 'Report type is required';
    if (!file) newErrors.reportFile = 'Report file is required';
    else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) newErrors.reportFile = `Max file size is ${MAX_FILE_SIZE_MB} MB`;
    if (!testDate) newErrors.testDate = 'Test date is required';
    if (!reportReceivedDate) newErrors.reportReceivedDate = 'Report received date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(order.id, {
      reportType,
      fileName: file?.name,
      testDate,
      reportReceivedDate,
      remarks,
    });
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-md">
        <DialogHeader>
          <DialogTitle>Upload External Lab Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Lab Order ID</Label>
            <Input value={order.orderId} readOnly disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Report Type *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className={errors.reportType ? 'border-destructive' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Image">Image</SelectItem>
              </SelectContent>
            </Select>
            {errors.reportType && <p className="text-xs text-destructive">{errors.reportType}</p>}
          </div>
          <div className="space-y-2">
            <Label>Report File * (PDF/Image, max {MAX_FILE_SIZE_MB} MB)</Label>
            <Input
              type="file"
              accept={ACCEPT}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                if (errors.reportFile) setErrors((prev) => ({ ...prev, reportFile: null }));
              }}
              className={errors.reportFile ? 'border-destructive' : ''}
            />
            {errors.reportFile && <p className="text-xs text-destructive">{errors.reportFile}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="testDate">Test Date *</Label>
            <Input
              id="testDate"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className={errors.testDate ? 'border-destructive' : ''}
            />
            {errors.testDate && <p className="text-xs text-destructive">{errors.testDate}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportReceivedDate">Report Received Date *</Label>
            <Input
              id="reportReceivedDate"
              type="date"
              value={reportReceivedDate}
              onChange={(e) => setReportReceivedDate(e.target.value)}
              className={errors.reportReceivedDate ? 'border-destructive' : ''}
            />
            {errors.reportReceivedDate && <p className="text-xs text-destructive">{errors.reportReceivedDate}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
