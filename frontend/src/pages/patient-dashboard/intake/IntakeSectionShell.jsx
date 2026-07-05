import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIntake } from './IntakeContext';

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function IntakeSectionShell({
  title,
  sectionKey,
  children,
  renderSummary,
  emptyMessage = 'No entries recorded.',
}) {
  const { loadSections, canPersist } = useIntake();
  const [entries, setEntries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasEntries = entries.length > 0;

  const refresh = async () => {
    if (!canPersist || !sectionKey) return;
    setLoading(true);
    try {
      const rows = await loadSections(sectionKey);
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [sectionKey, canPersist]);

  const handleSaved = async () => {
    setDialogOpen(false);
    await refresh();
  };

  return (
    <Card id={`intake-section-${sectionKey}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Button
          type="button"
          size="sm"
          variant={hasEntries ? 'outline' : 'default'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {hasEntries ? 'Add addendum' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {children({ open: dialogOpen, onOpenChange: setDialogOpen, onSaved: handleSaved, entries })}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Summary</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="max-w-md truncate">
                      {renderSummary ? renderSummary(entry.data) : JSON.stringify(entry.data)}
                    </TableCell>
                    <TableCell>{entry.createdByName || '—'}</TableCell>
                    <TableCell>{formatWhen(entry.createdAt)}</TableCell>
                    <TableCell>{entry.isAddendum ? 'Addendum' : 'Entry'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
