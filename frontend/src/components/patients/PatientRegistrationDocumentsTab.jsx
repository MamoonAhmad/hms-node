import { useRef } from 'react';
import { Upload, FileText, Eye, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CHECKLIST_ITEMS,
  GOVERNMENT_ID_TYPE_OPTIONS,
  buildDocumentForList,
  emptyNewDocument,
  formatDocumentDetailColumn,
  isChecklistItemUploaded,
  newDocumentFromChecklistItem,
  validateNewDocumentForm,
} from '@/components/patients/patientDocumentsConstants';

function formatDateDisplay(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export function PatientRegistrationDocumentsTab({
  documents,
  setDocuments,
  newDocument,
  setNewDocument,
  documentFormErrors = {},
  setDocumentFormErrors,
  documentWarnings = [],
}) {
  const uploadSectionRef = useRef(null);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startChecklistUpload = (item) => {
    setNewDocument(newDocumentFromChecklistItem(item));
    setDocumentFormErrors?.({});
    scrollToUpload();
  };

  const handleAddDocument = () => {
    const fieldErrors = validateNewDocumentForm(newDocument);
    if (Object.keys(fieldErrors).length > 0) {
      setDocumentFormErrors?.(fieldErrors);
      return;
    }
    const doc = buildDocumentForList(newDocument);
    setDocuments([doc, ...documents]);
    setNewDocument(emptyNewDocument());
    setDocumentFormErrors?.({});
  };

  const isIdProof = newDocument.documentCategory === 'Identity Proof';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Required documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload patient documents as needed. Photo ID and insurance card (front) are optional but recommended.
        </p>
        <div className="rounded-lg border divide-y">
          {DOCUMENT_CHECKLIST_ITEMS.map((item) => {
            const uploaded = isChecklistItemUploaded(item, documents);
            return (
              <div
                key={item.key}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.required ? (
                      <Badge variant="outline" className="text-destructive border-destructive/40">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {uploaded ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                        Not uploaded
                      </>
                    )}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => startChecklistUpload(item)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploaded ? 'Upload another' : 'Upload'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {documentWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Document warnings</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            {documentWarnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div ref={uploadSectionRef} className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Upload document</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="documentCategory">
              Document category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newDocument.documentCategory}
              onValueChange={(value) =>
                setNewDocument({
                  ...emptyNewDocument(),
                  documentCategory: value,
                  documentName: newDocument.documentName,
                  requiredDocumentType: newDocument.requiredDocumentType,
                  ...(value === 'Identity Proof'
                    ? {
                        governmentIdType: newDocument.governmentIdType,
                        documentExpirationDate: newDocument.documentExpirationDate,
                      }
                    : {}),
                  documentNotes: newDocument.documentNotes,
                })
              }
            >
              <SelectTrigger
                id="documentCategory"
                className={`w-full ${documentFormErrors.documentCategory ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {documentFormErrors.documentCategory && (
              <p className="text-xs text-destructive">{documentFormErrors.documentCategory}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentName">
              Document name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="documentName"
              value={newDocument.documentName}
              onChange={(e) => setNewDocument({ ...newDocument, documentName: e.target.value })}
              placeholder="Enter document name"
              className={documentFormErrors.documentName ? 'border-destructive' : ''}
            />
            {documentFormErrors.documentName && (
              <p className="text-xs text-destructive">{documentFormErrors.documentName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileUpload">
              File <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fileUpload"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setNewDocument({
                  ...newDocument,
                  file: file || null,
                  fileName: file?.name || '',
                });
              }}
              className={`cursor-pointer ${documentFormErrors.file ? 'border-destructive' : ''}`}
            />
            {documentFormErrors.file && (
              <p className="text-xs text-destructive">{documentFormErrors.file}</p>
            )}
          </div>
        </div>

        {isIdProof && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="docGovernmentIdType">
                ID type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newDocument.governmentIdType}
                onValueChange={(value) =>
                  setNewDocument({ ...newDocument, governmentIdType: value })
                }
              >
                <SelectTrigger
                  id="docGovernmentIdType"
                  className={`w-full ${documentFormErrors.governmentIdType ? 'border-destructive' : ''}`}
                >
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNMENT_ID_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {documentFormErrors.governmentIdType && (
                <p className="text-xs text-destructive">{documentFormErrors.governmentIdType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentExpirationDate">Expiration date</Label>
              <Input
                id="documentExpirationDate"
                type="date"
                value={newDocument.documentExpirationDate}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, documentExpirationDate: e.target.value })
                }
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="documentNotes">Notes</Label>
          <Textarea
            id="documentNotes"
            value={newDocument.documentNotes}
            onChange={(e) => setNewDocument({ ...newDocument, documentNotes: e.target.value })}
            rows={2}
            placeholder="Optional clerk notes"
          />
        </div>

        <Button type="button" onClick={handleAddDocument}>
          <Upload className="h-4 w-4 mr-2" />
          Add to list
        </Button>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground">Uploaded documents</h3>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>ID type / Card side</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                    No documents uploaded
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{doc.documentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.documentCategory}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDocumentDetailColumn(doc)}</TableCell>
                    <TableCell className="text-sm">
                      {doc.documentCategory === 'Identity Proof'
                        ? formatDateDisplay(doc.documentExpirationDate)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.fileName}</TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={doc.documentNotes}>
                      {doc.documentNotes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" title="View file">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                          title="Remove"
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
      </div>
    </div>
  );
}
