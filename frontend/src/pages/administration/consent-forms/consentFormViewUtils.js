import { formatConsentType, formatSignaturePlacement } from './consentFormsConstants';

export const SIGNATURE_ROLE_LABELS = {
  patient: 'Patient / Legal Guardian',
  witness: 'Witness',
  provider: 'Attending Provider',
};

/** Build signature blocks required for this template (preview / signing). */
export function getConsentSignatureBlocks(record) {
  if (!record) return [];
  const blocks = [];
  if (record.isSignatureRequired) {
    blocks.push({
      role: 'patient',
      label: SIGNATURE_ROLE_LABELS.patient,
      placement: record.patientSignaturePlacement || 'bottom-left',
    });
  }
  if (record.requiresWitnessSignature) {
    blocks.push({
      role: 'witness',
      label: SIGNATURE_ROLE_LABELS.witness,
      placement: record.witnessSignaturePlacement || 'bottom-center',
    });
  }
  if (record.requiresProviderSignature) {
    blocks.push({
      role: 'provider',
      label: SIGNATURE_ROLE_LABELS.provider,
      placement: record.providerSignaturePlacement || 'bottom-right',
    });
  }
  return blocks;
}

function placementColumn(placement) {
  if (placement.endsWith('-left')) return 0;
  if (placement.endsWith('-center')) return 1;
  if (placement.endsWith('-right')) return 2;
  return 1;
}

function placementZone(placement) {
  if (placement.startsWith('top-')) return 'top';
  if (placement.startsWith('middle-')) return 'middle';
  if (placement.startsWith('bottom-')) return 'bottom';
  if (placement === 'inline-after-content') return 'inline';
  if (placement === 'separate-section') return 'separate';
  if (placement === 'dedicated-page') return 'dedicated';
  return 'bottom';
}

/** Group signature blocks by document zone for layout. */
export function groupSignaturesByZone(blocks) {
  const zones = {
    top: [[], [], []],
    middle: [[], [], []],
    bottom: [[], [], []],
    inline: [],
    separate: [],
    dedicated: [],
  };

  blocks.forEach((block) => {
    const zone = placementZone(block.placement);
    if (zone === 'top' || zone === 'middle' || zone === 'bottom') {
      const col = placementColumn(block.placement);
      zones[zone][col].push(block);
    } else {
      zones[zone].push(block);
    }
  });

  return zones;
}

export function formatConsentDisplayDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function consentFormMetaLines(record) {
  return [
    { label: 'Form type', value: formatConsentType(record?.consentType) },
    { label: 'Department', value: record?.department || 'All departments' },
    { label: 'Language', value: record?.language || 'English' },
    { label: 'Version', value: record?.versionNumber ? `v${record.versionNumber}` : '—' },
  ];
}

export function signaturePlacementHint(placement) {
  return formatSignaturePlacement(placement);
}
