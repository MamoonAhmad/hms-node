const LANGUAGE_DISPLAY = typeof Intl !== 'undefined' ? new Intl.DisplayNames(['en'], { type: 'language' }) : null;
const REGION_DISPLAY = typeof Intl !== 'undefined' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

let languageOptionsCache = null;
let countryOptionsCache = null;

function safeSupportedValuesOf(key) {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf(key);
    }
  } catch {
    // Some browsers expose supportedValuesOf but reject keys like 'region'.
  }
  return [];
}

function uniqueSorted(options) {
  const seen = new Set();
  return options
    .filter((opt) => {
      if (!opt?.value || seen.has(opt.value)) return false;
      seen.add(opt.value);
      return Boolean(opt.label);
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
}

/**
 * ISO 639 language codes commonly used in EHR / MU language lists.
 * Labels are resolved with Intl.DisplayNames when available.
 */
const LANGUAGE_CODES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no', 'fi', 'is', 'ga', 'cy', 'gd',
  'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'el', 'ru', 'uk', 'be', 'sr', 'hr', 'bs', 'sl', 'mk', 'sq',
  'lt', 'lv', 'et', 'tr', 'az', 'kk', 'uz', 'ky', 'tk', 'tg', 'hy', 'ka', 'mn',
  'ar', 'he', 'fa', 'ps', 'ur', 'hi', 'bn', 'pa', 'gu', 'mr', 'ta', 'te', 'kn', 'ml', 'si', 'ne',
  'zh', 'yue', 'wuu', 'ja', 'ko', 'vi', 'th', 'lo', 'km', 'my', 'id', 'ms', 'tl', 'fil', 'jw', 'su',
  'am', 'sw', 'so', 'om', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'st', 'tn', 'sn', 'rw', 'rn', 'lg',
  'ti', 'or', 'as', 'sd', 'ks', 'bo', 'dz', 'ug', 'tt', 'ba', 'cv',
  'ca', 'eu', 'gl', 'oc', 'br', 'co', 'lb', 'rm', 'mt', 'eo', 'la',
  'ht', 'pap', 'qu', 'ay', 'gn', 'nah', 'iu', 'ik', 'nv', 'chr', 'haw', 'sm', 'to', 'fj', 'mi',
];

const FALLBACK_LANGUAGE_LABELS = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  yue: 'Cantonese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  ru: 'Russian',
  ur: 'Urdu',
  fa: 'Persian',
  he: 'Hebrew',
  vi: 'Vietnamese',
  th: 'Thai',
  tl: 'Tagalog',
  fil: 'Filipino',
  pl: 'Polish',
  uk: 'Ukrainian',
  sw: 'Swahili',
  am: 'Amharic',
  so: 'Somali',
  ha: 'Hausa',
  yo: 'Yoruba',
  ig: 'Igbo',
  ne: 'Nepali',
  pa: 'Punjabi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  gu: 'Gujarati',
  mr: 'Marathi',
  si: 'Sinhala',
};

/** ISO 3166-1 alpha-2 codes used when Intl.supportedValuesOf('region') is unavailable. */
const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW',
];

const FALLBACK_COUNTRY_LABELS = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  GB: 'United Kingdom',
  AU: 'Australia',
  IN: 'India',
  CN: 'China',
  JP: 'Japan',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  BR: 'Brazil',
  PH: 'Philippines',
};

export function getWorldLanguageOptions() {
  if (languageOptionsCache) return languageOptionsCache;

  const supported = safeSupportedValuesOf('language').filter((code) => /^[a-z]{2,3}$/i.test(code));

  const codes = [...new Set([...LANGUAGE_CODES, ...supported])];
  languageOptionsCache = uniqueSorted(
    codes.map((code) => {
      const label =
        LANGUAGE_DISPLAY?.of(code) ||
        FALLBACK_LANGUAGE_LABELS[code] ||
        code;
      return { value: code, label };
    }),
  );
  return languageOptionsCache;
}

export function getWorldCountryOptions() {
  if (countryOptionsCache) return countryOptionsCache;

  const supported = safeSupportedValuesOf('region').filter((code) => /^[A-Z]{2}$/.test(code));
  const codes = [...new Set([...COUNTRY_CODES, ...supported])];

  countryOptionsCache = uniqueSorted(
    codes.map((code) => ({
      value: code,
      label: REGION_DISPLAY?.of(code) || FALLBACK_COUNTRY_LABELS[code] || code,
    })),
  );
  return countryOptionsCache;
}

export function formatLanguageList(value) {
  if (!value) return '';
  const codes = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  const options = getWorldLanguageOptions();
  const labels = codes.map((code) => options.find((opt) => opt.value === code)?.label || code);
  return labels.join(', ');
}

export function formatCountryLabel(value) {
  if (!value) return '';
  const options = getWorldCountryOptions();
  return options.find((opt) => opt.value === value)?.label || value;
}

export function parseCsvList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toCsvList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(',');
  return value ? String(value) : '';
}
