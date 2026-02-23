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
import { MultiSelect } from '@/components/ui/multi-select';
import { outsideLabsStore } from './outsideLabsMock';

export function SendOutsideLabOrderFormDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [patients, setPatients] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [externalLabs, setExternalLabs] = useState([]);
  const [orderingProvider, setOrderingProvider] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const patientRef = useRef(null);

  const [formData, setFormData] = useState({
    patientId: '',
    labTestIds: [],
    clinicalIndication: '',
    externalLabId: '',
    externalLabName: '',
    priority: 'Routine',
    patientInstructions: '',
    orderDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      outsideLabsStore.getLoggedInProvider().then(setOrderingProvider);
      outsideLabsStore.getLabTests().then(setLabTests);
      outsideLabsStore.getExternalLabs(true).then(setExternalLabs);
      setFormData({
        patientId: '',
        labTestIds: [],
        clinicalIndication: '',
        externalLabId: '',
        externalLabName: '',
        priority: 'Routine',
        patientInstructions: '',
        orderDate: new Date().toISOString().split('T')[0],
      });
      setSelectedPatient(null);
      setPatientSearch('');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => outsideLabsStore.getPatients(patientSearch).then(setPatients), 200);
    return () => clearTimeout(t);
  }, [open, patientSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (patientRef.current && !patientRef.current.contains(e.target)) setPatientOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePatientSelect = (p) => {
    setSelectedPatient(p);
    setFormData((prev) => ({ ...prev, patientId: String(p.id) }));
    setPatientSearch(`${p.firstName} ${p.lastName}`);
    setPatientOpen(false);
    if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: null }));
  };

  const labTestOptions = labTests.map((t) => ({ value: t.id, label: t.name }));

  const validate = () => {
    const newErrors = {};
    if (!formData.patientId) newErrors.patientId = 'Patient is required';
    if (!formData.labTestIds?.length) newErrors.labTestIds = 'Select at least one lab test';
    if (!formData.clinicalIndication?.trim()) newErrors.clinicalIndication = 'Clinical indication is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...formData,
      orderDate: formData.orderDate,
      status: 'Sent to External Lab',
      externalLabId: formData.externalLabId || null,
      externalLabName: (formData.externalLabName && formData.externalLabName.trim()) || '',
    };
    if (formData.externalLabId) {
      const lab = externalLabs.find((l) => l.id === Number(formData.externalLabId));
      if (lab) payload.externalLabName = lab.labName;
    }
    onSubmit?.(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Outside Lab Order (Send to Lab)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient *</Label>
            <div className="relative" ref={patientRef}>
              <Input
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setPatientOpen(true);
                  if (!e.target.value) setSelectedPatient(null);
                  setFormData((prev) => ({ ...prev, patientId: '' }));
                }}
                onFocus={() => setPatientOpen(true)}
                placeholder="Search patient..."
                className={errors.patientId ? 'border-destructive' : ''}
              />
              {patientOpen && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover py-1 shadow-md max-h-48 overflow-auto">
                  {patients.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">No patients found</li>
                  ) : (
                    patients.map((p) => (
                      <li
                        key={p.id}
                        role="button"
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => handlePatientSelect(p)}
                      >
                        {p.firstName} {p.lastName} ({p.mrn})
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            {errors.patientId && <p className="text-xs text-destructive">{errors.patientId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Ordering Provider *</Label>
            <Input
              value={orderingProvider ? orderingProvider.name : 'Loading...'}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Lab Tests *</Label>
            <MultiSelect
              options={labTestOptions}
              value={formData.labTestIds}
              onChange={(v) => {
                setFormData((prev) => ({ ...prev, labTestIds: v }));
                if (errors.labTestIds) setErrors((prev) => ({ ...prev, labTestIds: null }));
              }}
              placeholder="Select lab tests"
              className={errors.labTestIds ? 'border-destructive' : ''}
            />
            {errors.labTestIds && <p className="text-xs text-destructive">{errors.labTestIds}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicalIndication">Clinical Indication *</Label>
            <Textarea
              id="clinicalIndication"
              value={formData.clinicalIndication}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, clinicalIndication: e.target.value }));
                if (errors.clinicalIndication) setErrors((prev) => ({ ...prev, clinicalIndication: null }));
              }}
              placeholder="Mandatory justification for the order"
              rows={3}
              className={errors.clinicalIndication ? 'border-destructive' : ''}
            />
            {errors.clinicalIndication && <p className="text-xs text-destructive">{errors.clinicalIndication}</p>}
          </div>

          <div className="space-y-2">
            <Label>External Lab (optional)</Label>
            <Select
              value={formData.externalLabId || 'none'}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, externalLabId: v === 'none' ? '' : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lab or leave blank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None / Other —</SelectItem>
                {externalLabs.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.labName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalLabName">Lab Name (optional)</Label>
            <Input
              id="externalLabName"
              value={formData.externalLabName}
              onChange={(e) => setFormData((prev) => ({ ...prev, externalLabName: e.target.value }))}
              placeholder="Enter lab name if not in list above"
            />
          </div>

          <div className="space-y-2">
            <Label>Priority *</Label>
            <Select
              value={formData.priority}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}
            >
              <SelectTrigger className={errors.priority ? 'border-destructive' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Stat">Stat</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-xs text-destructive">{errors.priority}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderDate">Order Date *</Label>
            <Input
              id="orderDate"
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, orderDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientInstructions">Patient Instructions</Label>
            <Textarea
              id="patientInstructions"
              value={formData.patientInstructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, patientInstructions: e.target.value }))}
              placeholder="e.g. Fasting required, bring prior results"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
