import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useIntake } from '../IntakeContext';
import { SCREENING_LABELS } from '../intakeConstants';

export function ScreeningSectionWrapper({ sectionType, title, children, getScore }) {
  const { saveSection, getRecordsBySection, saving } = useIntake();
  const existing = getRecordsBySection(sectionType)[0];
  const [saved, setSaved] = useState(Boolean(existing));

  const handleSave = async (payload, score) => {
    await saveSection({
      sectionType,
      payload,
      score: score ?? getScore?.(payload) ?? null,
    });
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      {typeof children === 'function'
        ? children({ onSave: handleSave, existingRecord: existing, saved })
        : children}
      {saved && existing && (
        <p className="text-sm text-muted-foreground">
          Saved score: <strong>{existing.score ?? '—'}</strong> — {SCREENING_LABELS[sectionType]}
        </p>
      )}
      {!saved && (
        <p className="text-xs text-muted-foreground">Complete the assessment and click Save Score below.</p>
      )}
    </div>
  );
}

export function SaveScreeningButton({ onClick, disabled, label = 'Save Score' }) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}
