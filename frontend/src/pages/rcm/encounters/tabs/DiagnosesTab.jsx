import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
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
import { CodeLookupField } from '@/components/rcm/CodeLookupField';

function emptyDiagnosis(index) {
  return {
    id: `tmp-${Date.now()}-${index}`,
    code: '',
    description: '',
    pointer: String.fromCharCode(65 + index),
    isPrimary: index === 0,
  };
}

export function DiagnosesTab() {
  const { encounter, updateDiagnoses, saving } = useRcmEncounter();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(encounter?.diagnoses?.length ? encounter.diagnoses.map((d) => ({ ...d })) : [emptyDiagnosis(0)]);
  }, [encounter?.diagnoses]);

  if (!encounter) return null;

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    const cleaned = rows
      .filter((r) => r.code.trim() && r.description.trim())
      .map((r, idx) => ({
        id: String(r.id || '').startsWith('tmp-') ? undefined : r.id,
        code: r.code.trim(),
        description: r.description.trim(),
        pointer: r.pointer || String.fromCharCode(65 + idx),
        isPrimary: idx === 0,
      }));
    await updateDiagnoses(cleaned);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Diagnoses (ICD)</h2>
          <p className="text-sm text-muted-foreground">ICD-10 codes for claim diagnosis pointers.</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyDiagnosis(prev.length)])}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add ICD
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            Save diagnoses
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ICD list</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ptr</TableHead>
                  <TableHead className="w-36">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.id || idx}>
                    <TableCell className="font-mono text-xs">{row.pointer || String.fromCharCode(65 + idx)}</TableCell>
                    <TableCell>
                      <CodeLookupField
                        catalog="diagnosis"
                        value={row.code}
                        onChange={(code) => updateRow(idx, { code })}
                        onSelect={(item) =>
                          updateRow(idx, {
                            code: item.code,
                            description: item.description,
                            catalogId: item.id,
                          })
                        }
                        placeholder="E11.9"
                        inputClassName="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(e) => updateRow(idx, { description: e.target.value })}
                        placeholder="Select a catalog code or enter description"
                        className="h-8"
                      />
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
