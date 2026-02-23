import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ManageInventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Inventory</h1>
        <p className="text-muted-foreground">Manage medication inventory and stock levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Inventory management functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
