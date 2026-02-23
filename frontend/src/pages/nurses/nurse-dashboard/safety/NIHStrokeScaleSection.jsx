import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity } from 'lucide-react';

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

function parseScore(val) {
  if (!val || val === 'UN - Untestable') return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
}

export function NIHStrokeScaleSection() {
  const [scores, setScores] = useState(
    NIH_STROKE_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: '' }), {})
  );
  const [examDate, setExamDate] = useState('');
  const [interval, setInterval] = useState('');
  const [administering, setAdministering] = useState('');

  const totalScore = useMemo(() => {
    return NIH_STROKE_ITEMS.reduce((sum, item) => {
      const val = scores[item.id];
      return sum + parseScore(val);
    }, 0);
  }, [scores]);

  return (
    <Card>
      <CardHeader className="rounded-t-lg border-b bg-primary px-6 py-4 text-primary-foreground">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            <Activity className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-lg font-semibold text-primary-foreground">
              NIH Stroke Scale
            </CardTitle>
            <p className="text-sm text-primary-foreground/90">
              Administer items in order. Record performance after each subscale. Do not go back and change scores.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Date of Exam</Label>
            <Input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Interval</Label>
            <Select value={interval} onValueChange={setInterval}>
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
              value={administering}
              onChange={(e) => setAdministering(e.target.value)}
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
                value={scores[item.id]}
                onValueChange={(v) => setScores((p) => ({ ...p, [item.id]: v }))}
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

        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground">NIH Stroke Scale Total Score: {totalScore}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Scores reflect what the patient does, not what the clinician thinks the patient can do. Do not coach the patient (except where indicated).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
