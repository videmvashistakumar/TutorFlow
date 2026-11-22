// localStorage persistence for the students list, seeded from sample data when empty.
import { sampleStudents } from './sampleStudents.js'

export const STORAGE_KEY = 'tutorflow.students.v1'

export function loadStudents() {
  let parsed = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }

  if (!Array.isArray(parsed)) {
    const fresh = JSON.parse(JSON.stringify(sampleStudents))
    saveStudents(fresh)
    return fresh
  }

  return parsed
}

export function saveStudents(students) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
    window.dispatchEvent(new CustomEvent('tutorflow:data-changed'))
  } catch {
    /* storage unavailable: ignore */
  }
}
