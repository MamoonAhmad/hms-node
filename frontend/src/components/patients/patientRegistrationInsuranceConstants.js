/** Sentinel value for unset billing type in Select (stored as empty string in form). */
export const BILLING_TYPE_SELECT_VALUE = 'select';

export const INSURANCE_BILLING_TYPE_OPTIONS = [
  { value: BILLING_TYPE_SELECT_VALUE, label: 'Select Type' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'self-pay', label: 'Self Pay' },
];

/** Sentinel for unset payment method in Select (stored as empty string in form). */
export const PAYMENT_METHOD_SELECT_VALUE = 'select';

export const SELF_PAY_PAYMENT_METHOD_OPTIONS = [
  { value: PAYMENT_METHOD_SELECT_VALUE, label: 'Select mode of payment' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export const SELF_PAY_PAYMENT_METHOD_LABELS = Object.fromEntries(
  SELF_PAY_PAYMENT_METHOD_OPTIONS.filter((o) => o.value !== PAYMENT_METHOD_SELECT_VALUE).map(
    (o) => [o.value, o.label],
  ),
);
