import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart } from 'lucide-react';

// Button labels as in screenshot; scores per user: Not at all=1, Several days=2, More than half=3, Nearly every day=4
const PHQ9_RESPONSE_OPTIONS = [
  { value: '1', label: 'NOT AT ALL', score: 1 },
  { value: '2', label: 'SEVERAL DAYS', score: 2 },
  { value: '3', label: 'MORE THAN HALF THE DAYS', score: 3 },
  { value: '4', label: 'NEARLY EVERY DAY', score: 4 },
];

const phq9Questions = [
  { id: 1, label: 'Little interest or pleasure in doing things' },
  { id: 2, label: 'Feeling down, depressed, or hopeless' },
  { id: 3, label: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 4, label: 'Feeling tired or having little energy' },
  { id: 5, label: 'Poor appetite or overeating' },
  {
    id: 6,
    label:
      'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
  },
  {
    id: 7,
    label:
      'Trouble concentrating on things, such as reading the newspaper or watching television',
  },
  {
    id: 8,
    label:
      'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
  },
  {
    id: 9,
    label: 'Thoughts that you would be better off dead, or of hurting yourself',
  },
];

function getSeverity(score) {
  if (score <= 4) return { label: 'Minimal', variant: 'default' };
  if (score <= 9) return { label: 'Mild', variant: 'secondary' };
  if (score <= 14) return { label: 'Moderate', variant: 'secondary' };
  if (score <= 19) return { label: 'Moderately severe', variant: 'destructive' };
  return { label: 'Severe', variant: 'destructive' };
}

function getInterpretation(score) {
  if (score <= 4) return 'Minimal depression - may not require treatment';
  if (score <= 9) return 'Mild depression - watchful waiting; repeat PHQ-9 at follow-up';
  if (score <= 14) return 'Moderate depression - treatment plan, follow-up and/or referral';
  if (score <= 19) return 'Moderately severe depression - active treatment and follow-up';
  return 'Severe depression - immediate initiation of treatment and referral';
}

export function PHQ9Section() {
  const [introChecked, setIntroChecked] = useState(true);
  const [answers, setAnswers] = useState(
    phq9Questions.reduce((acc, q) => ({ ...acc, [q.id]: null }), {})
  );

  const totalScore = useMemo(() => {
    return phq9Questions.reduce((sum, q) => {
      const val = answers[q.id];
      const option = PHQ9_RESPONSE_OPTIONS.find((o) => o.value === val);
      return sum + (option?.score ?? 0);
    }, 0);
  }, [answers]);

  const severity = getSeverity(totalScore);
  const interpretation = getInterpretation(totalScore);

  return (
    <Card>
      <CardHeader className="rounded-t-lg border-b bg-primary px-6 py-4 text-primary-foreground">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            <Heart className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-lg font-semibold text-primary-foreground">
              PHQ-9 Depression Screening Assessment
            </CardTitle>
            <p className="text-sm text-primary-foreground/90">
              Patient Health Questionnaire - 9 depression screening
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <Input id="phq9-timestamp" className="hidden" disabled />

        {/* Intro with checkbox */}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-3">
          <Checkbox
            checked={introChecked}
            onCheckedChange={(c) => setIntroChecked(!!c)}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground">
            Over the last 2 weeks, how often have you been bothered by any of the
            following problems?
          </span>
        </label>

        {/* Questions with button options */}
        <div className="space-y-4">
          {phq9Questions.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-xs font-medium text-primary-foreground">
                  {q.id}
                </span>
                <p className="text-sm font-medium text-foreground">{q.label}</p>
              </div>
              <div className="flex flex-wrap gap-2 pl-8">
                {PHQ9_RESPONSE_OPTIONS.map((opt) => (
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
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Score and interpretation footer */}
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              PHQ-9 Total Score
            </p>
            <p className="text-sm text-muted-foreground">
              Score: {totalScore} / 27
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Interpretation: </span>
              {interpretation}
            </p>
          </div>
          <Badge variant={severity.variant} className="w-fit">
            {severity.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
