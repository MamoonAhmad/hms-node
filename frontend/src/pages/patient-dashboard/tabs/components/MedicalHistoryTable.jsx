import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MedicalHistoryTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical History</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No medical history recorded</p>
        ) : (
          <div>Medical history content</div>
        )}
      </CardContent>
    </Card>
  );
}


