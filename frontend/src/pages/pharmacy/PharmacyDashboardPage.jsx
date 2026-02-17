import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  medicationOrdersMock,
  dailyOrdersMock,
  tatMock,
  topMedicationsMock,
  routesMock,
  topPrescribersMock,
  peakHoursMock,
  inventoryItemsMock,
  stockLevelDistributionMock,
  drugTypeDistributionMock,
  MEDICATION_STATUSES,
  STOCK_STATUSES,
  DRUG_TYPES,
} from './pharmacyMockData';

const REPORT_TYPES = ['Medication Report', 'Inventory Report'];
const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

function ChartExportButtons() {
  const handleExportPDF = () => window.print();
  const handleExportExcel = () => alert('Export as Excel/CSV – connect to backend.');
  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleExportPDF}>Export PDF</Button>
      <Button variant="outline" size="sm" onClick={handleExportExcel}>Export Excel</Button>
    </div>
  );
}

function SimpleDonut({ data, colors = COLORS }) {
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0) || 1;
  let acc = 0;
  const gradientStops = data
    .map((d, i) => {
      const start = (acc / total) * 100;
      acc += d.value ?? 0;
      const end = (acc / total) * 100;
      return `${colors[i % colors.length]} ${start}% ${end}%`;
    })
    .join(', ');
  return (
    <div className="flex flex-wrap items-center justify-center gap-4" style={{ minHeight: 280 }}>
      <div className="flex flex-col gap-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span>{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: `conic-gradient(${gradientStops})`,
          padding: '8px',
          boxSizing: 'content-box',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-background" />
      </div>
    </div>
  );
}

