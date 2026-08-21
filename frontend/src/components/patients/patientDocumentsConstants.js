import { GOVERNMENT_ID_TYPE_OPTIONS } from '@/components/patients/patientDemographicsConstants';

export const DOCUMENT_CATEGORIES = [
  { value: 'Identity Proof', label: 'Identity Proof' },
  { value: 'Insurance Card Front', label: 'Insurance Card Front' },
  { value: 'Insurance Card Back', label: 'Insurance Card Back' },
  { value: 'Registration Form', label: 'Registration Form' },
  { value: 'Consent Form', label: 'Consent Form' },
  { value: 'Referral Letter', label: 'Referral Letter' },
  { value: 'Medical Records', label: 'Medical Records' },
  { value: 'Lab Report', label: 'Lab Report' },
  { value: 'Prescription', label: 'Prescription' },
  { value: 'Patient Photo', label: 'Patient Photo' },
  { value: 'Financial Document', label: 'Financial Document' },
  { value: 'Other', label: 'Other' },
];

export const INSURANCE_CARD_SIDE_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
];

/** Checklist rows shown on patient registration → Documents tab */
export const DOCUMENT_CHECKLIST_ITEMS = [
  {
    key: 'photo-id',
    label: 'Photo ID',
    required: false,
    category: 'Identity Proof',
    defaultDocumentName: 'Photo ID',
  },
  {
    key: 'insurance-card-front',
    label: 'Insurance card (front)',
    required: false,
    category: 'Insurance Card Front',
    insuranceCardSide: 'front',
    defaultDocumentName: 'Insurance card (front)',
  },
  {
    key: 'insurance-card-back',
    label: 'Insurance card (back)',
    required: false,
    category: 'Insurance Card Back',
    insuranceCardSide: 'back',
    defaultDocumentName: 'Insurance card (back)',
  },
  {
    key: 'referral-letter',
    label: 'Referral letter',
    required: false,
    category: 'Referral Letter',
    defaultDocumentName: 'Referral letter',
  },
];

export const REQUIRED_DOCUMENT_TYPES = DOCUMENT_CHECKLIST_ITEMS.filter((i) => i.required).map(
  (i) => i.key,
);

export { GOVERNMENT_ID_TYPE_OPTIONS };

export function emptyNewDocument() {
  return {
    documentCategory: '',
    documentName: '',
    file: null,
    fileName: '',
    requiredDocumentType: '',
    governmentIdType: '',
    documentExpirationDate: '',
    insuranceCardSide: '',
    documentNotes: '',
  };
}

export function newDocumentFromChecklistItem(item) {
  return {
    ...emptyNewDocument(),
    documentCategory: item.category,
    documentName: item.defaultDocumentName,
    requiredDocumentType: item.key,
    insuranceCardSide: item.insuranceCardSide || '',
    governmentIdType: item.category === 'Identity Proof' ? '' : '',
  };
}

export function isChecklistItemUploaded(item, documents) {
  if (!Array.isArray(documents) || documents.length === 0) return false;
  if (documents.some((d) => d.requiredDocumentType === item.key)) return true;

  if (item.key === 'photo-id') {
    return documents.some((d) => d.documentCategory === 'Identity Proof');
  }
  if (item.key === 'insurance-card-front') {
    return documents.some(
      (d) =>
        d.documentCategory === 'Insurance Card Front' ||
        d.requiredDocumentType === 'insurance-card-front',
    );
  }
  if (item.key === 'insurance-card-back') {
    return documents.some(
      (d) =>
        d.documentCategory === 'Insurance Card Back' ||
        d.requiredDocumentType === 'insurance-card-back',
    );
  }
  if (item.key === 'referral-letter') {
    return documents.some(
      (d) => d.documentCategory === 'Referral Letter' || d.requiredDocumentType === 'referral-letter',
    );
  }
  return false;
}

export function getMissingRequiredDocuments(documents) {
  return DOCUMENT_CHECKLIST_ITEMS.filter(
    (item) => item.required && !isChecklistItemUploaded(item, documents),
  );
}

