import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Eye, Pencil, Plus } from 'lucide-react';

const DOCUMENT_TYPES = [
  'Lab Report',
  'Referral Letter',
  'Insurance Document',
  'Radiology Report',
  'Consent Form',
  'ID / Photo',
  'Other',
];

// Mock list (replace with API by patient id)
const initialDocs = [
  { id: 1, documentType: 'Lab Report', addedAt: '2025-01-15T10:30:00', fileName: 'Lab Report - CBC.pdf' },
  { id: 2, documentType: 'Referral Letter', addedAt: '2025-01-10T14:00:00', fileName: 'Referral Letter.pdf' },
  { id: 3, documentType: 'Insurance Document', addedAt: '2025-01-05T09:15:00', fileName: 'Insurance Card.jpg' },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function DocumentsSummaryContent() {
  const [docs, setDocs] = useState(initialDocs);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [formData, setFormData] = useState({
    documentType: '',
    fileName: '',
    addedAt: new Date().toISOString().slice(0, 16),
  });
  const [editingId, setEditingId] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      documentType: '',
      fileName: '',
      addedAt: new Date().toISOString().slice(0, 16),
    });
    setEditingId(null);
  }, []);

  const handleAddDoc = useCallback(() => {
    if (!formData.documentType?.trim() || !formData.fileName?.trim()) return;
    const newDoc = {
      id: Date.now(),
      documentType: formData.documentType.trim(),
      addedAt: formData.addedAt ? new Date(formData.addedAt).toISOString() : new Date().toISOString(),
      fileName: formData.fileName.trim(),
    };
    setDocs((prev) => [newDoc, ...prev]);
    setAddModalOpen(false);
    resetForm();
  }, [formData, resetForm]);

  const handleEditDoc = useCallback(() => {
    if (!editingId || !formData.documentType?.trim() || !formData.fileName?.trim()) return;
    setDocs((prev) =>
      prev.map((d) =>
        d.id === editingId
          ? {
              ...d,
              documentType: formData.documentType.trim(),
              fileName: formData.fileName.trim(),
              addedAt: formData.addedAt ? new Date(formData.addedAt).toISOString() : d.addedAt,
            }
          : d
      )
    );
    setEditModalOpen(false);
    resetForm();
  }, [editingId, formData, resetForm]);

  const openEdit = useCallback((doc) => {
    setEditingId(doc.id);
    setFormData({
      documentType: doc.documentType,
      fileName: doc.fileName,
      addedAt: doc.addedAt ? doc.addedAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setEditModalOpen(true);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Documents</CardTitle>
            <p className="text-muted-foreground text-sm font-normal mt-0.5">
              Patient documents. Add, view, or edit.
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="w-fit shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add doc
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document type</TableHead>
                <TableHead>Added date and time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No documents. Click &quot;Add doc&quot; to add one.
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.documentType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(doc.addedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => setViewDoc(doc)}
                          title="View"
                        >
                          <Eye className="h-4 w-4 mr-1 icon-action-view" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => openEdit(doc)}
                          title="Edit document"
                        >
                          <Pencil className="h-4 w-4 mr-1 icon-action-edit" />
                          Edit document
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add document modal – same fields as typical patient document form */}
      <Dialog open={addModalOpen} onOpenChange={(open) => { setAddModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="min-w-[800px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-doc-type">Document type</Label>
              <Select
                value={formData.documentType}
                onValueChange={(v) => setFormData((p) => ({ ...p, documentType: v }))}
              >
                <SelectTrigger id="add-doc-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-doc-name">Document name / file name</Label>
              <Input
                id="add-doc-name"
                placeholder="e.g. Lab Report - CBC.pdf"
                value={formData.fileName}
                onChange={(e) => setFormData((p) => ({ ...p, fileName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-doc-datetime">Added date and time</Label>
              <Input
                id="add-doc-datetime"
                type="datetime-local"
                value={formData.addedAt}
                onChange={(e) => setFormData((p) => ({ ...p, addedAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDoc} disabled={!formData.documentType?.trim() || !formData.fileName?.trim()}>
              Add document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit document modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { setEditModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="min-w-[800px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select
                value={formData.documentType}
                onValueChange={(v) => setFormData((p) => ({ ...p, documentType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document name / file name</Label>
              <Input
                placeholder="e.g. Lab Report - CBC.pdf"
                value={formData.fileName}
                onChange={(e) => setFormData((p) => ({ ...p, fileName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Added date and time</Label>
              <Input
                type="datetime-local"
                value={formData.addedAt}
                onChange={(e) => setFormData((p) => ({ ...p, addedAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDoc} disabled={!formData.documentType?.trim() || !formData.fileName?.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View document modal (read-only) */}
      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="min-w-[800px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>View document</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="grid gap-3 py-4 text-sm">
              <div>
                <p className="text-muted-foreground">Document type</p>
                <p className="font-medium">{viewDoc.documentType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Document name</p>
                <p className="font-medium">{viewDoc.fileName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Added date and time</p>
                <p className="font-medium">{formatDateTime(viewDoc.addedAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDoc(null)}>
              Close
            </Button>
            <Button onClick={() => { viewDoc && openEdit(viewDoc); setViewDoc(null); setEditModalOpen(true); }}>
              Edit document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
