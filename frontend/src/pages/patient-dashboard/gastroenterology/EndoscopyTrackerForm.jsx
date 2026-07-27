import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  DYSPLASIA_OPTIONS,
  FINDING_OPTIONS,
  INDICATION_OPTIONS,
  PATHOLOGY_STATUS_OPTIONS,
  POLYP_LOCATION_OPTIONS,
  PREP_PRESCRIBED_OPTIONS,
  PREP_QUALITY_OPTIONS,
  PROCEDURE_STATUS_OPTIONS,
  PROCEDURE_TYPE_OPTIONS,
  SURVEILLANCE_INTERVAL_OPTIONS,
  YES_NO_OPTIONS,
} from './gastroenterologyConstants';
import {
  computeSurveillanceDueDate,
  createEmptyEndoscopyProcedure,
  toggleListValue,
} from './gastroenterologyUtils';

export function EndoscopyTrackerForm({
  value,
  onChange,
  performingProvider = '',
  onOpenOrders,
  onOpenResults,
}) {
  const procedures = value.procedures || [];
  const activeId = value.activeProcedureId || procedures[0]?.id || null;
  const activeIndex = Math.max(
    0,
    procedures.findIndex((p) => p.id === activeId),
  );
  const active = procedures[activeIndex] || null;

  const setProcedures = (next, nextActiveId = activeId) => {
    onChange({
      ...value,
      procedures: next,
      activeProcedureId: nextActiveId,
    });
  };

  const updateActive = (patch) => {
    if (!active) return;
    const next = procedures.map((p, i) => (i === activeIndex ? { ...p, ...patch } : p));
    setProcedures(next, active.id);
  };

  const addProcedure = () => {
    const proc = createEmptyEndoscopyProcedure({
      performingProvider: performingProvider || value.defaultProvider || '',
    });
    setProcedures([...procedures, proc], proc.id);
  };

  const removeProcedure = (id) => {
    const next = procedures.filter((p) => p.id !== id);
    setProcedures(next, next[0]?.id || null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track endoscopic procedures, bowel preparation, findings, pathology, and surveillance
        intervals. Link orders when procedure reports or pathology results become available.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {procedures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No endoscopy procedures documented yet.</p>
          ) : (
            procedures.map((p, i) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={p.id === active?.id ? 'default' : 'outline'}
                onClick={() => onChange({ ...value, activeProcedureId: p.id })}
              >
                {p.procedureType || `Procedure ${i + 1}`}
                {p.procedureStatus ? (
                  <Badge variant="secondary" className="ml-2 font-normal">
                    {p.procedureStatus}
                  </Badge>
                ) : null}
              </Button>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenOrders && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenOrders}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Orders
            </Button>
          )}
          {onOpenResults && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenResults}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Results
            </Button>
          )}
          <Button type="button" size="sm" onClick={addProcedure}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add procedure
          </Button>
        </div>
      </div>

      {!active ? (
        <SectionCard title="Procedure tracker">
          <p className="text-sm text-muted-foreground">
            Add a colonoscopy, EGD, or other endoscopic procedure to begin tracking.
          </p>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="A. Procedure Information"
            accent="info"
            actions={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Remove procedure"
                onClick={() => removeProcedure(active.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Procedure Type">
                <TextSelect
                  value={active.procedureType}
                  onChange={(v) => updateActive({ procedureType: v })}
                  options={PROCEDURE_TYPE_OPTIONS}
                />
              </Field>
              <Field label="Procedure Status">
                <TextSelect
                  value={active.procedureStatus}
                  onChange={(v) => updateActive({ procedureStatus: v })}
                  options={PROCEDURE_STATUS_OPTIONS}
                />
              </Field>
              <Field label="Indication">
                <TextSelect
                  value={active.indication}
                  onChange={(v) => updateActive({ indication: v })}
                  options={INDICATION_OPTIONS}
                />
              </Field>
              <Field label="Scheduled Date">
                <TextInput
                  type="date"
                  value={active.scheduledDate}
                  onChange={(v) => updateActive({ scheduledDate: v })}
                />
              </Field>
              <Field label="Procedure Date">
                <TextInput
                  type="date"
                  value={active.procedureDate}
                  onChange={(v) => {
                    const patch = { procedureDate: v };
                    if (active.surveillanceInterval && !active.nextEndoscopyDue) {
                      patch.nextEndoscopyDue = computeSurveillanceDueDate(
                        v,
                        active.surveillanceInterval,
                      );
                    }
                    updateActive(patch);
                  }}
                />
              </Field>
              <Field label="Performing Provider">
                <TextInput
                  value={active.performingProvider}
                  onChange={(v) => updateActive({ performingProvider: v })}
                  placeholder="Auto from encounter provider"
                />
              </Field>
              <Field label="Facility" className="sm:col-span-2 lg:col-span-3">
                <TextInput
                  value={active.facility}
                  onChange={(v) => updateActive({ facility: v })}
                  placeholder="Facility / endoscopy suite…"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="B. Bowel Preparation">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Preparation Prescribed">
                <TextSelect
                  value={active.preparationPrescribed}
                  onChange={(v) => updateActive({ preparationPrescribed: v })}
                  options={PREP_PRESCRIBED_OPTIONS}
                />
              </Field>
              <Field label="Preparation Completed">
                <TextSelect
                  value={active.preparationCompleted}
                  onChange={(v) => updateActive({ preparationCompleted: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
              <Field label="Preparation Quality">
                <TextSelect
                  value={active.preparationQuality}
                  onChange={(v) => updateActive({ preparationQuality: v })}
                  options={PREP_QUALITY_OPTIONS}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="C. Procedure Findings">
            <MultiSelectChips
              values={active.findings || []}
              options={FINDING_OPTIONS}
              onToggle={(opt) => updateActive({ findings: toggleListValue(active.findings, opt) })}
              idPrefix={`gi-find-${active.id}`}
            />
          </SectionCard>

          <SectionCard title="D. Polyp Information">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Number of Polyps">
                <TextInput
                  type="number"
                  min={0}
                  value={active.numberOfPolyps}
                  onChange={(v) => updateActive({ numberOfPolyps: v })}
                />
              </Field>
              <Field label="Largest Size (mm)">
                <TextInput
                  type="number"
                  min={0}
                  value={active.largestSizeMm}
                  onChange={(v) => updateActive({ largestSizeMm: v })}
                />
              </Field>
              <Field label="Location">
                <TextSelect
                  value={active.polypLocation}
                  onChange={(v) => updateActive({ polypLocation: v })}
                  options={POLYP_LOCATION_OPTIONS}
                />
              </Field>
              <Field label="Removed">
                <TextSelect
                  value={active.polypRemoved}
                  onChange={(v) => updateActive({ polypRemoved: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
              <Field label="Retrieval Successful">
                <TextSelect
                  value={active.retrievalSuccessful}
                  onChange={(v) => updateActive({ retrievalSuccessful: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="E. Biopsy & Pathology" accent="warning">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Biopsy Taken">
                <TextSelect
                  value={active.biopsyTaken}
                  onChange={(v) => updateActive({ biopsyTaken: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
              <Field label="Number of Specimens">
                <TextInput
                  type="number"
                  min={0}
                  value={active.numberOfSpecimens}
                  onChange={(v) => updateActive({ numberOfSpecimens: v })}
                />
              </Field>
              <Field label="Pathology Status">
                <TextSelect
                  value={active.pathologyStatus}
                  onChange={(v) => updateActive({ pathologyStatus: v })}
                  options={PATHOLOGY_STATUS_OPTIONS}
                />
              </Field>
              <Field label="Dysplasia">
                <TextSelect
                  value={active.dysplasia}
                  onChange={(v) => updateActive({ dysplasia: v })}
                  options={DYSPLASIA_OPTIONS}
                />
              </Field>
              <Field label="Malignancy">
                <TextSelect
                  value={active.malignancy}
                  onChange={(v) => updateActive({ malignancy: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
              <Field label="Pathology Result" className="sm:col-span-2 lg:col-span-3">
                <TextTextarea
                  value={active.pathologyResult}
                  onChange={(v) => updateActive({ pathologyResult: v })}
                  rows={3}
                  placeholder="Pathology narrative / histology…"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="F. Follow-up" accent="primary">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Surveillance Interval">
                <TextSelect
                  value={active.surveillanceInterval}
                  onChange={(v) => {
                    const due =
                      active.nextEndoscopyDue ||
                      computeSurveillanceDueDate(active.procedureDate, v);
                    updateActive({
                      surveillanceInterval: v,
                      nextEndoscopyDue: due,
                    });
                  }}
                  options={SURVEILLANCE_INTERVAL_OPTIONS}
                />
              </Field>
              <Field label="Next Endoscopy Due">
                <TextInput
                  type="date"
                  value={active.nextEndoscopyDue}
                  onChange={(v) => updateActive({ nextEndoscopyDue: v })}
                />
              </Field>
              <Field label="Repeat Procedure Required">
                <TextSelect
                  value={active.repeatProcedureRequired}
                  onChange={(v) => updateActive({ repeatProcedureRequired: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
              <Field label="Patient Notified">
                <TextSelect
                  value={active.patientNotified}
                  onChange={(v) => updateActive({ patientNotified: v })}
                  options={YES_NO_OPTIONS}
                />
              </Field>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
