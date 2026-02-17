import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Package, Truck, ClipboardCheck, FileText, BookOpen } from 'lucide-react';

const labModules = [
  { name: 'Specimen Collection', href: '/laboratory-management/specimen-collection', icon: FlaskConical, description: 'Manage specimen collection and barcode labels' },
  { name: 'Specimen Transport', href: '/laboratory-management/specimen-transport', icon: Truck, description: 'Track and edit specimen transport' },
  { name: 'Specimen Receiver', href: '/laboratory-management/specimen-receiver', icon: Package, description: 'Receive and accept/reject specimens' },
  { name: 'Result Management', href: '/laboratory-management/result-management', icon: ClipboardCheck, description: 'Enter results and generate reports' },
  { name: 'Test Catalog', href: '/laboratory-management/test-catalog', icon: BookOpen, description: 'Manage lab test catalog and parameters' },
];

export function LaboratoryDashboardPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
        <p className="text-muted-foreground">Lab workflow: Collection → Transport → Receive → Results</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labModules.map((mod) => {
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
  );
}
