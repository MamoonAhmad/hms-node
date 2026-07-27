import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Loader2 } from 'lucide-react';
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import {
  PROBLEM_ACUITY_OPTIONS,
  PROBLEM_CLINICAL_STATUS_OPTIONS,
  PROBLEM_STATUS_OPTIONS,
  PROBLEM_TYPE_OPTIONS,
  PROBLEM_VERIFICATION_OPTIONS,
} from './patientProblemConstants';

const emptyForm = () => ({
  diagnosisId: '',
  searchQuery: '',
  icd10Code: '',
  diagnosisDescription: '',
  status: 'Active',
  clinicalStatus: 'None',
  verificationStatus: 'None',
  problemType: '',
  acuity: '',
  onsetDate: '',
  resolvedDate: '',
  notes: '',
});

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function parseLocalDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatTodayInput() {
  return new Date().toISOString().slice(0, 10);
}

export function ProblemFormDialog({
  open,
  onOpenChange,
  record,
  patientDateOfBirth,
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const isEdit = Boolean(record?.id);
  const hasDiagnosisSelected = Boolean(formData.diagnosisId);

  useEffect(() => {
    if (!open) return;

    if (record) {
      setFormData({
        diagnosisId: record.diagnosisId || '',
        searchQuery: record.diagnosisDescription || '',
        icd10Code: record.icd10Code || '',
        diagnosisDescription: record.diagnosisDescription || '',
        status: record.status || 'Active',
        clinicalStatus: record.clinicalStatus || 'None',
        verificationStatus: record.verificationStatus || 'None',
        problemType: record.problemType || '',
        acuity: record.acuity || '',
        onsetDate: toDateInputValue(record.onsetDate),
        resolvedDate: toDateInputValue(record.resolvedDate),
        notes: record.notes || '',
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
    setSearchResults([]);
    setShowDropdown(false);
  }, [record, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const runSearch = useCallback(async (query) => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await diagnosisCodeApi.getAll({ search: q, limit: 25, page: 1 });
      setSearchResults((res.data || []).filter((item) => item.isActive !== false));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      searchQuery: value,
      diagnosisId: '',
      icd10Code: '',
      diagnosisDescription: '',
    }));
    if (errors.diagnosisId) {
      setErrors((prev) => ({ ...prev, diagnosisId: null }));
    }
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const handleSelectDiagnosis = (item) => {
    setFormData((prev) => ({
      ...prev,
      diagnosisId: item.id,
      searchQuery: `${item.code} — ${item.description}`,
      icd10Code: item.code,
      diagnosisDescription: item.description,
    }));
    setShowDropdown(false);
    setSearchResults([]);
    if (errors.diagnosisId) {
      setErrors((prev) => ({ ...prev, diagnosisId: null }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const today = parseLocalDate(formatTodayInput());
    const dob = patientDateOfBirth ? parseLocalDate(toDateInputValue(patientDateOfBirth)) : null;
    const onset = parseLocalDate(formData.onsetDate);
    const resolved = parseLocalDate(formData.resolvedDate);

    if (!formData.diagnosisId) {
      newErrors.diagnosisId = 'Diagnosis selection is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    if (onset && today && onset > today) {
      newErrors.onsetDate = 'Onset Date cannot be a future date';
    }
    if (dob && onset && onset < dob) {
      newErrors.onsetDate = 'Onset Date cannot be earlier than patient date of birth';
    }
    if (resolved && today && resolved > today) {
      newErrors.resolvedDate = 'Resolved Date cannot be a future date';
    }
    if (onset && resolved && resolved < onset) {
      newErrors.resolvedDate = 'Resolved Date cannot be earlier than Onset Date';
    }
    if (formData.status === 'Resolved' && !formData.resolvedDate) {
      newErrors.resolvedDate = 'Resolved Date is required when status is Resolved';
    }
    if (formData.notes.length > 2000) {
      newErrors.notes = 'Notes cannot exceed 2,000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      diagnosisId: formData.diagnosisId,
      icd10Code: formData.icd10Code,
      diagnosisDescription: formData.diagnosisDescription,
      status: formData.status,
      clinicalStatus: formData.clinicalStatus,
      verificationStatus: formData.verificationStatus,
      problemType: formData.problemType || null,
      acuity: formData.acuity || null,
      onsetDate: formData.onsetDate || null,
      resolvedDate: formData.resolvedDate || null,
      notes: formData.notes.trim() || null,
    });
  };

  const maxOnsetDate = formatTodayInput();
  const minOnsetDate = patientDateOfBirth ? toDateInputValue(patientDateOfBirth) : undefined;
  const maxResolvedDate = formatTodayInput();
  const minResolvedDate = formData.onsetDate || minOnsetDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[640px] max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Problem' : 'Add Problem'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2" ref={searchRef}>
            <Label htmlFor="diagnosisSearch">Search ICD-10-CM Diagnoses or Symptoms *</Label>
            <div className="relative">
              <Input
                id="diagnosisSearch"
                value={formData.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => formData.searchQuery.length >= 2 && setShowDropdown(true)}
                placeholder="Search ICD-10-CM diagnoses or symptoms..."
                disabled={isLoading}
                className={errors.diagnosisId ? 'border-destructive' : ''}
                autoComplete="off"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => handleSelectDiagnosis(item)}
                    >
                      <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                      <span>{item.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.diagnosisId && (
              <p className="text-xs text-destructive">{errors.diagnosisId}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="icd10Code">Code</Label>
              <Input
                id="icd10Code"
                value={formData.icd10Code}
                placeholder="e.g. E11.9"
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosisDescription">Description</Label>
              <Input
                id="diagnosisDescription"
                value={formData.diagnosisDescription}
                placeholder="e.g. Type 2 diabetes mellitus"
                readOnly
                disabled={!hasDiagnosisSelected}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => handleChange('status', v)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Clinical Status</Label>
              <Select
                value={formData.clinicalStatus}
                onValueChange={(v) => handleChange('clinicalStatus', v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select clinical status" />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_CLINICAL_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification</Label>
              <Select
                value={formData.verificationStatus}
                onValueChange={(v) => handleChange('verificationStatus', v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select verification" />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_VERIFICATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Problem type</Label>
              <Select
                value={formData.problemType || '__none__'}
                onValueChange={(v) => handleChange('problemType', v === '__none__' ? '' : v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Acute / Chronic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not specified</SelectItem>
                  {PROBLEM_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Acuity</Label>
              <Select
                value={formData.acuity || '__none__'}
                onValueChange={(v) => handleChange('acuity', v === '__none__' ? '' : v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not specified</SelectItem>
                  {PROBLEM_ACUITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="onsetDate">Onset Date</Label>
              <Input
                id="onsetDate"
                type="date"
                value={formData.onsetDate}
                onChange={(e) => handleChange('onsetDate', e.target.value)}
                min={minOnsetDate}
                max={maxOnsetDate}
                disabled={isLoading}
                className={errors.onsetDate ? 'border-destructive' : ''}
              />
              {errors.onsetDate && (
                <p className="text-xs text-destructive">{errors.onsetDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolvedDate">Resolved Date</Label>
              <Input
                id="resolvedDate"
                type="date"
                value={formData.resolvedDate}
                onChange={(e) => handleChange('resolvedDate', e.target.value)}
                min={minResolvedDate}
                max={maxResolvedDate}
                disabled={isLoading}
                className={errors.resolvedDate ? 'border-destructive' : ''}
              />
              {errors.resolvedDate && (
                <p className="text-xs text-destructive">{errors.resolvedDate}</p>
              )}
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="clinical-details" className="border rounded-md px-3">
              <AccordionTrigger className="py-3 hover:no-underline">
                Add Clinical Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Additional clinical notes..."
                    rows={4}
                    maxLength={2000}
                    disabled={isLoading}
                    className={errors.notes ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.notes.length}/2,000
                  </p>
                  {errors.notes && (
                    <p className="text-xs text-destructive">{errors.notes}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Problem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
