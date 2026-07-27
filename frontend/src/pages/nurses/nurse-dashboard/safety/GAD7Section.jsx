import { Button } from '@/components/ui/button';
import { useScreeningAnswers } from './useScreeningAnswers';

// Official GAD-7 scoring: 0-3 per item, total range 0-21.
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

const defaultAnswers = () => ({
  responses: GAD7_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}),
  functionalImpact: null,
});

function computeScore(answers) {
  const responses = answers?.responses || {};
  return GAD7_QUESTIONS.reduce((sum, q) => {
    const opt = GAD7_RESPONSE_OPTIONS.find((o) => o.value === responses[q.id]);
    return sum + (opt?.score ?? 0);
  }, 0);
}

function computeResult(score) {
  if (score <= 4) return { label: 'Minimal anxiety', variant: 'secondary', interpretation: 'Minimal anxiety - no intervention typically required' };
  if (score <= 9) return { label: 'Mild anxiety', variant: 'secondary', interpretation: 'Mild anxiety - monitor; repeat GAD-7 at follow-up' };
  if (score <= 14) return { label: 'Moderate anxiety', variant: 'default', interpretation: 'Moderate anxiety - probable clinically significant condition; further evaluation' };
  return { label: 'Severe anxiety', variant: 'destructive', interpretation: 'Severe anxiety - active treatment warranted' };
}

function validate(answers) {
  const responses = answers?.responses || {};
  const missing = GAD7_QUESTIONS.filter((q) => responses[q.id] == null).length;
  return { valid: missing === 0, missing };
}

function renderHistory(payload) {
  const responses = payload?.responses || {};
  const answered = GAD7_QUESTIONS.filter((q) => responses[q.id] != null).length;
  return (
    <div className="space-y-1">
      <p><span className="text-muted-foreground">Answered: </span>{answered} / {GAD7_QUESTIONS.length}</p>
      {payload?.functionalImpact && (
        <p><span className="text-muted-foreground">Functional impact: </span>{payload.functionalImpact}</p>
      )}
    </div>
  );
}

export const definition = {
  sectionType: 'screening_gad7',
  name: 'GAD-7 Anxiety Severity',
  shortName: 'GAD-7',
  maxScore: 21,
  scoreLabel: 'GAD-7 Total Score',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function GAD7Section({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const responses = value.responses || {};

  const setResponse = (id, val) =>
    update({ ...value, responses: { ...responses, [id]: val } });

  return (
    <div className="space-y-6">
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
                  variant={responses[q.id] === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-md"
                  disabled={disabled}
                  onClick={() => setResponse(q.id, opt.value)}
                >
                  {opt.label} ({opt.score})
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
              variant={value.functionalImpact === opt ? 'default' : 'outline'}
              size="sm"
              className="rounded-md"
              disabled={disabled}
              onClick={() => update({ ...value, functionalImpact: opt })}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Scoring: 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day. Total score range 0–21.
      </p>
    </div>
  );
}
