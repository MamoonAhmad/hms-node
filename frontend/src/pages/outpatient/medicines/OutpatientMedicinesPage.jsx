import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Pencil,
  Package,
  Printer,
  XCircle,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Mock visit options and initial data
const MOCK_VISITS = [
  {
    id: 'V001',
    patientName: 'John Doe',
    mrNumber: 'MR-2024-001',
    doctorName: 'Dr. Sarah Smith',
    visitDate: '2024-02-10',
    clinicName: 'General Outpatient',
    diagnosis: 'Hypertension, Type 2 DM',
    allergies: 'Penicillin',
  },
  {
    id: 'V002',
    patientName: 'Jane Smith',
    mrNumber: 'MR-2024-002',
    doctorName: 'Dr. James Wilson',
    visitDate: '2024-02-11',
    clinicName: 'General Outpatient',
    diagnosis: 'Upper respiratory infection',
    allergies: null,
  },
];

const MEDICINE_MASTER = [
  { id: 'M1', name: 'Amlodipine 5mg', genericName: 'Amlodipine', strength: '5mg', unitPrice: 2.5 },
  { id: 'M2', name: 'Metformin 500mg', genericName: 'Metformin', strength: '500mg', unitPrice: 1.2 },
  { id: 'M3', name: 'Paracetamol 500mg', genericName: 'Paracetamol', strength: '500mg', unitPrice: 0.5 },
  { id: 'M4', name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', strength: '250mg', unitPrice: 3.0 },
];

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'online', label: 'Online' },
];

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);
}

