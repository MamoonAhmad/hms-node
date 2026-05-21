import {
  formatConsentStatus,
  formatConsentType,
  formatSignaturePlacement,
} from './consentFormsConstants';

const HISTORY_SKIP_KEYS = new Set([
  'id',
  'history',
  'createdBy',
  'createdDate',
  'updatedBy',
  'updatedDate',
  '_srNo',
]);

export const CONSENT_FIELD_LABELS = {
  consentTitle: 'Consent title',
  consentType: 'Consent type',
  description: 'Description',
  consentContent: 'Consent content',
  isMandatory: 'Is mandatory',
  isSignatureRequired: 'Patient signature required',
  patientSignaturePlacement: 'Patient signature placement',
  requiresWitnessSignature: 'Witness signature required',
  witnessSignaturePlacement: 'Witness signature placement',
  requiresProviderSignature: 'Provider signature required',
  providerSignaturePlacement: 'Provider signature placement',
  effectiveDate: 'Effective date',
  expiryDate: 'Expiry date',
  status: 'Status',
  department: 'Department',
  language: 'Language',
  versionNumber: 'Version number',
  tags: 'Tags / keywords',
  attachmentName: 'Attachment',
};

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function normalizeComparable(field, value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value;
  if (field === 'consentContent') return stripHtml(String(value));
  if (field === 'attachmentDataUrl') return value ? '[attachment data]' : '';
  return String(value).trim();
}

function formatDisplayValue(field, value) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (field === 'consentType') return formatConsentType(value);
  if (field === 'status') return formatConsentStatus(value);
  if (field.endsWith('SignaturePlacement')) return formatSignaturePlacement(value);
  if (field === 'consentContent') {
    const text = stripHtml(String(value));
    return text.length > 120 ? `${text.slice(0, 120)}…` : text || '—';
  }
  if (field === 'attachmentDataUrl') return value ? 'File attached' : '—';
  return String(value);
}

function valuesEqual(field, a, b) {
  const na = normalizeComparable(field, a);
  const nb = normalizeComparable(field, b);
  if (typeof na === 'boolean' || typeof nb === 'boolean') return na === nb;
  return na === nb;
}

/** Compare two form snapshots and return human-readable changes. */
export function diffConsentFormRecords(before, after) {
  const keys = new Set([
    ...Object.keys(CONSENT_FIELD_LABELS),
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  const changes = [];
  keys.forEach((field) => {
    if (HISTORY_SKIP_KEYS.has(field)) return;
    if (!CONSENT_FIELD_LABELS[field] && field !== 'attachmentDataUrl') return;
    if (field === 'attachmentDataUrl' && !before?.attachmentDataUrl && !after?.attachmentDataUrl) return;

    const prev = before?.[field];
    const next = after?.[field];
    if (valuesEqual(field, prev, next)) return;

    changes.push({
      field,
      label: CONSENT_FIELD_LABELS[field] || field,
      from: formatDisplayValue(field, prev),
      to: formatDisplayValue(field, next),
    });
  });

  return changes;
}

export function createHistoryEntry({ action, user, at, changes = [] }) {
  return {
    id: crypto.randomUUID(),
    action,
    user: user || 'System',
    at: at || new Date().toISOString(),
    changes,
  };
}

export function appendConsentFormHistory(existingHistory, entry) {
  return [...(Array.isArray(existingHistory) ? existingHistory : []), entry];
}

/** Timeline for UI: stored history or synthetic from audit fields. */
export function getConsentFormHistoryTimeline(record) {
  if (!record) return [];
  if (Array.isArray(record.history) && record.history.length > 0) {
    return [...record.history].sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  const synthetic = [];
  if (record.createdDate) {
    synthetic.push(
      createHistoryEntry({
        action: 'created',
        user: record.createdBy,
        at: record.createdDate,
        changes: [],
      }),
    );
  }
  if (
    record.updatedDate &&
    record.updatedDate !== record.createdDate &&
    record.updatedBy
  ) {
    synthetic.push(
      createHistoryEntry({
        action: 'updated',
        user: record.updatedBy,
        at: record.updatedDate,
        changes: [
          {
            field: '_legacy',
            label: 'Note',
            from: '—',
            to: 'Updated before change history was enabled; field-level detail unavailable.',
          },
        ],
      }),
    );
  }
  return synthetic.sort((a, b) => new Date(b.at) - new Date(a.at));
}

export function formatHistoryAction(action) {
  if (action === 'created') return 'Created';
  if (action === 'updated') return 'Updated';
  return action || 'Activity';
}

export function formatHistoryTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}
