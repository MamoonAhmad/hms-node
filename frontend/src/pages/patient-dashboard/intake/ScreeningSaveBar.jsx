import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useIntake } from './IntakeContext';

export function ScreeningSaveBar({ screeningType, score, maxScore, answers, notes }) {
  const { saveScreening, canPersist } = useIntake();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const handleSave = async () => {
    if (!canPersist) return;
    setSaving(true);
    try {
      await saveScreening({
        screeningType,
        score: score ?? null,
        maxScore: maxScore ?? null,
        answers: answers || {},
        notes: notes || null,
      });
      setSavedAt(new Date().toLocaleString());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div className="text-sm text-muted-foreground">
        {score != null && (
          <span className="font-medium text-foreground">Score: {score}</span>
        )}
        {savedAt && <span className="ml-3">Saved {savedAt}</span>}
        {!canPersist && <span>Sign in with a patient chart to persist screening scores.</span>}
      </div>
      <Button type="button" size="sm" onClick={handleSave} disabled={saving || !canPersist}>
        {saving ? 'Saving…' : 'Save screening score'}
      </Button>
    </div>
  );
}
