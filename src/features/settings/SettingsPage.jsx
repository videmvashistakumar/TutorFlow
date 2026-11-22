// Settings page: business profile, appearance, notifications, invoice preferences,
// data management (export / validated import / demo reset), regional options and help.
// All settings are read through loadSettings() and written through saveSettings().
import { useState, useEffect, useRef, useCallback } from 'react'
import pkg from '../../../package.json'
import {
  loadSettings,
  saveSettings,
  applyTheme,
  SETTINGS_CHANGED_EVENT,
} from '../../lib/settingsStore.js'
import {
  exportAllData,
  parseBackupText,
  validateBackup,
  importAllData,
  resetDemoData,
} from '../../lib/dataBackup.js'
import { formatDateByPref, todayISO } from '../../lib/format.js'
import { Button, FormField, Input, Select, Textarea, PageHeader, cx } from '../../components/ui/index.js'

const PANEL =
  'rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6 dark:border-navy-800 dark:bg-navy-900'
const FIELD = 'dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100'
const SECONDARY_DARK = 'dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700'
const MUTED = 'text-navy-500 dark:text-navy-400'
const LOGO_MAX_BYTES = 300 * 1024
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SECTIONS = [
  { id: 'business', label: 'Business Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'invoices', label: 'Invoices & Payments' },
  { id: 'data', label: 'Data Management' },
  { id: 'regional', label: 'Regional' },
  { id: 'help', label: 'Help & About' },
]

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const PALETTES = [
  { value: 'ocean', label: 'Ocean Blue', color: '#2563eb' },
  { value: 'violet', label: 'Royal Violet', color: '#7c3aed' },
  { value: 'emerald', label: 'Fresh Emerald', color: '#059669' },
  { value: 'rose', label: 'Rose', color: '#e11d48' },
  { value: 'amber', label: 'Warm Amber', color: '#d97706' },
  { value: 'teal', label: 'Modern Teal', color: '#0d9488' },
]

const NOTIFICATION_TYPES = [
  { key: 'overdueInvoices', label: 'Overdue invoices' },
  { key: 'upcomingPayments', label: 'Upcoming payments' },
  { key: 'cashShortfall', label: 'Cash shortfall alerts' },
  { key: 'monthlyInvoicesMissing', label: 'Monthly invoices not generated' },
  { key: 'repeatedLatePayments', label: 'Repeated late payments' },
  { key: 'upcomingBills', label: 'Upcoming bill payments' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]

const CURRENCIES = ['INR', 'USD', 'EUR']
const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank transfer' },
]
const DUE_DAYS = [7, 14, 30]
const TONES = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'firm', label: 'Firm' },
]
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

const HELP_ITEMS = [
  {
    q: 'What do the settings change?',
    a: 'Business profile fills in your invoice header and footer. Appearance changes colours only. Invoice preferences set defaults for new invoices, and Regional sets how dates are shown. Settings do not rewrite existing records.',
  },
  {
    q: 'How do I back up my data?',
    a: 'Open Data Management and choose Export data. TutorFlow downloads a JSON file with your students, invoices, bills, cash settings and payment details. Keep copies somewhere safe.',
  },
  {
    q: 'Does changing the currency convert my amounts?',
    a: 'No. Changing the currency only changes how amounts are displayed. Existing amounts are not converted and remain in the currency they were recorded in.',
  },
  {
    q: 'What do archive and notifications do?',
    a: 'Archived records are kept, not deleted. Turning off a notification type only hides that alert type from the alerts list. No data is deleted.',
  },
  {
    q: 'Where does my data live?',
    a: 'In this browser only. TutorFlow stores everything in the browser localStorage and does not send it to a server.',
  },
  {
    q: 'How do I start again with sample data?',
    a: 'Use Reset demo data in Data Management. It asks you to type RESET and saves a snapshot of your current data first. Export a backup beforehand if you want to keep your records.',
  },
]

/** Flash-message helper: visible for `ms` after flash(); hide() clears it early. */
function useFlash(ms = 3000) {
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const flash = useCallback(() => {
    clearTimeout(timer.current)
    setVisible(true)
    timer.current = setTimeout(() => setVisible(false), ms)
  }, [ms])
  const hide = useCallback(() => {
    clearTimeout(timer.current)
    setVisible(false)
  }, [])
  return [visible, flash, hide]
}

