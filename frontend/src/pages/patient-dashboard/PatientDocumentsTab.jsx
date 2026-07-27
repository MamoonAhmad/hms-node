import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { patientApi } from '@/services/api/patient.api';
import {
  ACCEPTED_DOCUMENT_INPUT,
  downloadDataUrl,
  formatFileSize,
  readFileAsDataUrl,
  validateDocumentFile,
} from '@/lib/fileUpload';
import { usePatientChart } from './PatientChartContext';
import { DocumentUploadDialog } from './documents/DocumentUploadDialog';
import { DocumentPreviewPanel } from './documents/DocumentPreviewPanel';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_SOURCES,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  SUMMARY_CARDS,
  emptyEditForm,
  parseTagsInput,
  statusBadgeVariant,
} from './documents/patientDocumentConstants';
import { ChartTabShell, EmptyState, RowActionMenu, StatCard } from './components/chart-ui';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const DOCUMENT_ACTIONS = [
  { id: 'view', label: 'View', icon: Eye },
  { id: 'download', label: 'Download', icon: Download },
  { id: 'edit', label: 'Edit Details', icon: Pencil },
  { id: 'replace', label: 'Replace File', icon: RefreshCw },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'verify', label: 'Mark as Verified', icon: CheckCircle2 },
  { id: 'history', label: 'Version History', icon: History },
  { id: 'print', label: 'Print', icon: Printer },
  { id: 'delete', label: 'Delete', icon: Trash2, destructive: true },
];

function DocumentActionMenu({ doc, onAction, disabled }) {
  return (
    <RowActionMenu
      items={DOCUMENT_ACTIONS}
      disabled={disabled}
      label="Document actions"
      onSelect={(action) => onAction(action, doc)}
    />
  );
}

