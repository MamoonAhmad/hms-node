import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Edit, MessageSquare, Printer, Package } from 'lucide-react';
import { orderApi, medicationOrderApi, patientApi } from '@/services/api';
import { mapOrderToPharmacyMed, formatPatientName, formatDob, calcAge, formatGender } from '@/lib/orderWorklist';
import { EditMedicationDialog } from './EditMedicationDialog';

const ORDER_STATUS_OPTIONS = ['Scheduled', 'Pending', 'In Progress', 'On Hold', 'Cancelled', 'Completed', 'Resulted'];
const MED_ORDER_STATUS_OPTIONS = ['Draft', 'Signed', 'Verified', 'Sent', 'Completed', 'Cancelled'];

function mapMedicationOrderToCard(mo, patientId) {
  return {
    id: mo.id,
    patientId,
    medicationName: mo.medicationName || '-',
    drugProduct: mo.medicationCode || mo.ndcSafetyFlag || '-',
    dosage: [mo.dose, mo.unit].filter(Boolean).join(' ') || mo.sigPreview || '-',
    description: mo.sigPreview || mo.additionalInstructions || mo.medicationName || '-',
    comment: mo.additionalInstructions || '',
    priority: mo.prn ? 'PRN' : 'Routine',
    status: mo.status || 'Draft',
    dateTime: mo.signedAt || mo.createdAt,
    createdBy: mo.orderedBy || mo.prescriber || mo.signedBy || '-',
    updatedAt: mo.updatedAt || mo.createdAt,
    source: 'medicationOrder',
  };
}

