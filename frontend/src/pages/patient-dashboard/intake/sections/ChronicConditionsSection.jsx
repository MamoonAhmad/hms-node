import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { diagnosisCodeApi } from '@/services/api/diagnosisCode.api';
import { chronicDiseaseApi } from '@/services/api/chronicDisease.api';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { IntakeRecordActions } from '../components/IntakeRecordActions';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS } from '../intakeConstants';

const CONTROL = 'h-9 w-full';
const STATUS_OPTIONS = ['Active', 'Inactive', 'Resolved', 'In Remission'];
const CONTROL_OPTIONS = ['Controlled', 'Uncontrolled', 'Improving', 'Worsening', 'Unknown'];

function emptyHeader() {
  return {
    conditionCode: '',
    conditionName: '',
    icdCode: '',
    status: 'Active',
    severity: '',
    diagnosisDate: '',
    controlStatus: '',
    notes: '',
  };
}

function FieldControl({ field, value, onChange, autoValues }) {
  const id = `ccm-${field.fieldKey}`;
  const type = field.fieldType;

  if (type?.startsWith('auto_vitals_')) {
    const autoKey = type.replace('auto_vitals_', '');
    const autoVal = autoValues?.[autoKey] || '';
    return (
      <Input
        id={id}
        className={`${CONTROL} bg-muted`}
        value={value || autoVal}
        readOnly
        title="Auto-filled from latest vitals when available"
        placeholder="From vitals"
      />
    );
  }

  if (type === 'textarea') {
    return (
      <Textarea
        id={id}
        className="min-h-[5rem] w-full resize-y"
        rows={3}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
        <Checkbox
          id={id}
          checked={value === 'true' || value === true}
          onCheckedChange={(c) => onChange(c ? 'true' : 'false')}
        />
        <Label htmlFor={id} className="font-normal">Yes</Label>
      </div>
    );
  }

  if (type === 'yes_no' || type === 'select') {
    const options = field.options || (type === 'yes_no' ? ['Yes', 'No'] : []);
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger id={id} className={CONTROL}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === 'date') {
    return (
      <Input
        id={id}
        type="date"
        className={CONTROL}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === 'number') {
    return (
      <Input
        id={id}
        type="number"
        className={CONTROL}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Input
      id={id}
      className={CONTROL}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ChronicConditionsSection() {
  const {
    patientId,
    appointmentId,
    isLive,
    isCertified,
    getRecordsBySection,
  } = useIntake();

  const [templates, setTemplates] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [header, setHeader] = useState(emptyHeader);
  const [fields, setFields] = useState({});
  const [icdResults, setIcdResults] = useState([]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.diseaseCode === header.conditionCode) || null,
    [templates, header.conditionCode],
  );

  const autoValues = useMemo(() => {
    const vitals = getRecordsBySection(INTAKE_SECTIONS.VITALS)?.[0]?.payload || {};
    const bp = vitals.bpSys && vitals.bpDia ? `${vitals.bpSys}/${vitals.bpDia}` : '';
    return {
      bp,
      weight: vitals.weight || '',
      height: [vitals.heightFeet, vitals.heightInches].filter(Boolean).join("'") || '',
      bmi: vitals.bmi || '',
    };
  }, [getRecordsBySection]);

  const load = useCallback(async () => {
    if (!patientId || patientId === 'sample' || !isLive) {
      setTemplates([]);
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const [tplRes, recRes] = await Promise.all([
        chronicDiseaseApi.getTemplates(patientId),
        chronicDiseaseApi.list(patientId, { encounterId: appointmentId || undefined }),
      ]);
      setTemplates(tplRes.data || []);
      setRecords(recRes.data || []);
    } catch {
      setTemplates([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId, isLive]);

  useEffect(() => {
    load();
  }, [load]);

  const searchIcd = async (term) => {
    if (!term || term.length < 2) {
      setIcdResults([]);
      return;
    }
    try {
      const res = await diagnosisCodeApi.getAll({ search: term, limit: 12 });
      setIcdResults(res.data || res.items || []);
    } catch {
      setIcdResults([]);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setHeader(emptyHeader());
    setFields({});
    setIcdResults([]);
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setHeader({
      conditionCode: record.conditionCode || '',
      conditionName: record.conditionName || '',
      icdCode: record.icdCode || '',
      status: record.status || 'Active',
      severity: record.severity || '',
      diagnosisDate: record.diagnosisDate
        ? new Date(record.diagnosisDate).toISOString().slice(0, 10)
        : '',
      controlStatus: record.controlStatus || '',
      notes: record.notes || '',
    });
    setFields({ ...(record.fields || {}) });
    setIcdResults([]);
    setOpen(true);
  };

  const selectTemplate = (code) => {
    const tpl = templates.find((t) => t.diseaseCode === code);
    setHeader((p) => ({
      ...p,
      conditionCode: code,
      conditionName: tpl?.name || p.conditionName,
      icdCode: p.icdCode || tpl?.defaultIcd || '',
    }));
    // Keep existing field values when switching carefully; reset for create
    if (!editingId) setFields({});
  };

  const setField = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayloadFields = () => {
    const next = { ...fields };
    // Persist auto vitals snapshots when empty
    if (selectedTemplate) {
      for (const g of selectedTemplate.groups || []) {
        for (const f of g.fields || []) {
          if (!f.fieldType?.startsWith('auto_vitals_')) continue;
          if (next[f.fieldKey]) continue;
          const autoKey = f.fieldType.replace('auto_vitals_', '');
          if (autoValues[autoKey]) next[f.fieldKey] = autoValues[autoKey];
        }
      }
    }
    return next;
  };

  const handleSave = async () => {
    if (!header.conditionCode || !header.conditionName) return;
    if (!isLive || !patientId) return;
    setSaving(true);
    try {
      const body = {
        encounterId: appointmentId || null,
        conditionCode: header.conditionCode,
        conditionName: header.conditionName,
        icdCode: header.icdCode || null,
        status: header.status || 'Active',
        severity: header.severity || null,
        diagnosisDate: header.diagnosisDate || null,
        controlStatus: header.controlStatus || null,
        notes: header.notes || null,
        fields: buildPayloadFields(),
      };
      if (editingId) {
        await chronicDiseaseApi.update(patientId, editingId, body);
      } else {
        await chronicDiseaseApi.create(patientId, body);
      }
      setOpen(false);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isLive || !patientId) return;
    await chronicDiseaseApi.remove(patientId, id);
    await load();
  };

  return (
    <IntakeSectionCard
      id="assessment-chronic-conditions"
      title="Chronic Conditions Management"
      onAdd={openCreate}
    >
      <IntakeInlineFormPanel
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditingId(null);
        }}
        title={editingId ? 'Edit Chronic Condition' : 'Add Chronic Condition'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !header.conditionCode || !header.conditionName}
            >
              {editingId ? 'Save Changes' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 space-y-2">
              <Label>Condition *</Label>
              <Select value={header.conditionCode} onValueChange={selectTemplate}>
                <SelectTrigger className={CONTROL}>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.diseaseCode} value={t.diseaseCode}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Condition Name *</Label>
              <Input
                className={CONTROL}
                value={header.conditionName}
                onChange={(e) => setHeader((p) => ({ ...p, conditionName: e.target.value }))}
                placeholder="Condition name"
              />
            </div>
            <div className="relative min-w-0 space-y-2">
              <Label>ICD-10</Label>
              <Input
                className={CONTROL}
                value={header.icdCode}
                onChange={(e) => {
                  setHeader((p) => ({ ...p, icdCode: e.target.value }));
                  searchIcd(e.target.value);
                }}
                placeholder="Search ICD-10..."
              />
              {icdResults.length > 0 && (
                <div className="absolute z-10 max-h-40 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                  {icdResults.map((row) => (
                    <button
                      key={row.id || row.code}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setHeader((p) => ({
                          ...p,
                          icdCode: row.code || row.icdCode,
                          conditionName: p.conditionName || row.description,
                        }));
                        setIcdResults([]);
                      }}
                    >
                      {row.code || row.icdCode} — {row.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Status</Label>
              <Select
                value={header.status}
                onValueChange={(v) => setHeader((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger className={CONTROL}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0 space-y-2">
              <Label>Diagnosis Date</Label>
              <Input
                type="date"
                className={CONTROL}
                value={header.diagnosisDate}
                onChange={(e) => setHeader((p) => ({ ...p, diagnosisDate: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Severity</Label>
              <Input
                className={CONTROL}
                value={header.severity}
                onChange={(e) => setHeader((p) => ({ ...p, severity: e.target.value }))}
                placeholder="Severity"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Control Status</Label>
              <Select
                value={header.controlStatus}
                onValueChange={(v) => setHeader((p) => ({ ...p, controlStatus: v }))}
              >
                <SelectTrigger className={CONTROL}><SelectValue placeholder="Control status" /></SelectTrigger>
                <SelectContent>
                  {CONTROL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTemplate?.groups?.map((group) => (
            <div key={group.groupKey} className="space-y-3 rounded-lg border border-border/70 p-4">
              <p className="text-sm font-semibold text-foreground">{group.groupName}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(group.fields || []).map((field) => (
                  <div
                    key={field.fieldKey}
                    className={`min-w-0 space-y-2 ${field.fieldType === 'textarea' ? 'sm:col-span-2 xl:col-span-4' : ''}`}
                  >
                    <Label>
                      {field.fieldName}
                      {field.required ? ' *' : ''}
                    </Label>
                    <FieldControl
                      field={field}
                      value={fields[field.fieldKey]}
                      onChange={(v) => setField(field.fieldKey, v)}
                      autoValues={autoValues}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              className="min-h-[5.5rem] w-full resize-y"
              rows={3}
              value={header.notes}
              onChange={(e) => setHeader((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Clinical notes..."
            />
          </div>
        </div>
      </IntakeInlineFormPanel>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading chronic conditions…</p>
      ) : records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead>ICD-10</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Control</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.conditionName}
                  {r.severity && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">{r.severity}</Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.icdCode || '—'}</TableCell>
                <TableCell>{r.status || '—'}</TableCell>
                <TableCell>{r.controlStatus || '—'}</TableCell>
                <TableCell>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</TableCell>
                <TableCell className="text-right">
                  <IntakeRecordActions
                    isCertified={isCertified}
                    onEdit={() => openEdit(r)}
                    onAmend={() => openEdit(r)}
                    onDelete={() => handleDelete(r.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No chronic conditions recorded for this encounter. Use + to add.
        </p>
      )}
    </IntakeSectionCard>
  );
}
