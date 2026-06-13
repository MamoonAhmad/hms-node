const CONSENT_TYPE_VALUES = [
  'general-treatment',
  'hipaa-privacy',
  'financial-responsibility',
  'assignment-of-benefits',
  'release-of-information',
  'bill-insurance',
  'telehealth',
  'electronic-communication',
  'patient-portal',
  'sms-reminder',
  'prescription-history',
  'minor-guardian',
  'photography',
  'consent-withdrawal-revocation',
];

const CONSENT_STATUS_VALUES = ['active', 'inactive', 'draft'];

const SIGNATURE_PLACEMENT_VALUES = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'inline-after-content',
  'separate-section',
  'dedicated-page',
];

const CONSENT_LIST_TABS = ['all', 'active', 'draft', 'inactive', 'signature'];

module.exports = {
  CONSENT_TYPE_VALUES,
  CONSENT_STATUS_VALUES,
  SIGNATURE_PLACEMENT_VALUES,
  CONSENT_LIST_TABS,
};
