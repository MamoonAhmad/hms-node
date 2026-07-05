const ORDER_STATUSES = [
  'Draft',
  'Scheduled',
  'Ordered',
  'In Progress',
  'Completed',
  'Cancelled',
  'Discontinued',
];

const ORDER_CATEGORIES = [
  'Lab',
  'Imaging',
  'Procedure',
  'Medication',
  'Referral',
  'Other',
  // Legacy values kept for existing records
  'Radiology',
  'Pharmacy',
  'Procedures',
];

const ORDER_SITES = [
  { id: 'main-lab', name: 'Main Lab' },
  { id: 'inhouse-lab', name: 'In-house Lab' },
  { id: 'external-lab', name: 'External Lab' },
  { id: 'radiology-center', name: 'Radiology Center' },
  { id: 'outpatient-facility', name: 'Outpatient Facility' },
];

const SOURCE_TYPES = {
  INDIVIDUAL: 'Individual Order',
  CUSTOM_ORDER_SET: 'Custom Order Set',
};

const ALLOW_DUPLICATE_ORDERS = false;
const SITE_REQUIRED = true;

function mapProcedureCategoryToOrderCategory(categoryName) {
  if (!categoryName) return 'Other';
  const n = String(categoryName).toLowerCase();
  if (n.includes('lab')) return 'Lab';
  if (n.includes('radiolog') || n.includes('imaging')) return 'Imaging';
  if (n.includes('pharm') || n.includes('medication') || n.includes('medicine')) return 'Medication';
  if (n.includes('procedure')) return 'Procedure';
  if (n.includes('referral')) return 'Referral';
  return 'Other';
}

function normalizeOrderCategory(category) {
  if (!category) return 'Other';
  const legacyMap = {
    Radiology: 'Imaging',
    Pharmacy: 'Medication',
    Procedures: 'Procedure',
  };
  return legacyMap[category] || category;
}

function isOrderEditable(status) {
  const locked = ['Completed', 'Cancelled', 'Discontinued'];
  return !locked.includes(status);
}

module.exports = {
  ORDER_STATUSES,
  ORDER_CATEGORIES,
  ORDER_SITES,
  SOURCE_TYPES,
  ALLOW_DUPLICATE_ORDERS,
  SITE_REQUIRED,
  mapProcedureCategoryToOrderCategory,
  normalizeOrderCategory,
  isOrderEditable,
};
