import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useScreeningAnswers } from './useScreeningAnswers';

const FALL_RISK_QUESTIONS = [
  { id: 'presented-due-to-fall', label: 'Presented due to fall (syncope, seizure, LOC)', yesPoints: 20 },
  { id: 'recent-fall', label: 'History of fall (within last 3 months)', yesPoints: 15 },
  { id: 'altered-mental-status', label: 'Altered mental status', yesPoints: 15 },
  { id: 'impaired-mobility', label: 'Impaired mobility', yesPoints: 15 },
  { id: 'nurse-judgement', label: 'Nurse judgement (incontinence, dizziness, risky meds, etc.)', yesPoints: 10 },
  { id: 'fsi-category', label: 'FSI Category I', yesPoints: 10 },
  { id: 'yellow-band', label: 'Yellow Fall Risk ID band applied', yesPoints: 0 },
];

const MAX_SCORE = FALL_RISK_QUESTIONS.reduce((sum, q) => sum + q.yesPoints, 0);

const defaultAnswers = () => ({
  responses: FALL_RISK_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 'no' }), {}),
  notes: '',
});

function computeScore(answers) {
  const responses = answers?.responses || {};
  return FALL_RISK_QUESTIONS.reduce(
    (sum, q) => (responses[q.id] === 'yes' ? sum + q.yesPoints : sum),
    0,
  );
}

// Any positive high-risk trigger (>=15 pts) flags high fall risk; otherwise banded by total.
function computeResult(score, answers) {
  const responses = answers?.responses || {};
  const hasHighTrigger = FALL_RISK_QUESTIONS.some(
    (q) => q.yesPoints >= 15 && responses[q.id] === 'yes',
  );
  if (hasHighTrigger || score >= 15) {
    return { label: 'High fall risk', variant: 'destructive', interpretation: 'Implement high fall-risk precautions and apply yellow ID band' };
  }
  if (score >= 10) {
    return { label: 'Moderate fall risk', variant: 'default', interpretation: 'Implement standard fall precautions and reassess' };
  }
  return { label: 'Low fall risk', variant: 'secondary', interpretation: 'Standard care; reassess as condition changes' };
}

// Yes/No questions default to "no", so the assessment is always answerable.
function validate() {
  return { valid: true, missing: 0 };
}

function renderHistory(payload) {
  const responses = payload?.responses || {};
  const triggers = FALL_RISK_QUESTIONS.filter((q) => responses[q.id] === 'yes');
  return (
    <div className="space-y-1">
      <p><span className="text-muted-foreground">Positive triggers: </span>{triggers.length}</p>
      {payload?.notes && <p><span className="text-muted-foreground">Notes: </span>{payload.notes}</p>}
    </div>
  );
}

export const definition = {
  sectionType: 'screening_fall_risk',
  name: 'Fall Risk',
  shortName: 'Fall Risk',
  maxScore: MAX_SCORE,
  scoreLabel: 'Fall Risk Score',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function FallRiskSection({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const responses = value.responses || {};

  const setResponse = (id, val) =>
    update({ ...value, responses: { ...responses, [id]: val } });

  return (
    <div className="space-y-3">
      {FALL_RISK_QUESTIONS.map((q) => (
        <div key={q.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{q.label}</p>
            <span className="text-xs text-muted-foreground">Yes = {q.yesPoints} pts</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`fall-${q.id}`}
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
                name={`fall-${q.id}`}
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
      ))}
      <div className="space-y-2">
        <Label htmlFor="fall-notes">Fall Risk Notes</Label>
        <Textarea
          id="fall-notes"
          placeholder="Add notes"
          value={value.notes || ''}
          disabled={disabled}
          onChange={(e) => update({ ...value, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