export function OutpatientMedicinesPage() {
  const [selectedVisitId, setSelectedVisitId] = useState(MOCK_VISITS[0]?.id ?? '');
  const [medicines, setMedicines] = useState([
    {
      id: '1',
      medicineName: 'Amlodipine 5mg',
      genericName: 'Amlodipine',
      strength: '5mg',
      dosageInstructions: '1 tablet once daily',
      frequency: 'OD',
      duration: '30 days',
      quantityPrescribed: 30,
      quantityDispensed: 0,
      unitPrice: 2.5,
      discount: 0,
      paymentStatus: 'Unpaid',
      dispensingStatus: 'Pending',
      prescribedBy: 'Dr. Sarah Smith',
      remarks: '',
      outsidePharmacyName: '',
      dispensedBy: null,
      dispensedAt: null,
    },
    {
      id: '2',
      medicineName: 'Metformin 500mg',
      genericName: 'Metformin',
      strength: '500mg',
      dosageInstructions: '1 tablet twice daily',
      frequency: 'BD',
      duration: '30 days',
      quantityPrescribed: 60,
      quantityDispensed: 60,
      unitPrice: 1.2,
      discount: 2,
      paymentStatus: 'Paid',
      dispensingStatus: 'Dispensed',
      prescribedBy: 'Dr. Sarah Smith',
      remarks: '',
      outsidePharmacyName: 'City Pharmacy',
      dispensedBy: 'Nurse Jane',
      dispensedAt: '2024-02-10 14:30',
    },
  ]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    paymentStatus: 'all',
    dispensingStatus: 'all',
    doctor: '',
    clinic: '',
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [targetMedicine, setTargetMedicine] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const selectedVisit = MOCK_VISITS.find((v) => v.id === selectedVisitId) ?? null;
  const visitSelectValue = MOCK_VISITS.some((v) => v.id === selectedVisitId) ? selectedVisitId : (MOCK_VISITS[0]?.id ?? 'none');

  const filteredMedicines = useMemo(() => {
    let list = medicines;
    const s = (search || '').toLowerCase();
    if (s) {
      list = list.filter(
        (m) =>
          m.medicineName?.toLowerCase().includes(s) ||
          m.genericName?.toLowerCase().includes(s) ||
          m.prescribedBy?.toLowerCase().includes(s)
      );
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      list = list.filter((m) => m.paymentStatus === filters.paymentStatus);
    }
    if (filters.dispensingStatus && filters.dispensingStatus !== 'all') {
      list = list.filter((m) => m.dispensingStatus === filters.dispensingStatus);
    }
    return list;
  }, [medicines, search, filters.paymentStatus, filters.dispensingStatus]);

  const summary = useMemo(() => {
    const totalMedicines = filteredMedicines.length;
    let totalAmount = 0;
    let totalDiscount = 0;
    let paidAmount = 0;
    filteredMedicines.forEach((m) => {
      const gross = (m.quantityPrescribed ?? 0) * (m.unitPrice ?? 0);
      const disc = m.discount ?? 0;
      totalAmount += gross;
      totalDiscount += disc;
      paidAmount += m.amountPaid ?? 0;
    });
    const netAmount = totalAmount - totalDiscount;
    const pendingAmount = netAmount - paidAmount;
    return {
      totalMedicines,
      totalAmount,
      totalDiscount,
      netAmount,
      paidAmount,
      pendingAmount,
    };
  }, [filteredMedicines]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMedicines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedicines.map((m) => m.id)));
    }
  };

  const netAmount = (row) => {
    const gross = (row.quantityPrescribed ?? 0) * (row.unitPrice ?? 0);
    return gross - (row.discount ?? 0);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleAddMedicine = (form) => {
    const master = MEDICINE_MASTER.find((m) => m.id === form.medicineId) ?? MEDICINE_MASTER[0];
    const total = (form.quantity ?? 0) * (form.unitPrice ?? master.unitPrice);
    const newRow = {
      id: String(Date.now()),
      medicineName: form.medicineName ?? master.name,
      genericName: form.genericName ?? master.genericName,
      strength: form.strength ?? master.strength,
      dosageInstructions: form.dosage ?? '',
      frequency: form.frequency ?? '',
      duration: form.duration ?? '',
      quantityPrescribed: form.quantity ?? 0,
      quantityDispensed: 0,
      unitPrice: form.unitPrice ?? master.unitPrice,
      discount: form.discount ?? 0,
      paymentStatus: 'Unpaid',
      dispensingStatus: 'Pending',
      prescribedBy: selectedVisit?.doctorName ?? '',
      remarks: form.remarks ?? '',
      outsidePharmacyName: form.outsidePharmacyName ?? '',
    };
    setMedicines((prev) => [...prev, newRow]);
    setAddOpen(false);
    showMessage('success', 'Medicine added.');
  };

  const handleDispense = (row, quantityDispensed) => {
    const qty = Math.min(Number(quantityDispensed) || 0, row.quantityPrescribed ?? 0);
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === row.id
          ? {
              ...m,
              quantityDispensed: qty,
              dispensingStatus: qty >= (m.quantityPrescribed ?? 0) ? 'Dispensed' : m.dispensingStatus,
              dispensedBy: 'Current User',
              dispensedAt: new Date().toLocaleString(),
            }
          : m
      )
    );
    setDispenseOpen(false);
    setTargetMedicine(null);
    showMessage('success', 'Dispensing updated.');
  };

  const handlePayment = (paymentMode, amountPaid) => {
    const amt = Number(amountPaid) || 0;
    const items = targetMedicine ? [targetMedicine] : medicines.filter((m) => selectedIds.has(m.id));
    if (items.length === 0) {
      setPaymentOpen(false);
      return;
    }
    const totalNet = items.reduce((s, m) => s + netAmount(m), 0);
    const ids = new Set(items.map((m) => m.id));
    setMedicines((prev) =>
      prev.map((m) => {
        if (!ids.has(m.id)) return m;
        const rowNet = netAmount(m);
        const rowPaid = items.length === 1 ? amt : totalNet > 0 ? (rowNet / totalNet) * amt : 0;
        return {
          ...m,
          paymentStatus: rowPaid >= rowNet ? 'Paid' : rowPaid > 0 ? 'Partial' : 'Unpaid',
          amountPaid: rowPaid,
          paymentMode,
        };
      })
    );
    setPaymentOpen(false);
    setTargetMedicine(null);
    showMessage('success', 'Payment recorded.');
  };

  const handleCancel = (row, reason) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === row.id ? { ...m, dispensingStatus: 'Cancelled', cancelReason: reason } : m))
    );
    setCancelOpen(false);
    setTargetMedicine(null);
    showMessage('success', 'Medicine cancelled.');
  };

  const handleEdit = (row, updates) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === row.id ? { ...m, ...updates } : m))
    );
    setEditOpen(false);
    setTargetMedicine(null);
    showMessage('success', 'Medicine updated.');
  };

  const handlePrintLabel = (row) => {
    const printContent = `
      Patient: ${selectedVisit?.patientName ?? '-'} | MR: ${selectedVisit?.mrNumber ?? '-'} | Visit: ${selectedVisit?.id ?? '-'}
      Medicine: ${row.medicineName} | Dosage: ${row.dosageInstructions} | Qty: ${row.quantityPrescribed}
      Barcode: ${row.id}-${Date.now()}
    `;
    const w = window.open('', '_blank');
    w.document.write('<pre style="font-family:monospace; padding: 20px;">' + printContent + '</pre>');
    w.document.close();
    w.print();
    w.close();
  };

  const handleBulkPrintLabels = () => {
    const toPrint = selectedIds.size > 0 ? medicines.filter((m) => selectedIds.has(m.id)) : medicines;
    toPrint.forEach((m, i) => {
      setTimeout(() => handlePrintLabel(m), i * 300);
    });
    showMessage('success', `Printing ${toPrint.length} label(s).`);
  };

  return (
    <div className="min-h-[400px] space-y-4">
      {/* A. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Outpatient Outside Medicines</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filters.paymentStatus || 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, paymentStatus: v }))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.dispensingStatus || 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, dispensingStatus: v }))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Dispensing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Dispensed">Dispensed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Medicine
          </Button>
        </div>
      </div>

      {message.text && (
        <div
          className={cn(
            'rounded-lg border p-3 text-sm',
            message.type === 'error'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
          )}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* B. Left – Patient & Visit Information */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient & Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Select
              value={visitSelectValue}
              onValueChange={(v) => v !== 'none' && setSelectedVisitId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visit" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_VISITS.length === 0 ? (
                  <SelectItem value="none" disabled>No visits</SelectItem>
                ) : (
                  MOCK_VISITS.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.patientName} – {v.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedVisit && (
              <>
                <p><span className="text-muted-foreground">Patient:</span> {selectedVisit.patientName}</p>
                <p><span className="text-muted-foreground">MR Number:</span> {selectedVisit.mrNumber}</p>
                <p><span className="text-muted-foreground">Visit ID:</span> {selectedVisit.id}</p>
                <p><span className="text-muted-foreground">Doctor:</span> {selectedVisit.doctorName}</p>
                <p><span className="text-muted-foreground">Visit Date:</span> {selectedVisit.visitDate}</p>
                <p><span className="text-muted-foreground">Clinic:</span> {selectedVisit.clinicName}</p>
                {selectedVisit.diagnosis && (
                  <p><span className="text-muted-foreground">Diagnosis:</span> {selectedVisit.diagnosis}</p>
                )}
                {selectedVisit.allergies ? (
                  <p className="text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Allergies: {selectedVisit.allergies}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Allergies: None</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* C. Main – Medicines Grid */}
        <div className="space-y-4 min-w-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={filteredMedicines.length > 0 && selectedIds.size === filteredMedicines.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Generic</TableHead>
                      <TableHead>Strength</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Freq</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Qty Prescribed</TableHead>
                      <TableHead className="text-right">Qty Dispensed</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Dispensing</TableHead>
                      <TableHead>Prescribed By</TableHead>
                      <TableHead className="text-right w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicines.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.dispensingStatus !== 'Cancelled' && (
                            <Checkbox
                              checked={selectedIds.has(row.id)}
                              onCheckedChange={() => toggleSelect(row.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.medicineName}</TableCell>
                        <TableCell>{row.genericName}</TableCell>
                        <TableCell>{row.strength}</TableCell>
                        <TableCell>{row.dosageInstructions}</TableCell>
                        <TableCell>{row.frequency}</TableCell>
                        <TableCell>{row.duration}</TableCell>
                        <TableCell className="text-right">{row.quantityPrescribed}</TableCell>
                        <TableCell className="text-right">{row.quantityDispensed}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.unitPrice)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency((row.quantityPrescribed ?? 0) * (row.unitPrice ?? 0))}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.discount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(netAmount(row))}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.paymentStatus === 'Paid'
                                ? 'default'
                                : row.paymentStatus === 'Partial'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {row.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.dispensingStatus === 'Dispensed'
                                ? 'default'
                                : row.dispensingStatus === 'Cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {row.dispensingStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.prescribedBy}</TableCell>
                        <TableCell className="text-right">
                          {row.dispensingStatus !== 'Cancelled' && (
                            <div className="flex flex-wrap justify-end gap-1">
                              {row.dispensingStatus !== 'Dispensed' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setTargetMedicine(row);
                                      setEditOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setTargetMedicine(row);
                                      setDispenseOpen(true);
                                    }}
                                  >
                                    <Package className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handlePrintLabel(row)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              {row.dispensingStatus !== 'Dispensed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTargetMedicine(row);
                                    setCancelOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredMedicines.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">No medicines found.</div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkPrintLabels}>
              <Printer className="h-4 w-4 mr-1" />
              Print Selected Labels
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetMedicine(null);
                setPaymentOpen(true);
              }}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          </div>

          {/* D. Summary Panel */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Medicines</p>
                  <p className="font-semibold">{summary.totalMedicines}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Discount</p>
                  <p className="font-semibold">{formatCurrency(summary.totalDiscount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Amount</p>
                  <p className="font-semibold">{formatCurrency(summary.netAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-green-600">{formatCurrency(summary.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-semibold text-destructive">{formatCurrency(summary.pendingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Medicine Dialog */}
      <AddMedicineDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddMedicine}
        visit={selectedVisit}
        medicineMaster={MEDICINE_MASTER}
        allergies={selectedVisit?.allergies}
      />

      {/* Dispense Dialog */}
      <DispenseDialog
        open={dispenseOpen}
        onOpenChange={(open) => {
          setDispenseOpen(open);
          if (!open) setTargetMedicine(null);
        }}
        medicine={targetMedicine}
        onConfirm={handleDispense}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={(open) => {
          setPaymentOpen(open);
          if (!open) setTargetMedicine(null);
        }}
        medicines={targetMedicine ? [targetMedicine] : medicines.filter((m) => selectedIds.has(m.id))}
        netAmount={netAmount}
        onConfirm={handlePayment}
      />

      {/* Cancel Dialog */}
      <CancelDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setTargetMedicine(null);
        }}
        medicine={targetMedicine}
        onConfirm={handleCancel}
      />

      {/* Edit Medicine Dialog */}
      <EditMedicineDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setTargetMedicine(null);
        }}
        medicine={targetMedicine}
        onConfirm={handleEdit}
        canEdit={targetMedicine?.dispensingStatus !== 'Dispensed'}
      />
    </div>
  );
}

function AddMedicineDialog({ open, onOpenChange, onSubmit, visit, medicineMaster, allergies }) {
  const [medicineId, setMedicineId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [discount, setDiscount] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [outsidePharmacyName, setOutsidePharmacyName] = useState('');

  const selectedMaster = medicineMaster.find((m) => m.id === medicineId);
  const unitPrice = selectedMaster?.unitPrice ?? 0;
  const qty = Number(quantity) || 0;
  const disc = Number(discount) || 0;
  const total = qty * unitPrice - disc;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!medicineId || !quantity || qty < 1) return;
    onSubmit({
      medicineId,
      medicineName: selectedMaster?.name,
      genericName: selectedMaster?.genericName,
      strength: selectedMaster?.strength,
      quantity: qty,
      unitPrice,
      dosage,
      frequency,
      duration,
      discount: disc,
      remarks,
      outsidePharmacyName,
    });
    setMedicineId('');
    setQuantity('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setDiscount('0');
    setRemarks('');
    setOutsidePharmacyName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-md">
        <DialogHeader>
          <DialogTitle>Add Medicine</DialogTitle>
        </DialogHeader>
        {allergies && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Patient allergy: {allergies}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Medicine</Label>
            <Select value={medicineId} onValueChange={setMedicineId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {medicineMaster.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} – {m.genericName} {m.strength}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Unit Price</Label>
              <Input type="number" step="0.01" value={unitPrice} readOnly className="bg-muted" />
            </div>
          </div>
          <div>
            <Label>Dosage Instructions</Label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 1 tablet OD" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequency</Label>
              <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. OD, BD" />
            </div>
            <div>
              <Label>Duration</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 30 days" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Discount</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <Label>Total</Label>
              <Input value={formatCurrency(total)} readOnly className="bg-muted" />
            </div>
          </div>
          <div>
            <Label>Outside Pharmacy Name (optional)</Label>
            <Input
              value={outsidePharmacyName}
              onChange={(e) => setOutsidePharmacyName(e.target.value)}
              placeholder="Pharmacy name"
            />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DispenseDialog({ open, onOpenChange, medicine, onConfirm }) {
  const maxQty = medicine?.quantityPrescribed ?? 0;
  const [qty, setQty] = useState(maxQty);

  useEffect(() => {
    if (open && medicine) setQty(medicine.quantityPrescribed ?? 0);
  }, [open, medicine]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (medicine) onConfirm(medicine, qty);
  };

  if (!medicine) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Dispense Medicine</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{medicine.medicineName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantity to dispense (max {maxQty})</Label>
            <Input
              type="number"
              min={0}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(Math.min(maxQty, Number(e.target.value) || 0))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Dispense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({ open, onOpenChange, medicines, netAmount, onConfirm }) {
  const [mode, setMode] = useState('cash');
  const [amount, setAmount] = useState('');

  const totalNet = medicines?.reduce((s, m) => s + netAmount(m), 0) ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    onConfirm(mode, amt);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Net amount: {formatCurrency(totalNet)} ({medicines?.length ?? 0} item(s))
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Payment mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={formatCurrency(totalNet)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ open, onOpenChange, medicine, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (medicine && reason.trim()) onConfirm(medicine, reason.trim());
  };

  if (!medicine) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Cancel Medicine</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{medicine.medicineName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cancellation reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Back
            </Button>
            <Button type="submit" variant="destructive">
              Cancel Medicine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMedicineDialog({ open, onOpenChange, medicine, onConfirm, canEdit }) {
  const [quantity, setQuantity] = useState(medicine?.quantityPrescribed ?? 0);
  const [discount, setDiscount] = useState(medicine?.discount ?? 0);
  const [dosage, setDosage] = useState(medicine?.dosageInstructions ?? '');
  const [remarks, setRemarks] = useState(medicine?.remarks ?? '');

  useEffect(() => {
    if (open && medicine) {
      setQuantity(medicine.quantityPrescribed ?? 0);
      setDiscount(medicine.discount ?? 0);
      setDosage(medicine.dosageInstructions ?? '');
      setRemarks(medicine.remarks ?? '');
    }
  }, [open, medicine]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (medicine) onConfirm(medicine, { quantityPrescribed: quantity, discount, dosageInstructions: dosage, remarks });
  };

  if (!medicine) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Medicine</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{medicine.medicineName}</p>
        {!canEdit && (
          <p className="text-sm text-destructive">This item is dispensed; only limited edits allowed.</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label>Discount</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label>Dosage Instructions</Label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
