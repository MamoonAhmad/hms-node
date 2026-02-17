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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { labApi } from '@/services/api';

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toISOString().slice(0, 16);
}

function formatDisplayDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export function EditResultsDialog({ open, onOpenChange, labTest, onSaved }) {
  const [formData, setFormData] = useState({
    resultDate: formatDateTime(new Date()),
    resultStatus: 'Pending',
    parameters: [],
    resultNotes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labTest) {
      const params = (labTest.parameters && labTest.parameters.length)
        ? labTest.parameters.map((p) => ({
            name: p.name,
            resultValue: p.resultValue ?? '',
            flag: p.flag ?? '',
            units: p.units ?? '',
            referenceRange: p.referenceRange ?? '',
            criticalRange: p.criticalRange ?? '',
            reportableRange: p.reportableRange ?? '',
            analyticalRange: p.analyticalRange ?? '',
            method: p.method ?? '',
          }))
        : [{ name: 'Result', resultValue: '', flag: '', units: '', referenceRange: '', criticalRange: '', reportableRange: '', analyticalRange: '', method: '' }];
      setFormData({
        resultDate: labTest.resultDate ? formatDateTime(labTest.resultDate) : formatDateTime(new Date()),
        resultStatus: labTest.resultStatus || 'Pending',
        parameters: params,
        resultNotes: labTest.resultNotes || '',
      });
    }
  }, [labTest]);

  const handleParamResult = (index, value) => {
    setFormData((f) => ({
      ...f,
      parameters: f.parameters.map((p, i) => (i === index ? { ...p, resultValue: value } : p)),
    }));
  };

  const handleSave = async () => {
    if (!labTest?.id) return;
    setSaving(true);
    try {
      await labApi.updateLabTest(labTest.id, {
        resultDate: formData.resultDate ? new Date(formData.resultDate).toISOString() : new Date().toISOString(),
        resultStatus: formData.resultStatus,
        parameters: formData.parameters,
        resultNotes: formData.resultNotes,
        generatedBy: 'Current User',
      });
      onSaved?.();
      onOpenChange?.(false);
    } catch (e) {
      alert(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!labTest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Result Information</DialogTitle>
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
                <Input value={labTest.labRoom || ''} readOnly className="bg-background" placeholder="—" />
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

          {/* Test Results - editable result date/time and status */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Test Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Result Generated Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.resultDate}
                  onChange={(e) => setFormData((f) => ({ ...f, resultDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Test Result Status</Label>
                <Select value={formData.resultStatus} onValueChange={(v) => setFormData((f) => ({ ...f, resultStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parameters table - only Results editable */}
          <div>
            <Label className="text-sm font-medium">Result parameters</Label>
            <div className="rounded-md border overflow-x-auto mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="min-w-[120px]">Results *</TableHead>
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
                  {formData.parameters.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Input
                          value={p.resultValue}
                          onChange={(e) => handleParamResult(i, e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.flag}</TableCell>
                      <TableCell className="text-muted-foreground">{p.units}</TableCell>
                      <TableCell className="text-muted-foreground">{p.referenceRange}</TableCell>
                      <TableCell className="text-muted-foreground">{p.criticalRange}</TableCell>
                      <TableCell className="text-muted-foreground">{p.reportableRange}</TableCell>
                      <TableCell className="text-muted-foreground">{p.analyticalRange}</TableCell>
                      <TableCell className="text-muted-foreground">{p.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <Label>Upload attachment</Label>
            <Input type="file" className="cursor-pointer" />
          </div>

          <div>
            <Label>Result notes</Label>
            <Textarea
              value={formData.resultNotes}
              onChange={(e) => setFormData((f) => ({ ...f, resultNotes: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
