import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../womens-health/WomensHealthFields';
import {
  HOME_O2_STATUS_OPTIONS,
  O2_DELIVERY_OPTIONS,
  SPIROMETRY_INTERPRETATION_OPTIONS,
  SPIROMETRY_QUALITY_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './pulmonologyConstants';

export function SpirometryO2Section({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Capture spirometry results, oxygenation status, and home oxygen therapy details.
      </p>

      <SectionCard title="A. Spirometry" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Spirometry Performed">
            <TextSelect
              value={value.spirometryPerformed}
              onChange={(v) => set('spirometryPerformed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Test Date">
            <TextInput
              type="date"
              value={value.spirometryDate}
              onChange={(v) => set('spirometryDate', v)}
            />
          </Field>
          <Field label="Test Quality">
            <TextSelect
              value={value.quality}
              onChange={(v) => set('quality', v)}
              options={SPIROMETRY_QUALITY_OPTIONS}
            />
          </Field>
          <Field label="FEV1 (L)">
            <TextInput
              type="number"
              step="0.01"
              value={value.fev1Liters}
              onChange={(v) => set('fev1Liters', v)}
              placeholder="e.g. 2.10"
            />
          </Field>
          <Field label="FEV1 % Predicted">
            <TextInput
              type="number"
              value={value.fev1PercentPredicted}
              onChange={(v) => set('fev1PercentPredicted', v)}
              placeholder="%"
            />
          </Field>
          <Field label="FVC (L)">
            <TextInput
              type="number"
              step="0.01"
              value={value.fvcLiters}
              onChange={(v) => set('fvcLiters', v)}
              placeholder="e.g. 3.40"
            />
          </Field>
          <Field label="FVC % Predicted">
            <TextInput
              type="number"
              value={value.fvcPercentPredicted}
              onChange={(v) => set('fvcPercentPredicted', v)}
              placeholder="%"
            />
          </Field>
          <Field label="FEV1/FVC Ratio">
            <TextInput
              value={value.fev1FvcRatio}
              onChange={(v) => set('fev1FvcRatio', v)}
              placeholder="e.g. 0.62 or 62%"
            />
          </Field>
          <Field label="Post-Bronchodilator Change">
            <TextInput
              value={value.postBronchodilatorChange}
              onChange={(v) => set('postBronchodilatorChange', v)}
              placeholder="e.g. +12% / +200 mL"
            />
          </Field>
          <Field label="Peak Flow (L/min)">
            <TextInput
              value={value.peakFlow}
              onChange={(v) => set('peakFlow', v)}
              placeholder="L/min"
            />
          </Field>
          <Field label="Interpretation" className="sm:col-span-2">
            <TextSelect
              value={value.interpretation}
              onChange={(v) => set('interpretation', v)}
              options={SPIROMETRY_INTERPRETATION_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Oxygen Status" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="SpO₂ Room Air (%)">
            <TextInput
              type="number"
              min={50}
              max={100}
              value={value.spo2RoomAir}
              onChange={(v) => set('spo2RoomAir', v)}
              placeholder="e.g. 94"
            />
          </Field>
          <Field label="SpO₂ on Oxygen (%)">
            <TextInput
              type="number"
              min={50}
              max={100}
              value={value.spo2OnOxygen}
              onChange={(v) => set('spo2OnOxygen', v)}
              placeholder="e.g. 98"
            />
          </Field>
          <Field label="O₂ Flow Rate">
            <TextInput
              value={value.oxygenFlowRate}
              onChange={(v) => set('oxygenFlowRate', v)}
              placeholder="e.g. 2 L/min"
            />
          </Field>
          <Field label="Delivery Method">
            <TextSelect
              value={value.oxygenDelivery}
              onChange={(v) => set('oxygenDelivery', v)}
              options={O2_DELIVERY_OPTIONS}
            />
          </Field>
          <Field label="Ambulatory Desaturation">
            <TextSelect
              value={value.ambulatoryDesaturation}
              onChange={(v) => set('ambulatoryDesaturation', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="C. Home Oxygen Therapy" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Home O₂ Status">
            <TextSelect
              value={value.homeOxygenStatus}
              onChange={(v) => set('homeOxygenStatus', v)}
              options={HOME_O2_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Home O₂ Liters">
            <TextInput
              value={value.homeOxygenLiters}
              onChange={(v) => set('homeOxygenLiters', v)}
              placeholder="e.g. 2 L continuous"
            />
          </Field>
          <Field label="ABG Performed">
            <TextSelect
              value={value.abgPerformed}
              onChange={(v) => set('abgPerformed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
        <Field label="ABG Result Summary">
          <TextInput
            value={value.abgResult}
            onChange={(v) => set('abgResult', v)}
            placeholder="pH / PaCO₂ / PaO₂ / HCO₃…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="D. Clinical Notes">
        <TextTextarea
          value={value.clinicalNotes}
          onChange={(v) => set('clinicalNotes', v)}
          rows={3}
          placeholder="Spirometry / oxygen interpretation notes…"
        />
      </SectionCard>

      {history.length > 0 && (
        <SectionCard
          title="Longitudinal Spirometry / O₂"
          description="Recent FEV1% and SpO₂ across visits."
          accent="warning"
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">FEV1 %</th>
                  <th className="px-3 py-2 font-medium">SpO₂ RA</th>
                  <th className="px-3 py-2 font-medium">Home O₂</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.at}-${idx}`} className={idx % 2 === 1 ? 'bg-muted/20' : undefined}>
                    <td className="px-3 py-2">{row.examinationDate || '—'}</td>
                    <td className="px-3 py-2">
                      {row.fev1PercentPredicted ? `${row.fev1PercentPredicted}%` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row.spo2RoomAir ? `${row.spo2RoomAir}%` : '—'}
                    </td>
                    <td className="px-3 py-2">{row.homeOxygenStatus || '—'}</td>
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
