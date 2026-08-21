const CLAIM_STATUSES = [
  'draft',
  'ready',
  'submitted',
  'accepted',
  'rejected',
  'paid',
  'denied',
  'on_hold',
  'cancelled',
];

const SUBMISSION_STATUSES = [
  'not_submitted',
  'queued',
  'submitted',
  'accepted',
  'rejected',
];

const CHARGE_ROUTING = {
  no_change: 'No Change',
  clearinghouse: 'Clearinghouse',
  balance_due_patient: 'Balance Due Patient',
  on_hold: 'On Hold',
  user_print_mail: 'User Print & Mail',
};

const CHARGE_ROUTING_VALUES = Object.keys(CHARGE_ROUTING);

const INSURANCE_TIERS = ['primary', 'secondary', 'tertiary'];

const ICD_POINTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

module.exports = {
  CLAIM_STATUSES,
  SUBMISSION_STATUSES,
  CHARGE_ROUTING,
  CHARGE_ROUTING_VALUES,
  INSURANCE_TIERS,
  ICD_POINTERS,
};
