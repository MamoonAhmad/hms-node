import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Unlock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { claimApi } from '@/services/api/claim.api';
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { encounterProblemApi } from '@/services/api/encounterProblem.api';
import { patientProblemApi } from '@/services/api/patientProblem.api';
import { usePatientChart } from '../PatientChartContext';
import {
  PLACE_OF_SERVICE,
  emptyDiagnosis,
  emptyServiceLine,
  formToPayload,
  mapCaptureToForm,
} from './chargeCaptureConstants';

function formatApiError(err, fallback) {
  if (Array.isArray(err?.errors) && err.errors.length) {
    return err.errors.join(' ');
  }
  return err?.message || fallback;
}

function problemToDiagnosisOption(problem) {
  const nested = problem.problem || problem;
  const code = nested.icd10Code || problem.icd10Code || problem.problemCode || '';
  const description =
    nested.diagnosisDescription ||
    problem.diagnosisDescription ||
    problem.description ||
    problem.problemName ||
    '';
  if (!code && !description) return null;
  return {
    id: nested.diagnosisId || problem.diagnosisId || nested.id || problem.problemId || problem.id,
    code,
    description,
    source: 'problem',
    status: nested.status || problem.status,
    problemId: problem.problemId || nested.id || problem.id,
    isPrimary: !!problem.isPrimary,
    addressedThisVisit: !!problem.addressedThisVisit,
  };
}

