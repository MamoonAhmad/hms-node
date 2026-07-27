import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Barcode, Eye } from 'lucide-react';
import { orderApi } from '@/services/api';
import {
  mapOrderToPharmacyMed,
  groupOrdersByPatient,
} from '@/lib/orderWorklist';

export function MedicationPrescriptionsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [mrn, setMrn] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [admissionSearch, setAdmissionSearch] = useState('');
  const [barcodeRow, setBarcodeRow] = useState(null);
  const [labelCount, setLabelCount] = useState(1);

  const [tableSearch, setTableSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderApi.getOrders({ category: 'Pharmacy', limit: 500 });
        const mapped = (res?.data || []).map(mapOrderToPharmacyMed);
        const grouped = groupOrdersByPatient(mapped, 'dateTime');
        if (!cancelled) setPatients(grouped);
      } catch (err) {
        if (!cancelled) {
          setPatients([]);
          setError(err.message || 'Failed to load medication orders');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = patients;
    if (patientName.trim()) {
      const q = patientName.toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    if (mrn.trim()) {
      const q = mrn.toLowerCase();
      list = list.filter((p) => (p.mrn || '').toLowerCase().includes(q));
    }
    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.mrn || '').toLowerCase().includes(q)
      );
    }
    if (admissionSearch.trim()) {
      const q = admissionSearch.toLowerCase();
      list = list.filter((p) => (p.admission?.erId || '').toLowerCase().includes(q));
    }
    return list;
  }, [patients, patientName, mrn, quickSearch, admissionSearch]);

  const filteredByTableSearch = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return filtered;
    return filtered.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.mrn || '').toLowerCase().includes(q)
    );
  }, [filtered, tableSearch]);

  const total = filteredByTableSearch.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => filteredByTableSearch.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [filteredByTableSearch, currentPage, pagination.limit]
  );

  const handleTableSearch = useCallback((keyword) => {
    setTableSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleApplyFilters = () => {};
  const handleReset = () => {
    setPatientName('');
    setMrn('');
    setQuickSearch('');
    setAdmissionSearch('');
  };

  const handlePrintBarcode = () => {
    if (!barcodeRow) return;
    const count = Math.max(1, parseInt(labelCount, 10) || 1);
    window.open(`/pharmacy/barcode-labels?patientId=${barcodeRow.id}&count=${count}`, '_blank');
    setBarcodeRow(null);
    setLabelCount(1);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Medication Prescriptions</h1>
        <p className="text-muted-foreground">E-Prescribe & Med Reconciliation</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Patient Name</Label>
              <Input placeholder="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>
            <div>
              <Label>MRN</Label>
              <Input placeholder="MRN" value={mrn} onChange={(e) => setMrn(e.target.value)} />
            </div>
            <div>
              <Label>Quick Search</Label>
              <Input placeholder="Search across fields" value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label className="text-sm text-muted-foreground">Search by Admission ID</Label>
        <Input placeholder="Admission ID" value={admissionSearch} onChange={(e) => setAdmissionSearch(e.target.value)} className="max-w-xs mt-1" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'patientDetails',
                label: 'Patient Details',
                render: (row) => (
                  <div className="text-sm">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-muted-foreground">
                      MRN: {row.mrn} · DOB: {row.dob} · Age: {row.age} · {row.gender}
                    </div>
                  </div>
                ),
              },
              {
                key: 'medications',
                label: 'Medications',
                render: (row) => (
                  <div className="text-sm">
                    <div className="font-medium">{row.medicationCount} medication(s)</div>
                    <div className="text-muted-foreground text-xs">
                      {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '-'}
                    </div>
                    <div className="text-xs">by {row.updatedBy}</div>
                  </div>
                ),
              },
              {
                key: 'lastUpdated',
                label: 'Last Updated',
                render: (row) => (
                  <div className="text-sm">
                    <div>{row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '-'}</div>
                    <div className="text-xs text-muted-foreground">{row.updatedBy}</div>
                  </div>
                ),
              },
            ]}
            data={rows}
            total={total}
            page={currentPage}
            pageSize={pagination.limit}
            searchValue={tableSearch}
            onSearch={handleTableSearch}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            getRowId={(row) => row.id}
            searchPlaceholder="Search patient records..."
            emptyMessage={loading ? 'Loading medication orders...' : 'No records'}
            actions={(row) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  title="View medications"
                  onClick={() => navigate(`/pharmacy/e-prescribe-med-reconciliation/patient/${row.id}`)}
                >
                  <Eye className="h-4 w-4 icon-action-view" />
                </Button>
                <Button variant="ghost" size="sm" title="Generate Barcode Labels" onClick={() => setBarcodeRow(row)}>
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={!!barcodeRow} onOpenChange={(o) => !o && setBarcodeRow(null)}>
        <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Generate Barcode Labels</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{barcodeRow?.name} — MRN: {barcodeRow?.mrn}</p>
          <div>
            <Label>Number of labels</Label>
            <Input type="number" min={1} value={labelCount} onChange={(e) => setLabelCount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBarcodeRow(null)}>Cancel</Button>
            <Button onClick={handlePrintBarcode}>Generate & Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
