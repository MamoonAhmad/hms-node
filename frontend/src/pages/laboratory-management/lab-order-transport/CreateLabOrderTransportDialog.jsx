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
import { labApi, patientApi } from '@/services/api';
import { MultiSelect } from '@/components/ui/multi-select';

export function CreateLabOrderTransportDialog({ open, onOpenChange, onSaved }) {
  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    testIds: [],
    orderingProvider: '',
    clinicalNotes: '',
    destination: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        patientId: '',
        testIds: [],
        orderingProvider: '',
        clinicalNotes: '',
        destination: '',
      });
      patientApi.getAll({ limit: 200 }).then((res) => setPatients(res.data || []));
      Promise.all([
        labApi.getTestCatalogList(),
        labApi.getAvailableLabTests(),
      ]).then(([catalogRes, availableRes]) => {
        const catalog = (catalogRes?.data || []).map((t) => ({ value: String(t.id), label: t.testName }));
        const available = (availableRes?.data || []).map((t) => ({ value: t.id, label: t.name }));
        const combined = [...catalog];
        available.forEach((a) => {
          if (!combined.some((c) => c.value === a.value)) combined.push({ value: a.value, label: a.label });
        });
        setTests(combined.length ? combined : [{ value: 'cbc', label: 'CBC' }, { value: 'lipid', label: 'Lipid Profile' }, { value: 'bmp', label: 'BMP' }]);
      });
    }
  }, [open]);

  const selectedPatient = patients.find((p) => p.id === Number(formData.patientId));

  const handleSave = async () => {
    if (!formData.patientId) {
      alert('Please select a patient.');
      return;
    }
    if (!formData.testIds?.length) {
      alert('Please select at least one lab test.');
      return;
    }
    setSaving(true);
    try {
      const testNames = formData.testIds.map(
        (id) => tests.find((t) => t.value === id)?.label || id
      );
      await labApi.createLabOrderTransport({
        patientId: selectedPatient.id,
        patient: {
          name: selectedPatient.name || `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() || 'Unknown',
          mrn: selectedPatient.mrn || selectedPatient.id,
          dob: selectedPatient.dob,
          gender: selectedPatient.gender,
        },
        testIds: formData.testIds,
        testNames,
        orderingProvider: formData.orderingProvider,
        clinicalNotes: formData.clinicalNotes,
        destination: formData.destination,
      });
      onSaved?.();
      onOpenChange?.(false);
    } catch (e) {
      alert(e?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Lab Order (Transport)</DialogTitle>
        </DialogHeader>
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
            <Label>Lab tests *</Label>
            <MultiSelect
              options={tests}
              value={formData.testIds}
              onChange={(v) => setFormData((f) => ({ ...f, testIds: v }))}
              placeholder="Select tests"
            />
          </div>
          <div>
            <Label>Ordering provider</Label>
            <Input
              value={formData.orderingProvider}
              onChange={(e) => setFormData((f) => ({ ...f, orderingProvider: e.target.value }))}
              placeholder="e.g. Dr. Smith"
            />
          </div>
          <div>
            <Label>Clinical notes</Label>
            <Textarea
              value={formData.clinicalNotes}
              onChange={(e) => setFormData((f) => ({ ...f, clinicalNotes: e.target.value }))}
              placeholder="Optional"
              rows={2}
            />
          </div>
          <div>
            <Label>Destination (e.g. external lab name)</Label>
            <Input
              value={formData.destination}
              onChange={(e) => setFormData((f) => ({ ...f, destination: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
