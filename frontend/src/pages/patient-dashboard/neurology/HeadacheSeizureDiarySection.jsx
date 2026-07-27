import { Plus, Trash2 } from 'lucide-react';
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
  DIARY_ENTRY_TYPES,
  HEADACHE_LOCATION_OPTIONS,
  HEADACHE_QUALITY_OPTIONS,
  HEADACHE_SEVERITY_OPTIONS,
  HEADACHE_TRIGGERS,
  SEIZURE_DURATION_OPTIONS,
  SEIZURE_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from './neurologyConstants';
import { createEmptyDiaryEntry, toggleListValue } from './neurologyUtils';

export function HeadacheSeizureDiarySection({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const entries = Array.isArray(value.entries) ? value.entries : [];

  const addEntry = () => {
    set('entries', [...entries, createEmptyDiaryEntry()]);
  };

  const updateEntry = (id, patch) => {
    set(
      'entries',
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const removeEntry = (id) => {
    set(
      'entries',
      entries.filter((entry) => entry.id !== id),
    );
  };

  const toggleEntryList = (id, key, opt) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    updateEntry(id, { [key]: toggleListValue(entry[key], opt) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track headache and seizure events for this encounter. Baseline regimen carries forward to
        follow-up visits.
      </p>

      <SectionCard title="A. Baseline diary context" accent="info">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Typical frequency">
            <TextInput
              value={value.baselineFrequency}
              onChange={(v) => set('baselineFrequency', v)}
              placeholder="e.g. 3 migraines / month, 1 GTC / year"
            />
          </Field>
          <Field label="Current neuro meds / prophylaxis">
            <TextInput
              value={value.currentMedications}
              onChange={(v) => set('currentMedications', v)}
              placeholder="AEDs, migraine prophylaxis, rescue meds"
            />
          </Field>
        </div>
        <Field label="Rescue / acute plan" className="mt-3">
          <TextTextarea
            value={value.rescuePlan}
            onChange={(v) => set('rescuePlan', v)}
            rows={2}
            placeholder="Triptan timing, rescue benzo, ED criteria…"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="B. Event log"
        description={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} this encounter.`}
        accent="primary"
        actions={
          <Button type="button" size="sm" onClick={addEntry}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add event
          </Button>
        }
      >
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No headache or seizure events logged yet.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addEntry}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Log first event
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const isSeizure =
                entry.entryType === 'Seizure' || entry.entryType === 'Aura only';
              return (
                <div
                  key={entry.id}
                  className="space-y-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Event {index + 1}</Badge>
                      <span className="text-sm font-medium text-foreground">
                        {entry.entryType || 'Untitled'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remove event ${index + 1}`}
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Type">
                      <TextSelect
                        value={entry.entryType}
                        onChange={(v) => updateEntry(entry.id, { entryType: v })}
                        options={DIARY_ENTRY_TYPES}
                      />
                    </Field>
                    <Field label="Date">
                      <TextInput
                        type="date"
                        value={entry.date}
                        onChange={(v) => updateEntry(entry.id, { date: v })}
                      />
                    </Field>
                    <Field label="Time">
                      <TextInput
                        type="time"
                        value={entry.time}
                        onChange={(v) => updateEntry(entry.id, { time: v })}
                      />
                    </Field>
                    <Field label="Severity (1–10)">
                      <TextSelect
                        value={entry.severity}
                        onChange={(v) => updateEntry(entry.id, { severity: v })}
                        options={HEADACHE_SEVERITY_OPTIONS}
                        placeholder="—"
                      />
                    </Field>
                  </div>

                  {!isSeizure && (
                    <>
                      <Field label="Quality">
                        <MultiSelectChips
                          idPrefix={`hq-${entry.id}`}
                          options={HEADACHE_QUALITY_OPTIONS}
                          values={entry.quality}
                          onToggle={(opt) => toggleEntryList(entry.id, 'quality', opt)}
                        />
                      </Field>
                      <Field label="Location">
                        <MultiSelectChips
                          idPrefix={`hl-${entry.id}`}
                          options={HEADACHE_LOCATION_OPTIONS}
                          values={entry.location}
                          onToggle={(opt) => toggleEntryList(entry.id, 'location', opt)}
                        />
                      </Field>
                      <Field label="Triggers">
                        <MultiSelectChips
                          idPrefix={`ht-${entry.id}`}
                          options={HEADACHE_TRIGGERS}
                          values={entry.triggers}
                          onToggle={(opt) => toggleEntryList(entry.id, 'triggers', opt)}
                        />
                      </Field>
                    </>
                  )}

                  {isSeizure && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Seizure type">
                        <TextSelect
                          value={entry.seizureType}
                          onChange={(v) => updateEntry(entry.id, { seizureType: v })}
                          options={SEIZURE_TYPE_OPTIONS}
                        />
                      </Field>
                      <Field label="Duration">
                        <TextSelect
                          value={entry.seizureDuration}
                          onChange={(v) => updateEntry(entry.id, { seizureDuration: v })}
                          options={SEIZURE_DURATION_OPTIONS}
                        />
                      </Field>
                      <Field label="Witnessed">
                        <TextSelect
                          value={entry.witnessed}
                          onChange={(v) => updateEntry(entry.id, { witnessed: v })}
                          options={YES_NO_OPTIONS}
                        />
                      </Field>
                      <Field label="Aura" className="sm:col-span-2 lg:col-span-3">
                        <TextInput
                          value={entry.aura}
                          onChange={(v) => updateEntry(entry.id, { aura: v })}
                          placeholder="Visual, sensory, déjà vu…"
                        />
                      </Field>
                      <Field label="Post-ictal" className="sm:col-span-2 lg:col-span-3">
                        <TextInput
                          value={entry.postIctal}
                          onChange={(v) => updateEntry(entry.id, { postIctal: v })}
                          placeholder="Confusion, Todd paresis, sleep…"
                        />
                      </Field>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Duration / course">
                      <TextInput
                        value={entry.duration}
                        onChange={(v) => updateEntry(entry.id, { duration: v })}
                        placeholder="e.g. 4 hours, resolved with rest"
                      />
                    </Field>
                    <Field label="Meds taken for this event">
                      <TextInput
                        value={entry.medsTaken}
                        onChange={(v) => updateEntry(entry.id, { medsTaken: v })}
                        placeholder="Sumatriptan, lorazepam…"
                      />
                    </Field>
                  </div>
                  <Field label="Notes">
                    <TextTextarea
                      value={entry.notes}
                      onChange={(v) => updateEntry(entry.id, { notes: v })}
                      rows={2}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
