import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRcmEncounter } from '../RcmEncounterContext';
import { formatMoney } from '../rcmEncounterConstants';
import { CodeLookupField } from '@/components/rcm/CodeLookupField';
import { PlaceOfServiceSelect } from '@/components/rcm/PlaceOfServiceSelect';
import { rcmApi } from '@/services/api';

function emptyCharge(index) {
  return {
    id: `tmp-${Date.now()}-${index}`,
    cptCode: '',
    hcpcsCode: '',
    description: '',
    modifiers: '',
    units: 1,
    unitCharge: 0,
    diagnosisPointers: 'A',
    placeOfService: '11',
    revenueCode: '',
  };
}

export function ChargesTab() {
  const { encounter, updateCharges, saving } = useRcmEncounter();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState([]);

  useEffect(() => {
    setRows(encounter?.charges?.length ? encounter.charges.map((c) => ({ ...c })) : [emptyCharge(0)]);
  }, [encounter?.charges]);

  useEffect(() => {
    if (!search.trim()) {
      setHits([]);
      return undefined;
    }
    const t = setTimeout(() => {
      rcmApi
        .searchCharges({ q: search.trim(), limit: 8 })
        .then((res) => setHits(res.data || []))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.units || 0) * Number(r.unitCharge || 0), 0),
    [rows],
  );

  if (!encounter) return null;

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addFromMaster = (hit) => {
    setRows((prev) => [
      ...prev.filter((r) => r.cptCode || r.description),
      {
        id: `tmp-${Date.now()}`,
        cptCode: hit.cptCode || (hit.codeType === 'CPT' ? hit.code : ''),
        hcpcsCode: hit.hcpcsCode || (hit.codeType === 'HCPCS' ? hit.code : ''),
        description: hit.description || '',
        modifiers: hit.modifiers || '',
        units: hit.defaultUnits || 1,
        unitCharge: Number(hit.unitCharge || 0),
        diagnosisPointers: 'A',
        placeOfService: hit.placeOfService || '11',
        revenueCode: hit.revenueCode || null,
        catalogId: hit.id,
      },
    ]);
    setSearch('');
    setHits([]);
  };

  const handleSave = async () => {
    const cleaned = rows
      .filter((r) => (r.cptCode?.trim() || r.hcpcsCode?.trim()) && r.description.trim())
      .map((r) => ({
        id: String(r.id || '').startsWith('tmp-') ? undefined : r.id,
        cptCode: r.cptCode?.trim() || undefined,
        hcpcsCode: r.hcpcsCode?.trim() || undefined,
        description: r.description.trim(),
        modifiers: r.modifiers || '',
        units: Number(r.units) || 1,
        unitCharge: Number(r.unitCharge) || 0,
        diagnosisPointers: r.diagnosisPointers || 'A',
        placeOfService: r.placeOfService || '11',
        revenueCode: r.revenueCode || null,
        catalogId: r.catalogId || undefined,
      }));
    await updateCharges(cleaned);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Charges (CPT)</h2>
          <p className="text-sm text-muted-foreground">
            Charge capture from charge master → encounter → claim lines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-muted-foreground">
            Total <span className="font-semibold text-foreground">{formatMoney(total)}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyCharge(prev.length)])}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add charge
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            Save charges
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Charge master lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search CPT / description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {hits.length > 0 && (
            <div className="overflow-hidden rounded-md border">
              {hits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
                  onClick={() => addFromMaster(hit)}
                >
                  <span>
                    <span className="font-mono text-xs">{hit.code || hit.cptCode || hit.hcpcsCode}</span> — {hit.description}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatMoney(hit.unitCharge)}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Charge lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">CPT / HCPCS</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Mods</TableHead>
                  <TableHead className="w-20">Units</TableHead>
                  <TableHead className="w-28">Unit $</TableHead>
                  <TableHead className="w-24">Dx ptr</TableHead>
                  <TableHead className="w-20">POS</TableHead>
                  <TableHead className="w-28">Line $</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.id || idx}>
                    <TableCell>
                      <CodeLookupField
                        catalog="charge"
                        value={row.cptCode || row.hcpcsCode || ''}
                        onChange={(code) => updateRow(idx, { cptCode: code, hcpcsCode: '' })}
                        onSelect={(item) => {
                          const raw = item.raw || {};
                          updateRow(idx, {
                            cptCode: raw.cptCode || (raw.codeType === 'CPT' ? item.code : ''),
                            hcpcsCode: raw.hcpcsCode || (raw.codeType === 'HCPCS' ? item.code : ''),
                            description: item.description || raw.description || '',
                            unitCharge: raw.unitCharge ?? row.unitCharge,
                            modifiers: raw.modifiers || row.modifiers,
                            placeOfService: raw.placeOfService || row.placeOfService || '11',
                            revenueCode: raw.revenueCode || '',
                            units: raw.defaultUnits || row.units || 1,
                            catalogId: item.id,
                          });
                        }}
                        placeholder="99213"
                        inputClassName="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(e) => updateRow(idx, { description: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.modifiers || ''}
                        onChange={(e) => updateRow(idx, { modifiers: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={row.units}
                        onChange={(e) => updateRow(idx, { units: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.unitCharge}
                        onChange={(e) => updateRow(idx, { unitCharge: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.diagnosisPointers || ''}
                        onChange={(e) => updateRow(idx, { diagnosisPointers: e.target.value })}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <PlaceOfServiceSelect
                        value={row.placeOfService || ''}
                        onValueChange={(v) => updateRow(idx, { placeOfService: v })}
                        triggerClassName="h-8 min-w-[4.5rem]"
                        placeholder="POS"
                      />
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {formatMoney(Number(row.units || 0) * Number(row.unitCharge || 0))}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={rows.length <= 1}
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
