import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useScreeningAnswers } from './useScreeningAnswers';

// Official PHQ-9 scoring: 0-3 per item, total range 0-27.
const PHQ9_RESPONSE_OPTIONS = [
  { value: '0', label: 'NOT AT ALL', score: 0 },
  { value: '1', label: 'SEVERAL DAYS', score: 1 },
  { value: '2', label: 'MORE THAN HALF THE DAYS', score: 2 },
  { value: '3', label: 'NEARLY EVERY DAY', score: 3 },
];

const PHQ9_QUESTIONS = [
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

const defaultAnswers = () => ({
  responses: PHQ9_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}),
  introChecked: true,
});

function computeScore(answers) {
  const responses = answers?.responses || {};
  return PHQ9_QUESTIONS.reduce((sum, q) => {
    const opt = PHQ9_RESPONSE_OPTIONS.find((o) => o.value === responses[q.id]);
    return sum + (opt?.score ?? 0);
  }, 0);
}

function computeResult(score) {
  if (score <= 4) return { label: 'Minimal', variant: 'secondary', interpretation: 'Minimal depression - may not require treatment' };
  if (score <= 9) return { label: 'Mild', variant: 'secondary', interpretation: 'Mild depression - watchful waiting; repeat PHQ-9 at follow-up' };
  if (score <= 14) return { label: 'Moderate', variant: 'default', interpretation: 'Moderate depression - treatment plan, follow-up and/or referral' };
  if (score <= 19) return { label: 'Moderately severe', variant: 'destructive', interpretation: 'Moderately severe depression - active treatment and follow-up' };
  return { label: 'Severe', variant: 'destructive', interpretation: 'Severe depression - immediate initiation of treatment and referral' };
}

function validate(answers) {
  const responses = answers?.responses || {};
  const missing = PHQ9_QUESTIONS.filter((q) => responses[q.id] == null).length;
  return { valid: missing === 0, missing };
}

function renderHistory(payload) {
  const responses = payload?.responses || {};
  const answered = PHQ9_QUESTIONS.filter((q) => responses[q.id] != null).length;
  return (
    <div className="space-y-1">
      <p><span className="text-muted-foreground">Answered: </span>{answered} / {PHQ9_QUESTIONS.length}</p>
      {payload?.introChecked === false && (
        <p className="text-muted-foreground">Intro statement not confirmed</p>
      )}
    </div>
  );
}

export const definition = {
  sectionType: 'screening_phq9',
  name: 'PHQ-9 Depression Screening',
  shortName: 'PHQ-9',
  maxScore: 27,
  scoreLabel: 'PHQ-9 Total Score',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function PHQ9Section({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const responses = value.responses || {};

  const setResponse = (id, val) =>
    update({ ...value, responses: { ...responses, [id]: val } });

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-3">
        <Checkbox
          checked={value.introChecked !== false}
          onCheckedChange={(c) => update({ ...value, introChecked: !!c })}
          className="mt-0.5"
          disabled={disabled}
        />
        <span className="text-sm text-foreground">
          Over the last 2 weeks, how often have you been bothered by any of the
          following problems?
        </span>
      </label>

      <div className="space-y-4">
        {PHQ9_QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
          >
            <p className="text-sm font-medium text-foreground">{q.label}</p>
            <div className="flex flex-wrap gap-2">
              {PHQ9_RESPONSE_OPTIONS.map((opt) => (
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
    </div>
  );
}
