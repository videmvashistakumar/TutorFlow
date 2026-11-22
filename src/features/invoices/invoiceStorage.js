// Load and save invoices in localStorage. Falls back to the sample invoices when nothing valid is stored.
import { sampleInvoices } from './sampleInvoices.js'

export const STORAGE_KEY = 'tutorflow.invoices.v1'

export function loadInvoices() {
  let parsed = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  if (!Array.isArray(parsed)) {
    const fresh = JSON.parse(JSON.stringify(sampleInvoices))
    saveInvoices(fresh)
    return fresh
  }
  return parsed
}

export function saveInvoices(invoices) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
    window.dispatchEvent(new CustomEvent('tutorflow:data-changed'))
  } catch {
    /* storage unavailable: ignore */
  }
}