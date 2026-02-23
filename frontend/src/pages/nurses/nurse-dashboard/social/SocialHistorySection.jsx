import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SocialHistorySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Social History</CardTitle>
      </CardHeader>
      <CardContent>
        <Input id="social-timestamp" className="hidden" disabled />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { id: 'alcohol', label: 'Alcohol' },
            { id: 'employment', label: 'Employment/School' },
            { id: 'exercise', label: 'Exercise' },
            { id: 'home-environment', label: 'Home/Environment' },
            { id: 'nutrition', label: 'Nutrition/Health' },
            { id: 'sexual', label: 'Sexual' },
            { id: 'substance', label: 'Substance Abuse' },
            { id: 'tobacco', label: 'Tobacco' },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input id={field.id} placeholder={field.label} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


