import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ImagingOrdersManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Imaging Orders Management</h1>
        <p className="text-muted-foreground">Manage imaging orders and radiology requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Imaging Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Imaging orders management functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
