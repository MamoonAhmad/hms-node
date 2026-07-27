import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useScreeningAnswers } from './useScreeningAnswers';

const WONG_BAKER_FACES = [
  { value: 0, label: 'No Hurt' },
  { value: 1, label: 'Hurts Little Bit' },
  { value: 2, label: 'Hurts Little More' },
  { value: 3, label: 'Hurts Even More' },
  { value: 4, label: 'Hurts Whole Lot' },
  { value: 5, label: 'Hurts Worst' },
];

const defaultAnswers = () => ({
  wongBaker: null,
  numericPain: '',
});

function clampNumeric(raw) {
  if (raw === '' || raw == null) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(10, Math.max(0, n));
}

// Numeric 0-10 rating is primary; Wong-Baker faces (0-5) are scaled to 0-10 as a fallback.
function computeScore(answers) {
  const numeric = clampNumeric(answers?.numericPain);
  if (numeric != null) return numeric;
  if (answers?.wongBaker != null) return answers.wongBaker * 2;
  return 0;
}

function computeResult(score, answers) {
  const hasInput =
    clampNumeric(answers?.numericPain) != null || answers?.wongBaker != null;
  if (!hasInput) return { label: 'Not assessed', variant: 'secondary', interpretation: 'No pain rating entered' };
  if (score === 0) return { label: 'No pain', variant: 'secondary', interpretation: 'No pain' };
  if (score <= 3) return { label: 'Mild pain', variant: 'secondary', interpretation: 'Mild pain (1-3)' };
  if (score <= 6) return { label: 'Moderate pain', variant: 'default', interpretation: 'Moderate pain (4-6)' };
  return { label: 'Severe pain', variant: 'destructive', interpretation: 'Severe pain (7-10)' };
}

function validate(answers) {
  const hasInput =
    clampNumeric(answers?.numericPain) != null || answers?.wongBaker != null;
  return { valid: hasInput, missing: hasInput ? 0 : 1 };
}

function renderHistory(payload) {
  const numeric = clampNumeric(payload?.numericPain);
  return (
    <div className="space-y-1">
      {numeric != null && <p><span className="text-muted-foreground">Numeric: </span>{numeric}/10</p>}
      {payload?.wongBaker != null && (
        <p><span className="text-muted-foreground">Wong-Baker: </span>{payload.wongBaker} – {WONG_BAKER_FACES.find((f) => f.value === payload.wongBaker)?.label}</p>
      )}
    </div>
  );
}

export const definition = {
  sectionType: 'screening_pain',
  name: 'Pain Assessment',
  shortName: 'Pain',
  maxScore: 10,
  scoreLabel: 'Pain Score',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function PainAssessmentSection({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const numericVal = clampNumeric(value.numericPain);

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <h4 className="text-sm font-semibold text-foreground">Wong-Baker FACES® Pain Rating Scale</h4>
        <p className="text-xs text-muted-foreground">
          Explain: Face 0 = no pain, Face 5 = hurts as much as you can imagine. Ask the person to choose the face that best describes how they are feeling. Recommended for age 3 years and older.
        </p>
        <div className="flex flex-wrap gap-2">
          {WONG_BAKER_FACES.map((face) => (
            <Button
              key={face.value}
              type="button"
              variant={value.wongBaker === face.value ? 'default' : 'outline'}
              size="sm"
              className="rounded-md"
              disabled={disabled}
              onClick={() => update({ ...value, wongBaker: face.value })}
            >
              {face.value} – {face.label}
            </Button>
          ))}
        </div>
        {value.wongBaker != null && (
          <p className="text-sm text-foreground">Selected: {value.wongBaker} – {WONG_BAKER_FACES.find((f) => f.value === value.wongBaker)?.label}</p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <h4 className="text-sm font-semibold text-foreground">0–10 Numeric Pain Rating Scale</h4>
        <p className="text-xs text-muted-foreground">0 = No pain, 10 = Worst possible pain</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-baseline gap-2">
            <Label htmlFor="numeric-pain" className="whitespace-nowrap">Pain level (0–10):</Label>
            <Input
              id="numeric-pain"
              type="number"
              min={0}
              max={10}
              step={1}
              placeholder="0–10"
              value={value.numericPain ?? ''}
              disabled={disabled}
              onChange={(e) => update({ ...value, numericPain: e.target.value })}
              className="w-20"
            />
          </div>
          <div className="flex gap-1 text-xs text-muted-foreground">
            <span>0 No pain</span>
            <span className="px-1">–</span>
            <span>Moderate</span>
            <span className="px-1">–</span>
            <span>10 Worst</span>
          </div>
        </div>
        {numericVal != null && (
          <p className="text-sm text-foreground">Numeric score: {numericVal}/10</p>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          Sources: Wong-Baker FACES® (Wong&apos;s Essentials of Pediatric Nursing); 0–10 scale (Pain: Clinical Manual, McCaffery M et al). Pain Assessment Scales provided by the National Initiative on Pain Control™ (NIPC™).
        </p>
      </div>
    </div>
  );
}
