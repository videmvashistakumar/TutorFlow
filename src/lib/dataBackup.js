// Full-app backup: export raw TutorFlow localStorage data as JSON, validate a backup file, import it, or reset to demo data.
import { loadSettings, saveSettings, resetSettings, SETTINGS_KEY } from './settingsStore'

export const BACKUP_FORMAT = 'tutorflow-backup'
export const BACKUP_VERSION = 1
export const BEFORE_IMPORT_KEY = 'tutorflow.backup.beforeImport.v1'
export const BEFORE_RESET_KEY = 'tutorflow.backup.beforeReset.v1'

const DATA_CHANGED_EVENT = 'tutorflow:data-changed'
const MAX_ERRORS = 50

const KEYS = {
  students: 'tutorflow.students.v1',
  invoices: 'tutorflow.invoices.v1',
  bills: 'tutorflow.bills.v1',
  cashSettings: 'tutorflow.cashSettings.v1',
  paymentDetails: 'tutorflow.paymentDetails.v1',
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isValidId(id) {
  return (typeof id === 'string' && id.length > 0) || (typeof id === 'number' && Number.isFinite(id))
}

// Returns localStorage, or throws if it is unavailable.
function requireStorage() {
  if (typeof localStorage === 'undefined' || !localStorage) {
    throw new Error('localStorage unavailable')
  }
  return localStorage
}

// Raw stored string for a key, or null if missing or storage is unavailable. Never throws.
function readRaw(key) {
  try {
    return requireStorage().getItem(key)
  } catch {
    return null
  }
}

// Parsed JSON for a key, or null if missing or unparseable. Never throws.
function readJson(key) {
  const raw = readRaw(key)
  if (raw == null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Sets the key to the value, or removes the key when the value is null/undefined. Throws on storage failure.
function writeValue(storage, key, value) {
  if (value === null || value === undefined) {
    storage.removeItem(key)
  } else {
    storage.setItem(key, value)
  }
}

// Appends a record to the array stored under key. Existing records are never removed or replaced.
// A legacy single-object value is wrapped; any other unreadable value is kept as a raw note.
// Returns true on success, false if reading or writing storage fails.
function appendBackupRecord(storage, key, record) {
  let records = []
  try {
    const raw = storage.getItem(key)
    if (raw != null) {
      let parsed
      let parsedOk = true
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsedOk = false
      }
      if (parsedOk && Array.isArray(parsed)) {
        records = parsed
      } else if (parsedOk && isPlainObject(parsed)) {
        records = [parsed]
      } else {
        records = [{ savedAt: 'unknown', note: 'unreadable previous value', raw }]
      }
    }
  } catch {
    return false
  }

  try {
    records.push(record)
    storage.setItem(key, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

// Builds a backup record of the raw values of all data keys plus settings.
function buildBackupRecord(reason) {
  const values = {}
  for (const key of [...Object.values(KEYS), SETTINGS_KEY]) {
    values[key] = readRaw(key)
  }
  return { savedAt: new Date().toISOString(), reason, values }
}

// Appends a pre-import snapshot to BEFORE_IMPORT_KEY. Returns true on success, false on failure.
function snapshotBeforeImport(storage) {
  return appendBackupRecord(storage, BEFORE_IMPORT_KEY, buildBackupRecord('import'))
}

// Appends a pre-reset snapshot to BEFORE_RESET_KEY. Returns true on success, false on failure.
function snapshotBeforeReset(storage) {
  return appendBackupRecord(storage, BEFORE_RESET_KEY, buildBackupRecord('reset-demo-data'))
}

function notifyDataChanged() {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
    }
  } catch {
    // Event dispatch is best-effort.
  }
}

/**
 * Builds a backup object from the raw localStorage values. Does not reseed sample data.
 * @returns {{format: string, version: number, exportedAt: string, data: Object}}
 */
export function exportAllData() {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      students: readJson(KEYS.students),
      invoices: readJson(KEYS.invoices),
      bills: readJson(KEYS.bills),
      cashSettings: readJson(KEYS.cashSettings),
      paymentDetails: readRaw(KEYS.paymentDetails),
      settings: loadSettings(),
    },
  }
}

/**
 * Parses backup file text as JSON. Never throws.
 * @param {string} text
 * @returns {{ok: true, value: *} | {ok: false, error: string}}
 */
export function parseBackupText(text) {
  try {
    if (typeof text !== 'string') {
      return { ok: false, error: 'Backup file is not text.' }
    }
    const trimmed = text.trim()
    if (!trimmed) {
      return { ok: false, error: 'Backup file is empty.' }
    }
    return { ok: true, value: JSON.parse(trimmed) }
  } catch {
    return { ok: false, error: 'Backup file is not valid JSON.' }
  }
}

/**
 * Checks the structure of a backup object. Never throws.
 * @param {*} obj
 * @returns {{ok: true, counts: {students: number, invoices: number, bills: number}} | {ok: false, errors: string[]}}
 */
export function validateBackup(obj) {
  const errors = []
  const addError = (message) => {
    if (errors.length < MAX_ERRORS) errors.push(message)
  }

  try {
    if (!isPlainObject(obj)) {
      return { ok: false, errors: ['Backup must be a JSON object.'] }
    }
    if (obj.format !== BACKUP_FORMAT) {
      addError(`format must be "${BACKUP_FORMAT}".`)
    }
    if (obj.version !== BACKUP_VERSION) {
      addError(`version must be ${BACKUP_VERSION}.`)
    }

    const data = obj.data
    if (!isPlainObject(data)) {
      addError('data must be an object.')
      return { ok: false, errors }
    }

    const counts = {}
    for (const name of ['students', 'invoices', 'bills']) {
      const list = data[name]
      if (!Array.isArray(list)) {
        addError(`data.${name} must be an array.`)
        continue
      }
      list.forEach((item, index) => {
        if (!isPlainObject(item)) {
          addError(`data.${name}[${index}] must be an object.`)
        } else if (!isValidId(item.id)) {
          addError(`data.${name}[${index}].id must be a non-empty string or a finite number.`)
        }
      })
      counts[name] = list.length
    }

    if (data.cashSettings != null && !isPlainObject(data.cashSettings)) {
      addError('data.cashSettings must be an object or null.')
    }
    if (data.paymentDetails != null && typeof data.paymentDetails !== 'string') {
      addError('data.paymentDetails must be a string or null.')
    }
    if (data.settings != null && !isPlainObject(data.settings)) {
      addError('data.settings must be an object or null.')
    }

    if (errors.length > 0) return { ok: false, errors }
    return { ok: true, counts }
  } catch {
    return { ok: false, errors: ['Backup could not be validated.'] }
  }
}

/**
 * Restores a validated backup. Snapshots the current data first, then overwrites the data keys.
 * Re-validates internally and refuses to write if the backup is invalid.
 * @param {*} obj
 * @returns {{ok: true, counts: Object} | {ok: false, errors: string[]}}
 */
export function importAllData(obj) {
  const check = validateBackup(obj)
  if (!check.ok) return { ok: false, errors: check.errors }

  const data = obj.data
  let storage
  try {
    storage = requireStorage()
    if (!snapshotBeforeImport(storage)) {
      return { ok: false, error: 'Could not save the pre-import backup, so nothing was imported.' }
    }
  } catch {
    return { ok: false, errors: ['Could not save a safety snapshot before import. Nothing was changed.'] }
  }

  try {
    writeValue(storage, KEYS.students, JSON.stringify(data.students))
    writeValue(storage, KEYS.invoices, JSON.stringify(data.invoices))
    writeValue(storage, KEYS.bills, JSON.stringify(data.bills))
    writeValue(storage, KEYS.cashSettings, data.cashSettings == null ? null : JSON.stringify(data.cashSettings))
    writeValue(storage, KEYS.paymentDetails, data.paymentDetails == null ? null : data.paymentDetails)
    if (data.settings != null) saveSettings(data.settings)
    notifyDataChanged()
    return { ok: true, counts: check.counts }
  } catch {
    notifyDataChanged()
    return {
      ok: false,
      errors: [`Import failed while writing browser storage. Previous data was saved under ${BEFORE_IMPORT_KEY}.`],
    }
  }
}

/**
 * Snapshots current data, then removes the data keys so the loaders re-seed sample data, and resets settings.
 * @returns {{ok: true} | {ok: false, errors: string[]}}
 */
export function resetDemoData() {
  let storage
  try {
    storage = requireStorage()
    if (!snapshotBeforeReset(storage)) {
      return { ok: false, error: 'Could not save the pre-reset backup, so nothing was reset.' }
    }
  } catch {
    return { ok: false, errors: ['Could not save a safety snapshot before reset. Nothing was changed.'] }
  }

  try {
    for (const key of Object.values(KEYS)) {
      storage.removeItem(key)
    }
    resetSettings()
    return { ok: true }
  } catch {
    return {
      ok: false,
      errors: [`Reset failed while clearing browser storage. Previous data was saved under ${BEFORE_RESET_KEY}.`],
    }
  } finally {
    notifyDataChanged()
  }
}
