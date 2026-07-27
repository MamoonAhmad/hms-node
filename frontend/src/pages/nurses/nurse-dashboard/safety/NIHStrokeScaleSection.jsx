import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScreeningAnswers } from './useScreeningAnswers';

const NIH_STROKE_ITEMS = [
  { id: '1a', label: '1a. Level of Consciousness', options: ['0 - Alert', '1 - Not alert; arousable by minor stimulation', '2 - Repeated stimulation to attend', '3 - Reflex only or unresponsive'] },
  { id: '1b', label: '1b. LOC Questions (month, age)', options: ['0 - Both correct', '1 - One correct', '2 - Neither correct'] },
  { id: '1c', label: '1c. LOC Commands (open/close eyes, grip/release)', options: ['0 - Both tasks', '1 - One task', '2 - Neither'] },
  { id: '2', label: '2. Best Gaze', options: ['0 - Normal', '1 - Partial gaze palsy', '2 - Forced deviation or total gaze paresis'] },
  { id: '3', label: '3. Visual', options: ['0 - No visual loss', '1 - Partial hemianopia', '2 - Complete hemianopia', '3 - Bilateral hemianopia'] },
  { id: '4', label: '4. Facial Palsy', options: ['0 - Normal', '1 - Minor paralysis', '2 - Partial paralysis', '3 - Complete paralysis'] },
  { id: '5a', label: '5a. Motor Arm (Left)', options: ['0 - No drift 10 sec', '1 - Drift before 10 sec', '2 - Some effort vs gravity', '3 - No effort vs gravity', '4 - No movement', 'UN - Untestable'] },
  { id: '5b', label: '5b. Motor Arm (Right)', options: ['0 - No drift 10 sec', '1 - Drift before 10 sec', '2 - Some effort vs gravity', '3 - No effort vs gravity', '4 - No movement', 'UN - Untestable'] },
  { id: '6a', label: '6a. Motor Leg (Left)', options: ['0 - No drift 5 sec', '1 - Drift by 5 sec', '2 - Some effort vs gravity', '3 - No effort vs gravity', '4 - No movement', 'UN - Untestable'] },
  { id: '6b', label: '6b. Motor Leg (Right)', options: ['0 - No drift 5 sec', '1 - Drift by 5 sec', '2 - Some effort vs gravity', '3 - No effort vs gravity', '4 - No movement', 'UN - Untestable'] },
  { id: '7', label: '7. Limb Ataxia', options: ['0 - Absent', '1 - One limb', '2 - Two limbs', 'UN - Untestable'] },
  { id: '8', label: '8. Sensory', options: ['0 - Normal', '1 - Mild-moderate loss', '2 - Severe to total loss'] },
  { id: '9', label: '9. Best Language', options: ['0 - No aphasia', '1 - Mild-moderate aphasia', '2 - Severe aphasia', '3 - Mute/global aphasia'] },
  { id: '10', label: '10. Dysarthria', options: ['0 - Normal', '1 - Mild-moderate', '2 - Severe/unintelligible', 'UN - Untestable'] },
  { id: '11', label: '11. Extinction and Inattention', options: ['0 - No abnormality', '1 - Inattention in one modality', '2 - Profound hemi-inattention'] },
];

const MAX_SCORE = 42;

// "Untestable" (UN) is not added to the total, per standard NIHSS scoring.
function parseItemScore(val) {
  if (!val || val.startsWith('UN')) return 0;
  const num = parseInt(val, 10);
  return Number.isNaN(num) ? 0 : num;
}

const defaultAnswers = () => ({
  scores: NIH_STROKE_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: '' }), {}),
  examDate: '',
  interval: '',
  administering: '',
});

function computeScore(answers) {
  const scores = answers?.scores || {};
  return NIH_STROKE_ITEMS.reduce((sum, item) => sum + parseItemScore(scores[item.id]), 0);
}

function computeResult(score) {
  if (score === 0) return { label: 'No stroke symptoms', variant: 'secondary', interpretation: 'No stroke symptoms' };
  if (score <= 4) return { label: 'Minor stroke', variant: 'secondary', interpretation: 'Minor stroke' };
  if (score <= 15) return { label: 'Moderate stroke', variant: 'default', interpretation: 'Moderate stroke' };
  if (score <= 20) return { label: 'Moderate to severe stroke', variant: 'destructive', interpretation: 'Moderate to severe stroke' };
  return { label: 'Severe stroke', variant: 'destructive', interpretation: 'Severe stroke' };
}

function validate(answers) {
  const scores = answers?.scores || {};
  const missing = NIH_STROKE_ITEMS.filter((item) => !scores[item.id]).length;
  return { valid: missing === 0, missing };
}

function renderHistory(payload) {
  const scores = payload?.scores || {};
  const answered = NIH_STROKE_ITEMS.filter((item) => scores[item.id]).length;
  return (
    <div className="space-y-1">
      <p><span className="text-muted-foreground">Items scored: </span>{answered} / {NIH_STROKE_ITEMS.length}</p>
      {payload?.interval && <p><span className="text-muted-foreground">Interval: </span>{payload.interval}</p>}
      {payload?.administering && <p><span className="text-muted-foreground">Administered by: </span>{payload.administering}</p>}
    </div>
  );
}

export const definition = {
  sectionType: 'screening_nih_stroke',
  name: 'NIH Stroke Scale',
  shortName: 'NIHSS',
  maxScore: MAX_SCORE,
  scoreLabel: 'NIH Stroke Scale Total',
  defaultAnswers,
  computeScore,
  computeResult,
  validate,
  renderHistory,
};

export function NIHStrokeScaleSection({ answers, onChange, disabled }) {
  const [value, update] = useScreeningAnswers(answers, onChange, defaultAnswers);
  const scores = value.scores || {};

  const setScore = (id, val) => update({ ...value, scores: { ...scores, [id]: val } });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Date of Exam</Label>
          <Input
            type="date"
            value={value.examDate || ''}
            disabled={disabled}
            onChange={(e) => update({ ...value, examDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Interval</Label>
          <Select
            value={value.interval || ''}
            onValueChange={(v) => update({ ...value, interval: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baseline">Baseline</SelectItem>
              <SelectItem value="2h">2 hours post treatment</SelectItem>
              <SelectItem value="24h">24 hours post onset ±20 min</SelectItem>
              <SelectItem value="7-10d">7-10 days</SelectItem>
              <SelectItem value="3m">3 months</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Person Administering Scale</Label>
          <Input
            placeholder="Name"
            value={value.administering || ''}
            disabled={disabled}
            onChange={(e) => update({ ...value, administering: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        {NIH_STROKE_ITEMS.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <Label className="text-sm font-medium text-foreground shrink-0 sm:w-56">
              {item.label}
            </Label>
            <Select
              value={scores[item.id] || ''}
              onValueChange={(v) => setScore(item.id, v)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                {item.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Scores reflect what the patient does, not what the clinician thinks the patient can do. Do not coach the patient (except where indicated). Untestable (UN) items score as 0 toward the total.
      </p>
    </div>
  );
}