export function PatientMedicationViewPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [barcodeModal, setBarcodeModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [labelCount, setLabelCount] = useState(1);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, medOrdersRes, patientRes] = await Promise.all([
        orderApi.getOrders({ patientId, category: 'Pharmacy', limit: 500 }).catch(() => ({ data: [] })),
        medicationOrderApi.getOrders(patientId).catch(() => ({ data: [] })),
        patientApi.getById(patientId).catch(() => null),
      ]);

      const pharmacyOrders = (ordersRes?.data || []).map(mapOrderToPharmacyMed);
      const structured = (medOrdersRes?.data || []).map((mo) => mapMedicationOrderToCard(mo, patientId));

      // Prefer structured medication orders; fall back to pharmacy Orders-tab rows.
      // Avoid duplicates when Pharmacy order already synced into MedicationOrder (same name + close time).
      const structuredNames = new Set(structured.map((m) => (m.medicationName || '').toLowerCase()));
      const extras = pharmacyOrders.filter(
        (o) => !structuredNames.has((o.medicationName || '').toLowerCase())
      );
      const merged = [...structured, ...extras].sort(
        (a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0)
      );
      setMedications(merged);

      const fromOrder = pharmacyOrders[0]?.patient;
      const p = patientRes?.data || patientRes;
      if (p?.id || p?.firstName) {
        const dob = p.dateOfBirth || p.dob;
        setPatient({
          id: p.id || patientId,
          name: formatPatientName(p),
          mrn: p.mrn || '-',
          dob: formatDob(dob),
          age: calcAge(dob),
          gender: formatGender(p.gender),
        });
      } else if (fromOrder) {
        setPatient(fromOrder);
      } else {
        setPatient({ id: patientId, name: 'Patient', mrn: '-', dob: '-', age: '-', gender: '-' });
      }
    } catch (err) {
      setError(err.message || 'Failed to load medications');
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (medId, newStatus) => {
    const med = medications.find((m) => m.id === medId);
    setMedications((prev) => prev.map((m) => (m.id === medId ? { ...m, status: newStatus } : m)));
    try {
      if (med?.source === 'medicationOrder') {
        await medicationOrderApi.updateStatus(patientId, medId, newStatus);
      } else {
        await orderApi.updateOrderStatus(medId, newStatus);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
      await loadData();
    }
  };

  const handleSaveMedication = (updated) => {
    setMedications((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    setEditModal(null);
  };

  const handlePrintBarcode = (med) => {
    const count = Math.max(1, parseInt(labelCount, 10) || 1);
    window.open(`/pharmacy/barcode-labels?patientId=${patientId}&medicationId=${med?.id}&count=${count}`, '_blank');
    setBarcodeModal(null);
    setLabelCount(1);
  };

  if (!loading && !patient && error) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="link" onClick={() => navigate('/pharmacy/e-prescribe-med-reconciliation')}>Back to Patient Medications</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pharmacy/e-prescribe-med-reconciliation')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Patient Medications</h1>
          <p className="text-muted-foreground">{patient?.name || '…'} · MRN: {patient?.mrn || '-'}</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Patient</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><Label className="text-muted-foreground">Patient Name</Label><p className="font-medium">{patient?.name || '-'}</p></div>
          <div><Label className="text-muted-foreground">MRN</Label><p>{patient?.mrn || '-'}</p></div>
          <div><Label className="text-muted-foreground">DOB</Label><p>{patient?.dob || '-'}</p></div>
          <div><Label className="text-muted-foreground">Age</Label><p>{patient?.age ?? '-'}</p></div>
          <div><Label className="text-muted-foreground">Gender</Label><p>{patient?.gender || '-'}</p></div>
          <div><Label className="text-muted-foreground">Number of medications</Label><p className="font-medium">{medications.length}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Medications</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : medications.length === 0 ? (
            <p className="text-muted-foreground">No medication orders for this patient.</p>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <div key={med.id} className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="font-medium">{med.medicationName}</div>
                    <div className="text-muted-foreground">Drug Product: {med.drugProduct}</div>
                    <div>Dosage: {med.dosage}</div>
                    <div>Description: {med.description}</div>
                    <div>Comment: {med.comment || '-'}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">Priority: {med.priority}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">Status: {med.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Date &amp; Time: {med.dateTime ? new Date(med.dateTime).toLocaleString() : '-'} · Created by {med.createdBy}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 items-center">
                    <Select value={med.status} onValueChange={(v) => handleStatusChange(med.id, v)}>
                      <SelectTrigger className="w-[120px] h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {(med.source === 'medicationOrder' ? MED_ORDER_STATUS_OPTIONS : ORDER_STATUS_OPTIONS).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        {!(med.source === 'medicationOrder' ? MED_ORDER_STATUS_OPTIONS : ORDER_STATUS_OPTIONS).includes(med.status) && (
                          <SelectItem value={med.status}>{med.status}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" title="Edit Medication" onClick={() => setEditModal(med)}><Edit className="h-4 w-4 icon-action-edit" /></Button>
                    <Button variant="ghost" size="icon" title="Feedback" onClick={() => setFeedbackModal(med)}><MessageSquare className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Print labels" onClick={() => setBarcodeModal(med)}><Printer className="h-4 w-4 icon-action-print" /></Button>
                    <Button variant="ghost" size="icon" title="Stock Status" onClick={() => setStockModal(med)}><Package className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editModal && (
        <EditMedicationDialog open={!!editModal} onOpenChange={(o) => !o && setEditModal(null)} medication={editModal} onSave={handleSaveMedication} />
      )}

      {feedbackModal && (
        <Dialog open={!!feedbackModal} onOpenChange={(o) => !o && setFeedbackModal(null)}>
          <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Feedback &amp; Clinical Notes</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{feedbackModal.medicationName}</p>
            <div>
              <Label>Feedback / Clinical notes</Label>
              <Textarea placeholder="Enter feedback..." rows={4} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackModal(null)}>Cancel</Button>
              <Button onClick={() => setFeedbackModal(null)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {barcodeModal && (
        <Dialog open={!!barcodeModal} onOpenChange={(o) => !o && setBarcodeModal(null)}>
          <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Print Barcode Labels</DialogTitle></DialogHeader>
            <p className="text-sm">{barcodeModal.medicationName}</p>
            <div>
              <Label>Number of labels</Label>
              <Input type="number" min={1} value={labelCount} onChange={(e) => setLabelCount(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBarcodeModal(null)}>Cancel</Button>
              <Button onClick={() => handlePrintBarcode(barcodeModal)}>Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {stockModal && (
        <Dialog open={!!stockModal} onOpenChange={(o) => !o && setStockModal(null)}>
          <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Stock Status</DialogTitle></DialogHeader>
            <p className="text-sm font-medium">{stockModal.medicationName}</p>
            <div className="text-sm text-muted-foreground">
              <p>Availability: Check pharmacy inventory</p>
              <p>Source: {stockModal.source === 'medicationOrder' ? 'Medication order' : 'Encounter pharmacy order'}</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setStockModal(null)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
