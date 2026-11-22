// Load and save bills in localStorage. Falls back to the sample bills when nothing valid is stored.
import { sampleBills } from './sampleBills.js'

export const STORAGE_KEY = 'tutorflow.bills.v1'

export function loadBills() {
  let parsed = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  if (!Array.isArray(parsed)) {
    const fresh = JSON.parse(JSON.stringify(sampleBills))
    saveBills(fresh)
    return fresh
  }
  return parsed
}

export function saveBills(bills) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills))
    window.dispatchEvent(new CustomEvent('tutorflow:data-changed'))
  } catch {
    /* storage unavailable: ignore */
  }
}