// Formatting helpers: currency display (INR default, amounts never converted), date display per the saved date format, and local-date ISO strings (YYYY-MM-DD).
import { loadSettings } from './settingsStore'

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR']
const DEFAULT_CURRENCY = 'INR'
const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY'

// Display currency from the saved invoice preference. Falls back to INR on any problem.
export const getDisplayCurrency = () => {
  try {
    const code = loadSettings().invoicePrefs.currency
    return SUPPORTED_CURRENCIES.includes(code) ? code : DEFAULT_CURRENCY
  } catch (_err) {
    return DEFAULT_CURRENCY
  }
}

const currencyFormatters = {
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
  EUR: new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
}

// Optional currency code. Omitted/null uses the saved display currency. Amounts are shown as-is, never converted.
export const formatCurrency = (amount, currency) => {
  const code = currency === undefined || currency === null ? getDisplayCurrency() : currency
  const formatter =
    currencyFormatters[code] ||
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, maximumFractionDigits: 0 })
  return formatter.format(Number(amount) || 0)
}

// Symbol for a currency code. Omitted uses the saved display currency.
export const getCurrencySymbol = (currency) => {
  const code = currency === undefined || currency === null ? getDisplayCurrency() : currency
  if (code === 'USD') return '$'
  if (code === 'EUR') return '€'
  return '₹'
}

// Alias so existing importers keep working.
export const formatRupees = formatCurrency

const isoFromDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayISO = () => isoFromDate(new Date())

export const daysAgoISO = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoFromDate(d)
}

// Formats an ISO 'YYYY-MM-DD' string or Date using the date preference (DD/MM/YYYY default). Returns '' for invalid input.
const pad2 = (n) => String(n).padStart(2, '0')

export const formatDateByPref = (value, dateFormat) => {
  let y
  let m
  let d
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    y = value.getFullYear()
    m = value.getMonth() + 1
    d = value.getDate()
  } else if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
    if (!match) return ''
    y = Number(match[1])
    m = Number(match[2])
    d = Number(match[3])
    const check = new Date(0)
    check.setUTCFullYear(y, m - 1, d)
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return ''
  } else {
    return ''
  }
  const yyyy = String(y).padStart(4, '0')
  const mm = pad2(m)
  const dd = pad2(d)
  if (dateFormat === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`
  if (dateFormat === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`
  return `${dd}/${mm}/${yyyy}`
}

// Date display helper. Uses the saved date format; invalid input returns ''. Same name and signature as before.
const getDateFormatPref = () => {
  try {
    return loadSettings().regional.dateFormat || DEFAULT_DATE_FORMAT
  } catch (_err) {
    return DEFAULT_DATE_FORMAT
  }
}

export const formatDate = (iso) => formatDateByPref(iso, getDateFormatPref())
