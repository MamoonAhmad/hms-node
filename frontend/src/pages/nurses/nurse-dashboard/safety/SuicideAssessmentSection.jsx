import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScreeningSaveBar } from '@/pages/patient-dashboard/intake/ScreeningSaveBar';

const suicideQuestions = [
  {
    id: 'q1',
    label: '1. Have you wished you were dead or wished you could go to sleep and not wake up?',
  },
  {
    id: 'q2',
    label: '2. Have you actually had any thoughts of killing yourself?',
    note: 'Behavioral Health Referral at Discharge',
  },
  {
    id: 'q3',
    label: '3. Have you thought about how you might do this? (e.g., had a method in mind)',
    note: 'Behavioral Health Referral at Discharge',
    dependsOn: 'q2',
  },
  {
    id: 'q4',
    label:
      '4. Have you had any intention of acting on these thoughts of killing yourself, as opposed to you have the thoughts but you definitely would not act on them?',
    note: 'Immediate Notification of Physician and/or Behavioral Health and Patient Safety Precautions',
    dependsOn: 'q2',
  },
  {
    id: 'q5',
    label:
      '5. Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?',
    note: 'Immediate Notification of Physician and/or Behavioral Health and Patient Safety Precautions',
    dependsOn: 'q2',
  },
  {
    id: 'q6',
    label:
      '6. Have you ever done anything, started to do anything, or prepared to do anything to end your life? (e.g., collected pills, written a note, bought a weapon)',
    note: 'Over 3 months ago: Behavioral Health Referral at Discharge',
  },
  {
    id: 'q6_1',
    label: '6.1 was this within the past three months?',
    dependsOn: 'q6',
  },
];

export function SuicideAssessmentSection() {
  const [suicideAnswers, setSuicideAnswers] = useState({});

  const shouldShowQuestion = (q) => {
    if (q.dependsOn === 'q2' && suicideAnswers['q2'] !== 'yes') return false;
    if (q.id === 'q6_1' && suicideAnswers['q6'] !== 'yes') return false;
    return true;
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-0">
        <Input id="suicide-timestamp" className="hidden" disabled />
        {suicideQuestions.map((q) =>
          shouldShowQuestion(q) ? (
            <div key={q.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
              <p className="text-sm font-medium text-foreground">{q.label}</p>
              {q.note && <p className="text-xs text-muted-foreground">{q.note}</p>}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name={q.id}
                    value="yes"
                    className="h-4 w-4"
                    checked={suicideAnswers[q.id] === 'yes'}
                    onChange={() => setSuicideAnswers((p) => ({ ...p, [q.id]: 'yes' }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name={q.id}
                    value="no"
                    className="h-4 w-4"
                    checked={suicideAnswers[q.id] !== 'yes'}
                    onChange={() => setSuicideAnswers((p) => ({ ...p, [q.id]: 'no' }))}
                  />
                  No
                </label>
              </div>
            </div>
          ) : null
        )}
        <ScreeningSaveBar screeningType="suicide" answers={suicideAnswers} />
      </CardContent>
    </Card>
  );
}


