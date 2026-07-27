import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { canPreviewMime } from '@/lib/fileUpload';

export function DocumentPreviewPanel({ document, onAudit }) {
  useEffect(() => {
    if (document?.id && document?.fileData && canPreviewMime(document.mimeType)) {
      onAudit?.('viewed');
    }
  }, [document?.id, document?.fileData, document?.mimeType, onAudit]);

  if (!document) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Select a document to preview its contents.
      </div>
    );
  }

  const previewSupported = canPreviewMime(document.mimeType);
  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';
  const isText = document.mimeType === 'text/plain';

  if (!document.fileData) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Preview is not available for this file type. Please download the file to view it.
      </div>
    );
  }

  if (!previewSupported) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{document.fileType}</Badge>
          {document.isConfidential && <Badge variant="destructive">Confidential</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Preview is not available for this file type. Please download the file to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border">
      <div className="flex flex-wrap gap-2 border-b px-4 py-3">
        <Badge variant="secondary">{document.fileType}</Badge>
        {document.isConfidential && <Badge variant="destructive">Confidential</Badge>}
        {document.patientVisible && <Badge variant="outline">Patient Visible</Badge>}
      </div>
      <div className="max-h-[480px] overflow-auto p-2">
        {isImage && (
          <img
            src={document.fileData}
            alt={document.title || document.fileName}
            className="mx-auto max-h-[440px] object-contain"
          />
        )}
        {isPdf && (
          <iframe
            src={document.fileData}
            title={document.title || document.fileName}
            className="h-[440px] w-full rounded border-0"
          />
        )}
        {isText && (
          <iframe
            src={document.fileData}
            title={document.title || document.fileName}
            className="h-[440px] w-full rounded border-0 bg-background"
          />
        )}
      </div>
    </div>
  );
}
