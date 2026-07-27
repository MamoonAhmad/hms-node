export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
];

export const ACCEPTED_DOCUMENT_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export const ACCEPTED_DOCUMENT_INPUT = ACCEPTED_DOCUMENT_EXTENSIONS.join(',');

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isValidFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return false;
  return !/[<>:"/\\|?*\x00-\x1F]/.test(fileName);
}

export function validateDocumentFile(file) {
  if (!file) {
    return { valid: false, message: 'Please select a file to upload.' };
  }
  if (!isValidFileName(file.name)) {
    return { valid: false, message: 'File name contains invalid characters.' };
  }
  if (!ACCEPTED_DOCUMENT_MIME.includes(file.type) && file.type) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExt = ACCEPTED_DOCUMENT_EXTENSIONS.map((e) => e.slice(1));
    if (!ext || !allowedExt.includes(ext)) {
      return { valid: false, message: 'This file type is not supported.' };
    }
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return { valid: false, message: 'File size exceeds the allowed limit.' };
  }
  if (file.size === 0) {
    return { valid: false, message: 'The selected file appears to be corrupted or empty.' };
  }
  return { valid: true };
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function canPreviewMime(mimeType) {
  if (!mimeType) return false;
  return (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/') ||
    mimeType === 'text/plain'
  );
}

export function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName || 'document';
  link.click();
}