export function PatientDocumentsTab() {
  const { patientId, appointmentId, refreshKey, isSampleChart, appointments, refreshChart } =
    usePatientChart();

  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({ total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm());
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceReason, setReplaceReason] = useState('');
  const [versions, setVersions] = useState([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    documentType: '',
    category: '',
    source: '',
    status: '',
    includeArchived: false,
  });

  const canFetch = !isSampleChart && patientId;

  const encounterMap = useMemo(
    () => new Map((appointments || []).map((enc) => [enc.id, enc.encounterNumber || enc.id])),
    [appointments],
  );

  const loadDocuments = useCallback(async () => {
    if (!canFetch) {
      setDocuments([]);
      setSummary({ total: 0 });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getDocuments(patientId, {
        search: filters.search || undefined,
        documentType: filters.documentType || undefined,
        category: filters.category || undefined,
        source: filters.source || undefined,
        status: filters.status || undefined,
        includeArchived: filters.includeArchived,
      });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setDocuments(rows);
      setSummary(res.summary || { total: rows.length });
      setSelectedDoc((prev) => {
        if (!prev) return rows[0] || null;
        return rows.find((doc) => doc.id === prev.id) || rows[0] || null;
      });
    } catch (err) {
      setError(err?.message || 'Failed to load documents');
      setDocuments([]);
      setSummary({ total: 0 });
    } finally {
      setLoading(false);
    }
  }, [canFetch, patientId, filters]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshKey]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const auditDocument = useCallback(
    async (documentId, action) => {
      if (!canFetch || !documentId) return;
      try {
        await patientApi.logDocumentAudit(patientId, documentId, action);
      } catch {
        // Audit failures should not block UI actions.
      }
    },
    [canFetch, patientId],
  );

  const handlePreviewAudit = useCallback(
    (action) => {
      if (selectedDoc?.id) auditDocument(selectedDoc.id, action);
    },
    [auditDocument, selectedDoc?.id],
  );

  const handleUpload = async (payloads) => {
    for (const payload of payloads) {
      await patientApi.createDocument(patientId, payload);
    }
    setSuccessMessage('Document uploaded successfully.');
    await loadDocuments();
    refreshChart?.();
  };

  const handleDownload = async (doc) => {
    if (!doc?.fileData) return;
    downloadDataUrl(doc.fileData, doc.fileName || doc.title);
    await auditDocument(doc.id, 'downloaded');
  };

  const handlePrint = async (doc) => {
    if (!doc?.fileData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    if (doc.mimeType?.startsWith('image/') || doc.mimeType === 'application/pdf') {
      win.document.write(
        `<iframe src="${doc.fileData}" style="width:100%;height:100%;border:0" title="Print document"></iframe>`,
      );
    } else {
      win.document.write(`<pre>${doc.fileData}</pre>`);
    }
    win.document.close();
    win.focus();
    win.print();
    await auditDocument(doc.id, 'printed');
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title || doc.fileName}"?`)) return;
    try {
      await patientApi.deleteDocument(patientId, doc.id);
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
      await loadDocuments();
    } catch (err) {
      alert(err?.message || 'You do not have permission to delete this document.');
    }
  };

  const handleArchive = async (doc) => {
    await patientApi.updateDocumentStatus(patientId, doc.id, 'Archived');
    await loadDocuments();
  };

  const handleVerify = async (doc) => {
    await patientApi.updateDocumentStatus(patientId, doc.id, 'Verified');
    await loadDocuments();
  };

  const openVersionHistory = async (doc) => {
    const res = await patientApi.getDocumentVersions(patientId, doc.id);
    setVersions(Array.isArray(res?.data) ? res.data : []);
    setVersionsOpen(true);
  };

  const openEditDialog = (doc) => {
    setEditDoc(doc);
    setEditForm(emptyEditForm(doc));
    setReplaceFile(null);
    setReplaceReason('');
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    try {
      await patientApi.updateDocument(patientId, editDoc.id, {
        ...editForm,
        tags: parseTagsInput(editForm.tags),
      });
      setEditDoc(null);
      await loadDocuments();
    } catch (err) {
      alert(err?.message || 'Failed to update document');
    }
  };

  const saveReplace = async () => {
    if (!editDoc || !replaceFile) return;
    try {
      await patientApi.replaceDocument(patientId, editDoc.id, {
        ...replaceFile,
        replaceReason: replaceReason.trim() || null,
      });
      setEditDoc(null);
      setReplaceFile(null);
      setReplaceReason('');
      setSuccessMessage('Document uploaded successfully.');
      await loadDocuments();
    } catch (err) {
      alert(err?.message || 'Document upload failed. Please try again.');
    }
  };

  const handleAction = async (action, doc) => {
    switch (action) {
      case 'view':
        setSelectedDoc(doc);
        setDetailsDoc(doc);
        break;
      case 'download':
        await handleDownload(doc);
        break;
      case 'edit':
        openEditDialog(doc);
        break;
      case 'replace':
        openEditDialog(doc);
        break;
      case 'archive':
        await handleArchive(doc);
        break;
      case 'verify':
        await handleVerify(doc);
        break;
      case 'history':
        await openVersionHistory(doc);
        break;
      case 'print':
        await handlePrint(doc);
        break;
      case 'delete':
        await handleDelete(doc);
        break;
      default:
        break;
    }
  };

  if (isSampleChart) {
    return (
      <ChartTabShell title="Documents" description="Upload, view, and manage all documents attached to this patient.">
        <EmptyState icon={FileText} title="Demo chart" description="Open a live patient chart to manage documents." />
      </ChartTabShell>
    );
  }

  return (
    <ChartTabShell
      title="Documents"
      description="Upload, view, and manage all documents attached to this patient."
      actions={
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      }
      error={error}
    >
      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SUMMARY_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={summary[card.key] ?? 0}
            icon={FileText}
            accent="info"
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search and Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            placeholder="Search title, type, tags..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <Select
            value={filters.documentType || '__all__'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                documentType: value === '__all__' ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.category || '__all__'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                category: value === '__all__' ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {DOCUMENT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.source || '__all__'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                source: value === '__all__' ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sources</SelectItem>
              {DOCUMENT_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || '__all__'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value === '__all__' ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {DOCUMENT_STATUSES.filter((status) => !['Deleted', 'Replaced'].includes(status)).map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-archived"
              checked={filters.includeArchived}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({ ...prev, includeArchived: !!checked }))
              }
            />
            <Label htmlFor="include-archived">Include archived</Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Document Listing</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No documents found for this patient.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className={`cursor-pointer ${selectedDoc?.id === doc.id ? 'bg-muted/40' : ''} ${doc.isExpiringSoon ? 'bg-amber-50/60' : ''}`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{doc.title || doc.documentName}</div>
                            <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                          </div>
                          {doc.isConfidential && (
                            <Badge variant="destructive" className="text-[10px]">
                              Confidential
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell>{doc.source}</TableCell>
                      <TableCell>{doc.uploadedByName}</TableCell>
                      <TableCell>{formatDateTime(doc.uploadedOn || doc.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(doc.status)}>{doc.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DocumentActionMenu doc={doc} onAction={handleAction} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentPreviewPanel document={selectedDoc} onAudit={handlePreviewAudit} />
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        encounters={appointments || []}
        defaultEncounterId={appointmentId || ''}
        existingDocuments={documents}
        onUpload={handleUpload}
      />

      <Dialog open={Boolean(detailsDoc)} onOpenChange={(open) => !open && setDetailsDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {detailsDoc && (
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Document Title', detailsDoc.title || detailsDoc.documentName],
                ['Document Type', detailsDoc.documentType],
                ['Category', detailsDoc.category],
                ['Source', detailsDoc.source],
                ['File Name', detailsDoc.fileName],
                ['File Type', detailsDoc.fileType],
                ['File Size', formatFileSize(detailsDoc.fileSize)],
                ['Uploaded By', detailsDoc.uploadedByName],
                ['Uploaded Date', formatDateTime(detailsDoc.createdAt)],
                ['Last Updated', formatDateTime(detailsDoc.updatedAt)],
                ['Document Date', formatDate(detailsDoc.documentDate)],
                ['Expiration Date', formatDate(detailsDoc.expirationDate)],
                ['Encounter', encounterMap.get(detailsDoc.encounterId) || '—'],
                ['Description', detailsDoc.description || '—'],
                ['Tags', (detailsDoc.tags || []).join(', ') || '—'],
                ['Confidential', detailsDoc.isConfidential ? 'Yes' : 'No'],
                ['Patient Visibility', detailsDoc.patientVisible ? 'Yes' : 'No'],
                ['Status', detailsDoc.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editDoc)} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{replaceFile ? 'Replace Document' : 'Edit Document Details'}</DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Document Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={editForm.documentType}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tags</Label>
                <Input
                  value={editForm.tags}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Replace File</Label>
                <Input
                  type="file"
                  accept={ACCEPTED_DOCUMENT_INPUT}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    const validation = validateDocumentFile(file);
                    if (!validation.valid) {
                      alert(validation.message);
                      return;
                    }
                    const fileData = await readFileAsDataUrl(file);
                    setReplaceFile({
                      fileName: file.name,
                      fileData,
                      mimeType: file.type || 'application/octet-stream',
                      fileSize: file.size,
                    });
                  }}
                />
                {replaceFile?.fileName && (
                  <p className="text-xs text-muted-foreground">Selected: {replaceFile.fileName}</p>
                )}
              </div>
              {replaceFile && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Reason for Replacement</Label>
                  <Input
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>
              Cancel
            </Button>
            {replaceFile ? (
              <Button onClick={saveReplace}>Replace File</Button>
            ) : (
              <Button onClick={saveEdit}>Save Changes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Uploaded Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      No version history available.
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>{version.versionNumber}</TableCell>
                      <TableCell>{version.fileName}</TableCell>
                      <TableCell>{version.uploadedByName}</TableCell>
                      <TableCell>{formatDateTime(version.uploadedOn)}</TableCell>
                      <TableCell>{version.replaceReason || '—'}</TableCell>
                      <TableCell>{version.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </ChartTabShell>
  );
}
