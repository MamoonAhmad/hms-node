import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScreeningAnswers } from './useScreeningAnswers';

const FOOD_INSECURITY_OPTIONS = [
  'OFTEN TRUE',
  'SOMETIMES TRUE',
  'NEVER TRUE',
  'PATIENT UNABLE TO ANSWER',
  'PATIENT DECLINED',
];

const AFFIRMATIVE_OPTIONS = ['OFTEN TRUE', 'SOMETIMES TRUE'];

const FOOD_QUESTIONS = [
  {
    id: 'food-run-out',
    label:
      'Within the past 12 months we worried whether our food would run out before we got money to buy more.',
  },
  {
    id: 'food-didnt-last',
    label:
      "Within the past 12 months the food we bought just didn't last and we didn't have money to get more.",
  },
];

const WHO_ANSWERED_OPTIONS = [
  'AUNT', 'BROTHER', 'DAUGHTER', 'FATHER', 'FRIEND', 'GRANDDAUGHTER', 'GRANDFATHER',
  'GRANDMOTHER', 'GRANDSON', 'LEGAL GUARDIAN', 'MOTHER', 'OTHER', 'STEP FATHER',
  'SISTER', 'SELF', 'STEP MOTHER', 'SON', 'SPOUSE', 'UNCLE', 'EMPLOYER',
  'UNVERIFIED CONTACT', 'TRANSPLANT COORDINATOR', 'VISIT CONTACT',
];

const defaultAnswers = () => ({
  food: FOOD_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}),
  whoAnswered: null,
});

// Hunger Vital Sign: 1 point per "Often true" / "Sometimes true" (range 0-2).
function computeScore(answers) {
  const food = answers?.food || {};
  return FOOD_QUESTIONS.reduce(
    (sum, q) => sum + (AFFIRMATIVE_OPTIONS.includes(food[q.id]) ? 1 : 0),
    0,
  );
}

// A score of 1 or 2 is a positive screen for food insecurity.
function computeResult(score) {
  if (score >= 1) {
    return { label: 'Positive - food insecurity', variant: 'destructive', interpretation: 'Positive screen; refer to social work / food resources' };
  }
  return { label: 'Negative', variant: 'secondary', interpretation: 'No food insecurity identified' };
}

function validate(answers) {
  const food = answers?.food || {};
  const missing = FOOD_QUESTIONS.filter((q) => food[q.id] == null).length;
  return { valid: missing === 0, missing };
}

function renderHistory(payload) {
  const food = payload?.food || {};
  return (
    <div className="space-y-1">
      {FOOD_QUESTIONS.map((q) => (
        <p key={q.id}><span className="text-muted-foreground">{q.id}: </span>{food[q.id] || '—'}</p>
      ))}
      {payload?.whoAnswered && <p><span className="text-muted-foreground">Answered by: </span>{payload.whoAnswered}</p>}
    </div>
  );
}

export const definition = {
  sectionType: 'screening_hunger',
  name: 'Hunger Screening',
  shortName: 'Hunger',
  maxScore: 2,
  scoreLabel: 'Hunger Vital Sign',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function HungerScreeningSection({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const food = value.food || {};

  const setFood = (id, val) => update({ ...value, food: { ...food, [id]: val } });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Food Insecurity</h3>
        {FOOD_QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
          >
            <p className="text-sm font-medium text-foreground">{q.label}</p>
            <div className="flex flex-wrap gap-2">
              {FOOD_INSECURITY_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  type="button"
                  variant={food[q.id] === opt ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-md"
                  disabled={disabled}
                  onClick={() => setFood(q.id, opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Who answered the hunger screening questions?
        </h3>
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
          <div className="flex flex-wrap gap-2">
            {WHO_ANSWERED_OPTIONS.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={value.whoAnswered === opt ? 'default' : 'outline'}
                size="sm"
                className={cn('rounded-md')}
                disabled={disabled}
                onClick={() => update({ ...value, whoAnswered: opt })}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
