import { Button } from '@/components/ui/button';
import { useScreeningAnswers } from './useScreeningAnswers';

const DAST10_QUESTIONS = [
  { id: 1, text: 'Have you used drugs other than those required for medical reasons?' },
  { id: 2, text: 'Do you abuse more than one drug at a time?' },
  { id: 3, text: 'Are you always able to stop using drugs when you want to?', scoredOn: 'no' },
  { id: 4, text: 'Have you ever had blackouts or flashbacks as a result of drug use?' },
  { id: 5, text: 'Do you ever feel bad or guilty about your drug use?' },
  { id: 6, text: 'Does your spouse (or parents) ever complain about your involvement with drugs?' },
  { id: 7, text: 'Have you neglected your family because of your use of drugs?' },
  { id: 8, text: 'Have you engaged in illegal activities in order to obtain drugs?' },
  { id: 9, text: 'Have you ever experienced withdrawal symptoms (felt sick) when you stopped taking drugs?' },
  { id: 10, text: 'Have you had medical problems as a result of your drug use (e.g., memory loss, hepatitis, convulsions, bleeding)?' },
];

const defaultAnswers = () => ({
  responses: DAST10_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}),
});

// 1 point for each affirmative response; question 3 is reverse-scored ("No" = 1 point).
function computeScore(answers) {
  const responses = answers?.responses || {};
  return DAST10_QUESTIONS.reduce((sum, q) => {
    const val = responses[q.id];
    if (val == null) return sum;
    const scoredValue = q.scoredOn || 'yes';
    return sum + (val === scoredValue ? 1 : 0);
  }, 0);
}

function computeResult(score) {
  if (score === 0) return { label: 'No problems reported', variant: 'secondary', interpretation: 'No action required at this time' };
  if (score <= 2) return { label: 'Low level', variant: 'secondary', interpretation: 'Monitor, re-assess at a later date' };
  if (score <= 5) return { label: 'Moderate level', variant: 'default', interpretation: 'Further investigation recommended' };
  if (score <= 8) return { label: 'Substantial level', variant: 'destructive', interpretation: 'Intensive assessment recommended' };
  return { label: 'Severe level', variant: 'destructive', interpretation: 'Intensive assessment recommended' };
}

function validate(answers) {
  const responses = answers?.responses || {};
  const missing = DAST10_QUESTIONS.filter((q) => responses[q.id] == null).length;
  return { valid: missing === 0, missing };
}

function renderHistory(payload) {
  const responses = payload?.responses || {};
  const answered = DAST10_QUESTIONS.filter((q) => responses[q.id] != null).length;
  return (
    <p><span className="text-muted-foreground">Answered: </span>{answered} / {DAST10_QUESTIONS.length}</p>
  );
}

export const definition = {
  sectionType: 'screening_dast10',
  name: 'Drug Abuse Screening (DAST-10)',
  shortName: 'DAST-10',
  maxScore: 10,
  scoreLabel: 'DAST-10 Score',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function DAST10Section({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const responses = value.responses || {};

  const setResponse = (id, val) =>
    update({ ...value, responses: { ...responses, [id]: val } });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        &quot;Drug abuse&quot; refers to the use of prescribed or over-the-counter drugs in excess of the directions, and any nonmedical use of drugs (e.g. cannabis, solvents, tranquilizers, barbiturates, cocaine, stimulants, hallucinogens, narcotics). Questions do not include alcoholic beverages.
      </p>

      <div className="space-y-4">
        {DAST10_QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
          >
            <p className="text-sm font-medium text-foreground">{q.id}. {q.text}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={responses[q.id] === 'yes' ? 'default' : 'outline'}
                size="sm"
                className="rounded-md"
                disabled={disabled}
                onClick={() => setResponse(q.id, 'yes')}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={responses[q.id] === 'no' ? 'default' : 'outline'}
                size="sm"
                className="rounded-md"
                disabled={disabled}
                onClick={() => setResponse(q.id, 'no')}
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
    </div>
  );
}
