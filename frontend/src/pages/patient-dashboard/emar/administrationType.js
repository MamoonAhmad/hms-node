// Derives the administration "type" for a medication order/eMAR entry so the
// Administer form can present the right fields (e.g. injection site & volume vs.
// inhaler actuations vs. a simple oral confirmation).

const INJECTION_SITES = [
  'Left Deltoid',
  'Right Deltoid',
  'Left Ventrogluteal',
  'Right Ventrogluteal',
  'Left Vastus Lateralis (Thigh)',
  'Right Vastus Lateralis (Thigh)',
  'Left Arm (SubQ)',
  'Right Arm (SubQ)',
  'Abdomen (SubQ)',
  'Other',
];

const NEEDLE_GAUGES = ['21G', '22G', '23G', '25G', '27G', '30G'];

const TOPICAL_SITES = ['Left Arm', 'Right Arm', 'Chest', 'Back', 'Abdomen', 'Left Leg', 'Right Leg', 'Other'];

function normalize(value) {
  return String(value || '').toLowerCase();
}

/**
 * @returns {'injection'|'infusion'|'inhalation'|'topical'|'ophthalmic'|'oral'|'other'}
 */
export function getAdministrationType(entry = {}) {
  const route = normalize(entry.route);
  const form = normalize(entry.dosageForm);
  const cls = normalize(entry.medicationClass);
  const hay = `${route} ${form} ${cls}`;

  if (/\b(iv|intravenous|infusion|drip)\b/.test(hay)) return 'infusion';
  if (
    /\b(im|intramuscular|subq|subcut|subcutaneous|injection|injectable|intradermal)\b/.test(hay) ||
    /(vial|ampoule|ampule|prefilled|syringe|solution for injection)/.test(form)
  ) {
    return 'injection';
  }
  if (/(inhal|nebuli|puff|actuation|mdi|dpi)/.test(hay)) return 'inhalation';
  if (/(topical|cream|ointment|transdermal|patch|gel|lotion)/.test(hay)) return 'topical';
  if (/(ophthalmic|eye drop|otic|ear drop)/.test(hay)) return 'ophthalmic';
  if (/\b(po|oral|by mouth|tablet|capsule|sublingual|troche|lozenge|liquid|syrup|suspension)\b/.test(hay)) {
    return 'oral';
  }
  return 'other';
}

const TYPE_META = {
  injection: { label: 'Injection', sites: INJECTION_SITES, requiresSite: true, gauges: NEEDLE_GAUGES },
  infusion: { label: 'IV / Infusion', sites: ['Left Forearm', 'Right Forearm', 'Left Hand', 'Right Hand', 'AC (Antecubital)', 'Central Line', 'PICC', 'Port', 'Other'], requiresSite: true },
  inhalation: { label: 'Inhalation', sites: [], requiresSite: false },
  topical: { label: 'Topical', sites: TOPICAL_SITES, requiresSite: true },
  ophthalmic: { label: 'Ophthalmic / Otic', sites: ['Left', 'Right', 'Both'], requiresSite: true },
  oral: { label: 'Oral', sites: [], requiresSite: false },
  other: { label: 'General', sites: ['Oral', 'Left Arm', 'Right Arm', 'Other'], requiresSite: false },
};

export function getAdministrationMeta(entry = {}) {
  const type = getAdministrationType(entry);
  return { type, ...TYPE_META[type] };
}
