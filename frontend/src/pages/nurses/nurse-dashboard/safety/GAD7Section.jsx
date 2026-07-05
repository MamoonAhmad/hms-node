import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScreeningSaveBar } from '@/pages/patient-dashboard/intake/ScreeningSaveBar';

const GAD7_RESPONSE_OPTIONS = [
  { value: '0', label: 'Not at all', score: 0 },
  { value: '1', label: 'Several days', score: 1 },
  { value: '2', label: 'More than half the days', score: 2 },
  { value: '3', label: 'Nearly every day', score: 3 },
];

const GAD7_QUESTIONS = [
  { id: 1, text: 'Feeling nervous, anxious, or on edge' },
  { id: 2, text: 'Not being able to stop or control worrying' },
  { id: 3, text: 'Worrying too much about different things' },
  { id: 4, text: 'Trouble relaxing' },
  { id: 5, text: 'Being so restless that it is hard to sit still' },
  { id: 6, text: 'Becoming easily annoyed or irritable' },
  { id: 7, text: 'Feeling afraid, as if something awful might happen' },
];

const FUNCTIONAL_OPTIONS = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult',
];

function getSeverity(score) {
  if (score <= 4) return { label: 'Minimal anxiety', variant: 'default' };
  if (score <= 9) return { label: 'Mild anxiety', variant: 'secondary' };
  if (score <= 14) return { label: 'Moderate anxiety', variant: 'destructive' };
  return { label: 'Severe anxiety', variant: 'destructive' };
}

export function GAD7Section() {
  const [answers, setAnswers] = useState(
    GAD7_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: null }), {})
  );
  const [functionalImpact, setFunctionalImpact] = useState(null);

  const totalScore = useMemo(() => {
    return GAD7_QUESTIONS.reduce((sum, q) => {
      const val = answers[q.id];
      const option = GAD7_RESPONSE_OPTIONS.find((o) => o.value === val);
      return sum + (option?.score ?? 0);
    }, 0);
  }, [answers]);

  const severity = getSeverity(totalScore);

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          {GAD7_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
            >
              <p className="text-sm font-medium text-foreground">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                {GAD7_RESPONSE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={answers[q.id] === opt.value ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-md"
                    onClick={() =>
                      setAnswers((p) => ({ ...p, [q.id]: opt.value }))
                    }
                  >
                    {opt.label} {opt.score > 0 && `(${opt.score})`}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-sm font-medium text-foreground mb-3">
            If you checked any problems, how difficult have they made it for you to do your work, take care of things at home, or get along with other people?
          </p>
          <div className="flex flex-wrap gap-2">
            {FUNCTIONAL_OPTIONS.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={functionalImpact === opt ? 'default' : 'outline'}
                size="sm"
                className="rounded-md"
                onClick={() => setFunctionalImpact(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Scoring: 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day. Total score range 0–21.
        </p>

        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">GAD-7 Total Score: {totalScore} / 21</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Severity: </span>
              {severity.label}
            </p>
            {functionalImpact && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Functional impact: </span>
                {functionalImpact}
              </p>
            )}
          </div>
          <Badge variant={severity.variant} className="w-fit">
            {severity.label}
          </Badge>
        </div>
        <ScreeningSaveBar
          screeningType="gad7"
          score={totalScore}
          maxScore={21}
          answers={{ ...answers, functionalImpact }}
        />
      </CardContent>
    </Card>
  );
}
