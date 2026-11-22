/**
 * TutorFlow settings store.
 *
 * Settings live in a single localStorage entry (SETTINGS_KEY), separate from
 * every other TutorFlow storage key (students, invoices, bills, cash, payment
 * details, migration flag). Reads are defensive: corrupt JSON, wrong types,
 * unknown keys and an unavailable localStorage all fall back to defaults.
 */

/** localStorage key holding the settings JSON. */
export const SETTINGS_KEY = 'tutorflow.settings.v1';

/** window event dispatched after settings are saved or reset. */
export const SETTINGS_CHANGED_EVENT = 'tutorflow:settings-changed';

/** Version of the settings shape stored under SETTINGS_KEY. */
export const SETTINGS_SCHEMA_VERSION = 1;

/** Media query used to detect the OS colour-scheme preference. */
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/**
 * Default settings. Used as the template for every read: only keys present
 * here are kept, and each field's type (and allowed values, where listed in
 * ALLOWED_VALUES) is enforced.
 *
 * @type {{
 *   schemaVersion: number,
 *   theme: 'light'|'dark'|'system',
 *   palette: 'ocean'|'violet'|'emerald'|'rose'|'amber'|'teal',
 *   business: {
 *     tutorName: string, businessName: string, phone: string, email: string,
 *     upiId: string, address: string, logoDataUrl: string,
 *     invoiceBrandingText: string, invoiceFooter: string
 *   },
 *   notifications: Object<string, {enabled: boolean, priority: 'low'|'normal'|'high'}>,
 *   invoicePrefs: {
 *     currency: 'INR'|'USD'|'EUR', defaultPaymentMethod: 'upi'|'cash'|'bank',
 *     defaultDueDays: number, numberPrefix: string,
 *     reminderTone: 'friendly'|'neutral'|'firm', defaultFooter: string,
 *     defaultPaymentInstructions: string
 *   },
 *   regional: { dateFormat: 'DD/MM/YYYY'|'MM/DD/YYYY'|'YYYY-MM-DD' }
 * }}
 */
export const DEFAULT_SETTINGS = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  theme: 'system',
  palette: 'ocean',
  business: {
    tutorName: '',
    businessName: '',
    phone: '',
    email: '',
    upiId: '',
    address: '',
    logoDataUrl: '',
    invoiceBrandingText: '',
    invoiceFooter: '',
  },
  notifications: {
    overdueInvoices: { enabled: true, priority: 'high' },
    upcomingPayments: { enabled: true, priority: 'normal' },
    cashShortfall: { enabled: true, priority: 'high' },
    monthlyInvoicesMissing: { enabled: true, priority: 'normal' },
    repeatedLatePayments: { enabled: true, priority: 'normal' },
    upcomingBills: { enabled: true, priority: 'normal' },
  },
  invoicePrefs: {
    currency: 'INR',
    defaultPaymentMethod: 'upi',
    defaultDueDays: 14,
    numberPrefix: '',
    reminderTone: 'friendly',
    defaultFooter: '',
    defaultPaymentInstructions: '',
  },
  regional: {
    dateFormat: 'DD/MM/YYYY',
  },
};

/**
 * Allowed values for enum-like leaf fields, keyed by leaf key name.
 * Leaf names are unique across the settings shape, so the name alone is used.
 * @type {Object<string, string[]>}
 */
const ALLOWED_VALUES = {
  theme: ['light', 'dark', 'system'],
  palette: ['ocean', 'violet', 'emerald', 'rose', 'amber', 'teal'],
  priority: ['low', 'normal', 'high'],
  currency: ['INR', 'USD', 'EUR'],
  defaultPaymentMethod: ['upi', 'cash', 'bank'],
  reminderTone: ['friendly', 'neutral', 'firm'],
  dateFormat: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
};

/** Module-level handles so initTheme() never registers a listener twice. */
let themeMediaQuery = null;
let themeMediaListener = null;

/**
 * True for non-null, non-array objects.
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Returns the localStorage object, or null if it is unavailable
 * (missing, or access throws e.g. in strict privacy modes).
 * @returns {Storage|null}
 */
function getStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch (_err) {
    return null;
  }
}

/**
 * Picks a single leaf value: the raw value if it matches the default's type
 * (and allowed values, when constrained), otherwise the default.
 * @param {string} key leaf key name
 * @param {*} def default value
 * @param {*} value raw value from storage
 * @returns {*}
 */
function pickLeaf(key, def, value) {
  if (value === undefined || typeof value !== typeof def) return def;
  if (typeof def === 'number' && !Number.isFinite(value)) return def;
  const allowed = ALLOWED_VALUES[key];
  if (allowed && !allowed.includes(value)) return def;
  return value;
}