/** Section card with heading. */
function Panel({ id, title, description, children }) {
  return (
    <section aria-labelledby={id} className={PANEL}>
      <div className="mb-5">
        <h2 id={id} className="text-base font-semibold text-navy-900 dark:text-navy-100">
          {title}
        </h2>
        {description && <p className={cx('mt-0.5 text-sm', MUTED)}>{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Save / Cancel row with a transient "Saved" message. */
function SaveBar({ canSave, canCancel, onSave, onCancel, showSaved }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button variant="accent" disabled={!canSave} onClick={onSave}>
        Save
      </Button>
      <Button variant="secondary" className={SECONDARY_DARK} disabled={!canCancel} onClick={onCancel}>
        Cancel
      </Button>
      {showSaved && (
        <span role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Saved
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- A. Business

function validateBusiness(d) {
  const errors = {}
  const email = d.email.trim()
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address, for example name@example.com.'
  }
  if (d.upiId.trim() && !d.upiId.includes('@')) {
    errors.upiId = 'UPI ID must contain "@", for example name@bank.'
  }
  return errors
}

function BusinessSection({ saved }) {
  const savedKey = JSON.stringify(saved)
  const [draft, setDraft] = useState(saved)
  const [logoError, setLogoError] = useState('')
  const [showSaved, flashSaved, hideSaved] = useFlash()

  // Re-sync the draft whenever the saved business profile actually changes.
  useEffect(() => {
    setDraft(saved)
  }, [savedKey])

  const errors = validateBusiness(draft)
  const dirty = JSON.stringify(draft) !== savedKey
  const canSave = dirty && Object.keys(errors).length === 0

  const setField = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))

  const handleLogo = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.')
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError('Logo must be 300KB or smaller. Choose a smaller image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogoError('')
      setDraft((d) => ({ ...d, logoDataUrl: String(reader.result) }))
    }
    reader.onerror = () => setLogoError('Could not read that file. Try another image.')
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoError('')
    setDraft((d) => ({ ...d, logoDataUrl: '' }))
  }

  const handleSave = () => {
    if (!canSave) return
    saveSettings({ business: draft })
    flashSaved()
  }

  const handleCancel = () => {
    setDraft(saved)
    setLogoError('')
    hideSaved()
  }

  return (
    <Panel id="settings-business" title="Business Profile" description="Details shown on your invoices and receipts.">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Tutor name" htmlFor="biz-tutor">
          <Input id="biz-tutor" className={FIELD} value={draft.tutorName} onChange={setField('tutorName')} />
        </FormField>
        <FormField label="Business name" htmlFor="biz-name">
          <Input id="biz-name" className={FIELD} value={draft.businessName} onChange={setField('businessName')} />
        </FormField>
        <FormField label="Phone" htmlFor="biz-phone">
          <Input id="biz-phone" type="tel" className={FIELD} value={draft.phone} onChange={setField('phone')} />
        </FormField>
        <FormField label="Email (optional)" htmlFor="biz-email" error={errors.email}>
          <Input
            id="biz-email"
            type="email"
            className={FIELD}
            invalid={Boolean(errors.email)}
            value={draft.email}
            onChange={setField('email')}
          />
        </FormField>
        <FormField label="UPI ID" htmlFor="biz-upi" error={errors.upiId} hint="Optional. Must contain @.">
          <Input
            id="biz-upi"
            className={FIELD}
            invalid={Boolean(errors.upiId)}
            value={draft.upiId}
            onChange={setField('upiId')}
          />
        </FormField>
        <FormField label="Address (optional)" htmlFor="biz-address" className="sm:col-span-2">
          <Textarea id="biz-address" className={FIELD} value={draft.address} onChange={setField('address')} />
        </FormField>
        <FormField
          label="Logo"
          htmlFor="biz-logo"
          error={logoError}
          hint="Image file up to 300KB."
          className="sm:col-span-2"
        >
          <input
            id="biz-logo"
            type="file"
            accept="image/*"
            onChange={handleLogo}
            className="block w-full text-sm text-navy-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-800 hover:file:bg-navy-200 dark:text-navy-200 dark:file:bg-navy-800 dark:file:text-navy-100"
          />
          {draft.logoDataUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={draft.logoDataUrl}
                alt="Logo preview"
                className="h-16 w-16 rounded-lg border border-navy-200 bg-white object-contain p-1 dark:border-navy-700"
              />
              <Button variant="secondary" size="sm" className={SECONDARY_DARK} onClick={handleRemoveLogo}>
                Remove logo
              </Button>
            </div>
          )}
        </FormField>
        <FormField label="Invoice branding text" htmlFor="biz-branding" className="sm:col-span-2">
          <Input
            id="biz-branding"
            className={FIELD}
            value={draft.invoiceBrandingText}
            onChange={setField('invoiceBrandingText')}
          />
        </FormField>
        <FormField label="Invoice footer" htmlFor="biz-footer" className="sm:col-span-2">
          <Textarea id="biz-footer" className={FIELD} value={draft.invoiceFooter} onChange={setField('invoiceFooter')} />
        </FormField>
      </div>
      <SaveBar
        canSave={canSave}
        canCancel={dirty}
        onSave={handleSave}
        onCancel={handleCancel}
        showSaved={showSaved}
      />
    </Panel>
  )
}

// ---------------------------------------------------------------- B. Appearance

function AppearanceSection({ settings }) {
  const chooseTheme = (value) => {
    saveSettings({ theme: value })
    applyTheme(loadSettings())
  }
  const choosePalette = (value) => {
    saveSettings({ palette: value })
    applyTheme(loadSettings())
  }

  return (
    <Panel id="settings-appearance" title="Appearance" description="Theme and accent colour for this browser.">
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-navy-800 dark:text-navy-100">Theme</legend>
        <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
          {THEMES.map((t) => {
            const checked = settings.theme === t.value
            return (
              <label
                key={t.value}
                className={cx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  checked
                    ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-navy-800 dark:text-accent-300'
                    : 'border-navy-200 text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800',
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={checked}
                  onChange={() => chooseTheme(t.value)}
                  className="h-4 w-4"
                />
                {t.label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-navy-800 dark:text-navy-100">Colour palette</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTES.map((p) => {
            const active = settings.palette === p.value
            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={active}
                onClick={() => choosePalette(p.value)}
                className={cx(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                  active
                    ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-navy-800 dark:text-accent-300'
                    : 'border-navy-200 text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800',
                )}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
                {p.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50 p-4 dark:border-navy-800 dark:bg-navy-800">
        <p className={cx('mb-3 text-xs font-semibold uppercase tracking-wider', MUTED)}>Preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" type="button">
            Sample button
          </Button>
          <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700 dark:bg-navy-900 dark:text-accent-300">
            Badge
          </span>
        </div>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------- C. Notifications

function updateNotification(key, patch) {
  const current = loadSettings().notifications
  saveSettings({ notifications: { ...current, [key]: { ...current[key], ...patch } } })
}

function NotificationsSection({ settings }) {
  return (
    <Panel
      id="settings-notifications"
      title="Notifications"
      description="Choose which alerts appear and how urgent they are."
    >
      <p className={cx('mb-4 text-sm', MUTED)}>
        Disabled alert types are hidden from the alerts list. No data is deleted.
      </p>
      <ul className="divide-y divide-navy-100 dark:divide-navy-800">
        {NOTIFICATION_TYPES.map(({ key, label }) => {
          const cfg = settings.notifications[key]
          const labelId = `notif-${key}`
          return (
            <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span id={labelId} className="text-sm font-medium text-navy-800 dark:text-navy-100">
                {label}
              </span>
              <div className="flex items-center gap-3">
                <Select
                  aria-label={`${label} priority`}
                  className={cx('h-9 w-32', FIELD)}
                  value={cfg.priority}
                  onChange={(e) => updateNotification(key, { priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  role="switch"
                  aria-checked={cfg.enabled}
                  aria-labelledby={labelId}
                  onClick={() => updateNotification(key, { enabled: !cfg.enabled })}
                  className={cx(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600',
                    cfg.enabled ? 'bg-accent-600' : 'bg-navy-200 dark:bg-navy-700',
                  )}
                >
                  <span
                    className={cx(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      cfg.enabled ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

// ---------------------------------------------------------------- D. Invoices & Payments

function InvoicesSection({ saved }) {
  const savedKey = JSON.stringify(saved)
  const [draft, setDraft] = useState(saved)
  const [showSaved, flashSaved, hideSaved] = useFlash()

  useEffect(() => {
    setDraft(saved)
  }, [savedKey])

  const dirty = JSON.stringify(draft) !== savedKey
  const setField = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))

  const handleSave = () => {
    saveSettings({ invoicePrefs: draft })
    flashSaved()
  }
  const handleCancel = () => {
    setDraft(saved)
    hideSaved()
  }

  return (
    <Panel
      id="settings-invoices"
      title="Invoices & Payments"
      description="Defaults used when you create new invoices."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Currency"
          htmlFor="inv-currency"
          hint="Changing currency changes how amounts are displayed. Existing amounts are NOT converted and remain in the currency they were recorded in."
          className="sm:col-span-2"
        >
          <Select id="inv-currency" className={FIELD} value={draft.currency} onChange={setField('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Default payment method" htmlFor="inv-method">
          <Select
            id="inv-method"
            className={FIELD}
            value={draft.defaultPaymentMethod}
            onChange={setField('defaultPaymentMethod')}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Default due days" htmlFor="inv-due">
          <Select
            id="inv-due"
            className={FIELD}
            value={draft.defaultDueDays}
            onChange={(e) => setDraft((d) => ({ ...d, defaultDueDays: Number(e.target.value) }))}
          >
            {DUE_DAYS.map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Invoice number prefix (optional)"
          htmlFor="inv-prefix"
          hint="Applies to newly created invoices. Existing invoice numbers are not changed."
        >
          <Input
            id="inv-prefix"
            maxLength={12}
            className={FIELD}
            value={draft.numberPrefix}
            onChange={setField('numberPrefix')}
          />
        </FormField>
        <FormField label="Reminder tone" htmlFor="inv-tone">
          <Select id="inv-tone" className={FIELD} value={draft.reminderTone} onChange={setField('reminderTone')}>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Default footer" htmlFor="inv-footer" className="sm:col-span-2">
          <Textarea id="inv-footer" className={FIELD} value={draft.defaultFooter} onChange={setField('defaultFooter')} />
        </FormField>
        <FormField label="Default payment instructions" htmlFor="inv-instructions" className="sm:col-span-2">
          <Textarea
            id="inv-instructions"
            className={FIELD}
            value={draft.defaultPaymentInstructions}
            onChange={setField('defaultPaymentInstructions')}
          />
        </FormField>
      </div>
      <SaveBar
        canSave={dirty}
        canCancel={dirty}
        onSave={handleSave}
        onCancel={handleCancel}
        showSaved={showSaved}
      />
    </Panel>
  )
}

// ---------------------------------------------------------------- E. Data Management

/** Downloads a JSON backup of all TutorFlow data. */
function downloadBackup() {
  const json = JSON.stringify(exportAllData(), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tutorflow-backup-${todayISO()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Reset dialog: requires typing RESET. Escape closes, Tab is kept inside the dialog. */
function ResetDemoDialog({ onClose, onDone }) {
  const [typed, setTyped] = useState('')
  const dialogRef = useRef(null)
  const firstRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const doReset = () => {
    if (typed !== 'RESET') return
    const res = resetDemoData()
    setTyped('')
    onDone(res.ok ? 'Demo data has been reset. Settings were restored to defaults.' : res.errors.join(' '))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-demo-title"
        className="w-full max-w-md rounded-xl border border-navy-100 bg-white p-6 shadow-card dark:border-navy-800 dark:bg-navy-900"
      >
        <h3 id="reset-demo-title" className="text-base font-semibold text-navy-900 dark:text-navy-100">
          Reset demo data
        </h3>
        <p className={cx('mt-2 text-sm', MUTED)}>
          This replaces your current students, invoices and bills with sample data, and resets settings to defaults.
          A snapshot of your current data is saved first.
        </p>
        <button
          ref={firstRef}
          type="button"
          onClick={downloadBackup}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-navy-100 bg-white px-3 text-sm font-medium text-navy-800 shadow-sm hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
        >
          Export backup first
        </button>
        <FormField label="Type RESET to confirm" htmlFor="reset-confirm" className="mt-4">
          <Input
            id="reset-confirm"
            autoComplete="off"
            className={FIELD}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </FormField>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" className={SECONDARY_DARK} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={typed !== 'RESET'} onClick={doReset}>
            Reset demo data
          </Button>
        </div>
      </div>
    </div>
  )
}

function DataSection() {
  const [pending, setPending] = useState(null) // { name, obj, counts }
  const [importErrors, setImportErrors] = useState([])
  const [status, setStatus] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    setPending(null)
    setImportErrors([])
    setStatus('')
    if (!file) return
    let text
    try {
      text = await file.text()
    } catch {
      setImportErrors(['Could not read the selected file.'])
      return
    }
    const parsed = parseBackupText(text)
    if (!parsed.ok) {
      setImportErrors([parsed.error])
      return
    }
    const check = validateBackup(parsed.value)
    if (!check.ok) {
      setImportErrors(check.errors)
      return
    }
    setPending({ name: file.name, obj: parsed.value, counts: check.counts })
  }

  const cancelImport = () => {
    setPending(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const confirmImport = () => {
    if (!pending) return
    const res = importAllData(pending.obj)
    setPending(null)
    if (res.ok) {
      setImportErrors([])
      setStatus(
        `Import complete: ${res.counts.students} students, ${res.counts.invoices} invoices and ${res.counts.bills} bills restored.`,
      )
    } else {
      setImportErrors(res.errors)
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        id="settings-data"
        title="Data Management"
        description="Back up, restore or reset the data stored in this browser."
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-navy-800 dark:text-navy-100">Export data</h3>
            <p className={cx('mt-0.5 text-sm', MUTED)}>Download a JSON backup of everything TutorFlow stores.</p>
            <Button variant="accent" className="mt-3" onClick={downloadBackup}>
              Export data
            </Button>
          </div>

          <div className="border-t border-navy-100 pt-6 dark:border-navy-800">
            <FormField label="Import data" htmlFor="data-import" hint="Choose a TutorFlow JSON backup file.">
              <input
                ref={fileRef}
                id="data-import"
                type="file"
                accept=".json,application/json"
                onChange={handleFile}
                className="block w-full text-sm text-navy-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-800 hover:file:bg-navy-200 dark:text-navy-200 dark:file:bg-navy-800 dark:file:text-navy-100"
              />
            </FormField>

            {importErrors.length > 0 && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                <p className="font-medium">This backup cannot be imported. Nothing was changed.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {pending && (
              <div className="mt-3 rounded-lg border border-navy-200 bg-navy-50 p-4 dark:border-navy-700 dark:bg-navy-800">
                <p className="text-sm font-medium text-navy-900 dark:text-navy-100">Ready to import {pending.name}</p>
                <ul className={cx('mt-2 space-y-0.5 text-sm', MUTED)}>
                  <li>{pending.counts.students} students</li>
                  <li>{pending.counts.invoices} invoices</li>
                  <li>{pending.counts.bills} bills</li>
                </ul>
                <p className={cx('mt-3 text-sm', MUTED)}>
                  Importing will replace your current students, invoices, bills, cash settings and payment details. A
                  snapshot of your current data is saved first so you can recover it.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="danger" onClick={confirmImport}>
                    Replace my data
                  </Button>
                  <Button variant="secondary" className={SECONDARY_DARK} onClick={cancelImport}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-navy-100 pt-6 dark:border-navy-800">
            <h3 className="text-sm font-semibold text-navy-800 dark:text-navy-100">Reset demo data</h3>
            <p className={cx('mt-0.5 text-sm', MUTED)}>Replace current records with sample data.</p>
            <Button variant="secondary" className={cx('mt-3', SECONDARY_DARK)} onClick={() => setResetOpen(true)}>
              Reset demo data…
            </Button>
          </div>

          {status && (
            <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {status}
            </p>
          )}
        </div>
      </Panel>

      {resetOpen && (
        <ResetDemoDialog
          onClose={() => setResetOpen(false)}
          onDone={(msg) => {
            setStatus(msg)
            setResetOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- F. Regional

function RegionalSection({ settings }) {
  const dateFormat = settings.regional.dateFormat

  return (
    <Panel id="settings-regional" title="Regional" description="Language and how dates are displayed.">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Language"
          htmlFor="reg-language"
          hint="Only English is available. Hindi and Telugu will be enabled once the full interface is translated."
        >
          <Select id="reg-language" className={FIELD} defaultValue="en">
            <option value="en">English</option>
            <option value="hi" disabled>
              Hindi (Planned)
            </option>
            <option value="te" disabled>
              Telugu (Planned)
            </option>
          </Select>
        </FormField>
        <FormField label="Date format" htmlFor="reg-date">
          <Select
            id="reg-date"
            className={FIELD}
            value={dateFormat}
            onChange={(e) => saveSettings({ regional: { dateFormat: e.target.value } })}
          >
            {DATE_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="mt-6 rounded-lg border border-navy-100 bg-navy-50 p-4 dark:border-navy-800 dark:bg-navy-800">
        <p className={cx('text-xs font-semibold uppercase tracking-wider', MUTED)}>Preview</p>
        <p className="mt-1 text-sm font-medium text-navy-900 dark:text-navy-100">
          {formatDateByPref(new Date(), dateFormat)}
        </p>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------- G. Help & About

function HelpSection() {
  return (
    <div className="space-y-6">
      <Panel id="settings-help" title="Help" description="Common questions about settings and data.">
        <div className="divide-y divide-navy-100 dark:divide-navy-800">
          {HELP_ITEMS.map((item) => (
            <details key={item.q} className="py-3">
              <summary className="cursor-pointer text-sm font-medium text-navy-800 dark:text-navy-100">{item.q}</summary>
              <p className={cx('mt-2 text-sm', MUTED)}>{item.a}</p>
            </details>
          ))}
        </div>
      </Panel>

      <Panel id="settings-about" title="About" description="Application details and contact.">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-navy-800 dark:text-navy-100">Application version</dt>
            <dd className={MUTED}>{pkg.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-navy-800 dark:text-navy-100">Data storage</dt>
            <dd className={MUTED}>
              All data is stored in this browser's localStorage; nothing is sent to a server. Clearing browser data
              erases it — export a backup regularly.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-navy-800 dark:text-navy-100">Privacy</dt>
            <dd className={MUTED}>TutorFlow does not send your data to any server. Your records stay on this device.</dd>
          </div>
          <div>
            <dt className="font-medium text-navy-800 dark:text-navy-100">Feedback and support</dt>
            <dd>
              <a href="mailto:support@example.com" className="text-accent-700 underline dark:text-accent-300">
                support@example.com
              </a>
              <span className={cx('ml-2 text-xs', MUTED)}>Replace with your support email</span>
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  )
}

// ---------------------------------------------------------------- Page

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => loadSettings())
  const [active, setActive] = useState('business')

  useEffect(() => {
    const refresh = () => setSettings(loadSettings())
    window.addEventListener(SETTINGS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, refresh)
  }, [])

  const content = {
    business: <BusinessSection saved={settings.business} />,
    appearance: <AppearanceSection settings={settings} />,
    notifications: <NotificationsSection settings={settings} />,
    invoices: <InvoicesSection saved={settings.invoicePrefs} />,
    data: <DataSection />,
    regional: <RegionalSection settings={settings} />,
    help: <HelpSection />,
  }[active]

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Business details, look and feel, alerts, invoice defaults and data." />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          aria-label="Settings sections"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:sticky lg:top-6 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {SECTIONS.map((s) => {
            const isActive = active === s.id
            return (
              <button
                key={s.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActive(s.id)}
                className={cx(
                  'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-600 text-white'
                    : 'text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800',
                )}
              >
                {s.label}
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">{content}</div>
      </div>
    </div>
  )
}
