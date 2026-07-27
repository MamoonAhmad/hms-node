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

/** @deprecated Static checklist removed from Documents tab; kept for review compatibility. */
export const DOCUMENT_CHECKLIST_ITEMS = [];

export const REQUIRED_DOCUMENT_TYPES = [];

export const INSURANCE_CARD_SIDES = [
  {
    side: 'front',
    category: 'Insurance Card Front',
    nameSuffix: 'front side',
  },
  {
    side: 'back',
    category: 'Insurance Card Back',
    nameSuffix: 'backside',
  },
];

export function insuranceCardDocumentName(typeLabel, side) {
  const suffix = side === 'back' ? 'backside' : 'front side';
  return `${typeLabel} insurance card ${suffix}`;
}

export function insuranceCardRequiredType(typeKey, side) {
  return `insurance-${typeKey}-${side}`;
}

export function findInsuranceCardDocument(documents, typeKey, side) {
  if (!Array.isArray(documents) || !typeKey || !side) return null;
  const requiredType = insuranceCardRequiredType(typeKey, side);
  const category = side === 'front' ? 'Insurance Card Front' : 'Insurance Card Back';

  return (
    documents.find((d) => d.requiredDocumentType === requiredType) ||
    documents.find(
      (d) =>
        String(d.insuranceTypeKey || '').toLowerCase() === typeKey &&
        String(d.insuranceCardSide || '').toLowerCase() === side,
    ) ||
    documents.find((d) => {
      const name = String(d.documentName || d.title || '').toLowerCase();
      const typeMatch = name.includes(typeKey);
      const sideMatch =
        side === 'front'
          ? name.includes('front')
          : name.includes('backside') || (name.includes('back') && !name.includes('front'));
      const categoryMatch =
        d.documentCategory === category || d.category === category || d.documentType === category;
      return typeMatch && sideMatch && (categoryMatch || typeMatch);
    }) ||
    null
  );
}

export function upsertInsuranceCardDocument(documents, { typeKey, typeLabel, side, fileMeta }) {
  const list = Array.isArray(documents) ? [...documents] : [];
  const requiredType = insuranceCardRequiredType(typeKey, side);
  const category = side === 'front' ? 'Insurance Card Front' : 'Insurance Card Back';
  const filtered = list.filter(
    (d) =>
      d.requiredDocumentType !== requiredType &&
      !(
        String(d.insuranceTypeKey || '').toLowerCase() === typeKey &&
        String(d.insuranceCardSide || '').toLowerCase() === side
      ),
  );

  if (!fileMeta) return filtered;

  filtered.unshift({
    id: `ins-${typeKey}-${side}-${Date.now()}`,
    documentName: insuranceCardDocumentName(typeLabel, side),
    documentCategory: category,
    documentType: insuranceCardDocumentName(typeLabel, side),
    type: insuranceCardDocumentName(typeLabel, side),
    category,
    requiredDocumentType: requiredType,
    insuranceTypeKey: typeKey,
    insuranceCardSide: side,
    fileName: fileMeta.fileName,
    file: fileMeta.file || null,
    fileData: fileMeta.fileData || null,
    mimeType: fileMeta.mimeType || null,
    documentNotes: '',
    governmentIdType: '',
    documentExpirationDate: '',
  });

  return filtered;
}

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
    documentCategory: item?.category || '',
    documentName: item?.defaultDocumentName || '',
    requiredDocumentType: item?.key || '',
    insuranceCardSide: item?.insuranceCardSide || '',
    governmentIdType: item?.category === 'Identity Proof' ? '' : '',
  };
}

export function isChecklistItemUploaded(item, documents) {
  if (!item || !Array.isArray(documents) || documents.length === 0) return false;
  if (documents.some((d) => d.requiredDocumentType === item.key)) return true;
  return false;
}

export function getMissingRequiredDocuments() {
  return [];
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
    // Insurance card uploads are optional; no hard required documents on this tab.
  }

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0,
    missingRequired: getMissingRequiredDocuments(),
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

export function serializeDocumentsForSubmit(documents) {
  return (documents || []).map(
    ({
      id,
      documentName,
      documentCategory,
      documentType,
      type,
      fileName,
      fileData,
      dataUrl,
      mimeType,
      requiredDocumentType,
      governmentIdType,
      documentExpirationDate,
      insuranceCardSide,
      insuranceTypeKey,
      documentNotes,
    }) => ({
      id,
      documentName,
      title: documentName,
      documentCategory,
      category: documentCategory,
      documentType: documentType || documentName || documentCategory,
      type: type || documentType || documentName || documentCategory,
      fileName,
      fileRef: fileName,
      fileData: fileData || dataUrl || null,
      dataUrl: fileData || dataUrl || null,
      mimeType: mimeType || null,
      requiredDocumentType: requiredDocumentType || null,
      governmentIdType: governmentIdType || null,
      documentExpirationDate: documentExpirationDate || null,
      insuranceCardSide: insuranceCardSide || null,
      insuranceTypeKey: insuranceTypeKey || null,
      documentNotes: documentNotes || null,
    }),
  );
}