/**
 * Recursively builds a settings object shaped like `template`, taking values
 * from `source` where they are valid and falling back to defaults otherwise.
 * Unknown keys in `source` are dropped.
 * @param {Object} template defaults describing the shape
 * @param {*} source raw (possibly invalid) input
 * @returns {Object} a fresh object (never shares references with template)
 */
function mergeKnown(template, source) {
  const out = {};
  for (const key of Object.keys(template)) {
    const def = template[key];
    const raw = isPlainObject(source) ? source[key] : undefined;
    out[key] = isPlainObject(def)
      ? mergeKnown(def, raw)
      : pickLeaf(key, def, raw);
  }
  return out;
}

/**
 * Validates raw input against DEFAULT_SETTINGS and pins the schema version.
 * @param {*} raw
 * @returns {typeof DEFAULT_SETTINGS}
 */
function normalize(raw) {
  const settings = mergeKnown(DEFAULT_SETTINGS, raw);
  settings.schemaVersion = SETTINGS_SCHEMA_VERSION;
  return settings;
}

/**
 * Deep-merges `patch` into `base` without mutating either. Nested plain
 * objects are merged recursively; anything else in `patch` replaces `base`.
 * @param {Object} base
 * @param {*} patch
 * @returns {Object}
 */
function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    out[key] =
      isPlainObject(base[key]) && isPlainObject(patch[key])
        ? deepMerge(base[key], patch[key])
        : patch[key];
  }
  return out;
}

/**
 * Dispatches SETTINGS_CHANGED_EVENT on window, if available.
 */
function notifyChanged() {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
    }
  } catch (_err) {
    // Event dispatch is best-effort.
  }
}

/**
 * Loads settings from localStorage, merged onto DEFAULT_SETTINGS.
 * Never throws: missing storage, invalid JSON, or non-object content all
 * yield defaults (per field where only some values are bad).
 * @returns {typeof DEFAULT_SETTINGS}
 */
export function loadSettings() {
  const storage = getStorage();
  if (!storage) return normalize({});
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (raw == null) return normalize({});
    return normalize(JSON.parse(raw));
  } catch (_err) {
    return normalize({});
  }
}

/**
 * Saves a partial settings update. The partial is deep-merged onto the
 * current settings, validated, written to localStorage, and
 * SETTINGS_CHANGED_EVENT is dispatched. If the write fails, the settings
 * are still returned (not persisted).
 * @param {Object} partial e.g. { theme: 'dark', business: { tutorName: 'Asha' } }
 * @returns {typeof DEFAULT_SETTINGS} the saved settings
 */
export function saveSettings(partial) {
  const settings = normalize(deepMerge(loadSettings(), partial));
  const storage = getStorage();
  try {
    if (storage) storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_err) {
    // Storage full or unavailable: return the settings anyway.
  }
  notifyChanged();
  return settings;
}

/**
 * Removes the settings entry and dispatches SETTINGS_CHANGED_EVENT.
 * Other localStorage keys are not touched.
 */
export function resetSettings() {
  const storage = getStorage();
  try {
    if (storage) storage.removeItem(SETTINGS_KEY);
  } catch (_err) {
    // Ignore: nothing to remove if storage is unavailable.
  }
  notifyChanged();
}

/**
 * Whether the OS currently prefers a dark colour scheme.
 * @returns {boolean}
 */
function systemPrefersDark() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(DARK_MEDIA_QUERY).matches
    );
  } catch (_err) {
    return false;
  }
}

/**
 * Applies theme and palette to the document: toggles the 'dark' class on
 * <html> (for theme 'system', follows the OS preference) and sets the
 * data-palette attribute. Safe to call when `document` is unavailable.
 * @param {Partial<typeof DEFAULT_SETTINGS>} settings
 */
export function applyTheme(settings) {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;
  const theme = settings && settings.theme;
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  if (settings && typeof settings.palette === 'string') {
    root.setAttribute('data-palette', settings.palette);
  }
}

/**
 * Applies the stored theme on startup. When the theme is 'system', also
 * re-applies whenever the OS colour scheme changes. Idempotent: the listener
 * is registered at most once per module instance.
 * @returns {typeof DEFAULT_SETTINGS} the settings that were applied
 */
export function initTheme() {
  const settings = loadSettings();
  applyTheme(settings);

  if (settings.theme !== 'system') return settings;
  if (themeMediaListener) return settings;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return settings;
  }

  themeMediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
  themeMediaListener = () => applyTheme(loadSettings());
  if (typeof themeMediaQuery.addEventListener === 'function') {
    themeMediaQuery.addEventListener('change', themeMediaListener);
  } else if (typeof themeMediaQuery.addListener === 'function') {
    // Older Safari fallback.
    themeMediaQuery.addListener(themeMediaListener);
  }
  return settings;
}
