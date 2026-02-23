import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function Results({ patientId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Lab & Radiology results - linked from Orders table</p>
      </CardContent>
    </Card>
  );
}


