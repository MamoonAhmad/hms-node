import { GOVERNMENT_ID_TYPE_OPTIONS } from '@/components/patients/patientDemographicsConstants';

export const DOCUMENT_CATEGORIES = [
  { value: 'ID Proof', label: 'ID Proof' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Lab Report', label: 'Lab Report' },
  { value: 'Referral', label: 'Referral' },
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
    category: 'ID Proof',
    defaultDocumentName: 'Photo ID',
  },
  {
    key: 'insurance-card-front',
    label: 'Insurance card (front)',
    required: false,
    category: 'Insurance',
    insuranceCardSide: 'front',
    defaultDocumentName: 'Insurance card (front)',
  },
  {
    key: 'insurance-card-back',
    label: 'Insurance card (back)',
    required: false,
    category: 'Insurance',
    insuranceCardSide: 'back',
    defaultDocumentName: 'Insurance card (back)',
  },
  {
    key: 'referral-letter',
    label: 'Referral letter',
    required: false,
    category: 'Referral',
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
    governmentIdType: item.category === 'ID Proof' ? '' : '',
  };
}

export function isChecklistItemUploaded(item, documents) {
  if (!Array.isArray(documents) || documents.length === 0) return false;
  if (documents.some((d) => d.requiredDocumentType === item.key)) return true;

  if (item.key === 'photo-id') {
    return documents.some((d) => d.documentCategory === 'ID Proof');
  }
  if (item.key === 'insurance-card-front') {
    return documents.some(
      (d) =>
        d.documentCategory === 'Insurance' &&
        (d.insuranceCardSide === 'front' || d.requiredDocumentType === 'insurance-card-front'),
    );
  }
  if (item.key === 'insurance-card-back') {
    return documents.some(
      (d) =>
        d.documentCategory === 'Insurance' &&
        (d.insuranceCardSide === 'back' || d.requiredDocumentType === 'insurance-card-back'),
    );
  }
  if (item.key === 'referral-letter') {
    return documents.some(
      (d) => d.documentCategory === 'Referral' || d.requiredDocumentType === 'referral-letter',
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
    if (doc.documentCategory === 'ID Proof' && doc.documentExpirationDate) {
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
  if (doc.documentCategory === 'ID Proof' && doc.governmentIdType) {
    return formatGovernmentIdTypeLabel(doc.governmentIdType);
  }
  if (doc.documentCategory === 'Insurance' && doc.insuranceCardSide) {
    return formatInsuranceCardSideLabel(doc.insuranceCardSide);
  }
  return '—';
}

export function buildDocumentForList(newDocument) {
  const category = newDocument.documentCategory;
  const doc = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    documentName: newDocument.documentName.trim(),
    documentCategory: category,
    fileName: newDocument.fileName || newDocument.file?.name || 'uploaded-file',
    file: newDocument.file || null,
    requiredDocumentType: newDocument.requiredDocumentType || '',
    governmentIdType:
      category === 'ID Proof' ? newDocument.governmentIdType || '' : '',
    documentExpirationDate:
      category === 'ID Proof' ? newDocument.documentExpirationDate || '' : '',
    insuranceCardSide:
      category === 'Insurance' ? newDocument.insuranceCardSide || '' : '',
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
  if (newDocument.documentCategory === 'ID Proof' && !newDocument.governmentIdType) {
    errors.governmentIdType = 'ID type is required for ID Proof documents';
  }
  if (newDocument.documentCategory === 'Insurance' && !newDocument.insuranceCardSide) {
    errors.insuranceCardSide = 'Card side is required for insurance documents';
  }
  return errors;
}

export function serializeDocumentsForSubmit(documents) {
  return (documents || []).map(
    ({
      id,
      documentName,
      documentCategory,
      fileName,
      requiredDocumentType,
      governmentIdType,
      documentExpirationDate,
      insuranceCardSide,
      documentNotes,
    }) => ({
      id,
      documentName,
      documentCategory,
      fileName,
      fileRef: fileName,
      requiredDocumentType: requiredDocumentType || null,
      governmentIdType: governmentIdType || null,
      documentExpirationDate: documentExpirationDate || null,
      insuranceCardSide: insuranceCardSide || null,
      documentNotes: documentNotes || null,
    }),
  );
}
