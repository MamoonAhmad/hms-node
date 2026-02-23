import { useState, useEffect } from 'react';
import { Plus, Pencil, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLabFormDialog } from './ExternalLabFormDialog';
import { outsideLabsStore } from './outsideLabsMock';

export function ExternalLabMasterPage() {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const data = await outsideLabsStore.getExternalLabsList();
      setList(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load labs' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleAdd = () => {
    setSelectedLab(null);
    setIsFormOpen(true);
  };

  const handleEdit = (lab) => {
    setSelectedLab(lab);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (selectedLab) {
        await outsideLabsStore.updateExternalLab(selectedLab.id, data);
        setMessage({ type: 'success', text: 'Lab updated successfully' });
      } else {
        await outsideLabsStore.createExternalLab(data);
        setMessage({ type: 'success', text: 'Lab added successfully' });
      }
      setIsFormOpen(false);
      setSelectedLab(null);
      fetchList();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (lab) => {
    try {
      await outsideLabsStore.toggleLabStatus(lab.id);
      setMessage({ type: 'success', text: `Lab ${lab.status === 'active' ? 'deactivated' : 'activated'}` });
      fetchList();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">External Lab Master</h1>
          <p className="text-muted-foreground">Maintain list of external laboratories</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lab
        </Button>
      </div>

      {message.text && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'error'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lab Name</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No external labs. Click Add Lab to create one.
                </TableCell>
              </TableRow>
            ) : (
              list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.labName}</TableCell>
                  <TableCell>{row.contactNumber || '—'}</TableCell>
                  <TableCell>{row.address || '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === 'active'
                          ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} title="Edit Lab">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(row)}
                        title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {row.status === 'active' ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExternalLabFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        lab={selectedLab}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
