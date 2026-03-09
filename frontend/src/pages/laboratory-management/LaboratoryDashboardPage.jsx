import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Package, Truck, ClipboardCheck, BookOpen, Send, FileDown } from 'lucide-react';

const onsiteLabModules = [
  { name: 'Specimen Collection', href: '/laboratory-management/specimen-collection', icon: FlaskConical, description: 'Manage specimen collection and barcode labels' },
  { name: 'Specimen Transport', href: '/laboratory-management/specimen-transport', icon: Truck, description: 'Track and edit specimen transport' },
  { name: 'Specimen Receiver', href: '/laboratory-management/specimen-receiver', icon: Package, description: 'Receive and accept/reject specimens' },
  { name: 'Lab Order Transport & Receiving', href: '/laboratory-management/lab-order-transport', icon: Send, description: 'Send orders/specimens to external or reference lab' },
  { name: 'Result Management', href: '/laboratory-management/result-management', icon: ClipboardCheck, description: 'Enter results and generate reports (onsite)' },
  { name: 'Test Catalog', href: '/laboratory-management/test-catalog', icon: BookOpen, description: 'Manage lab test catalog and parameters' },
];

const externalLabModules = [
  { name: 'External Lab Orders', href: '/outpatient/outside-labs', icon: Send, description: 'Create and track orders sent to external labs' },
  { name: 'Receive External Lab Reports', href: '/laboratory-management/lab-report-received', icon: FileDown, description: 'Receive or upload external lab reports and attach to chart' },
];

export function LaboratoryDashboardPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Onsite Laboratory Management</h1>
        <p className="text-muted-foreground">Lab workflow: Collection → Transport → Receive → Results. External lab orders and report receiving below.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Onsite lab workflow</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {onsiteLabModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} to={mod.href}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-base">{mod.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">External lab</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {externalLabModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} to={mod.href}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-base">{mod.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
