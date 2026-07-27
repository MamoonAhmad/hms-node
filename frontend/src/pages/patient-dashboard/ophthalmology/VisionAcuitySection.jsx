import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../womens-health/WomensHealthFields';
import {
  COLOUR_VISION_RESULT_OPTIONS,
  CONFRONTATION_OPTIONS,
  CONTACT_LENS_TYPE_OPTIONS,
  LENS_TYPE_OPTIONS,
  VISIT_TYPE_OPTIONS,
  VISUAL_ACUITY_OPTIONS,
  YES_NO_OPTIONS,
} from './ophthalmologyConstants';

function AcuitySelect({ label, value, onChange }) {
  return (
    <Field label={label}>
      <TextSelect value={value} onChange={onChange} options={VISUAL_ACUITY_OPTIONS} />
    </Field>
  );
}

export function VisionAcuitySection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents visual acuity, refractive status, corrective lenses, and vision assessment for
        each eye (OD / OS / OU).
      </p>

      <SectionCard
        title="A. Visit Information"
        description="Encounter date and visit context (auto-filled where available)."
        accent="info"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Examination Date" required>
            <TextInput
              type="date"
              value={value.examinationDate}
              onChange={(v) => set('examinationDate', v)}
            />
          </Field>
          <Field label="Provider" required>
            <TextInput
              value={value.provider}
              onChange={(v) => set('provider', v)}
              placeholder="Encounter provider"
            />
          </Field>
          <Field label="Visit Type" required>
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={VISIT_TYPE_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Visual Acuity" description="Distance, near, and pinhole vision." accent="primary">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Distance Vision
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AcuitySelect label="Right Eye (OD) Uncorrected" value={value.odUncorrected} onChange={(v) => set('odUncorrected', v)} />
          <AcuitySelect label="Left Eye (OS) Uncorrected" value={value.osUncorrected} onChange={(v) => set('osUncorrected', v)} />
          <AcuitySelect label="Both Eyes (OU) Uncorrected" value={value.ouUncorrected} onChange={(v) => set('ouUncorrected', v)} />
          <AcuitySelect label="Right Eye (OD) Corrected" value={value.odCorrected} onChange={(v) => set('odCorrected', v)} />
          <AcuitySelect label="Left Eye (OS) Corrected" value={value.osCorrected} onChange={(v) => set('osCorrected', v)} />
          <AcuitySelect label="Both Eyes (OU) Corrected" value={value.ouCorrected} onChange={(v) => set('ouCorrected', v)} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Near Vision
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <AcuitySelect label="OD Near Vision" value={value.odNear} onChange={(v) => set('odNear', v)} />
          <AcuitySelect label="OS Near Vision" value={value.osNear} onChange={(v) => set('osNear', v)} />
          <AcuitySelect label="OU Near Vision" value={value.ouNear} onChange={(v) => set('ouNear', v)} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pinhole Vision
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <AcuitySelect label="OD Pinhole" value={value.odPinhole} onChange={(v) => set('odPinhole', v)} />
          <AcuitySelect label="OS Pinhole" value={value.osPinhole} onChange={(v) => set('osPinhole', v)} />
        </div>
      </SectionCard>

      <SectionCard title="C. Corrective Lenses">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Uses Glasses">
            <TextSelect value={value.usesGlasses} onChange={(v) => set('usesGlasses', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Uses Contact Lenses">
            <TextSelect value={value.usesContactLenses} onChange={(v) => set('usesContactLenses', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Lens Type">
            <TextSelect value={value.lensType} onChange={(v) => set('lensType', v)} options={LENS_TYPE_OPTIONS} />
          </Field>
          <Field label="Contact Lens Type">
            <TextSelect value={value.contactLensType} onChange={(v) => set('contactLensType', v)} options={CONTACT_LENS_TYPE_OPTIONS} />
          </Field>
          <Field label="Wearing Correction Today">
            <TextSelect value={value.wearingCorrectionToday} onChange={(v) => set('wearingCorrectionToday', v)} options={YES_NO_OPTIONS} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Refraction" description="Manifest refraction and final prescription.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Manifest Refraction OD">
            <TextInput value={value.manifestRefractionOd} onChange={(v) => set('manifestRefractionOd', v)} placeholder="e.g. -2.00 -0.50 × 90" />
          </Field>
          <Field label="Manifest Refraction OS">
            <TextInput value={value.manifestRefractionOs} onChange={(v) => set('manifestRefractionOs', v)} placeholder="e.g. -1.75 -0.25 × 80" />
          </Field>
          <Field label="Final Prescription OD">
            <TextInput value={value.finalPrescriptionOd} onChange={(v) => set('finalPrescriptionOd', v)} />
          </Field>
          <Field label="Final Prescription OS">
            <TextInput value={value.finalPrescriptionOs} onChange={(v) => set('finalPrescriptionOs', v)} />
          </Field>
          <Field label="Add Power">
            <TextInput value={value.addPower} onChange={(v) => set('addPower', v)} placeholder="e.g. +2.00" />
          </Field>
          <Field label="PD (Pupillary Distance)">
            <TextInput value={value.pupillaryDistance} onChange={(v) => set('pupillaryDistance', v)} placeholder="mm" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Colour Vision">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Colour Vision Tested">
            <TextSelect value={value.colourVisionTested} onChange={(v) => set('colourVisionTested', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Result">
            <TextSelect value={value.colourVisionResult} onChange={(v) => set('colourVisionResult', v)} options={COLOUR_VISION_RESULT_OPTIONS} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="F. Visual Fields">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Confrontation Test">
            <TextSelect value={value.confrontationTest} onChange={(v) => set('confrontationTest', v)} options={CONFRONTATION_OPTIONS} />
          </Field>
          <Field label="Automated Visual Field Ordered">
            <TextSelect value={value.automatedVisualFieldOrdered} onChange={(v) => set('automatedVisualFieldOrdered', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Result" className="sm:col-span-2 lg:col-span-1">
            <TextInput value={value.visualFieldResult} onChange={(v) => set('visualFieldResult', v)} placeholder="Field result summary…" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="G. Provider Notes">
        <TextTextarea
          value={value.providerNotes}
          onChange={(v) => set('providerNotes', v)}
          rows={3}
          placeholder="Vision acuity notes…"
        />
      </SectionCard>

      {history.length > 0 && (
        <SectionCard
          title="Longitudinal Visual Acuity"
          description="Recent corrected acuity across visits."
          accent="warning"
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">OD Corrected</th>
                  <th className="px-3 py-2 font-medium">OS Corrected</th>
                  <th className="px-3 py-2 font-medium">OU Corrected</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.at}-${idx}`} className={idx % 2 === 1 ? 'bg-muted/20' : undefined}>
                    <td className="px-3 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-3 py-2">{row.odCorrected || '—'}</td>
                    <td className="px-3 py-2">{row.osCorrected || '—'}</td>
                    <td className="px-3 py-2">{row.ouCorrected || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
