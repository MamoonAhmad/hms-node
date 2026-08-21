export const US_ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;

export function normalizeUsZipInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function getUsZipValidationError(value, requiredMessage) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return requiredMessage || null;
  if (!US_ZIP_REGEX.test(trimmed)) {
    return 'Enter a valid US ZIP code (12345 or 12345-6789)';
  }
  return null;
}
