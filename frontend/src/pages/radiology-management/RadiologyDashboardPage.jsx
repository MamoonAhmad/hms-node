import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRadiologyStore } from './radiologyStore';

function isToday(isoString) {
  if (!isoString) return false;
  const d = new Date(isoString);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export function RadiologyDashboardPage() {
  const store = useMemo(() => loadRadiologyStore(), []);
  const orders = store.orders || [];

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => isToday(o.orderDateTime));
    const todayCompleted = orders.filter((o) => o.status === 'Completed' && isToday(o.lastUpdatedAt || o.orderDateTime));
    return {
      totalOrders: orders.length,
      todayOrder: todayOrders.length,
      pendingOrders: orders.filter((o) => o.status === 'Pending').length,
      totalCompleted: orders.filter((o) => o.status === 'Completed').length,
      todayCompleted: todayCompleted.length,
      cancelledOrders: orders.filter((o) => o.status === 'Cancelled').length,
      inProgressOrders: orders.filter((o) => o.status === 'In Progress').length,
    };
  }, [orders]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Radiology Management</h1>
        <p className="text-muted-foreground">Radiology Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today Order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.todayOrder}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Completed orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s completed order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.todayCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In progress orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.inProgressOrders}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
