import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { diagnosisCodeApi } from '@/services/api';
import { Input } from '@/components/ui/input';

export function DiagnosisPickerDialog({ open, onOpenChange, selected = [], onConfirm }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(selected);

  const search = async (q) => {
    setQuery(q);
    const res = await diagnosisCodeApi.getAll({ search: q, limit: 20 });
    setResults(res.data || []);
  };

  const toggle = (item) => {
    setPicked((prev) => {
      if (prev.some((p) => p.diagnosisId === item.id)) {
        return prev.filter((p) => p.diagnosisId !== item.id);
      }
      return [
        ...prev,
        { diagnosisId: item.id, code: item.code, description: item.description },
      ];
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Diagnosis</DialogTitle>
        </DialogHeader>
        <Input placeholder="Search ICD-10 code or name…" value={query} onChange={(e) => search(e.target.value)} />
        <ul className="max-h-48 overflow-y-auto divide-y rounded border">
          {results.map((item) => (
            <li key={item.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => toggle(item)}>
                <span className="font-medium">{item.code}</span> — {item.description}
                {picked.some((p) => p.diagnosisId === item.id) && ' ✓'}
              </button>
            </li>
          ))}
        </ul>
        {picked.length > 0 && (
          <div className="text-sm">
            <p className="font-medium">Selected:</p>
            {picked.map((p) => (
              <p key={p.diagnosisId}>{p.code} — {p.description}</p>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={() => { onConfirm(picked); onOpenChange(false); }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
