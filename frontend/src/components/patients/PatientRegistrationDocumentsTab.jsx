import { useRef } from 'react';
import { Upload, FileText, Eye, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  GOVERNMENT_ID_TYPE_OPTIONS,
  INSURANCE_CARD_SIDES,
  buildDocumentForList,
  emptyNewDocument,
  findInsuranceCardDocument,
  formatDocumentDetailColumn,
  insuranceCardDocumentName,
  upsertInsuranceCardDocument,
  validateNewDocumentForm,
} from '@/components/patients/patientDocumentsConstants';
import {
  INSURANCE_RANK_ORDER,
  INSURANCE_TYPE_LABELS,
} from '@/components/patients/patientRegistrationInsuranceConstants';

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

function formatDateDisplay(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function InsuranceCardSidePicker({
  typeKey,
  typeLabel,
  side,
  category,
  nameSuffix,
  documents,
  setDocuments,
}) {
  const inputId = `ins-card-${typeKey}-${side}`;
  const uploaded = findInsuranceCardDocument(documents, typeKey, side);
  const documentName = insuranceCardDocumentName(typeLabel, side);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type)) return;

    const fileData = await readFileAsDataUrl(file);
    setDocuments(
      upsertInsuranceCardDocument(documents, {
        typeKey,
        typeLabel,
        side,
        fileMeta: {
          fileName: file.name,
          file,
          fileData,
          mimeType: file.type,
        },
      }),
    );
  };

  const handleRemove = () => {
    setDocuments(
      upsertInsuranceCardDocument(documents, {
        typeKey,
        typeLabel,
        side,
        fileMeta: null,
      }),
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{documentName}</p>
        <p className="text-xs text-muted-foreground">
          Category: {category}
          <span className="mx-1.5 text-border">·</span>
          Insurance card {nameSuffix}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {uploaded ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{uploaded.fileName || 'Uploaded'}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              Not uploaded
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {uploaded && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <Trash2 className="mr-1.5 h-4 w-4 text-destructive" />
              Remove
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" asChild>
            <label htmlFor={inputId} className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploaded ? 'Replace' : 'Upload'}
              <input
                id={inputId}
                type="file"
                accept={ACCEPTED_TYPES}
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </Button>
        </div>
      </div>
    </div>
  );
}

function InsuranceDocumentsSection({
  activeInsuranceTypes,
  documents,
  setDocuments,
}) {
  if (!activeInsuranceTypes.length) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        Add primary, secondary, or tertiary insurance on the Insurance tab to upload insurance card
        documents here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activeInsuranceTypes.map((typeKey) => {
        const typeLabel = INSURANCE_TYPE_LABELS[typeKey] || typeKey;
        return (
          <div key={typeKey} className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {typeLabel} insurance documents
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload the front and back of the {typeLabel.toLowerCase()} insurance card.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {INSURANCE_CARD_SIDES.map(({ side, category, nameSuffix }) => (
                <InsuranceCardSidePicker
                  key={`${typeKey}-${side}`}
                  typeKey={typeKey}
                  typeLabel={typeLabel}
                  side={side}
                  category={category}
                  nameSuffix={nameSuffix}
                  documents={documents}
                  setDocuments={setDocuments}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PatientRegistrationDocumentsTab({
  documents,
  setDocuments,
  newDocument,
  setNewDocument,
  documentFormErrors = {},
  setDocumentFormErrors,
  documentWarnings = [],
  activeInsuranceTypes = [],
}) {
  const uploadSectionRef = useRef(null);

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
  const orderedActiveTypes = INSURANCE_RANK_ORDER.filter((key) =>
    activeInsuranceTypes.includes(key),
  );

  return (
    <div className="space-y-4">
      <InsuranceDocumentsSection
        activeInsuranceTypes={orderedActiveTypes}
        documents={documents}
        setDocuments={setDocuments}
      />

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
        <h3 className="text-sm font-semibold text-foreground">Upload additional document</h3>
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
