import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { labApi } from '@/services/api';

const defaultParameter = () => ({
  parameter: '',
  units: '',
  ageValue: '',
  ageUnit: 'Y',
  gender: 'u',
  referenceLow: '',
  referenceHigh: '',
  criticalStart: '',
  criticalEnd: '',
  reportableRange: '',
  analyticalRange: '',
  method: '',
});

export function TestCatalogPage() {
  const [list, setList] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState('');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState([defaultParameter()]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const load = () => labApi.getTestCatalogList().then(({ data }) => setList(data));
  useEffect(() => { load(); }, []);
  useEffect(() => { labApi.getAvailableLabTests().then(({ data }) => setAvailableTests(data || [])); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter((row) => (row.testName || '').toLowerCase().includes(q));
  }, [list, search]);

  const total = filtered.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => filtered.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [filtered, currentPage, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleAddParam = () => setParameters((p) => [...p, defaultParameter()]);
  const handleRemoveParam = (i) => setParameters((p) => p.filter((_, idx) => idx !== i));
  const handleParamChange = (i, field, value) =>
    setParameters((p) => p.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));

  const handleSaveCatalog = async () => {
    const test = availableTests.find((t) => t.id === selectedTest || t.name === selectedTest);
    const testName = test?.name || selectedTest;
    if (!testName) {
      alert('Select a lab test.');
      return;
    }
    const paramsToSave = parameters
      .filter((p) => p.parameter?.trim())
      .map((p) => ({
        parameter: p.parameter?.trim() || '',
        units: p.units?.trim() || '',
        ageValue: p.ageValue === '' ? null : Number(p.ageValue),
        ageUnit: p.ageUnit || 'Y',
        gender: p.gender || 'u',
        referenceLow: p.referenceLow === '' ? null : p.referenceLow,
        referenceHigh: p.referenceHigh === '' ? null : p.referenceHigh,
        criticalStart: p.criticalStart === '' ? null : p.criticalStart,
        criticalEnd: p.criticalEnd === '' ? null : p.criticalEnd,
        reportableRange: p.reportableRange === '' ? null : p.reportableRange,
        analyticalRange: p.analyticalRange === '' ? null : p.analyticalRange,
        method: p.method?.trim() || '',
      }));
    setSaving(true);
    try {
      await labApi.createTestCatalog({
        testName,
        description: description.trim(),
        parameters: paramsToSave,
      });
      load();
      setAddOpen(false);
      setSelectedTest('');
      setDescription('');
      setParameters([defaultParameter()]);
    } catch (e) {
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this catalog entry?')) return;
    try {
      await labApi.deleteTestCatalog(id);
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test Catalog</h1>
          <p className="text-muted-foreground">Manage lab test catalog and parameters</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Lab Test</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Catalog Listing</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'testName', label: 'Test Name', render: (row) => row.testName },
              { key: 'parameterCount', label: 'Number of Parameters', render: (row) => row.parameterCount ?? row.parameters?.length ?? 0 },
            ]}
            data={rows}
            total={total}
            page={currentPage}
            pageSize={pagination.limit}
            searchValue={search}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            getRowId={(row) => row.id}
            searchPlaceholder="Search by test name..."
            emptyMessage="No catalog entries"
            actions={(row) => (
              <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} title="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="min-w-[700px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Lab Test</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Select Lab Test <span className="text-destructive">*</span></Label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                <SelectContent>
                  {(availableTests || []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test description"
                rows={3}
                className="resize-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Test Parameters</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddParam}>Add Parameter</Button>
              </div>
              <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
                {parameters.map((p, i) => (
                  <div key={i} className="space-y-3 rounded-md border bg-background p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Parameter {i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveParam(i)} title="Delete parameter">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Parameter</Label>
                        <Input
                          value={p.parameter}
                          onChange={(e) => handleParamChange(i, 'parameter', e.target.value)}
                          placeholder="Parameter name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Units</Label>
                        <Input
                          value={p.units}
                          onChange={(e) => handleParamChange(i, 'units', e.target.value)}
                          placeholder="e.g. mg/dL"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Age</Label>
                          <Input
                            type="number"
                            min={0}
                            value={p.ageValue}
                            onChange={(e) => handleParamChange(i, 'ageValue', e.target.value)}
                            placeholder="Value"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Unit</Label>
                          <Select value={p.ageUnit} onValueChange={(v) => handleParamChange(i, 'ageUnit', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="D">Days</SelectItem>
                              <SelectItem value="M">Months</SelectItem>
                              <SelectItem value="Y">Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Gender</Label>
                        <Select value={p.gender} onValueChange={(v) => handleParamChange(i, 'gender', v)}>
                          <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m">M</SelectItem>
                            <SelectItem value="f">F</SelectItem>
                            <SelectItem value="u">U (Undefined)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Reference Range (Start)</Label>
                          <Input
                            type="number"
                            value={p.referenceLow}
                            onChange={(e) => handleParamChange(i, 'referenceLow', e.target.value)}
                            placeholder="e.g. 5"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Reference Range (End)</Label>
                          <Input
                            type="number"
                            value={p.referenceHigh}
                            onChange={(e) => handleParamChange(i, 'referenceHigh', e.target.value)}
                            placeholder="e.g. 10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Critical Range (Start)</Label>
                        <Input
                          type="number"
                          value={p.criticalStart}
                          onChange={(e) => handleParamChange(i, 'criticalStart', e.target.value)}
                          placeholder="Start"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Critical Range (End)</Label>
                        <Input
                          type="number"
                          value={p.criticalEnd}
                          onChange={(e) => handleParamChange(i, 'criticalEnd', e.target.value)}
                          placeholder="End"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reportable Range</Label>
                        <Input
                          type="number"
                          value={p.reportableRange}
                          onChange={(e) => handleParamChange(i, 'reportableRange', e.target.value)}
                          placeholder="Number"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Analytical Range</Label>
                        <Input
                          type="number"
                          value={p.analyticalRange}
                          onChange={(e) => handleParamChange(i, 'analyticalRange', e.target.value)}
                          placeholder="Number"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Method</Label>
                        <Input
                          value={p.method}
                          onChange={(e) => handleParamChange(i, 'method', e.target.value)}
                          placeholder="Method"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCatalog} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
