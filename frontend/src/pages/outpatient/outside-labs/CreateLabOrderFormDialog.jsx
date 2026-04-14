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

export function CreateLabOrderFormDialog({ open, onOpenChange, onSubmit, onSaveAndPrint, isLoading }) {
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
    priority: 'Routine',
    patientInstructions: '',
    startDate: new Date().toISOString().split('T')[0],
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
        priority: 'Routine',
        patientInstructions: '',
        startDate: new Date().toISOString().split('T')[0],
      });
      setSelectedPatient(null);
      setPatientSearch('');
      setPatientOpen(false);
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
    if (!formData.externalLabId) newErrors.externalLabId = 'External lab is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e, action = 'save') => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...formData,
      orderDate: formData.startDate,
      status: 'Ordered',
    };
    if (action === 'print') {
      onSaveAndPrint?.(payload);
    } else {
      onSubmit?.(payload);
    }
  };

  const orderDate = formData.startDate || new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lab Order (External)</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-4">
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
            <Input value={orderingProvider?.name ?? 'Loading...'} readOnly disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Lab Test(s) *</Label>
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
              rows={3}
              className={errors.clinicalIndication ? 'border-destructive' : ''}
            />
            {errors.clinicalIndication && <p className="text-xs text-destructive">{errors.clinicalIndication}</p>}
          </div>

          <div className="space-y-2">
            <Label>External Lab *</Label>
            <Select
              value={formData.externalLabId}
              onValueChange={(v) => {
                setFormData((prev) => ({ ...prev, externalLabId: v }));
                if (errors.externalLabId) setErrors((prev) => ({ ...prev, externalLabId: null }));
              }}
            >
              <SelectTrigger className={errors.externalLabId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select external lab" />
              </SelectTrigger>
              <SelectContent>
                {externalLabs.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.labName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.externalLabId && <p className="text-xs text-destructive">{errors.externalLabId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Priority *</Label>
            <Select value={formData.priority} onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientInstructions">Patient Instructions</Label>
            <Textarea
              id="patientInstructions"
              value={formData.patientInstructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, patientInstructions: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Order Date</Label>
              <p className="font-medium">{orderDate}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Status</Label>
              <p className="font-medium">Ordered</p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" variant="secondary" disabled={isLoading} onClick={(e) => handleSubmit(e, 'print')}>
              Save & Print Lab Slip
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
