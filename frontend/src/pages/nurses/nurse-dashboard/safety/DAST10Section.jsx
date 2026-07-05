import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScreeningSaveBar } from '@/pages/patient-dashboard/intake/ScreeningSaveBar';

const DAST10_QUESTIONS = [
  { id: 1, text: 'Have you used drugs other than those required for medical reasons?' },
  { id: 2, text: 'Do you abuse more than one drug at a time?' },
  { id: 3, text: 'Are you unable to stop abusing drugs when you want to?' }, // No = 1 point
  { id: 4, text: 'Have you ever had blackouts or flashbacks as a result of drug use?' },
  { id: 5, text: 'Do you ever feel bad or guilty about your drug use?' },
  { id: 6, text: 'Does your spouse (or parents) ever complain about your involvement with drugs?' },
  { id: 7, text: 'Have you neglected your family because of your use of drugs?' },
  { id: 8, text: 'Have you engaged in illegal activities in order to obtain drugs?' },
  { id: 9, text: 'Have you ever experienced withdrawal symptoms (felt sick) when you stopped taking drugs?' },
  { id: 10, text: 'Have you had medical problems as a result of your drug use (e.g., memory loss, hepatitis, convulsions, bleeding)?' },
];

function getInterpretation(score) {
  if (score === 0) return { label: 'No problems reported', action: 'None at this time', variant: 'default' };
  if (score <= 2) return { label: 'Low Level', action: 'Monitor, re-assess at a later date', variant: 'secondary' };
  if (score <= 5) return { label: 'Moderate level', action: 'Further Investigation', variant: 'destructive' };
  if (score <= 8) return { label: 'Substantial level', action: 'Intensive assessment', variant: 'destructive' };
  return { label: 'Severe level', action: 'Intensive assessment', variant: 'destructive' };
}

export function DAST10Section() {
  const [answers, setAnswers] = useState(
    DAST10_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: null }), {})
  );

  const totalScore = useMemo(() => {
    return DAST10_QUESTIONS.reduce((sum, q) => {
      const val = answers[q.id];
      if (val == null) return sum;
      if (q.id === 3) return sum + (val === 'no' ? 1 : 0);
      return sum + (val === 'yes' ? 1 : 0);
    }, 0);
  }, [answers]);

  const interpretation = getInterpretation(totalScore);

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <p className="text-sm text-muted-foreground">
          &quot;Drug abuse&quot; refers to the use of prescribed or over-the-counter drugs in excess of the directions, and any nonmedical use of drugs (e.g. cannabis, solvents, tranquilizers, barbiturates, cocaine, stimulants, hallucinogens, narcotics). Questions do not include alcoholic beverages.
        </p>

        <div className="space-y-4">
          {DAST10_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
            >
              <p className="text-sm font-medium text-foreground">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={answers[q.id] === 'yes' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-md"
                  onClick={() => setAnswers((p) => ({ ...p, [q.id]: 'yes' }))}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={answers[q.id] === 'no' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-md"
                  onClick={() => setAnswers((p) => ({ ...p, [q.id]: 'no' }))}
                >
                  No
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Scoring: 1 point for each &quot;Yes&quot; except question 3, for which &quot;No&quot; receives 1 point.
        </p>

        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Score: {totalScore} / 10</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Level: </span>
              {interpretation.label}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Suggested action: </span>
              {interpretation.action}
            </p>
          </div>
          <Badge variant={interpretation.variant} className="w-fit">
            {interpretation.label}
          </Badge>
        </div>
        <ScreeningSaveBar
          screeningType="dast10"
          score={totalScore}
          maxScore={10}
          answers={answers}
          notes={interpretation.action}
        />
      </CardContent>
    </Card>
  );
}
