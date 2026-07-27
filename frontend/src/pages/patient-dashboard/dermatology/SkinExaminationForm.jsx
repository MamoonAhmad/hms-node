import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  CheckboxField,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import { BodyMapSelector } from './BodyMapSelector';
import { IcdSearchField } from './IcdSearchField';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  ABCDE_FIELDS,
  ASSOCIATED_FINDING_OPTIONS,
  BODY_EXAMINATION_OPTIONS,
  BORDER_OPTIONS,
  COLOUR_OPTIONS,
  DISTRIBUTION_OPTIONS,
  EXAMINATION_TYPE_OPTIONS,
  PHOTO_CHECK_FIELDS,
  PRIMARY_LESION_OPTIONS,
  SECONDARY_LESION_OPTIONS,
  SHAPE_OPTIONS,
  SURFACE_OPTIONS,
  SYMPTOM_OPTIONS,
  VISIT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from './dermatologyConstants';
import {
  createEmptyLesion,
  formatLesionLabel,
  readFileAsDataUrl,
  toggleListValue,
} from './dermatologyUtils';

export function SkinExaminationForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  const lesions = value.lesions || [];
  const activeId = value.activeLesionId || lesions[0]?.id;
  const activeIndex = Math.max(
    0,
    lesions.findIndex((l) => l.id === activeId),
  );
  const active = lesions[activeIndex] || lesions[0];

  const updateLesion = (patch) => {
    const nextLesions = lesions.map((l, i) =>
      i === activeIndex ? { ...l, ...patch } : l,
    );
    onChange({ ...value, lesions: nextLesions });
  };

  const updateLesionNested = (key, nestedPatch) => {
    updateLesion({ [key]: { ...(active?.[key] || {}), ...nestedPatch } });
  };

  const addLesion = () => {
    const lesion = createEmptyLesion();
    lesion.label = `Lesion ${lesions.length + 1}`;
    onChange({
      ...value,
      lesions: [...lesions, lesion],
      activeLesionId: lesion.id,
    });
  };

  const removeLesion = (id) => {
    if (lesions.length <= 1) return;
    const next = lesions.filter((l) => l.id !== id);
    onChange({
      ...value,
      lesions: next,
      activeLesionId: next[0]?.id || null,
    });
  };

  const handlePhotoUpload = async (files) => {
    if (!files?.length) return;
    const uploaded = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await readFileAsDataUrl(file);
      uploaded.push({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    if (!uploaded.length) return;
    updateLesion({
      photos: [...(active.photos || []), ...uploaded].slice(0, 8),
      photography: {
        ...active.photography,
        photographTaken: true,
        imageUploaded: true,
      },
    });
  };

  const markers = lesions.map((l, i) => ({
    id: l.id,
    label: formatLesionLabel(l, i),
    locations: l.bodyLocations || [],
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents a comprehensive dermatologic examination — lesion morphology, distribution,
        colour, size, symptoms, and associated findings. Support multiple lesions per encounter.
      </p>

      <SectionCard title="A. Examination Type" accent="info">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Examination Type" required>
            <TextSelect
              value={value.examinationType}
              onChange={(v) => set('examinationType', v)}
              options={EXAMINATION_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Visit Type" required>
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Body Examination" required>
            <TextSelect
              value={value.bodyExamination}
              onChange={(v) => set('bodyExamination', v)}
              options={BODY_EXAMINATION_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Body Location"
        description="Select exam regions and map lesion sites. Multiple selections allowed."
      >
        <BodyMapSelector
          values={
            active
              ? [...new Set([...(value.examBodyLocations || []), ...(active.bodyLocations || [])])]
              : value.examBodyLocations || []
          }
          markers={markers}
          onToggle={(loc) => {
            const examLocs = toggleListValue(value.examBodyLocations, loc);
            const lesionLocs = toggleListValue(active?.bodyLocations, loc);
            onChange({
              ...value,
              examBodyLocations: examLocs,
              lesions: lesions.map((l, i) =>
                i === activeIndex ? { ...l, bodyLocations: lesionLocs } : l,
              ),
            });
          }}
        />
      </SectionCard>

      <SectionCard
        title="Lesions"
        description="Each lesion has its own morphology, measurements, photos, and diagnosis."
        accent="primary"
        actions={
          <Button type="button" size="sm" variant="outline" onClick={addLesion}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add lesion
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {lesions.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => set('activeLesionId', l.id)}
              className={`rounded-lg border px-3 py-1.5 text-left text-sm transition-colors ${
                l.id === activeId
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <span className="font-medium">{formatLesionLabel(l, i)}</span>
              {l.biopsyStatus && l.biopsyStatus !== 'None' && (
                <Badge variant="outline" className="ml-2 status-soft-warning">
                  {l.biopsyStatus}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {active && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Field label="Lesion label" className="min-w-[200px] flex-1">
                <TextInput
                  value={active.label}
                  onChange={(v) => updateLesion({ label: v })}
                  placeholder={`Lesion ${activeIndex + 1}`}
                />
              </Field>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={lesions.length <= 1}
                onClick={() => removeLesion(active.id)}
                aria-label="Remove lesion"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>

            <Accordion type="multiple" defaultValue={['info', 'morphology', 'size']} className="space-y-2">
              <AccordionItem value="info" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  C. Lesion Information
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Lesion Present">
                      <TextSelect
                        value={active.lesionPresent}
                        onChange={(v) => updateLesion({ lesionPresent: v })}
                        options={YES_NO_OPTIONS}
                      />
                    </Field>
                    <Field label="Number of Lesions">
                      <TextInput
                        type="number"
                        min={0}
                        value={active.numberOfLesions}
                        onChange={(v) => updateLesion({ numberOfLesions: v })}
                      />
                    </Field>
                    <Field label="Biopsy status">
                      <TextSelect
                        value={active.biopsyStatus}
                        onChange={(v) => updateLesion({ biopsyStatus: v })}
                        options={['None', 'Planned', 'Performed', 'Pending Pathology', 'Resulted']}
                      />
                    </Field>
                  </div>
                  <Field label="Primary Diagnosis (ICD-10)">
                    <IcdSearchField
                      value={
                        active.primaryDiagnosisCode
                          ? `${active.primaryDiagnosisCode}${
                              active.primaryDiagnosisDescription
                                ? ` — ${active.primaryDiagnosisDescription}`
                                : ''
                            }`
                          : ''
                      }
                      code={active.primaryDiagnosisCode}
                      onSelect={(item) =>
                        updateLesion({
                          primaryDiagnosisId: item.id,
                          primaryDiagnosisCode: item.code,
                          primaryDiagnosisDescription: item.description,
                        })
                      }
                    />
                  </Field>
                  <Field label="Clinical Diagnosis">
                    <TextInput
                      value={active.clinicalDiagnosis}
                      onChange={(v) => updateLesion({ clinicalDiagnosis: v })}
                      placeholder="Clinical impression for this lesion"
                    />
                  </Field>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="morphology" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  D. Lesion Morphology
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      Primary Lesions
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-prim-${active.id}`}
                      options={PRIMARY_LESION_OPTIONS}
                      values={active.primaryMorphology}
                      onToggle={(opt) =>
                        updateLesion({
                          primaryMorphology: toggleListValue(active.primaryMorphology, opt),
                        })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      Secondary Lesions
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-sec-${active.id}`}
                      options={SECONDARY_LESION_OPTIONS}
                      values={active.secondaryMorphology}
                      onToggle={(opt) =>
                        updateLesion({
                          secondaryMorphology: toggleListValue(active.secondaryMorphology, opt),
                        })
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="appearance" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  E–I. Colour, Borders, Surface, Shape, Distribution
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      E. Colour
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-col-${active.id}`}
                      options={COLOUR_OPTIONS}
                      values={active.colours}
                      onToggle={(opt) =>
                        updateLesion({ colours: toggleListValue(active.colours, opt) })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      F. Borders
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-bor-${active.id}`}
                      options={BORDER_OPTIONS}
                      values={active.borders}
                      onToggle={(opt) =>
                        updateLesion({ borders: toggleListValue(active.borders, opt) })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      G. Surface
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-surf-${active.id}`}
                      options={SURFACE_OPTIONS}
                      values={active.surfaces}
                      onToggle={(opt) =>
                        updateLesion({ surfaces: toggleListValue(active.surfaces, opt) })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      H. Shape
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-shape-${active.id}`}
                      options={SHAPE_OPTIONS}
                      values={active.shapes}
                      onToggle={(opt) =>
                        updateLesion({ shapes: toggleListValue(active.shapes, opt) })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      I. Distribution
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-dist-${active.id}`}
                      options={DISTRIBUTION_OPTIONS}
                      values={active.distributions}
                      onToggle={(opt) =>
                        updateLesion({
                          distributions: toggleListValue(active.distributions, opt),
                        })
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="size" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  J. Size
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Length (mm)">
                      <TextInput
                        type="number"
                        min={0}
                        step="0.1"
                        value={active.lengthMm}
                        onChange={(v) => updateLesion({ lengthMm: v })}
                      />
                    </Field>
                    <Field label="Width (mm)">
                      <TextInput
                        type="number"
                        min={0}
                        step="0.1"
                        value={active.widthMm}
                        onChange={(v) => updateLesion({ widthMm: v })}
                      />
                    </Field>
                    <Field label="Height (mm)">
                      <TextInput
                        type="number"
                        min={0}
                        step="0.1"
                        value={active.heightMm}
                        onChange={(v) => updateLesion({ heightMm: v })}
                      />
                    </Field>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="symptoms" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  K–L. Symptoms & Associated Findings
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      K. Symptoms
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-sym-${active.id}`}
                      options={SYMPTOM_OPTIONS}
                      values={active.symptoms}
                      onToggle={(opt) =>
                        updateLesion({ symptoms: toggleListValue(active.symptoms, opt) })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      L. Associated Findings
                    </p>
                    <MultiSelectChips
                      idPrefix={`derm-assoc-${active.id}`}
                      options={ASSOCIATED_FINDING_OPTIONS}
                      values={active.associatedFindings}
                      onToggle={(opt) =>
                        updateLesion({
                          associatedFindings: toggleListValue(active.associatedFindings, opt),
                        })
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="abcde" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  M. ABCDE Melanoma Assessment
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ABCDE_FIELDS.map((f) => (
                      <Field key={f.key} label={f.label}>
                        <TextSelect
                          value={active.abcde?.[f.key]}
                          onChange={(v) => updateLesionNested('abcde', { [f.key]: v })}
                          options={YES_NO_OPTIONS}
                        />
                      </Field>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="photos" className="rounded-lg border px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  N. Clinical Photography
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PHOTO_CHECK_FIELDS.map((f) => (
                      <CheckboxField
                        key={f.key}
                        id={`photo-${active.id}-${f.key}`}
                        label={f.label}
                        checked={Boolean(active.photography?.[f.key])}
                        onCheckedChange={(v) => updateLesionNested('photography', { [f.key]: v })}
                      />
                    ))}
                  </div>
                  {!active.photography?.consentObtained && (
                    <p className="text-xs text-amber-700">
                      Obtain patient consent before uploading clinical photographs.
                    </p>
                  )}
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted/40">
                      <Upload className="h-3.5 w-3.5" />
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={!active.photography?.consentObtained}
                        onChange={(e) => {
                          handlePhotoUpload(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {(active.photos || []).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {active.photos.map((photo) => (
                        <div key={photo.id} className="relative overflow-hidden rounded-md border">
                          <img
                            src={photo.dataUrl}
                            alt={photo.name}
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded bg-background/90 p-1 text-destructive"
                            aria-label={`Remove ${photo.name}`}
                            onClick={() =>
                              updateLesion({
                                photos: active.photos.filter((p) => p.id !== photo.id),
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Field label="Lesion notes">
              <TextTextarea
                value={active.notes}
                onChange={(v) => updateLesion({ notes: v })}
                rows={2}
              />
            </Field>
          </div>
        )}
      </SectionCard>

      <SectionCard title="O. Provider Notes" description="Rich-text encounter exam narrative.">
        <RichTextEditor
          value={value.providerNotes || ''}
          onChange={(html) => set('providerNotes', html)}
          placeholder="Document overall dermatologic examination findings…"
        />
      </SectionCard>
    </div>
  );
}
