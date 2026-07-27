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
  ANC_RISK_OPTIONS,
  FEVER_SOURCE_OPTIONS,
  FN_DISPOSITION_OPTIONS,
  FN_RISK_OPTIONS,
  NEUTROPENIA_SYMPTOM_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './oncologyHematologyConstants';
import { suggestAncRisk, toggleListValue } from './oncologyHematologyUtils';

function alertTone(value) {
  if (value?.feverPresent === 'Yes') return 'danger';
  if (String(value?.ancRisk || '').includes('<500')) return 'danger';
  if (String(value?.ancRisk || '').includes('500–999')) return 'warning';
  if (value?.feverPresent === 'No' && value?.ancRisk) return 'success';
  return null;
}

export function NeutropeniaFeverScreenSection({ value, onChange, history = [] }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, opt) => set(key, toggleListValue(value[key], opt));
  const tone = alertTone(value);

  const handleAncChange = (ancValue) => {
    const suggested = suggestAncRisk(ancValue);
    onChange({
      ...value,
      ancValue,
      ancRisk: suggested || value.ancRisk,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Screen for febrile neutropenia risk: fever, ANC, infectious symptoms, and disposition.
      </p>

      {tone && (
        <div
          className={
            tone === 'danger'
              ? 'rounded-lg border border-destructive/40 border-l-4 border-l-destructive bg-destructive/5 px-3 py-2 text-sm'
              : tone === 'warning'
                ? 'rounded-lg border border-border border-l-4 border-l-amber-500 bg-amber-50/80 px-3 py-2 text-sm'
                : 'rounded-lg border border-border border-l-4 border-l-emerald-600 bg-emerald-50/50 px-3 py-2 text-sm'
          }
        >
          {tone === 'danger' && (
            <span className="font-medium text-destructive">
              High-priority screen — fever and/or severe neutropenia documented. Confirm urgent
              workup and disposition.
            </span>
          )}
          {tone === 'warning' && (
            <span className="font-medium text-amber-800">
              Moderate neutropenia — reinforce fever precautions and close follow-up.
            </span>
          )}
          {tone === 'success' && (
            <span className="font-medium text-emerald-800">
              No fever reported with ANC risk documented — continue precautions counseling.
            </span>
          )}
        </div>
      )}

      <SectionCard title="A. Fever Assessment" accent="danger">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Screen Date" required>
            <TextInput
              type="date"
              value={value.screenDate}
              onChange={(v) => set('screenDate', v)}
            />
          </Field>
          <Field label="Fever Present" required>
            <TextSelect
              value={value.feverPresent}
              onChange={(v) => set('feverPresent', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Temperature (°C)" hint="≥38.0°C meets FN fever threshold">
            <TextInput
              type="number"
              min={30}
              max={45}
              step="0.1"
              value={value.temperatureC}
              onChange={(v) => set('temperatureC', v)}
              placeholder="e.g. 38.3"
            />
          </Field>
          <Field label="Fever Source / Setting">
            <TextSelect
              value={value.feverSource}
              onChange={(v) => set('feverSource', v)}
              options={FEVER_SOURCE_OPTIONS}
            />
          </Field>
          <Field label="Fever Onset">
            <TextInput
              value={value.feverOnset}
              onChange={(v) => set('feverOnset', v)}
              placeholder="e.g. last night, 2 hours ago"
            />
          </Field>
          <Field label="Last Chemotherapy Date">
            <TextInput
              type="date"
              value={value.lastChemoDate}
              onChange={(v) => set('lastChemoDate', v)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Neutrophil Count & Risk" accent="warning">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ANC (cells/µL)" required>
            <TextInput
              type="number"
              min={0}
              value={value.ancValue}
              onChange={handleAncChange}
              placeholder="e.g. 420"
            />
          </Field>
          <Field label="ANC Date">
            <TextInput
              type="date"
              value={value.ancDate}
              onChange={(v) => set('ancDate', v)}
            />
          </Field>
          <Field label="WBC (×10³/µL)">
            <TextInput
              type="number"
              min={0}
              step="0.1"
              value={value.wbc}
              onChange={(v) => set('wbc', v)}
            />
          </Field>
          <Field label="ANC Risk Band" required>
            <TextSelect
              value={value.ancRisk}
              onChange={(v) => set('ancRisk', v)}
              options={ANC_RISK_OPTIONS}
            />
          </Field>
          <Field label="FN Clinical Risk">
            <TextSelect
              value={value.fnRisk}
              onChange={(v) => set('fnRisk', v)}
              options={FN_RISK_OPTIONS}
            />
          </Field>
          <Field label="Central Line Present">
            <TextSelect
              value={value.centralLinePresent}
              onChange={(v) => set('centralLinePresent', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Recent Hospitalization (30d)">
            <TextSelect
              value={value.recentHospitalization}
              onChange={(v) => set('recentHospitalization', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
        </div>
        <Field label="ANC / Lab Notes">
          <TextInput
            value={value.absoluteNeutrophilCountNote}
            onChange={(v) => set('absoluteNeutrophilCountNote', v)}
            placeholder="Pending labs, trend, nadir expected…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Symptoms & Actions" accent="info">
        <Field label="Neutropenia / Infection Symptoms">
          <MultiSelectChips
            idPrefix="onc-fn-sx"
            options={NEUTROPENIA_SYMPTOM_OPTIONS}
            values={value.symptoms}
            onToggle={(opt) => toggle('symptoms', opt)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Blood Cultures Drawn">
            <TextSelect
              value={value.bloodCulturesDrawn}
              onChange={(v) => set('bloodCulturesDrawn', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Antibiotics Started">
            <TextSelect
              value={value.antibioticsStarted}
              onChange={(v) => set('antibioticsStarted', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="G-CSF Given / Ordered">
            <TextSelect
              value={value.gcsfGiven}
              onChange={(v) => set('gcsfGiven', v)}
              options={YES_NO_UNKNOWN_OPTIONS}
            />
          </Field>
          <Field label="Disposition" required>
            <TextSelect
              value={value.disposition}
              onChange={(v) => set('disposition', v)}
              options={FN_DISPOSITION_OPTIONS}
            />
          </Field>
          <Field label="Fever Precautions Reviewed">
            <TextSelect
              value={value.returnPrecautionsReviewed}
              onChange={(v) => set('returnPrecautionsReviewed', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Antibiotic Details">
          <TextInput
            value={value.antibioticDetails}
            onChange={(v) => set('antibioticDetails', v)}
            placeholder="Agent, dose, route, start time…"
          />
        </Field>
        <Field label="Clinical Notes">
          <TextTextarea
            value={value.clinicalNotes}
            onChange={(v) => set('clinicalNotes', v)}
            rows={3}
            placeholder="Source workup, MASCC considerations, follow-up plan…"
          />
        </Field>
        {value.disposition && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="status-soft-info font-medium">
              Disposition: {value.disposition}
            </Badge>
            {value.ancRisk && (
              <Badge
                variant="secondary"
                className={
                  String(value.ancRisk).includes('<500')
                    ? 'status-soft-danger font-medium'
                    : 'status-soft-warning font-medium'
                }
              >
                {value.ancRisk}
              </Badge>
            )}
          </div>
        )}
      </SectionCard>

      {history.some((h) => h.feverPresent || h.ancRisk || h.disposition) && (
        <SectionCard title="Prior fever / ANC screens">
          <ul className="space-y-2">
            {history
              .filter((h) => h.feverPresent || h.ancRisk || h.disposition)
              .slice(0, 5)
              .map((h) => (
                <li
                  key={`${h.appointmentId || 'none'}-${h.at}-fn`}
                  className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {h.examinationDate || new Date(h.at).toLocaleDateString()}
                  </span>
                  {' — '}
                  Fever: {h.feverPresent || '—'}
                  {h.ancRisk ? ` · ${h.ancRisk}` : ''}
                  {h.disposition ? ` · ${h.disposition}` : ''}
                </li>
              ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