function SimpleBarChart({ data, dataKey, nameKey, color = '#3b82f6', maxVal }) {
  const max = maxVal ?? Math.max(...data.map((d) => d[dataKey] ?? 0), 1);
  return (
    <div className="space-y-2" style={{ minHeight: 280 }}>
      {data.slice(0, 10).map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs w-24 shrink-0 truncate" title={d[nameKey]}>{d[nameKey]}</span>
          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
            <div className="h-full rounded bg-primary" style={{ width: `${((d[dataKey] ?? 0) / max) * 100}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs w-8 text-right">{d[dataKey]}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleLineBars({ data, dataKeys, colors }) {
  const flat = data.flatMap((d) => dataKeys.map((k) => d[k] ?? 0));
  const max = Math.max(...flat, 1);
  return (
    <div className="space-y-1" style={{ minHeight: 280 }}>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0">{d.date ?? d.day ?? d.hour}</span>
          {dataKeys.map((key, j) => (
            <div key={key} className="flex-1 h-5 bg-muted rounded overflow-hidden max-w-[80px]">
              <div className="h-full rounded" style={{ width: `${((d[key] ?? 0) / max) * 100}%`, backgroundColor: colors[j] ?? COLORS[j] }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SimpleHorizontalBars({ data, dataKey, nameKey, color = '#3b82f6' }) {
  const max = Math.max(...data.map((d) => d[dataKey] ?? 0), 1);
  return (
    <div className="space-y-2" style={{ minHeight: 280 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <span className="text-xs truncate">{d[nameKey]}</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div className="h-full rounded" style={{ width: `${((d[dataKey] ?? 0) / max) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs w-10 text-right">{d[dataKey]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PharmacyDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reportFromUrl = searchParams.get('report') || 'medication';

  const [reportType, setReportType] = useState(reportFromUrl === 'inventory' ? 'Inventory Report' : 'Medication Report');
  useEffect(() => {
    setReportType(reportFromUrl === 'inventory' ? 'Inventory Report' : 'Medication Report');
  }, [reportFromUrl]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [medicationStatus, setMedicationStatus] = useState('All');
  const [stockStatus, setStockStatus] = useState('All');
  const [drugType, setDrugType] = useState('All');

  const isMedication = reportType === 'Medication Report';

  const medicationKpis = useMemo(() => {
    const orders = medicationOrdersMock;
    const active = orders.filter((o) => ['Pending', 'Ordered'].includes(o.status)).length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const dispatched = orders.filter((o) => o.status === 'Dispatched').length;
    const withTat = orders.filter((o) => o.dispatchDate && o.createdAt).slice(0, 20);
    const avgTat = withTat.length
      ? Math.round(
          withTat.reduce((acc, o) => acc + (new Date(o.dispatchDate) - new Date(o.createdAt)) / 60000, 0) / withTat.length
        )
      : 0;
    return { activeOrders: orders.length, pendingOrders: pending, dispatchedOrders: dispatched, avgTat };
  }, []);

  const inventoryKpis = useMemo(() => {
    const items = inventoryItemsMock;
    const inStock = items.filter((i) => i.status === 'In Stock').length;
    const outOfStock = items.filter((i) => i.status === 'Out of Stock').length;
    const lowStock = items.filter((i) => i.quantity <= 5 && i.quantity > 0).length;
    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
    return { totalMedications: items.length, inStock, outOfStock, lowStock, totalQuantity: totalQty };
  }, []);

  const statusDistribution = useMemo(() => {
    const counts = {};
    MEDICATION_STATUSES.forEach((s) => (counts[s] = 0));
    medicationOrdersMock.forEach((o) => (counts[o.status] = (counts[o.status] || 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const handleApplyFilters = () => {
    if (reportType === 'Inventory Report') setSearchParams({ report: 'inventory' });
    else setSearchParams({ report: 'medication' });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">Medication Analytics & Inventory Reports</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {isMedication ? (
              <div>
                <Label>Medication Status</Label>
                <Select value={medicationStatus} onValueChange={setMedicationStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {MEDICATION_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Stock Status</Label>
                  <Select value={stockStatus} onValueChange={setStockStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {STOCK_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Drug Type</Label>
                  <Select value={drugType} onValueChange={setDrugType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {DRUG_TYPES.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <Button onClick={handleApplyFilters}>Filter</Button>
        </CardContent>
      </Card>

      {isMedication ? (
        <>
          {/* Medication KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Active Orders</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{medicationKpis.activeOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Orders</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{medicationKpis.pendingOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Dispatched Orders</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{medicationKpis.dispatchedOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Turnaround Time (min)</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{medicationKpis.avgTat}</p></CardContent>
            </Card>
          </div>

          {/* Medication Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medication Status Distribution</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleDonut data={statusDistribution} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daily Medication Orders Trend</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleLineBars data={dailyOrdersMock} dataKeys={['orders', 'dispatched']} colors={['#3b82f6', '#22c55e']} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Turnaround Time (TAT) Analysis</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleLineBars data={tatMock} dataKeys={['avgTat', 'benchmark']} colors={['#3b82f6', '#eab308']} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top 10 Medications by Volume</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleHorizontalBars data={topMedicationsMock} dataKey="count" nameKey="name" color="#3b82f6" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medication Administration Routes</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleDonut data={routesMock} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Prescribers by Volume</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={topPrescribersMock} dataKey="count" nameKey="name" color="#8b5cf6" />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Peak Hours Analysis</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleLineBars data={peakHoursMock} dataKeys={['orders']} colors={['#3b82f6']} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Inventory KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Medications</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{inventoryKpis.totalMedications}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">In Stock</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-green-600">{inventoryKpis.inStock}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Out of Stock</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-red-600">{inventoryKpis.outOfStock}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Low Stock (≤5)</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-yellow-600">{inventoryKpis.lowStock}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Inventory Qty</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{inventoryKpis.totalQuantity}</p></CardContent>
            </Card>
          </div>

          {/* Inventory Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Stock Level Distribution</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleDonut data={stockLevelDistributionMock} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top 10 Medications by Stock</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={inventoryItemsMock.slice(0, 10)} dataKey="quantity" nameKey="name" color="#22c55e" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Drug Type Distribution</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleDonut data={drugTypeDistributionMock} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Low Stock Alerts</CardTitle>
                <ChartExportButtons />
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={inventoryItemsMock.filter((i) => i.quantity <= 5).slice(0, 10)} dataKey="quantity" nameKey="name" color="#eab308" />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
