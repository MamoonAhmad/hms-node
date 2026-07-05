import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScreeningSaveBar } from '@/pages/patient-dashboard/intake/ScreeningSaveBar';

const WONG_BAKER_FACES = [
  { value: 0, label: 'No Hurt' },
  { value: 1, label: 'Hurts Little Bit' },
  { value: 2, label: 'Hurts Little More' },
  { value: 3, label: 'Hurts Even More' },
  { value: 4, label: 'Hurts Whole Lot' },
  { value: 5, label: 'Hurts Worst' },
];

export function PainAssessmentSection() {
  const [wongBaker, setWongBaker] = useState(null);
  const [numericPain, setNumericPain] = useState('');

  const numericVal = numericPain === '' ? null : Math.min(10, Math.max(0, parseInt(numericPain, 10)));

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Wong-Baker FACES Pain Rating Scale */}
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
                variant={wongBaker === face.value ? 'default' : 'outline'}
                size="sm"
                className="rounded-md"
                onClick={() => setWongBaker(face.value)}
              >
                {face.value} – {face.label}
              </Button>
            ))}
          </div>
          {wongBaker !== null && (
            <p className="text-sm text-foreground">Selected: {wongBaker} – {WONG_BAKER_FACES.find((f) => f.value === wongBaker)?.label}</p>
          )}
        </div>

        {/* 0–10 Numeric Pain Rating Scale */}
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <h4 className="text-sm font-semibold text-foreground">0–10 Numeric Pain Rating Scale</h4>
          <p className="text-xs text-muted-foreground">
            0 = No pain, 10 = Worst possible pain
          </p>
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
                value={numericPain}
                onChange={(e) => setNumericPain(e.target.value)}
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
          {numericVal !== null && !isNaN(numericVal) && (
            <p className="text-sm text-foreground">Numeric score: {numericVal}/10</p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Sources: Wong-Baker FACES® (Wong’s Essentials of Pediatric Nursing); 0–10 scale (Pain: Clinical Manual, McCaffery M et al). Pain Assessment Scales provided by the National Initiative on Pain Control™ (NIPC™).
          </p>
        </div>
        <ScreeningSaveBar
          screeningType="pain"
          score={numericVal ?? wongBaker}
          maxScore={10}
          answers={{ wongBaker, numericPain: numericVal }}
        />
      </CardContent>
    </Card>
  );
}