function Icd10SearchField({
  value,
  description,
  disabled,
  problems = [],
  onSelect,
  onCodeChange,
}) {
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [masterResults, setMasterResults] = useState([]);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const problemOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems
      .map(problemToDiagnosisOption)
      .filter(Boolean)
      .filter((item) => {
        if (!q) return true;
        return (
          String(item.code).toLowerCase().includes(q) ||
          String(item.description).toLowerCase().includes(q)
        );
      });
  }, [problems, query]);

  const runMasterSearch = useCallback(async (term) => {
    const q = term.trim();
    if (q.length < 2) {
      setMasterResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await diagnosisCodeApi.getAll({ search: q, limit: 25, page: 1 });
      setMasterResults((res.data || []).filter((item) => item.isActive !== false));
    } catch {
      setMasterResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (next) => {
    setQuery(next);
    onCodeChange?.(next);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runMasterSearch(next), 300);
  };

  const handleSelect = (item) => {
    setQuery(item.code || '');
    onSelect?.(item);
    setOpen(false);
    setMasterResults([]);
  };

  const showProblemSection = problemOptions.length > 0;
  const showMasterSection = masterResults.length > 0;
  const showEmpty =
    open &&
    !loading &&
    query.trim().length >= 2 &&
    !showProblemSection &&
    !showMasterSection;

  return (
    <div className="relative space-y-1" ref={containerRef}>
      <Label className="text-xs">ICD-10</Label>
      <div className="relative">
        <Input
          disabled={disabled}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            if (query.trim().length >= 2) runMasterSearch(query);
          }}
          placeholder="Search problems or ICD-10 codes…"
          className="font-mono"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && !disabled && (showProblemSection || showMasterSection || showEmpty) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {showProblemSection && (
            <div className="border-b py-1">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Patient problems
              </p>
              {problemOptions.map((item) => (
                <button
                  key={`problem-${item.id}-${item.code}`}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => handleSelect(item)}
                >
                  <span className="font-mono text-xs text-muted-foreground">{item.code || '—'}</span>
                  <span>{item.description || '—'}</span>
                </button>
              ))}
            </div>
          )}
          {showMasterSection && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Diagnosis codes
              </p>
              {masterResults.map((item) => (
                <button
                  key={`master-${item.id}`}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() =>
                    handleSelect({
                      id: item.id,
                      code: item.code,
                      description: item.description,
                      source: 'master',
                    })
                  }
                >
                  <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          )}
          {showEmpty && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matching ICD-10 codes.</p>
          )}
        </div>
      )}
      {description ? (
        <p className="truncate text-[11px] text-muted-foreground" title={description}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ChargeCaptureWorkspace() {
  const { patientId, appointmentId } = usePatientChart();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [capture, setCapture] = useState(null);
  const [form, setForm] = useState(null);
  const [generatedClaim, setGeneratedClaim] = useState(null);
  const [patientProblems, setPatientProblems] = useState([]);

  const isLocked = !!capture?.isLocked;

  const applyProblemsToForm = useCallback((mappedForm, problems) => {
    if (!mappedForm) return mappedForm;
    const hasCodedDx = (mappedForm.diagnoses || []).some((d) => String(d.icd10Code || '').trim());
    if (hasCodedDx) return mappedForm;

    const addressed = (problems || []).filter((p) => p.addressedThisVisit);
    const source = addressed.length
      ? addressed
      : (problems || []).filter(
          (p) => String(p.problem?.status || p.status || '').toLowerCase() !== 'resolved',
        );

    const sorted = [...source].sort((a, b) => {
      if (!!a.isPrimary !== !!b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.priority ?? 999) - (b.priority ?? 999);
    });

    const fromProblems = sorted
      .map(problemToDiagnosisOption)
      .filter((item) => item?.code)
      .slice(0, 12)
      .map((item, idx) => ({
        sequence: idx + 1,
        icd10Code: item.code,
        description: item.description || '',
        diagnosisCodeId: item.id || null,
        problemId: item.problemId || null,
        isPrimary: item.isPrimary || idx === 0,
      }));

    if (fromProblems.length) {
      const primaryIdx = fromProblems.findIndex((d) => d.isPrimary);
      fromProblems.forEach((d, idx) => {
        d.isPrimary = primaryIdx >= 0 ? idx === primaryIdx : idx === 0;
      });
    }

    if (!fromProblems.length) return mappedForm;
    return { ...mappedForm, diagnoses: fromProblems };
  }, []);

  const load = useCallback(async () => {
    if (!patientId || !appointmentId) {
      setLoading(false);
      setError('Select an encounter to code and generate a claim.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [captureRes, encounterRes, problemsRes] = await Promise.all([
        claimApi.getChargeCapture(patientId, appointmentId),
        encounterProblemApi.list(patientId, appointmentId).catch(() => ({ data: { items: [] } })),
        patientProblemApi.getAll(patientId).catch(() => ({ data: [] })),
      ]);
      const data = captureRes?.data?.chargeCapture || captureRes?.data;
      const encounterItems = Array.isArray(encounterRes?.data?.items)
        ? encounterRes.data.items
        : [];
      const fallbackProblems = Array.isArray(problemsRes?.data) ? problemsRes.data : [];
      const problems = encounterItems.length ? encounterItems : fallbackProblems;
      setPatientProblems(problems);
      setCapture(data);
      setForm(applyProblemsToForm(mapCaptureToForm(data), problems));
      setGeneratedClaim(data?.claims?.[0] || null);
    } catch (err) {
      setError(err?.message || 'Failed to load charge capture');
      setCapture(null);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId, applyProblemsToForm]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCharge = useMemo(() => {
    if (!form?.serviceLines) return 0;
    return form.serviceLines.reduce(
      (sum, line) => sum + (Number(line.chargeAmount) || 0) * (Number(line.units) || 0),
      0,
    );
  }, [form]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateDiagnosis = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      diagnoses: prev.diagnoses.map((d, i) => {
        if (i !== index) {
          if (field === 'isPrimary' && value) return { ...d, isPrimary: false };
          return d;
        }
        return { ...d, [field]: value };
      }),
    }));
  };

  const selectDiagnosis = (index, item) => {
    setForm((prev) => ({
      ...prev,
      diagnoses: prev.diagnoses.map((d, i) =>
        i === index
          ? {
              ...d,
              icd10Code: item.code || '',
              description: item.description || '',
              diagnosisCodeId: item.id || null,
            }
          : d,
      ),
    }));
  };

  const updateLine = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      serviceLines: prev.serviceLines.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  };

  const handleSave = async () => {
    if (!form || !appointmentId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await claimApi.saveChargeCapture(patientId, formToPayload(form, appointmentId));
      const data = res?.data;
      setCapture(data);
      setForm(mapCaptureToForm(data));
      setSuccess('Charge capture saved.');
    } catch (err) {
      setError(formatApiError(err, 'Failed to save charge capture'));
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    if (!form || !appointmentId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await claimApi.saveChargeCapture(patientId, formToPayload(form, appointmentId));
      const res = await claimApi.lockChargeCapture(patientId, appointmentId);
      setCapture(res?.data);
      setForm(mapCaptureToForm(res?.data));
      setSuccess('Charges locked. Ready to generate claim.');
    } catch (err) {
      setError(formatApiError(err, 'Failed to lock charges'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await claimApi.unlockChargeCapture(patientId, appointmentId);
      setCapture(res?.data);
      setForm(mapCaptureToForm(res?.data));
      setSuccess('Charges unlocked for editing.');
    } catch (err) {
      setError(formatApiError(err, 'Failed to unlock charges'));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateClaim = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (!isLocked) {
        await claimApi.saveChargeCapture(patientId, formToPayload(form, appointmentId));
      }
      const res = await claimApi.generateClaim(patientId, appointmentId);
      setGeneratedClaim(res?.data);
      setSuccess(`Claim ${res?.data?.claimNumber} created (Draft).`);
      await load();
    } catch (err) {
      setError(formatApiError(err, 'Failed to generate claim'));
    } finally {
      setSaving(false);
    }
  };

  if (!appointmentId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Select an encounter in the chart header to capture charges and generate a claim.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading charge capture…
      </div>
    );
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-sm text-destructive">{error || 'Unable to load charge capture.'}</p>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Encounter coding & charge capture</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Finalize ICD-10 order, CPT/HCPCS lines, POS, and providers before generating the claim.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isLocked ? 'default' : 'secondary'}>
            {isLocked ? 'Charges locked' : 'Draft coding'}
          </Badge>
          {generatedClaim?.claimNumber && (
            <Badge variant="outline">{generatedClaim.claimNumber} · {generatedClaim.status}</Badge>
          )}
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            error
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-green-300 bg-green-50 text-green-900'
          }`}
        >
          <div className="flex items-start gap-2">
            {error ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{error || success}</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Claim header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Date of service</Label>
            <Input
              type="date"
              disabled={isLocked || saving}
              value={form.dateOfService}
              onChange={(e) => updateForm('dateOfService', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Place of service</Label>
            <Select
              disabled={isLocked || saving}
              value={form.placeOfService}
              onValueChange={(v) => updateForm('placeOfService', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACE_OF_SERVICE.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Auth #</Label>
            <Input
              disabled={isLocked || saving}
              value={form.authorizationNumber}
              onChange={(e) => updateForm('authorizationNumber', e.target.value)}
              placeholder="Payer authorization"
            />
          </div>
          <div className="space-y-2">
            <Label>Referral #</Label>
            <Input
              disabled={isLocked || saving}
              value={form.referralNumber}
              onChange={(e) => updateForm('referralNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              disabled={isLocked || saving}
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rendering provider</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input
                disabled={isLocked || saving}
                value={form.renderingProviderName}
                onChange={(e) => updateForm('renderingProviderName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>NPI</Label>
              <Input
                disabled={isLocked || saving}
                value={form.renderingProviderNpi}
                onChange={(e) => updateForm('renderingProviderNpi', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Billing provider</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input
                disabled={isLocked || saving}
                value={form.billingProviderName}
                onChange={(e) => updateForm('billingProviderName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>NPI</Label>
              <Input
                disabled={isLocked || saving}
                value={form.billingProviderNpi}
                onChange={(e) => updateForm('billingProviderNpi', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input
                disabled={isLocked || saving}
                value={form.billingProviderTaxId}
                onChange={(e) => updateForm('billingProviderTaxId', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Encounter diagnoses (Box 21)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Primary first. Ordered ICD-10 for this encounter only.</p>
          </div>
          {!isLocked && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving || form.diagnoses.length >= 12}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  diagnoses: [...prev.diagnoses, emptyDiagnosis(prev.diagnoses.length + 1)],
                }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add ICD
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click ICD-10 to pick from this patient&apos;s problem list, or type to search Diagnosis Codes.
          </p>
          {form.diagnoses.map((dx, index) => (
            <div key={`dx-${index}`} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[auto_1fr_2fr_auto]">
              <div className="flex items-center gap-2">
                <Badge variant={dx.isPrimary || index === 0 ? 'default' : 'secondary'}>
                  {index + 1}
                </Badge>
                {(dx.isPrimary || index === 0) && (
                  <span className="text-xs text-muted-foreground">Primary</span>
                )}
              </div>
              <Icd10SearchField
                value={dx.icd10Code}
                description={dx.description}
                disabled={isLocked || saving}
                problems={patientProblems}
                onSelect={(item) => selectDiagnosis(index, item)}
                onCodeChange={(code) => {
                  setForm((prev) => ({
                    ...prev,
                    diagnoses: prev.diagnoses.map((d, i) =>
                      i === index
                        ? { ...d, icd10Code: code, diagnosisCodeId: null }
                        : d,
                    ),
                  }));
                }}
              />
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  disabled={isLocked || saving}
                  value={dx.description}
                  onChange={(e) => updateDiagnosis(index, 'description', e.target.value)}
                  placeholder="Diagnosis description"
                />
              </div>
              {!isLocked && form.diagnoses.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Remove diagnosis"
                  disabled={saving}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      diagnoses: prev.diagnoses
                        .filter((_, i) => i !== index)
                        .map((d, i) => ({ ...d, sequence: i + 1, isPrimary: i === 0 })),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Service lines (Box 24)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              CPT/HCPCS with modifiers, units, charge, and diagnosis pointers.
            </p>
          </div>
          {!isLocked && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  serviceLines: [
                    ...prev.serviceLines,
                    emptyServiceLine(prev.serviceLines.length + 1, prev.dateOfService),
                  ],
                }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add line
            </Button>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>DOS</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Mods</TableHead>
                <TableHead>Dx ptr</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead>POS</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.serviceLines.map((line, index) => (
                <TableRow key={`line-${index}`}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      className="min-w-[9rem]"
                      disabled={isLocked || saving}
                      value={line.serviceDate}
                      onChange={(e) => updateLine(index, 'serviceDate', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="min-w-[6rem] font-mono"
                      disabled={isLocked || saving}
                      value={line.procedureCode}
                      onChange={(e) => updateLine(index, 'procedureCode', e.target.value)}
                      placeholder="99213"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {['modifier1', 'modifier2', 'modifier3', 'modifier4'].map((m) => (
                        <Input
                          key={m}
                          className="w-12 font-mono"
                          maxLength={2}
                          disabled={isLocked || saving}
                          value={line[m]}
                          onChange={(e) => updateLine(index, m, e.target.value)}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-16 font-mono"
                      disabled={isLocked || saving}
                      value={line.diagnosisPointers}
                      onChange={(e) => updateLine(index, 'diagnosisPointers', e.target.value)}
                      placeholder="1,2"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      className="w-20"
                      disabled={isLocked || saving}
                      value={line.units}
                      onChange={(e) => updateLine(index, 'units', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-24"
                      disabled={isLocked || saving}
                      value={line.chargeAmount}
                      onChange={(e) => updateLine(index, 'chargeAmount', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={isLocked || saving}
                      value={line.placeOfService || form.placeOfService}
                      onValueChange={(v) => updateLine(index, 'placeOfService', v)}
                    >
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLACE_OF_SERVICE.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {!isLocked && form.serviceLines.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove service line"
                        disabled={saving}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            serviceLines: prev.serviceLines.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex justify-end text-sm font-medium">
            Total charge: ${totalCharge.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {!isLocked && (
          <>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save coding
            </Button>
            <Button type="button" variant="outline" onClick={handleLock} disabled={saving}>
              <Lock className="mr-2 h-4 w-4" />
              Lock charges
            </Button>
          </>
        )}
        {isLocked && (
          <Button type="button" variant="outline" onClick={handleUnlock} disabled={saving}>
            <Unlock className="mr-2 h-4 w-4" />
            Unlock
          </Button>
        )}
        <Button type="button" onClick={handleGenerateClaim} disabled={saving}>
          <Send className="mr-2 h-4 w-4" />
          Generate claim
        </Button>
        <Button type="button" variant="ghost" onClick={load} disabled={saving}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        {generatedClaim?.id && (
          <Button type="button" variant="link" asChild>
            <Link to="/rcm/claims">View claims list</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
