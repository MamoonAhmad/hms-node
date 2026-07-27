import { useScreeningAnswers } from './useScreeningAnswers';

const SUICIDE_QUESTIONS = [
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
    label: '6.1 Was this within the past three months?',
    dependsOn: 'q6',
  },
];

const defaultAnswers = () => ({
  responses: {},
});

function isVisible(q, responses) {
  if (q.dependsOn === 'q2' && responses.q2 !== 'yes') return false;
  if (q.id === 'q6_1' && responses.q6 !== 'yes') return false;
  return true;
}

// Score = count of positive risk responses (excludes the timing clarifier q6_1).
function computeScore(answers) {
  const responses = answers?.responses || {};
  return SUICIDE_QUESTIONS.filter(
    (q) => q.id !== 'q6_1' && isVisible(q, responses) && responses[q.id] === 'yes',
  ).length;
}

// C-SSRS-style risk stratification driven by which items are positive.
function computeResult(_score, answers) {
  const responses = answers?.responses || {};
  const recentBehavior = responses.q6 === 'yes' && responses.q6_1 === 'yes';
  if (responses.q4 === 'yes' || responses.q5 === 'yes' || recentBehavior) {
    return { label: 'High risk', variant: 'destructive', interpretation: 'Immediate notification of physician and/or behavioral health; initiate patient safety precautions' };
  }
  if (responses.q3 === 'yes') {
    return { label: 'Moderate risk', variant: 'destructive', interpretation: 'Behavioral health referral; do not leave patient unattended pending evaluation' };
  }
  if (responses.q2 === 'yes' || responses.q6 === 'yes') {
    return { label: 'Low-moderate risk', variant: 'default', interpretation: 'Behavioral health referral at discharge' };
  }
  if (responses.q1 === 'yes') {
    return { label: 'Low risk', variant: 'secondary', interpretation: 'Passive ideation reported; document and monitor' };
  }
  return { label: 'No acute risk', variant: 'secondary', interpretation: 'No suicidal ideation or behavior reported' };
}

function validate(answers) {
  const responses = answers?.responses || {};
  const required = SUICIDE_QUESTIONS.filter((q) => isVisible(q, responses));
  const missing = required.filter((q) => responses[q.id] == null).length;
  return { valid: missing === 0, missing };
}

function renderHistory(payload) {
  const responses = payload?.responses || {};
  const positives = SUICIDE_QUESTIONS.filter(
    (q) => q.id !== 'q6_1' && responses[q.id] === 'yes',
  ).length;
  return (
    <p><span className="text-muted-foreground">Positive responses: </span>{positives}</p>
  );
}

export const definition = {
  sectionType: 'screening_suicide',
  name: 'Suicide Assessment',
  shortName: 'Suicide',
  maxScore: 6,
  scoreLabel: 'Positive Responses',
  scoreIsPrimary: false,
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function SuicideAssessmentSection({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const responses = value.responses || {};

  const setResponse = (id, val) =>
    update({ ...value, responses: { ...responses, [id]: val } });

  return (
    <div className="space-y-3">
      {SUICIDE_QUESTIONS.map((q) =>
        isVisible(q, responses) ? (
          <div key={q.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
            <p className="text-sm font-medium text-foreground">{q.label}</p>
            {q.note && <p className="text-xs text-muted-foreground">{q.note}</p>}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={`suicide-${q.id}`}
                  value="yes"
                  className="h-4 w-4"
                  disabled={disabled}
                  checked={responses[q.id] === 'yes'}
                  onChange={() => setResponse(q.id, 'yes')}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={`suicide-${q.id}`}
                  value="no"
                  className="h-4 w-4"
                  disabled={disabled}
                  checked={responses[q.id] === 'no'}
                  onChange={() => setResponse(q.id, 'no')}
                />
                No
              </label>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
