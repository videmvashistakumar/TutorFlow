export const CASH_SETTINGS_KEY = 'tutorflow.cashSettings.v1'

export const DEFAULT_CASH_SETTINGS = { opening: 0, buffer: 0, delayDays: 0 }

export function loadCashSettings() {
  try {
    const raw = localStorage.getItem(CASH_SETTINGS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_CASH_SETTINGS }
    }

    const opening = Number(parsed.opening)
    const buffer = Number(parsed.buffer)
    const delay = Number(parsed.delayDays)

    return {
      opening: Number.isFinite(opening) ? opening : DEFAULT_CASH_SETTINGS.opening,
      buffer: Number.isFinite(buffer) ? buffer : DEFAULT_CASH_SETTINGS.buffer,
      delayDays: Number.isFinite(delay)
        ? Math.max(0, Math.round(delay))
        : DEFAULT_CASH_SETTINGS.delayDays,
    }
  } catch {
    return { ...DEFAULT_CASH_SETTINGS }
  }
}

export function saveCashSettings(settings) {
  try {
    localStorage.setItem(CASH_SETTINGS_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('tutorflow:data-changed'))
  } catch {
    // ignore storage errors
  }
}
