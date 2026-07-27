import { useState, useEffect } from 'react';
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

const RESULT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toISOString().slice(0, 16);
}

function formatDisplayDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

function normalizeResultStatus(status) {
  if (!status) return 'Pending';
  if (status === 'Resulted') return 'Completed';
  if (status === 'Ordered') return 'Pending';
  if (RESULT_STATUS_OPTIONS.some((o) => o.value === status)) return status;
  return 'Pending';
}

function InfoField({ label, value, emptyText = '—' }) {
  const display =
    value != null && String(value).trim() !== '' ? value : emptyText;
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground break-words">{display}</p>
    </div>
  );
}

export function EditResultsForm({ labTest, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    resultDate: formatDateTime(new Date()),
    resultStatus: 'Pending',
    parameters: [],
    resultNotes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (labTest) {
      const params =
        labTest.parameters && labTest.parameters.length
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
          : [
              {
                name: 'Result',
                resultValue: '',
                flag: '',
                units: '',
                referenceRange: '',
                criticalRange: '',
                reportableRange: '',
                analyticalRange: '',
                method: '',
              },
            ];
      setFormData({
        resultDate: labTest.resultDate
          ? formatDateTime(labTest.resultDate)
          : formatDateTime(new Date()),
        resultStatus: normalizeResultStatus(labTest.resultStatus),
        parameters: params,
        resultNotes: labTest.resultNotes || '',
      });
    }
  }, [labTest]);

  const handleParamResult = (index, value) => {
    setFormData((f) => ({
      ...f,
      parameters: f.parameters.map((p, i) =>
        i === index ? { ...p, resultValue: value } : p
      ),
    }));
  };

  const handleSave = async () => {
    if (!labTest?.id) return;
    setSaving(true);
    try {
      const payload = {
        ...labTest,
        resultDate: formData.resultDate
          ? new Date(formData.resultDate).toISOString()
          : new Date().toISOString(),
        resultStatus: formData.resultStatus,
        parameters: formData.parameters,
        resultNotes: formData.resultNotes,
        generatedBy: 'Current User',
      };
      if (labTest.source === 'order') {
        await onSaved?.(payload);
      } else {
        await labApi.updateLabTest(labTest.id, payload);
        onSaved?.(payload);
      }
    } catch (e) {
      alert(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!labTest) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Lab Order</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            <InfoField
              label="Lab Order Name"
              value={labTest.procedureName || labTest.testName}
            />
            <InfoField
              label="Test name"
              value={labTest.testName || labTest.procedureName}
            />
            <InfoField label="Method" value={labTest.method} emptyText="N/A" />
            <InfoField label="Department" value={labTest.department} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoField
              label="Created At"
              value={formatDisplayDateTime(labTest.createdAt)}
            />
            <InfoField label="Created By" value={labTest.createdBy} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Specimen status</h3>
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <InfoField label="Collection Site" value={labTest.collectionSite} />
            <InfoField label="Lab Room" value={labTest.labRoom} />
            <InfoField label="Specimen Type" value={labTest.specimenType} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoField label="Collected By" value={labTest.collectedBy} />
            <InfoField
              label="Collection Date & Time"
              value={formatDisplayDateTime(labTest.collectionDateTime)}
            />
          </div>
          <div>
            <InfoField
              label="Specimen Collection Notes"
              value={labTest.collectionNotes}
              emptyText="N/A"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          Test Result Status
        </h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Select
              value={formData.resultStatus}
              onValueChange={(v) => setFormData((f) => ({ ...f, resultStatus: v }))}
            >
              <SelectTrigger className="w-full min-w-[220px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {RESULT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
