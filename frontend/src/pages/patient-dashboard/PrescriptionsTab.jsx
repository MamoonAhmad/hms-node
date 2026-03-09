import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  RefreshCw,
  Printer,
  Send,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  XCircle,
  AlertTriangle,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200',
  Completed: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30',
  Discontinued: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
  Expired: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
  'Pending Pharmacy': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200',
};

const mockPatientHeader = {
  patientName: 'Ahmed Khan',
  mrn: 'MRN-102344',
  dob: '12-Mar-1985',
  age: 40,
  gender: 'Male',
  encounterId: 'ENC-55891',
  visitDate: '28-Feb-2026',
  allergies: [{ name: 'Penicillin', severity: 'Critical' }],
  primaryProvider: 'Dr. Ali',
};

const mockPrescriptions = [
  {
    id: 'rx1',
    medicationName: 'Amoxicillin',
    strength: '500mg',
    route: 'PO',
    instructions: '1 capsule after meals',
    frequency: '3x Daily',
    duration: '7 Days',
    startDate: '28-Feb-2026',
    endDate: '06-Mar-2026',
    refillsRemaining: 0,
    provider: 'Dr. Ali',
    pharmacy: 'City Pharmacy',
    status: 'Active',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    form: 'Capsule',
    dose: '500mg',
    quantity: 21,
    refillsAllowed: 0,
    diagnosis: 'J06.9 - Acute upper respiratory infection',
    specialInstructions: 'Take with food. Complete full course.',
    datePrescribed: '28-Feb-2026',
    electronicSignature: 'Dr. Ali, MD',
  },
  {
    id: 'rx2',
    medicationName: 'Metformin',
    strength: '500mg',
    route: 'PO',
    instructions: '1 tablet with breakfast',
    frequency: '2x Daily',
    duration: '30 Days',
    startDate: '01-Feb-2026',
    endDate: '01-Mar-2026',
    refillsRemaining: 2,
    provider: 'Dr. Ali',
    pharmacy: 'HealthPlus',
    status: 'Active',
    genericName: 'Metformin HCl',
    brandName: 'Glucophage',
    form: 'Tablet',
    dose: '500mg',
    quantity: 60,
    refillsAllowed: 3,
    diagnosis: 'E11.9 - Type 2 diabetes',
    specialInstructions: 'Take with meals.',
    datePrescribed: '01-Feb-2026',
    electronicSignature: 'Dr. Ali, MD',
  },
  {
    id: 'rx3',
    medicationName: 'Vitamin D',
    strength: '2000 IU',
    route: 'PO',
    instructions: '1 tablet daily',
    frequency: 'Once Daily',
    duration: '60 Days',
    startDate: '10-Jan-2026',
    endDate: '10-Mar-2026',
    refillsRemaining: 0,
    provider: 'Dr. Sara',
    pharmacy: '—',
    status: 'Completed',
    genericName: 'Cholecalciferol',
    brandName: 'D3',
    form: 'Tablet',
    dose: '2000 IU',
    quantity: 60,
    refillsAllowed: 0,
    diagnosis: 'E55.9 - Vitamin D deficiency',
    specialInstructions: null,
    datePrescribed: '10-Jan-2026',
    electronicSignature: 'Dr. Sara, MD',
  },
  {
    id: 'rx4',
    medicationName: 'Atorvastatin',
    strength: '10mg',
    route: 'PO',
    instructions: '1 tablet at bedtime',
    frequency: 'Once Daily',
    duration: 'Ongoing',
    startDate: '15-Jan-2026',
    endDate: null,
    refillsRemaining: 3,
    provider: 'Dr. Ali',
    pharmacy: 'City Pharmacy',
    status: 'Active',
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    form: 'Tablet',
    dose: '10mg',
    quantity: 30,
    refillsAllowed: 5,
    diagnosis: 'E78.00 - Hyperlipidemia',
    specialInstructions: 'Take at bedtime.',
    datePrescribed: '15-Jan-2026',
    electronicSignature: 'Dr. Ali, MD',
  },
];