export function validatePatientDocuments(documents, { strictMode = true } = {}) {
  const errors = {};
  const warnings = [];

  const list = Array.isArray(documents) ? documents : [];

  list.forEach((doc) => {
    if (doc.documentCategory === 'Identity Proof' && doc.documentExpirationDate) {
      const exp = new Date(doc.documentExpirationDate);
      if (!Number.isNaN(exp.getTime()) && exp < new Date()) {
        const name = doc.documentName || 'ID document';
        warnings.push(`${name}: expiration date is in the past`);
      }
    }
  });

  if (strictMode) {
    const missing = getMissingRequiredDocuments(list);
    missing.forEach((item) => {
      if (item.key === 'photo-id') {
        errors.documentsPhotoId = 'Photo ID is required before saving';
      }
      if (item.key === 'insurance-card-front') {
        errors.documentsInsuranceFront = 'Insurance card (front) is required before saving';
      }
    });
  }

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0,
    missingRequired: getMissingRequiredDocuments(list),
  };
}

export function formatGovernmentIdTypeLabel(value) {
  if (!value) return '';
  const match = GOVERNMENT_ID_TYPE_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value;
}

export function formatInsuranceCardSideLabel(value) {
  if (!value) return '';
  const match = INSURANCE_CARD_SIDE_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value;
}

export function formatDocumentDetailColumn(doc) {
  if (doc.documentCategory === 'Identity Proof' && doc.governmentIdType) {
    return formatGovernmentIdTypeLabel(doc.governmentIdType);
  }
  if (doc.documentCategory === 'Insurance Card Front') {
    return formatInsuranceCardSideLabel('front');
  }
  if (doc.documentCategory === 'Insurance Card Back') {
    return formatInsuranceCardSideLabel('back');
  }
  return '—';
}

export function buildDocumentForList(newDocument) {
  const category = newDocument.documentCategory;
  let insuranceCardSide = '';
  if (category === 'Insurance Card Front') insuranceCardSide = 'front';
  else if (category === 'Insurance Card Back') insuranceCardSide = 'back';

  const doc = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    documentName: newDocument.documentName.trim(),
    documentCategory: category,
    fileName: newDocument.fileName || newDocument.file?.name || 'uploaded-file',
    file: newDocument.file || null,
    requiredDocumentType: newDocument.requiredDocumentType || '',
    governmentIdType:
      category === 'Identity Proof' ? newDocument.governmentIdType || '' : '',
    documentExpirationDate:
      category === 'Identity Proof' ? newDocument.documentExpirationDate || '' : '',
    insuranceCardSide,
    documentNotes: newDocument.documentNotes?.trim() || '',
  };
  return doc;
}

export function validateNewDocumentForm(newDocument) {
  const errors = {};
  if (!newDocument.documentCategory) {
    errors.documentCategory = 'Document category is required';
  }
  if (!newDocument.documentName?.trim()) {
    errors.documentName = 'Document name is required';
  }
  if (!newDocument.file && !newDocument.fileName) {
    errors.file = 'Please select a file to upload';
  }
  if (newDocument.documentCategory === 'Identity Proof' && !newDocument.governmentIdType) {
    errors.governmentIdType = 'ID type is required for Identity Proof documents';
  }
  return errors;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function serializeDocumentsForSubmit(documents) {
  return Promise.all(
    (documents || []).map(async (doc) => {
      let fileData = doc.fileData || doc.dataUrl || null;
      let mimeType = doc.mimeType || null;
      if (!fileData && doc.file instanceof File) {
        fileData = await readFileAsDataUrl(doc.file);
        mimeType = doc.file.type || null;
      }
      return {
        id: doc.id,
        documentName: doc.documentName,
        documentCategory: doc.documentCategory,
        documentType: doc.documentType || doc.documentCategory || doc.requiredDocumentType || 'Other',
        fileName: doc.fileName,
        fileRef: doc.fileName,
        fileData,
        dataUrl: fileData,
        mimeType,
        requiredDocumentType: doc.requiredDocumentType || null,
        governmentIdType: doc.governmentIdType || null,
        documentExpirationDate: doc.documentExpirationDate || null,
        insuranceCardSide: doc.insuranceCardSide || null,
        documentNotes: doc.documentNotes || null,
      };
    }),
  );
}
