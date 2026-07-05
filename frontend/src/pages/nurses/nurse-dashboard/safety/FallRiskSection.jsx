import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScreeningSaveBar } from '@/pages/patient-dashboard/intake/ScreeningSaveBar';

const fallRiskQuestions = [
  { id: 'presented-due-to-fall', label: 'Presented due to fall (syncope, seizure, LOC)', yesPoints: 20 },
  { id: 'recent-fall', label: 'History of fall (within last 3 months)', yesPoints: 15 },
  { id: 'altered-mental-status', label: 'Altered mental status', yesPoints: 15 },
  { id: 'impaired-mobility', label: 'Impaired mobility', yesPoints: 15 },
  { id: 'nurse-judgement', label: 'Nurse judgement (incontinence, dizziness, risky meds, etc.)', yesPoints: 10 },
  { id: 'fsi-category', label: 'FSI Category I', yesPoints: 10 },
  { id: 'yellow-band', label: 'Yellow Fall Risk ID band applied', yesPoints: 0 },
];

export function FallRiskSection() {
  const [fallAnswers, setFallAnswers] = useState(
    fallRiskQuestions.reduce((acc, q) => ({ ...acc, [q.id]: 'no' }), {})
  );

  const fallRiskScore = useMemo(
    () =>
      fallRiskQuestions.reduce((sum, q) => {
        return fallAnswers[q.id] === 'yes' ? sum + q.yesPoints : sum;
      }, 0),
    [fallAnswers]
  );

  return (
    <Card>
      <CardContent className="space-y-3 pt-0">
        <Input id="fall-timestamp" className="hidden" disabled />
        {fallRiskQuestions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{q.label}</p>
              <span className="text-xs text-muted-foreground">Yes = {q.yesPoints} pts</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={q.id}
                  value="yes"
                  className="h-4 w-4"
                  checked={fallAnswers[q.id] === 'yes'}
                  onChange={() => setFallAnswers((p) => ({ ...p, [q.id]: 'yes' }))}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={q.id}
                  value="no"
                  className="h-4 w-4"
                  checked={fallAnswers[q.id] === 'no'}
                  onChange={() => setFallAnswers((p) => ({ ...p, [q.id]: 'no' }))}
                />
                No
              </label>
            </div>
          </div>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fall-notes">Fall Risk Notes</Label>
            <Textarea id="fall-notes" placeholder="Add notes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fall-score">Calculated Score</Label>
            <Input id="fall-score" value={fallRiskScore} readOnly className="ml-2 bg-muted w-auto px-3" />
          </div>
        </div>
        <ScreeningSaveBar
          screeningType="fall_risk"
          score={fallRiskScore}
          maxScore={100}
          answers={fallAnswers}
        />
      </CardContent>
    </Card>
  );
}


