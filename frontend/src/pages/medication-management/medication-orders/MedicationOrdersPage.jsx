import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MedicationOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medication Orders</h1>
        <p className="text-muted-foreground">Manage medication orders and prescriptions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Medication orders functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
