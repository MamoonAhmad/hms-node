import { useCallback, useEffect, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { patientApi } from '@/services/api';
import { formatDateTime } from '@/components/patients/listing/patientListUtils';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PatientDocumentsModal({ open, onOpenChange, patient }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getDocuments(patient.id);
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    if (open && patient?.id) loadDocuments();
  }, [open, patient?.id, loadDocuments]);

  const handleView = (doc) => {
    const url = doc.fileData;
    if (!url) return;
    const win = window.open('', '_blank');
    if (!win) return;
    if (url.startsWith('data:')) {
      win.document.write(`<iframe src="${url}" style="width:100%;height:100%;border:0" title="Document"></iframe>`);
    } else {
      win.location.href = url;
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.documentName}"?`)) return;
    try {
      await patientApi.deleteDocument(patient.id, doc.id);
      await loadDocuments();
    } catch (err) {
      alert(err?.message || 'Failed to delete document');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    try {
      const payload = { documentName: editingDoc.documentName };
      if (editFile) {
        payload.fileName = editFile.fileName;
        payload.fileData = editFile.fileData;
        payload.mimeType = editFile.mimeType;
        payload.documentType = editingDoc.documentName;
      }
      await patientApi.updateDocument(patient.id, editingDoc.id, payload);
      setEditingDoc(null);
      setEditFile(null);
      await loadDocuments();
    } catch (err) {
      alert(err?.message || 'Failed to update document');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Documents</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Uploaded On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No documents found for this patient.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.documentName || '—'}</TableCell>
                      <TableCell>{doc.uploadedByName || '—'}</TableCell>
                      <TableCell>{formatDateTime(doc.uploadedOn || doc.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleView(doc)} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingDoc(doc)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(doc)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingDoc)} onOpenChange={(v) => !v && setEditingDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-doc-name">Document Name</Label>
                <Input
                  id="edit-doc-name"
                  value={editingDoc.documentName || ''}
                  onChange={(e) =>
                    setEditingDoc((prev) => ({ ...prev, documentName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doc-file">Replace file (PDF, JPG, JPEG, PNG)</Label>
                <Input
                  id="edit-doc-file"
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (!ACCEPTED_MIME.includes(file.type)) {
                      alert('Supported types: PDF, JPG, JPEG, PNG');
                      return;
                    }
                    const dataUrl = await readFileAsDataUrl(file);
                    setEditFile({ fileName: file.name, fileData: dataUrl, mimeType: file.type });
                  }}
                />
                {editFile?.fileName && (
                  <p className="text-xs text-muted-foreground">Selected: {editFile.fileName}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingDoc(null); setEditFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