const mockHistory = [
  { medicationName: 'Ibuprofen', startDate: '01-Jan-2026', endDate: '10-Jan-2026', provider: 'Dr. Sara', status: 'Completed', reasonDiscontinuation: 'Course completed' },
  { medicationName: 'Lisinopril', startDate: '15-Nov-2025', endDate: '20-Dec-2025', provider: 'Dr. Ali', status: 'Discontinued', reasonDiscontinuation: 'Switched to alternative' },
];

const summaryCounts = {
  active: 3,
  completed: 5,
  discontinued: 2,
  expired: 1,
  refillPending: 1,
};

function StatusBadge({ status }) {
  const classes = STATUS_CONFIG[status] || 'bg-muted text-muted-foreground';
  return (
    <Badge variant="outline" className={cn('border', classes)}>
      {status}
    </Badge>
  );
}

export function PrescriptionsTab() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDropdown, setFilterDropdown] = useState('All');
  const [detailPrescription, setDetailPrescription] = useState(null);
  const [newPrescriptionOpen, setNewPrescriptionOpen] = useState(false);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [discontinueConfirm, setDiscontinueConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [prescriptions] = useState(mockPrescriptions);

  const filteredPrescriptions = useMemo(() => {
    let list = prescriptions;
    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (filterDropdown && filterDropdown !== 'All') {
      list = list.filter((r) => r.status === filterDropdown);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.medicationName.toLowerCase().includes(q) ||
          (r.genericName && r.genericName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [prescriptions, statusFilter, filterDropdown, searchQuery]);

  const paginatedPrescriptions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPrescriptions.slice(start, start + PAGE_SIZE);
  }, [filteredPrescriptions, currentPage]);

  const totalPages = Math.ceil(filteredPrescriptions.length / PAGE_SIZE);

  const summaryCards = [
    { key: 'active', label: 'Active Prescriptions', count: summaryCounts.active, filter: 'Active' },
    { key: 'completed', label: 'Completed', count: summaryCounts.completed, filter: 'Completed' },
    { key: 'discontinued', label: 'Discontinued', count: summaryCounts.discontinued, filter: 'Discontinued' },
    { key: 'expired', label: 'Expired', count: summaryCounts.expired, filter: 'Expired' },
    { key: 'refillPending', label: 'Refill Pending', count: summaryCounts.refillPending, filter: 'Refill Pending' },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pb-4 -mx-2 px-2">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                <p className="font-semibold text-foreground">{mockPatientHeader.patientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRN</p>
                <p className="font-mono text-sm">{mockPatientHeader.mrn}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">DOB</p>
                <p className="text-sm">{mockPatientHeader.dob} ({mockPatientHeader.age} Years)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="text-sm">{mockPatientHeader.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Encounter ID</p>
                <p className="font-mono text-sm">{mockPatientHeader.encounterId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visit Date</p>
                <p className="text-sm">{mockPatientHeader.visitDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {mockPatientHeader.allergies.map((a, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {a.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Primary Provider</p>
                <p className="text-sm">{mockPatientHeader.primaryProvider}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card
            key={card.key}
            className={cn(
              'cursor-pointer transition-colors hover:bg-muted/50',
              statusFilter === card.filter && 'ring-2 ring-primary'
            )}
            onClick={() => setStatusFilter(statusFilter === card.filter ? null : card.filter)}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{card.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setNewPrescriptionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prescription
          </Button>
          <Button variant="outline" onClick={() => setReconciliationOpen(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Medication Reconciliation
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2 icon-action-print" />
            Print All Active
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Send All to Pharmacy
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medication"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <select
            value={filterDropdown}
            onChange={(e) => setFilterDropdown(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Discontinued">Discontinued</option>
            <option value="Expired">Expired</option>
            <option value="Pending Pharmacy">Pending Pharmacy</option>
          </select>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Allergy conflict: Penicillin — verify before prescribing related antibiotics.</span>
        </div>
      </div>

      {/* Active Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Prescriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No prescriptions available for this encounter.
              </p>
              <Button onClick={() => setNewPrescriptionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Prescription
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication</TableHead>
                      <TableHead>Strength</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Instructions</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Refills</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPrescriptions.map((rx) => (
                      <TableRow key={rx.id}>
                        <TableCell className="font-medium">{rx.medicationName}</TableCell>
                        <TableCell>{rx.strength}</TableCell>
                        <TableCell>{rx.route}</TableCell>
                        <TableCell className="max-w-[140px] truncate" title={rx.instructions}>{rx.instructions}</TableCell>
                        <TableCell>{rx.frequency}</TableCell>
                        <TableCell>{rx.duration}</TableCell>
                        <TableCell>{rx.startDate}</TableCell>
                        <TableCell>{rx.endDate ?? '—'}</TableCell>
                        <TableCell>{rx.refillsRemaining}</TableCell>
                        <TableCell>{rx.provider}</TableCell>
                        <TableCell>{rx.pharmacy}</TableCell>
                        <TableCell><StatusBadge status={rx.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDetailPrescription(rx)}
                              title="View"
                            >
                              <Eye className="h-4 w-4 icon-action-view" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Pencil className="h-4 w-4 icon-action-edit" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDiscontinueConfirm(rx)}
                              title="Discontinue"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Print">
                              <Printer className="h-4 w-4 icon-action-print" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Send to Pharmacy">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Medication History */}
      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          onClick={() => setHistoryExpanded(!historyExpanded)}
        >
          <CardTitle className="text-base">Medication History</CardTitle>
          {historyExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {historyExpanded && (
          <CardContent className="pt-0">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason for Discontinuation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{h.medicationName}</TableCell>
                      <TableCell>{h.startDate}</TableCell>
                      <TableCell>{h.endDate}</TableCell>
                      <TableCell>{h.provider}</TableCell>
                      <TableCell><StatusBadge status={h.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{h.reasonDiscontinuation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Prescription Detail Modal */}
      <Dialog open={!!detailPrescription} onOpenChange={(open) => !open && setDetailPrescription(null)}>
        <DialogContent className="min-w-[800px] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {detailPrescription && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-muted-foreground">Medication Name</p>
                <p className="font-medium">{detailPrescription.medicationName}</p>
                <p className="text-muted-foreground">Generic Name</p>
                <p>{detailPrescription.genericName}</p>
                <p className="text-muted-foreground">Brand Name</p>
                <p>{detailPrescription.brandName}</p>
                <p className="text-muted-foreground">Strength</p>
                <p>{detailPrescription.strength}</p>
                <p className="text-muted-foreground">Form</p>
                <p>{detailPrescription.form}</p>
                <p className="text-muted-foreground">Route</p>
                <p>{detailPrescription.route}</p>
                <p className="text-muted-foreground">Dose</p>
                <p>{detailPrescription.dose}</p>
                <p className="text-muted-foreground">Frequency</p>
                <p>{detailPrescription.frequency}</p>
                <p className="text-muted-foreground">Duration</p>
                <p>{detailPrescription.duration}</p>
                <p className="text-muted-foreground">Quantity</p>
                <p>{detailPrescription.quantity}</p>
                <p className="text-muted-foreground">Refills Allowed</p>
                <p>{detailPrescription.refillsAllowed}</p>
                <p className="text-muted-foreground">Refills Remaining</p>
                <p>{detailPrescription.refillsRemaining}</p>
                <p className="text-muted-foreground">Diagnosis (ICD-10)</p>
                <p>{detailPrescription.diagnosis}</p>
                <p className="text-muted-foreground col-span-2">Special Instructions</p>
                <p className="col-span-2">{detailPrescription.specialInstructions || '—'}</p>
                <p className="text-muted-foreground">Prescribing Provider</p>
                <p>{detailPrescription.provider}</p>
                <p className="text-muted-foreground">Pharmacy</p>
                <p>{detailPrescription.pharmacy}</p>
                <p className="text-muted-foreground">Date Prescribed</p>
                <p>{detailPrescription.datePrescribed}</p>
                <p className="text-muted-foreground">Electronic Signature</p>
                <p>{detailPrescription.electronicSignature}</p>
                <p className="text-muted-foreground">Status</p>
                <p><StatusBadge status={detailPrescription.status} /></p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailPrescription(null)}>Close</Button>
            <Button variant="outline"><Pencil className="h-4 w-4 mr-2 icon-action-edit" />Edit</Button>
            <Button variant="outline"><Printer className="h-4 w-4 mr-2 icon-action-print" />Print</Button>
            <Button variant="outline"><Send className="h-4 w-4 mr-2" />Send to Pharmacy</Button>
            <Button variant="destructive" onClick={() => { setDiscontinueConfirm(detailPrescription); setDetailPrescription(null); }}>Discontinue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discontinue confirmation */}
      <Dialog open={!!discontinueConfirm} onOpenChange={(open) => !open && setDiscontinueConfirm(null)}>
        <DialogContent className="min-w-[800px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discontinue prescription?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to discontinue {discontinueConfirm?.medicationName}? This action can be documented in the record.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscontinueConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setDiscontinueConfirm(null)}>Discontinue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Prescription Modal */}
      <Dialog open={newPrescriptionOpen} onOpenChange={setNewPrescriptionOpen}>
        <DialogContent className="min-w-[800px] sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Medication Search</Label>
              <Input placeholder="Search medication (auto-suggest)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Strength</Label>
                <Input placeholder="e.g. 500mg" />
              </div>
              <div className="grid gap-2">
                <Label>Form</Label>
                <select className="h-9 rounded-md border border-input bg-background px-3 w-full">
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Route</Label>
                <Input placeholder="e.g. PO" />
              </div>
              <div className="grid gap-2">
                <Label>Dose</Label>
                <Input placeholder="e.g. 1 tablet" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <Input placeholder="e.g. 2x Daily" />
              </div>
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Input placeholder="e.g. 30 Days" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label>Refills Allowed</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Diagnosis (ICD-10)</Label>
              <Input placeholder="e.g. J06.9" />
            </div>
            <div className="grid gap-2">
              <Label>Special Instructions</Label>
              <Input placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label>Pharmacy Selection</Label>
              <select className="h-9 rounded-md border border-input bg-background px-3 w-full">
                <option>— Select pharmacy —</option>
                <option>City Pharmacy</option>
                <option>HealthPlus</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPrescriptionOpen(false)}>Cancel</Button>
            <Button variant="outline">Save & Send to Pharmacy</Button>
            <Button onClick={() => setNewPrescriptionOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medication Reconciliation Panel */}
      <Dialog open={reconciliationOpen} onOpenChange={setReconciliationOpen}>
        <DialogContent className="min-w-[800px] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medication Reconciliation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Compare current medications reported by patient with existing prescriptions. Select action for each.
          </p>
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <h4 className="font-medium mb-2">Reported by patient</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Metformin 500mg — Continue</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Atorvastatin 10mg — Continue</span>
                </li>
              </ul>
            </div>
            <div className="rounded-md border p-4">
              <h4 className="font-medium mb-2">In system</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Amoxicillin 500mg (Active)</li>
                <li>Metformin 500mg (Active)</li>
                <li>Vitamin D 2000 IU (Completed)</li>
                <li>Atorvastatin 10mg (Active)</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Label className="flex items-center gap-2">
                <input type="radio" name="action" />
                Continue
              </Label>
              <Label className="flex items-center gap-2">
                <input type="radio" name="action" />
                Discontinue
              </Label>
              <Label className="flex items-center gap-2">
                <input type="radio" name="action" />
                Modify
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReconciliationOpen(false)}>Cancel</Button>
            <Button onClick={() => setReconciliationOpen(false)}>Confirm Reconciliation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
