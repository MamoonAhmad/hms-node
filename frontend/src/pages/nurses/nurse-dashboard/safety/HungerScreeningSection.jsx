import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FOOD_INSECURITY_OPTIONS = [
  'OFTEN TRUE',
  'SOMETIMES TRUE',
  'NEVER TRUE',
  'PATIENT UNABLE TO ANSWER',
  'PATIENT DECLINED',
];

const foodInsecurityQuestions = [
  {
    id: 'food-run-out',
    label:
      'Within the past 12 months we worried whether our food would run out before we got money to buy more.',
  },
  {
    id: 'food-didnt-last',
    label:
      'Within the past 12 months the food we bought just didn\'t last and we didn\'t have money to get more.',
  },
];

const WHO_ANSWERED_OPTIONS = [
  'AUNT',
  'BROTHER',
  'DAUGHTER',
  'FATHER',
  'FRIEND',
  'GRANDDAUGHTER',
  'GRANDFATHER',
  'GRANDMOTHER',
  'GRANDSON',
  'LEGAL GUARDIAN',
  'MOTHER',
  'OTHER',
  'STEP FATHER',
  'SISTER',
  'SELF',
  'STEP MOTHER',
  'SON',
  'SPOUSE',
  'UNCLE',
  'EMPLOYER',
  'UNVERIFIED CONTACT',
  'TRANSPLANT COORDINATOR',
  'VISIT CONTACT',
];

export function HungerScreeningSection() {
  const [foodAnswers, setFoodAnswers] = useState(
    foodInsecurityQuestions.reduce((acc, q) => ({ ...acc, [q.id]: null }), {})
  );
  const [whoAnswered, setWhoAnswered] = useState(null);

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <Input id="hunger-timestamp" className="hidden" disabled />

        {/* Food Insecurity Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Food Insecurity</h3>
          {foodInsecurityQuestions.map((q) => (
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
                    variant={foodAnswers[q.id] === opt ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-md"
                    onClick={() =>
                      setFoodAnswers((p) => ({ ...p, [q.id]: opt }))
                    }
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Who answered Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Who answered the hunger screening questions?
          </h3>
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
            <p className="text-sm font-medium text-foreground">
              Who answered the hunger screening questions?
            </p>
            <div className="flex flex-wrap gap-2">
              {WHO_ANSWERED_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  type="button"
                  variant={whoAnswered === opt ? 'default' : 'outline'}
                  size="sm"
                  className={cn('rounded-md')}
                  onClick={() => setWhoAnswered(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
