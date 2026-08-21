import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';

export const DEFAULT_PHONE_COUNTRY = 'US';

let countryOptionsCache = null;

export function countryCodeToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function getCountryOptions() {
  if (countryOptionsCache) return countryOptionsCache;

  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  countryOptionsCache = getCountries()
    .map((code) => ({
      code,
      name: displayNames.of(code) || code,
      callingCode: getCountryCallingCode(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return countryOptionsCache;
}

export function digitsFromPhoneInput(input) {
  return String(input ?? '').replace(/\D/g, '');
}

export function formatNationalPhoneInput(input, country = DEFAULT_PHONE_COUNTRY) {
  const formatter = new AsYouType(country);
  return formatter.input(String(input ?? ''));
}

export function toE164Candidate(nationalInput, country = DEFAULT_PHONE_COUNTRY) {
  const digits = digitsFromPhoneInput(nationalInput);
  if (!digits) return '';
  const callingCode = getCountryCallingCode(country);
  return `+${callingCode}${digits}`;
}

export function parseStoredPhoneNumber(value, defaultCountry = DEFAULT_PHONE_COUNTRY) {
  if (!value || !String(value).trim()) {
    return { country: defaultCountry, nationalInput: '' };
  }

  const trimmed = String(value).trim();
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);

  if (parsed) {
    return {
      country: parsed.country || defaultCountry,
      nationalInput: parsed.formatNational(),
    };
  }

  return {
    country: defaultCountry,
    nationalInput: formatNationalPhoneInput(trimmed, defaultCountry),
  };
}

function usNationalDigits(digits, country) {
  if (!digits) return '';
  if (country === 'US' || country === 'CA') {
    if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
    if (digits.length === 10) return digits;
  }
  return '';
}

export function validatePhoneNumber(value, country = DEFAULT_PHONE_COUNTRY) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { valid: true, normalized: null };
  }

  if (isValidPhoneNumber(trimmed, country)) {
    const parsed = parsePhoneNumberFromString(trimmed, country);
    return { valid: true, normalized: parsed?.format('E.164') ?? trimmed };
  }

  if (trimmed.startsWith('+') && isValidPhoneNumber(trimmed)) {
    const parsed = parsePhoneNumberFromString(trimmed);
    return { valid: true, normalized: parsed?.format('E.164') ?? trimmed };
  }

  const digits = digitsFromPhoneInput(trimmed);
  if (!digits) {
    return { valid: true, normalized: null };
  }

  // Accept US-styled 10-digit numbers even when NANP exchange rules reject them
  // (common with placeholder/test numbers like (213) 123-2142).
  const national = usNationalDigits(digits, country);
  if (national.length === 10) {
    const callingCode = getCountryCallingCode(country);
    return { valid: true, normalized: `+${callingCode}${national}` };
  }

  return {
    valid: false,
    message: 'Enter a valid phone number for the selected country',
  };
}

export function getPhoneValidationError(value, fallbackMessage = 'Invalid phone number format') {
  if (!value || !String(value).trim()) return null;
  const result = validatePhoneNumber(value);
  return result.valid ? null : result.message || fallbackMessage;
}
