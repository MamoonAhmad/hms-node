import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ADDENDUM_SECTIONS } from './noteConstants';

export function AddendumDialog({ open, onOpenChange, noteType, onSubmit, saving }) {
  const sections = ADDENDUM_SECTIONS[noteType] || [];
  const [selected, setSelected] = useState([]);
  const [content, setContent] = useState({});

  useEffect(() => {
    if (open) {
      setSelected([]);
      setContent({});
    }
  }, [open, noteType]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    if (!selected.length) return;
    const payload = {};
    selected.forEach((id) => {
      payload[id] = { providerNotes: content[id] || '' };
    });
    onSubmit?.({ sections: selected, content: payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Addendum</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select sections to amend. Only selected sections can be edited.</p>
          {sections.map((s) => (
            <div key={s.id} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox id={`addendum-${s.id}`} checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                <Label htmlFor={`addendum-${s.id}`}>{s.label}</Label>
              </div>
              {selected.includes(s.id) && (
                <Textarea
                  rows={3}
                  placeholder={`Addendum for ${s.label}…`}
                  value={content[s.id] || ''}
                  onChange={(e) => setContent((c) => ({ ...c, [s.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || !selected.length}>
            {saving ? 'Signing…' : 'Sign Addendum'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
