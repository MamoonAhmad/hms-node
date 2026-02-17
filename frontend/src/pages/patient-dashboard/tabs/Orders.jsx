import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function Orders({ patientId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Orders section - linked from Orders & Order Sets module</p>
      </CardContent>
    </Card>
  );
}


